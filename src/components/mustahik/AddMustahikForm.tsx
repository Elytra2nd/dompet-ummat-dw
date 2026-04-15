'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import dynamic from 'next/dynamic'
import { MapPin, UserPlus, ClipboardList, ShieldCheck, ChevronRight, LayoutGrid, Layers, UserCircle, Search, Loader2, Phone, Users, Globe } from 'lucide-react'

// --- Interface untuk API Wilayah ---
interface Wilayah {
  id: string;
  name: string;
}

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  center: [number, number];
}

const MapPicker = dynamic<MapPickerProps>(
  () => import('./MapPickerComponent'), 
  { 
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-medium text-xs">
        Memuat Peta...
      </div>
    )
  }
)

interface AddMustahikFormProps {
  hierarkiData: {
    [key: string]: {
      [key: string]: string[]
    }
  }
}

export default function AddMustahikForm({ hierarkiData }: AddMustahikFormProps) {
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.3344, 111.7001])
  
  // --- State List Wilayah ---
  const [provinces, setProvinces] = useState<Wilayah[]>([])
  const [regencies, setRegencies] = useState<Wilayah[]>([])
  const [districts, setDistricts] = useState<Wilayah[]>([])
  const [villages, setVillages] = useState<Wilayah[]>([])

  // --- State ID untuk Trigger API ---
  const [selectedProvId, setSelectedProvId] = useState('')
  const [selectedKabId, setSelectedKabId] = useState('')
  const [selectedKecId, setSelectedKecId] = useState('')

  const [mainCategory, setMainCategory] = useState<string>("mustahik")
  const [selectedProgram, setSelectedProgram] = useState<string>("")
  
  const [formData, setFormData] = useState({
    nama: '',
    nik: '',
    kk: '',
    gender: 'L', 
    no_hp: '',
    kategori_pm: 'Fakir', 
    program_induk: '', 
    sub_program: '', 
    alamat: '',
    desa: '',
    kelurahan_kecamatan: '', 
    kabupaten_kota: '',
    provinsi: '',
    jumlah_jiwa: 1,
    latitude: 0,
    longitude: 0
  })

  // --- Fetch Data Wilayah ---
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then(res => res.json())
      .then(setProvinces)
  }, [])

  useEffect(() => {
    if (selectedProvId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
        .then(res => res.json())
        .then(setRegencies)
    }
  }, [selectedProvId])

  useEffect(() => {
    if (selectedKabId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedKabId}.json`)
        .then(res => res.json())
        .then(setDistricts)
    }
  }, [selectedKabId])

  useEffect(() => {
    if (selectedKecId) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedKecId}.json`)
        .then(res => res.json())
        .then(setVillages)
    }
  }, [selectedKecId])

  // --- Search Location ---
  const handleSearchLocation = async () => {
    const fullQuery = `${searchQuery} ${formData.desa} ${formData.kelurahan_kecamatan} ${formData.kabupaten_kota} ${formData.provinsi}`.trim();
    if (!fullQuery) return toast.warning("Masukkan kueri lokasi");
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fullQuery}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const newLat = parseFloat(lat);
        const newLng = parseFloat(lon);
        setFormData(prev => ({ ...prev, latitude: newLat, longitude: newLng }));
        setMapCenter([newLat, newLng]);
        toast.success("Lokasi ditemukan", { description: display_name });
      } else {
        toast.error("Lokasi tidak ditemukan");
      }
    } catch (error) {
      toast.error("Gagal menghubungi layanan peta");
    } finally {
      setSearching(false);
    }
  }

  // --- Sync Program Hierarki (Tetap dipertahankan) ---
  useEffect(() => {
    if (hierarkiData && hierarkiData[mainCategory]) {
      const programs = Object.keys(hierarkiData[mainCategory])
      const firstProgram = programs[0] || ""
      setSelectedProgram(firstProgram)
      setFormData(prev => ({ ...prev, program_induk: firstProgram }))
    }
  }, [mainCategory, hierarkiData])

  useEffect(() => {
    if (mainCategory && selectedProgram && hierarkiData[mainCategory][selectedProgram]) {
      const subPrograms = hierarkiData[mainCategory][selectedProgram]
      const firstSub = subPrograms[0] || ""
      setFormData(prev => ({ ...prev, sub_program: firstSub }))
    }
  }, [selectedProgram, mainCategory, hierarkiData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.latitude === 0 || formData.longitude === 0) {
      return toast.error("Titik Koordinat Kosong")
    }
    setLoading(true)
    try {
      const res = await fetch('/api/mustahik/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) toast.success("Berhasil Tersimpan");
      else toast.error("Gagal Menyimpan");
    } catch (error) {
      toast.error("Kesalahan koneksi");
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2 max-w-7xl mx-auto pb-10">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 border-b bg-slate-50/50 py-4">
          <UserPlus className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Informasi Registrasi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          
          {/* LEVEL HIERARKI PROGRAM */}
          <div className="grid gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 shadow-inner">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5 font-sans">
                <LayoutGrid className="h-3 w-3" /> 1. Kelompok Entitas
              </Label>
              <select className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer" value={mainCategory} onChange={(e: ChangeEvent<HTMLSelectElement>) => setMainCategory(e.target.value)}>
                <option value="mustahik">MUSTAHIK (Penerima)</option>
                <option value="penyalur">PENYALUR (Mitra)</option>
                <option value="lainnya">ADMINISTRASI / LAINNYA</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-emerald-600 uppercase flex items-center gap-1.5"><ClipboardList className="h-3 w-3" /> 2. Program Induk</Label>
              <select className="flex h-11 w-full rounded-md border-2 border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer" value={selectedProgram} onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedProgram(e.target.value)}>
                {hierarkiData[mainCategory] && Object.keys(hierarkiData[mainCategory]).map(prog => (
                  <option key={prog} value={prog}>{prog}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1.5"><Layers className="h-3 w-3" /> 3. Sub-Program</Label>
              <div className="relative">
                <select required className="flex h-11 w-full rounded-md border-2 border-blue-100 bg-white pl-3 pr-10 py-2 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer" value={formData.sub_program} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, sub_program: e.target.value})}>
                  {hierarkiData[mainCategory][selectedProgram]?.map(sub => (
                    <option key={sub} value={sub}>{sub.replace(/''/g, "'")}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-3.5 h-4 w-4 rotate-90 text-blue-500 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold flex items-center gap-2"><UserCircle className="h-4 w-4 text-emerald-600" /> Gender</Label>
                <select className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium" value={formData.gender} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, gender: e.target.value})}>
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold text-xs text-slate-500 uppercase flex items-center gap-1.5"><LayoutGrid className="h-3 w-3" /> Kategori PM (Asnaf)</Label>
                <select className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium" value={formData.kategori_pm} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData({...formData, kategori_pm: e.target.value})}>
                  {["Fakir","Miskin","Amil","Muallaf","Riqab","Gharimin","Fisabilillah","Ibnu Sabil"].map(asnaf => (
                    <option key={asnaf} value={asnaf}>{asnaf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" /> WhatsApp</Label>
                <Input placeholder="08..." value={formData.no_hp} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, no_hp: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-emerald-600" /> Jumlah Jiwa</Label>
                <Input type="number" min={1} value={formData.jumlah_jiwa} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, jumlah_jiwa: parseInt(e.target.value) || 1})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Nama Lengkap / Instansi</Label>
              <Input required placeholder="..." value={formData.nama} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData({...formData, nama: e.target.value})} className="h-11 shadow-sm" />
            </div>

            {/* HIERARKI WILAYAH INDONESIA */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-4">
              <Label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1.5"><Globe className="h-3 w-3" /> Hierarki Wilayah Indonesia</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Provinsi</Label>
                  <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                    value={selectedProvId} onChange={(e) => {
                      setSelectedProvId(e.target.value);
                      setFormData({...formData, provinsi: provinces.find(p => p.id === e.target.value)?.name || ""});
                      setSelectedKabId(''); setSelectedKecId(''); setRegencies([]); setDistricts([]); setVillages([]);
                    }}>
                    <option value="">Pilih Provinsi</option>
                    {provinces.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Kabupaten/Kota</Label>
                  <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                    disabled={!selectedProvId} value={selectedKabId} onChange={(e) => {
                      setSelectedKabId(e.target.value);
                      setFormData({...formData, kabupaten_kota: regencies.find(r => r.id === e.target.value)?.name || ""});
                      setSelectedKecId(''); setDistricts([]); setVillages([]);
                    }}>
                    <option value="">Pilih Kabupaten</option>
                    {regencies.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Kecamatan</Label>
                  <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                    disabled={!selectedKabId} value={selectedKecId} onChange={(e) => {
                      setSelectedKecId(e.target.value);
                      setFormData({...formData, kelurahan_kecamatan: districts.find(d => d.id === e.target.value)?.name || ""});
                      setVillages([]);
                    }}>
                    <option value="">Pilih Kecamatan</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Desa/Kelurahan</Label>
                  <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:opacity-50"
                    disabled={!selectedKecId} value={formData.desa} onChange={(e) => setFormData({...formData, desa: villages.find(v => v.name === e.target.value)?.name || e.target.value})}>
                    <option value="">Pilih Desa</option>
                    {villages.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold text-sm">Alamat Lengkap (Detail Patokan)</Label>
              <Textarea placeholder="..." value={formData.alamat} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, alamat: e.target.value})} className="min-h-[80px] focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2 border-b bg-slate-50/50 py-4 font-bold text-slate-800">
          <MapPin className="h-5 w-5 text-emerald-600" /> Pemetaan Geospasial
        </CardHeader>
        <CardContent className="space-y-4 pt-6 flex-1 bg-white">
          <div className="flex gap-2 group">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input placeholder="Cari wilayah spesifik..." className="pl-9 h-10 border-slate-200 focus:ring-emerald-500" value={searchQuery} onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()} />
            </div>
            <Button type="button" variant="outline" onClick={handleSearchLocation} disabled={searching} className="border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 font-semibold transition-all">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cari"}
            </Button>
          </div>

          <div className="h-[380px] w-full border-2 border-slate-100 rounded-2xl overflow-hidden relative shadow-inner bg-slate-50">
             <MapPicker center={mapCenter} onLocationSelect={(lat, lng) => { setFormData({...formData, latitude: lat, longitude: lng}); setMapCenter([lat, lng]); }} />
          </div>

          <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 flex justify-between text-xs font-mono text-emerald-700 shadow-sm">
             <span className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3" /> Lat: {formData.latitude.toFixed(6)}</span>
             <span>Lng: {formData.longitude.toFixed(6)}</span>
          </div>

          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 text-base font-bold shadow-lg mt-auto gap-3 transition-all active:scale-[0.98]" disabled={loading}>
            {loading ? "Menyimpan Data..." : <><UserPlus className="h-5 w-5" /> Daftarkan Entitas</>}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}