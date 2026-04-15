'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import dynamic from 'next/dynamic'
import { 
  MapPin, Ambulance, UserCircle, Phone, Search, 
  Loader2, Globe, Clock, Car, HeartPulse, UserPlus 
} from 'lucide-react'
import { SHIFT_JAM, LIST_ARMADA, KATEGORI_LAYANAN, STATUS_EKONOMI } from '@/lib/constants-ambulan'

interface Wilayah {
  id: string;
  name: string;
}

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  center: [number, number];
}

const MapPicker = dynamic<MapPickerProps>(
  () => import('../mustahik/MapPickerComponent'), 
  { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-xs">Memuat Peta...</div>
  }
)

export default function AddLayananForm() {
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.3344, 111.7001])
  
  // Wilayah State
  const [provinces, setProvinces] = useState<Wilayah[]>([])
  const [regencies, setRegencies] = useState<Wilayah[]>([])
  const [districts, setDistricts] = useState<Wilayah[]>([])
  const [villages, setVillages] = useState<Wilayah[]>([])
  const [selectedIds, setSelectedIds] = useState({ prov: '', kab: '', kec: '' })

  const [formData, setFormData] = useState({
    nama_pasien: '',
    gender: 'L',
    no_hp: '',
    status_ekonomi: 'Dhuafa',
    alamat_jemput: '',
    jam: SHIFT_JAM[0],
    armada: LIST_ARMADA[0],
    kategori_layanan: KATEGORI_LAYANAN[0],
    desa: '',
    kelurahan_kecamatan: '',
    kabupaten_kota: '',
    provinsi: '',
    latitude: 0,
    longitude: 0
  })

  // --- Effect untuk Wilayah (Standard Emsifa) ---
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json').then(res => res.json()).then(setProvinces)
  }, [])

  useEffect(() => {
    if (selectedIds.prov) fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedIds.prov}.json`).then(res => res.json()).then(setRegencies)
  }, [selectedIds.prov])

  useEffect(() => {
    if (selectedIds.kab) fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedIds.kab}.json`).then(res => res.json()).then(setDistricts)
  }, [selectedIds.kab])

  useEffect(() => {
    if (selectedIds.kec) fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedIds.kec}.json`).then(res => res.json()).then(setVillages)
  }, [selectedIds.kec])

  const handleSearch = async () => {
    const query = `${searchQuery} ${formData.kelurahan_kecamatan} ${formData.kabupaten_kota}`.trim();
    if (!query) return;
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData(prev => ({ ...prev, latitude: parseFloat(lat), longitude: parseFloat(lon) }));
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
        toast.success("Lokasi ditemukan");
      }
    } catch (e) { toast.error("Gagal cari lokasi"); } finally { setSearching(false); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.latitude === 0) return toast.error("Tentukan lokasi tujuan di peta");
    setLoading(true);
    try {
      const res = await fetch('/app/ambulan/api/layanan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) toast.success("Layanan Ambulans Berhasil Dicatat");
    } catch (e) { toast.error("Error Simpan Data"); } finally { setLoading(false); }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2 max-w-7xl mx-auto pb-10">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b py-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="h-5 w-5 text-red-600" />
            <CardTitle className="text-lg font-bold text-slate-800">Data Pasien & Layanan</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          
          {/* SEKSI ARMADA & SHIFT */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-red-50/50 border border-red-100">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1.5">
                <Car className="h-3 w-3" /> Armada
              </Label>
              <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-semibold" 
                value={formData.armada} onChange={e => setFormData({...formData, armada: e.target.value})}>
                {LIST_ARMADA.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-red-700 uppercase flex items-center gap-1.5">
                <Clock className="h-3 w-3" /> Shift Waktu
              </Label>
              <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-semibold"
                value={formData.jam} onChange={e => setFormData({...formData, jam: e.target.value})}>
                {SHIFT_JAM.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Nama Pasien</Label>
                <Input required placeholder="Nama Lengkap" onChange={e => setFormData({...formData, nama_pasien: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Kategori Layanan</Label>
                <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm"
                  value={formData.kategori_layanan} onChange={e => setFormData({...formData, kategori_layanan: e.target.value})}>
                  {KATEGORI_LAYANAN.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Gender</Label>
                <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm" 
                  value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Status Ekonomi</Label>
                <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm"
                  value={formData.status_ekonomi} onChange={e => setFormData({...formData, status_ekonomi: e.target.value})}>
                  {STATUS_EKONOMI.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold flex items-center gap-2"><Phone className="h-4 w-4" /> No. HP/WhatsApp</Label>
              <Input placeholder="08..." onChange={e => setFormData({...formData, no_hp: e.target.value})} />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Alamat Jemput (Asal)</Label>
              <Textarea placeholder="Alamat lengkap penjemputan..." onChange={e => setFormData({...formData, alamat_jemput: e.target.value})} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-slate-200 overflow-hidden flex flex-col">
        <CardHeader className="bg-slate-50/50 border-b py-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-600" />
            <CardTitle className="text-lg font-bold text-slate-800">Lokasi Tujuan (GIS)</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6 flex-1 bg-white">
          <div className="grid grid-cols-2 gap-2">
            <select className="h-9 rounded border text-xs" onChange={e => {
              setSelectedIds({...selectedIds, prov: e.target.value});
              setFormData({...formData, provinsi: provinces.find(p => p.id === e.target.value)?.name || ""});
            }}>
              <option value="">Pilih Provinsi</option>
              {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="h-9 rounded border text-xs" disabled={!selectedIds.prov} onChange={e => {
              setSelectedIds({...selectedIds, kab: e.target.value});
              setFormData({...formData, kabupaten_kota: regencies.find(r => r.id === e.target.value)?.name || ""});
            }}>
              <option value="">Pilih Kabupaten</option>
              {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2">
            <Input placeholder="Cari RS/Puskesmas/Desa..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            <Button type="button" variant="outline" onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          <div className="h-[300px] w-full border-2 rounded-xl overflow-hidden relative">
            <MapPicker center={mapCenter} onLocationSelect={(lat, lng) => {
              setFormData({...formData, latitude: lat, longitude: lng});
              setMapCenter([lat, lng]);
            }} />
          </div>

          <Button type="submit" disabled={loading} className="w-full h-14 bg-red-600 hover:bg-red-700 text-base font-bold shadow-lg">
            {loading ? "Menyimpan..." : <><Ambulance className="h-5 w-5 mr-2" /> Simpan Layanan Pasien</>}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}