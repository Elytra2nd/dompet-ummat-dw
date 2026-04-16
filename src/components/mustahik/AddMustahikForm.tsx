'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import {
  MapPin,
  UserPlus,
  ClipboardList,
  ShieldCheck,
  ChevronRight,
  LayoutGrid,
  Layers,
  UserCircle,
  Search,
  Loader2,
  Phone,
  Users,
  Globe,
  Banknote,
} from 'lucide-react'

// --- Interface untuk API Wilayah ---
interface Wilayah {
  id: string
  name: string
}

interface MapPickerProps {
  onLocationSelect: (lat: number, lng: number) => void
  center: [number, number]
}

const MapPicker = dynamic<MapPickerProps>(
  () => import('./MapPickerComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full animate-pulse items-center justify-center bg-slate-100 text-xs font-medium text-slate-400">
        Memuat Peta...
      </div>
    ),
  },
)

interface AddMustahikFormProps {
  hierarkiData: {
    [key: string]: {
      [key: string]: string[]
    }
  }
}

export default function AddMustahikForm({
  hierarkiData,
}: AddMustahikFormProps) {
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -0.3344, 111.7001,
  ])

  const [provinces, setProvinces] = useState<Wilayah[]>([])
  const [regencies, setRegencies] = useState<Wilayah[]>([])
  const [districts, setDistricts] = useState<Wilayah[]>([])
  const [villages, setVillages] = useState<Wilayah[]>([])

  const [selectedProvId, setSelectedProvId] = useState('')
  const [selectedKabId, setSelectedKabId] = useState('')
  const [selectedKecId, setSelectedKecId] = useState('')

  const [mainCategory, setMainCategory] = useState<string>('mustahik')
  const [selectedProgram, setSelectedProgram] = useState<string>('')

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
    dana_tersalur: 0, // Measure untuk fact_penyaluran
    latitude: 0,
    longitude: 0,
  })

  // --- API Wilayah Indonesia ---
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((res) => res.json())
      .then(setProvinces)
  }, [])

  useEffect(() => {
    if (selectedProvId)
      fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`,
      )
        .then((res) => res.json())
        .then(setRegencies)
  }, [selectedProvId])

  useEffect(() => {
    if (selectedKabId)
      fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedKabId}.json`,
      )
        .then((res) => res.json())
        .then(setDistricts)
  }, [selectedKabId])

  useEffect(() => {
    if (selectedKecId)
      fetch(
        `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedKecId}.json`,
      )
        .then((res) => res.json())
        .then(setVillages)
  }, [selectedKecId])

  const handleSearchLocation = async () => {
    const fullQuery =
      `${searchQuery} ${formData.desa} ${formData.kelurahan_kecamatan} ${formData.kabupaten_kota}`.trim()
    if (!fullQuery) return toast.warning('Masukkan kueri lokasi')
    setSearching(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${fullQuery}&limit=1`,
      )
      const data = await res.json()
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setFormData((prev) => ({
          ...prev,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
        }))
        setMapCenter([parseFloat(lat), parseFloat(lon)])
        toast.success('Lokasi ditemukan')
      }
    } catch (e) {
      toast.error('Gagal cari lokasi')
    } finally {
      setSearching(false)
    }
  }

  // --- Sync Program ---
  useEffect(() => {
    if (hierarkiData && hierarkiData[mainCategory]) {
      const programs = Object.keys(hierarkiData[mainCategory])
      setSelectedProgram(programs[0] || '')
      setFormData((prev) => ({ ...prev, program_induk: programs[0] || '' }))
    }
  }, [mainCategory, hierarkiData])

  useEffect(() => {
    if (
      mainCategory &&
      selectedProgram &&
      hierarkiData[mainCategory][selectedProgram]
    ) {
      const firstSub = hierarkiData[mainCategory][selectedProgram][0] || ''
      setFormData((prev) => ({ ...prev, sub_program: firstSub }))
    }
  }, [selectedProgram, mainCategory, hierarkiData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.latitude === 0) return toast.error('Tentukan lokasi di peta')
    setLoading(true)
    try {
      const res = await fetch('/api/mustahik/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) toast.success('Data & Penyaluran Berhasil Disimpan')
      else toast.error('Gagal simpan')
    } catch (e) {
      toast.error('Error server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto grid max-w-7xl gap-6 pb-10 md:grid-cols-2"
    >
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 border-b bg-slate-50/50 py-4">
          <UserPlus className="h-5 w-5 text-emerald-600" />
          <CardTitle className="text-lg font-bold tracking-tight text-slate-800">
            Informasi Registrasi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 pt-6">
          <div className="grid gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 shadow-inner">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <LayoutGrid className="h-3 w-3" /> 1. Kelompok Entitas
              </Label>
              <select
                className="flex h-11 w-full cursor-pointer rounded-md border bg-white px-3 py-2 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                value={mainCategory}
                onChange={(e) => setMainCategory(e.target.value)}
              >
                <option value="mustahik">MUSTAHIK (Penerima)</option>
                <option value="penyalur">PENYALUR (Mitra)</option>
                <option value="lainnya">ADMINISTRASI / LAINNYA</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 uppercase">
                <ClipboardList className="h-3 w-3" /> 2. Program Induk
              </Label>
              <select
                className="flex h-11 w-full cursor-pointer rounded-md border-2 border-emerald-100 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500"
                value={selectedProgram}
                onChange={(e) => setSelectedProgram(e.target.value)}
              >
                {hierarkiData[mainCategory] &&
                  Object.keys(hierarkiData[mainCategory]).map((prog) => (
                    <option key={prog} value={prog}>
                      {prog}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase">
                  <Layers className="h-3 w-3" /> 3. Sub-Program
                </Label>
                <select
                  className="flex h-11 w-full cursor-pointer rounded-md border-2 border-blue-100 bg-white px-3 py-2 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.sub_program}
                  onChange={(e) =>
                    setFormData({ ...formData, sub_program: e.target.value })
                  }
                >
                  {hierarkiData[mainCategory][selectedProgram]?.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub.replace(/''/g, "'")}
                    </option>
                  ))}
                </select>
              </div>

              {/* KOLOM DANA TERSALUR */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 uppercase">
                  <Banknote className="h-3 w-3" /> 4. Dana Tersalur (Rp)
                </Label>
                <Input
                  type="number"
                  placeholder="0"
                  className="h-11 border-orange-200 font-bold focus:ring-orange-500"
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setFormData({
                      ...formData,
                      dana_tersalur: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold text-slate-700">
                  <UserCircle className="h-4 w-4" /> Gender
                </Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 py-2 text-sm"
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                >
                  <option value="L">Laki-Laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-500 text-slate-700 uppercase">
                  Kategori PM (Asnaf)
                </Label>
                <select
                  className="flex h-11 w-full rounded-md border bg-white px-3 py-2 text-sm"
                  value={formData.kategori_pm}
                  onChange={(e) =>
                    setFormData({ ...formData, kategori_pm: e.target.value })
                  }
                >
                  {[
                    'Fakir',
                    'Miskin',
                    'Amil',
                    'Muallaf',
                    'Riqab',
                    'Gharimin',
                    'Fisabilillah',
                    'Ibnu Sabil',
                  ].map((asnaf) => (
                    <option key={asnaf} value={asnaf}>
                      {asnaf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold text-slate-700">
                  <Phone className="h-4 w-4" /> WhatsApp
                </Label>
                <Input
                  placeholder="08..."
                  value={formData.no_hp}
                  onChange={(e) =>
                    setFormData({ ...formData, no_hp: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 font-semibold text-slate-700">
                  <Users className="h-4 w-4" /> Jumlah Jiwa
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.jumlah_jiwa}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      jumlah_jiwa: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">
                Nama Lengkap / Instansi
              </Label>
              <Input
                required
                placeholder="Nama..."
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
              />
            </div>

            <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <Label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                <Globe className="h-3 w-3" /> Hierarki Wilayah Indonesia
              </Label>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="h-10 rounded border bg-white px-2 text-xs"
                  value={selectedProvId}
                  onChange={(e) => {
                    setSelectedProvId(e.target.value)
                    setFormData({
                      ...formData,
                      provinsi:
                        provinces.find((p) => p.id === e.target.value)?.name ||
                        '',
                    })
                    setSelectedKabId('')
                  }}
                >
                  <option value="">Pilih Provinsi</option>
                  {provinces.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded border bg-white px-2 text-xs"
                  disabled={!selectedProvId}
                  value={selectedKabId}
                  onChange={(e) => {
                    setSelectedKabId(e.target.value)
                    setFormData({
                      ...formData,
                      kabupaten_kota:
                        regencies.find((r) => r.id === e.target.value)?.name ||
                        '',
                    })
                    setSelectedKecId('')
                  }}
                >
                  <option value="">Pilih Kabupaten</option>
                  {regencies.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <select
                  className="h-10 rounded border bg-white px-2 text-xs"
                  disabled={!selectedKabId}
                  value={selectedKecId}
                  onChange={(e) => {
                    setSelectedKecId(e.target.value)
                    setFormData({
                      ...formData,
                      kelurahan_kecamatan:
                        districts.find((d) => d.id === e.target.value)?.name ||
                        '',
                    })
                  }}
                >
                  <option value="">Pilih Kecamatan</option>
                  {districts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <select
                  className="h-10 rounded border bg-white px-2 text-xs"
                  disabled={!selectedKecId}
                  value={formData.desa}
                  onChange={(e) =>
                    setFormData({ ...formData, desa: e.target.value })
                  }
                >
                  <option value="">Pilih Desa</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                Alamat Lengkap & Patokan
              </Label>
              <Textarea
                placeholder="..."
                value={formData.alamat}
                onChange={(e) =>
                  setFormData({ ...formData, alamat: e.target.value })
                }
                className="min-h-[80px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="flex flex-col overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-center gap-2 border-b bg-slate-50/50 py-4 font-bold text-slate-800">
          <MapPin className="h-5 w-5 text-emerald-600" /> Pemetaan Geospasial
        </CardHeader>
        <CardContent className="flex-1 space-y-4 bg-white pt-6">
          <div className="group flex gap-2">
            <Input
              placeholder="Cari wilayah spesifik..."
              className="h-10 border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSearchLocation}
              disabled={searching}
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="relative h-[380px] w-full overflow-hidden rounded-2xl border-2 border-slate-100 bg-slate-50 shadow-inner">
            <MapPicker
              center={mapCenter}
              onLocationSelect={(lat, lng) => {
                setFormData({ ...formData, latitude: lat, longitude: lng })
                setMapCenter([lat, lng])
              }}
            />
          </div>
          <Button
            type="submit"
            className="mt-auto h-14 w-full bg-emerald-600 text-base font-bold shadow-lg hover:bg-emerald-700"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Daftarkan & Salurkan'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
