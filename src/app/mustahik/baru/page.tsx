'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  MapPin,
  ClipboardList,
  Search,
  Loader2,
  Banknote,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Home
} from 'lucide-react'
import MustahikSuccessDialog from '@/components/mustahik/MustahikSuccessDialog'

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
  () => import('@/components/mustahik/MapPickerComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full animate-pulse items-center justify-center bg-slate-100 text-xs font-medium text-slate-400">
        Memuat Peta...
      </div>
    ),
  },
)

const hierarkiData: Record<string, Record<string, string[]>> = {
  mustahik: {
    Pendidikan: ['Beasiswa Utama', 'Institut Muallaf', 'Ota'],
    Kesehatan: ['Kesehatan Gratis', 'Ambulans Gratis', 'Dompet Tvri Peduli'],
    Ekonomi: ['Pemberdayaan Ekonomi'],
    'Sosial Kemanusiaan': [
      'Bantuan Pangan',
      'Dakwah Pedalaman',
      'Zakat Fitrah',
      'Fidyah',
      'Zakat Mal',
      'Paket Buka Puasa',
      'Paket Lebaran',
    ],
    'Dakwah & Advokasi': [
      "Ta''Jil Ontheroad",
      "Paket Ta''Jil",
      'Akikah Kita',
      'Kurban/Tfk',
      'Cicilan Kurban',
      'Wakaf',
      'Infak Tpa',
    ],
  },
  penyalur: {
    Ekonomi: ['Zakat Profesi', 'Zakat Pertanian'],
    'Dakwah & Advokasi': ['Infak Umum', 'Infak Praktis', 'Inbuser'],
    Operasional: ['Vue', 'Ett', 'Lainnya'],
  },
  lainnya: {
    'To Be Determined': [
      'To Be Determined',
      'Not Applicable',
      'Data Corrupted',
    ],
  },
}

export interface MustahikFormData {
  sk_mustahik: number
  nama: string
  nik: string
  kk: string
  gender: string
  no_hp: string
  kategori_pm: string
  program_induk: string
  sub_program: string
  alamat: string
  desa: string
  kelurahan_kecamatan: string
  kabupaten_kota: string
  provinsi: string
  jumlah_jiwa: number
  dana_tersalur: number
  latitude: number
  longitude: number
}

const defaultForm: MustahikFormData = {
  sk_mustahik: 0,
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
  dana_tersalur: 0,
  latitude: 0,
  longitude: 0,
}

import { Suspense } from 'react'

export function AddMustahikFormContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get('id')

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Wilayah State
  const [provinces, setProvinces] = useState<Wilayah[]>([])
  const [regencies, setRegencies] = useState<Wilayah[]>([])
  const [districts, setDistricts] = useState<Wilayah[]>([])
  const [villages, setVillages] = useState<Wilayah[]>([])

  const [selectedProvId, setSelectedProvId] = useState('')
  const [selectedKabId, setSelectedKabId] = useState('')
  const [selectedKecId, setSelectedKecId] = useState('')

  // Map State
  const [searching, setSearching] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([-0.3344, 111.7001])

  // Form State
  const [mainCategory, setMainCategory] = useState<string>('mustahik')
  const [selectedProgram, setSelectedProgram] = useState<string>('')
  const [formData, setFormData] = useState<MustahikFormData>(defaultForm)
  const isGeoLocked = formData.latitude !== 0 && formData.longitude !== 0

  // Success Dialog State
  const [successDialogOpen, setSuccessDialogOpen] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)

  // Init Data (Untuk Edit)
  useEffect(() => {
    if (editId) {
      setIsEditing(true)
      fetch(`/api/mustahik/index`)
        .then(res => res.json())
        .then(data => {
          const mustahik = data.find((m: any) => m.id_mustahik === editId)
          if (mustahik) {
            const initialData = {
              sk_mustahik: mustahik.sk_mustahik,
              nama: mustahik.nama || '',
              nik: mustahik.nik || '',
              kk: '', 
              gender: 'L', 
              no_hp: '', 
              alamat: mustahik.alamat || '',
              kabupaten_kota: mustahik.kabupaten_kota || '',
              desa: '', 
              kelurahan_kecamatan: '', 
              provinsi: '', 
              jumlah_jiwa: 1, 
              dana_tersalur: 0, 
              kategori_pm: mustahik.kategori_pm || 'Fakir',
              skoring: mustahik.skoring || 0,
              latitude: mustahik.latitude || 0,
              longitude: mustahik.longitude || 0,
              program_induk: '', 
              sub_program: '', 
            }
            setFormData(initialData)
            setMapCenter(initialData.latitude && initialData.longitude ? [initialData.latitude, initialData.longitude] : [-0.3344, 111.7001])
            if (initialData.program_induk) {
              setSelectedProgram(initialData.program_induk)
              let foundCategory = 'mustahik'
              for (const cat of Object.keys(hierarkiData)) {
                if (Object.keys(hierarkiData[cat]).includes(initialData.program_induk)) {
                  foundCategory = cat
                  break
                }
              }
              setMainCategory(foundCategory)
            }
          }
        })
    }
  }, [editId])

  // API Wilayah
  useEffect(() => {
    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
      .then((res) => res.json())
      .then(setProvinces)
  }, [])

  useEffect(() => {
    if (selectedProvId)
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvId}.json`)
        .then((res) => res.json())
        .then(setRegencies)
  }, [selectedProvId])

  useEffect(() => {
    if (selectedKabId)
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedKabId}.json`)
        .then((res) => res.json())
        .then(setDistricts)
  }, [selectedKabId])

  useEffect(() => {
    if (selectedKecId)
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedKecId}.json`)
        .then((res) => res.json())
        .then(setVillages)
  }, [selectedKecId])

  // Map Search
  const handleSearchLocation = async () => {
    const fullQuery = `${searchQuery} ${formData.desa} ${formData.kelurahan_kecamatan} ${formData.kabupaten_kota}`.trim()
    if (!fullQuery) return toast.warning('Masukkan kueri pencarian atau lengkapi wilayah')
    setSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${fullQuery}&limit=1`)
      const data = await res.json()
      if (data && data.length > 0) {
        const { lat, lon } = data[0]
        setFormData((prev) => ({ ...prev, latitude: parseFloat(lat), longitude: parseFloat(lon) }))
        setMapCenter([parseFloat(lat), parseFloat(lon)])
        toast.success('Lokasi berhasil ditemukan')
      } else {
        toast.error('Lokasi tidak ditemukan')
      }
    } catch (e) {
      toast.error('Gagal mencari lokasi')
    } finally {
      setSearching(false)
    }
  }

  // Sync Program
  useEffect(() => {
    if (!isEditing && hierarkiData[mainCategory]) {
      const programs = Object.keys(hierarkiData[mainCategory])
      setSelectedProgram(programs[0] || '')
      setFormData((prev) => ({ ...prev, program_induk: programs[0] || '' }))
    }
  }, [mainCategory, isEditing])

  useEffect(() => {
    if (!isEditing && mainCategory && selectedProgram && hierarkiData[mainCategory][selectedProgram]) {
      const firstSub = hierarkiData[mainCategory][selectedProgram][0] || ''
      setFormData((prev) => ({ ...prev, sub_program: firstSub }))
    }
  }, [selectedProgram, mainCategory, isEditing])

  // Validasi Step
  const canGoToStep2 = formData.nama.trim() !== '' && formData.nik.trim() !== ''
  const canGoToStep3 = isGeoLocked && formData.kabupaten_kota !== ''

  // Submit
  const handleSubmit = async () => {
    if (!isGeoLocked) return toast.error('Koordinat belum terkunci!')
    setLoading(true)
    try {
      const isEdit = formData.sk_mustahik > 0
      const endpoint = isEdit ? '/api/mustahik/index' : '/api/mustahik/create'
      const method = isEdit ? 'PUT' : 'POST'
      
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const result = await res.json()
      
      if (res.ok) {
        setSuccessData({
          ...formData,
          id_generated: result.id_generated || result.id || '-',
          isEdit
        })
        setSuccessDialogOpen(true)
      } else {
        toast.error(result.error || 'Gagal menyimpan data')
      }
    } catch (e) {
      toast.error('Terjadi kesalahan server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-bold hover:bg-slate-50">
            <Link href="/mustahik"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
          </Button>
          <div className="flex flex-col gap-2">
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-black text-slate-900">
              <ClipboardList className="h-8 w-8 text-emerald-600" /> {isEditing ? 'Update Data Mustahik' : 'Registrasi Entitas Baru'}
            </h1>
            <p className="text-sm font-medium text-slate-500">
              Sistem Informasi Geospasial (SOLAP Ready)
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-8">
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          {/* ── Progress Bar ── */}
          <div className="flex border-b bg-white">
            {[1, 2, 3].map((num) => (
              <div
                key={num}
                className={`flex-1 py-4 text-center border-b-2 text-[10px] md:text-xs font-black uppercase tracking-wider transition-colors ${
                  step === num
                    ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
                    : step > num
                    ? 'border-emerald-200 text-emerald-600 bg-white'
                    : 'border-transparent text-slate-400 bg-slate-50'
                }`}
              >
                Step {num}: {num === 1 ? 'Identitas' : num === 2 ? 'Geolokasi' : 'Review'}
              </div>
            ))}
          </div>

          {/* ── Konten Form ── */}
          <div className="p-6 md:p-8">
            {/* STEP 1: IDENTITAS */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Kelompok Entitas</Label>
                    <select
                      className="flex h-11 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500"
                      value={mainCategory}
                      onChange={(e) => setMainCategory(e.target.value)}
                    >
                      <option value="mustahik">MUSTAHIK (Penerima)</option>
                      <option value="penyalur">PENYALUR (Mitra)</option>
                      <option value="lainnya">ADMINISTRASI / LAINNYA</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Program Induk</Label>
                    <select
                      className="flex h-11 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500"
                      value={selectedProgram}
                      onChange={(e) => {
                        setSelectedProgram(e.target.value)
                        setFormData(prev => ({ ...prev, program_induk: e.target.value }))
                      }}
                    >
                      {hierarkiData[mainCategory] &&
                        Object.keys(hierarkiData[mainCategory]).map((prog) => (
                          <option key={prog} value={prog}>{prog}</option>
                        ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Sub-Program</Label>
                    <select
                      className="flex h-11 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500"
                      value={formData.sub_program}
                      onChange={(e) => setFormData({ ...formData, sub_program: e.target.value })}
                    >
                      {hierarkiData[mainCategory][selectedProgram]?.map((sub) => (
                        <option key={sub} value={sub}>{sub.replace(/''/g, "'")}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label className="text-xs font-bold text-slate-700">Dana Tersalur (Rp)</Label>
                    <Input
                      type="number"
                      value={formData.dana_tersalur || ''}
                      onChange={(e) => setFormData({ ...formData, dana_tersalur: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                      className="font-bold h-11"
                    />
                    <p className="text-[10px] text-slate-500">Opsional. Mengisi field ini akan men-generate record di fact_penyaluran.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Nama Lengkap / Instansi *</Label>
                    <Input className="h-11 font-bold" required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">NIK (KTP) *</Label>
                      <Input className="h-11" required value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Jumlah Jiwa</Label>
                      <Input className="h-11" type="number" min={1} value={formData.jumlah_jiwa} onChange={(e) => setFormData({ ...formData, jumlah_jiwa: parseInt(e.target.value) || 1 })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Gender</Label>
                      <select className="flex h-11 w-full rounded-md border bg-white px-3 text-sm" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                        <option value="L">Laki-Laki</option>
                        <option value="P">Perempuan</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">Kategori PM (Asnaf)</Label>
                      <select className="flex h-11 w-full rounded-md border bg-white px-3 text-sm" value={formData.kategori_pm} onChange={(e) => setFormData({ ...formData, kategori_pm: e.target.value })}>
                        {['Fakir', 'Miskin', 'Amil', 'Muallaf', 'Riqab', 'Gharimin', 'Fisabilillah', 'Ibnu Sabil'].map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">No. WhatsApp</Label>
                    <Input className="h-11" placeholder="08..." value={formData.no_hp} onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: LOKASI & PETA */}
            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Provinsi & Kabupaten *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="h-11 rounded border bg-white px-2 text-xs" value={selectedProvId} onChange={(e) => {
                        setSelectedProvId(e.target.value)
                        setFormData({ ...formData, provinsi: provinces.find((p) => p.id === e.target.value)?.name || '' })
                        setSelectedKabId('')
                      }}>
                        <option value="">Pilih Provinsi</option>
                        {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <select className="h-11 rounded border bg-white px-2 text-xs" disabled={!selectedProvId} value={selectedKabId} onChange={(e) => {
                        setSelectedKabId(e.target.value)
                        setFormData({ ...formData, kabupaten_kota: regencies.find((r) => r.id === e.target.value)?.name || '' })
                        setSelectedKecId('')
                      }}>
                        <option value="">Pilih Kabupaten</option>
                        {regencies.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Kecamatan & Desa</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="h-11 rounded border bg-white px-2 text-xs" disabled={!selectedKabId} value={selectedKecId} onChange={(e) => {
                        setSelectedKecId(e.target.value)
                        setFormData({ ...formData, kelurahan_kecamatan: districts.find((d) => d.id === e.target.value)?.name || '' })
                      }}>
                        <option value="">Pilih Kecamatan</option>
                        {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                      <select className="h-11 rounded border bg-white px-2 text-xs" disabled={!selectedKecId} value={formData.desa} onChange={(e) => setFormData({ ...formData, desa: e.target.value })}>
                        <option value="">Pilih Desa</option>
                        {villages.map((v) => <option key={v.id} value={v.name}>{v.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Alamat Lengkap</Label>
                    <Textarea value={formData.alamat} onChange={(e) => setFormData({ ...formData, alamat: e.target.value })} className="min-h-[80px] text-xs" />
                  </div>

                  <div className={`p-4 rounded-xl border ${isGeoLocked ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {isGeoLocked ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
                      <span className={`text-sm font-bold ${isGeoLocked ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {isGeoLocked ? 'Koordinat Terkunci' : 'Koordinat Belum Dikunci'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-mono">
                      {isGeoLocked ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}` : 'Klik pada peta untuk mengunci koordinat geospasial.'}
                    </p>
                  </div>
                </div>

                {/* MAP RENDER */}
                <div className="flex flex-col gap-2 h-[350px]">
                  <div className="flex gap-2">
                    <Input placeholder="Cari area di peta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()} className="h-11 text-xs" />
                    <Button variant="secondary" onClick={handleSearchLocation} disabled={searching} className="h-11 px-4">
                      {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                  </div>
                  <div className="flex-1 rounded-xl overflow-hidden border-2 border-slate-200 relative z-0">
                    <MapPicker
                      center={mapCenter}
                      onLocationSelect={(lat, lng) => {
                        setFormData({ ...formData, latitude: lat, longitude: lng })
                        setMapCenter([lat, lng])
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW */}
            {step === 3 && (
              <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
                <div className="bg-slate-50/50 rounded-xl border p-6 space-y-6">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Ringkasan Data</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex gap-3 items-start bg-white border p-4 rounded-xl shadow-sm">
                      <User className="h-6 w-6 text-slate-400 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900 text-lg">{formData.nama}</p>
                        <p className="text-sm text-slate-500">NIK: {formData.nik} • {formData.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                        <Badge variant="outline" className="mt-2">{formData.kategori_pm}</Badge>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start bg-white border p-4 rounded-xl shadow-sm">
                      <Home className="h-6 w-6 text-slate-400 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-900">{formData.kabupaten_kota}</p>
                        <p className="text-sm text-slate-500 line-clamp-2">{formData.alamat}</p>
                        <p className="text-xs font-mono text-slate-400 mt-1">{formData.desa || '-'} • {formData.kelurahan_kecamatan || '-'}</p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start bg-emerald-50 border border-emerald-100 p-4 rounded-xl shadow-sm">
                      <ClipboardList className="h-6 w-6 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase">Program</p>
                        <p className="font-bold text-slate-900 text-sm">{formData.program_induk}</p>
                        <p className="text-xs text-slate-500">{formData.sub_program}</p>
                      </div>
                    </div>

                    {formData.dana_tersalur > 0 ? (
                      <div className="flex gap-3 items-start bg-amber-50 border border-amber-100 p-4 rounded-xl shadow-sm">
                        <Banknote className="h-6 w-6 text-amber-500 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-amber-600 uppercase">Dana Tersalur (Create Fact)</p>
                          <p className="font-bold text-slate-900 text-lg leading-none mt-1">Rp {formData.dana_tersalur.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3 items-start bg-white border p-4 rounded-xl shadow-sm">
                        <MapPin className="h-6 w-6 text-rose-400 shrink-0" />
                        <div>
                          <p className="text-[10px] font-black text-rose-600 uppercase">Geolokasi</p>
                          <p className="font-mono text-sm font-bold text-slate-700 mt-1">{formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</p>
                          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 mt-2 text-[10px]">SPATIAL LOCKED</Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  {formData.dana_tersalur > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-800 rounded-lg text-xs font-medium border border-amber-200">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Menyimpan data ini juga akan men-generate record baru secara otomatis di tabel <strong>fact_penyaluran</strong>.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer Aksi ── */}
          <div className="px-6 py-4 bg-slate-50 border-t flex justify-between items-center shrink-0">
            <Button
              variant="outline"
              onClick={() => setStep((s) => s - 1 as any)}
              disabled={step === 1 || loading}
              className="font-bold h-11 px-6 border-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Kembali
            </Button>

            {step < 3 ? (
              <Button
                onClick={() => setStep((s) => s + 1 as any)}
                disabled={(step === 1 && !canGoToStep2) || (step === 2 && !canGoToStep3)}
                className="font-bold bg-slate-900 hover:bg-slate-800 h-11 px-8"
              >
                Lanjut
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading || !isGeoLocked}
                className="font-bold bg-emerald-600 hover:bg-emerald-700 h-11 px-8 min-w-[180px] shadow-lg shadow-emerald-200"
              >
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />} 
                {isEditing ? 'Simpan Perubahan' : 'Push to Warehouse'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <MustahikSuccessDialog
        open={successDialogOpen}
        data={successData}
        onAddAnother={() => {
          setSuccessDialogOpen(false)
          setFormData(defaultForm)
          setStep(1)
          if(isEditing) router.push('/mustahik')
        }}
        onClose={() => {
          setSuccessDialogOpen(false)
          router.push('/mustahik')
        }}
      />
    </div>
  )
}

export default function AddMustahikPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>}>
      <AddMustahikFormContent />
    </Suspense>
  )
}
