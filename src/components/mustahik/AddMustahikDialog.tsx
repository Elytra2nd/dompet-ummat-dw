'use client'

import { useState, useEffect, ChangeEvent } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import dynamic from 'next/dynamic'
import {
  MapPin,
  ClipboardList,
  LayoutGrid,
  Layers,
  UserCircle,
  Search,
  Loader2,
  Phone,
  Users,
  Globe,
  Banknote,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  Home
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

interface AddMustahikDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: MustahikFormData | null
  onSuccess: (data: any) => void
}

export default function AddMustahikDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: AddMustahikDialogProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  
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

  const [formData, setFormData] = useState<MustahikFormData>(defaultForm)
  const isGeoLocked = formData.latitude !== 0 && formData.longitude !== 0

  // Init Data (Untuk Edit)
  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData(initialData)
        setMapCenter(initialData.latitude && initialData.longitude ? [initialData.latitude, initialData.longitude] : [-0.3344, 111.7001])
        // Program & Sub Program Logic untuk Edit
        if (initialData.program_induk) {
          setSelectedProgram(initialData.program_induk)
          // Asumsi kategori utama dari hierarki yang cocok dengan program induk (simplifikasi: cari dari hierarkiData)
          let foundCategory = 'mustahik'
          for (const cat of Object.keys(hierarkiData)) {
            if (Object.keys(hierarkiData[cat]).includes(initialData.program_induk)) {
              foundCategory = cat
              break
            }
          }
          setMainCategory(foundCategory)
        }
      } else {
        setFormData(defaultForm)
        setStep(1)
        setMapCenter([-0.3344, 111.7001])
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData])

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
    if (!initialData && hierarkiData[mainCategory]) {
      const programs = Object.keys(hierarkiData[mainCategory])
      setSelectedProgram(programs[0] || '')
      setFormData((prev) => ({ ...prev, program_induk: programs[0] || '' }))
    }
  }, [mainCategory, initialData])

  useEffect(() => {
    if (!initialData && mainCategory && selectedProgram && hierarkiData[mainCategory][selectedProgram]) {
      const firstSub = hierarkiData[mainCategory][selectedProgram][0] || ''
      setFormData((prev) => ({ ...prev, sub_program: firstSub }))
    }
  }, [selectedProgram, mainCategory, initialData])

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
        onSuccess({
          ...formData,
          id_generated: result.id_generated || result.id || '-',
          isEdit
        })
        onOpenChange(false)
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
    <Dialog open={open} onOpenChange={(val) => { if (!loading) onOpenChange(val) }}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-slate-50">
        <DialogHeader className="px-6 py-4 border-b bg-white shrink-0">
          <DialogTitle className="text-xl font-black text-slate-800">
            {initialData?.sk_mustahik ? 'Update Data Mustahik' : 'Registrasi Entitas Baru'}
          </DialogTitle>
          <DialogDescription className="text-xs font-medium">
            Sistem Informasi Geospasial (SOLAP Ready)
          </DialogDescription>
        </DialogHeader>

        {/* ── Progress Bar ── */}
        <div className="flex border-b bg-white">
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`flex-1 py-3 text-center border-b-2 text-xs font-black uppercase tracking-wider transition-colors ${
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

        {/* ── Konten Scrollable ── */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* STEP 1: IDENTITAS */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Kelompok Entitas</Label>
                  <select
                    className="flex h-10 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500"
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
                    className="flex h-10 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500"
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
                    className="flex h-10 w-full rounded-md border bg-white px-3 text-sm focus:ring-2 focus:ring-emerald-500"
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
                    className="font-bold"
                  />
                  <p className="text-[10px] text-slate-500">Opsional. Mengisi field ini akan men-generate record di fact_penyaluran.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Nama Lengkap / Instansi *</Label>
                  <Input required value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">NIK (KTP) *</Label>
                    <Input required value={formData.nik} onChange={(e) => setFormData({ ...formData, nik: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Jumlah Jiwa</Label>
                    <Input type="number" min={1} value={formData.jumlah_jiwa} onChange={(e) => setFormData({ ...formData, jumlah_jiwa: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Gender</Label>
                    <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm" value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                      <option value="L">Laki-Laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">Kategori PM (Asnaf)</Label>
                    <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm" value={formData.kategori_pm} onChange={(e) => setFormData({ ...formData, kategori_pm: e.target.value })}>
                      {['Fakir', 'Miskin', 'Amil', 'Muallaf', 'Riqab', 'Gharimin', 'Fisabilillah', 'Ibnu Sabil'].map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">No. WhatsApp</Label>
                  <Input placeholder="08..." value={formData.no_hp} onChange={(e) => setFormData({ ...formData, no_hp: e.target.value })} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOKASI & PETA */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-700">Provinsi & Kabupaten *</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <select className="h-10 rounded border bg-white px-2 text-xs" value={selectedProvId} onChange={(e) => {
                      setSelectedProvId(e.target.value)
                      setFormData({ ...formData, provinsi: provinces.find((p) => p.id === e.target.value)?.name || '' })
                      setSelectedKabId('')
                    }}>
                      <option value="">Pilih Provinsi</option>
                      {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="h-10 rounded border bg-white px-2 text-xs" disabled={!selectedProvId} value={selectedKabId} onChange={(e) => {
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
                    <select className="h-10 rounded border bg-white px-2 text-xs" disabled={!selectedKabId} value={selectedKecId} onChange={(e) => {
                      setSelectedKecId(e.target.value)
                      setFormData({ ...formData, kelurahan_kecamatan: districts.find((d) => d.id === e.target.value)?.name || '' })
                    }}>
                      <option value="">Pilih Kecamatan</option>
                      {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                    <select className="h-10 rounded border bg-white px-2 text-xs" disabled={!selectedKecId} value={formData.desa} onChange={(e) => setFormData({ ...formData, desa: e.target.value })}>
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

              {/* MAP RENDER HANYA JIKA TAB AKTIF */}
              <div className="flex flex-col gap-2 h-[350px]">
                <div className="flex gap-2">
                  <Input placeholder="Cari area di peta..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearchLocation()} className="h-9 text-xs" />
                  <Button variant="secondary" size="sm" onClick={handleSearchLocation} disabled={searching} className="h-9">
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
              <div className="bg-white rounded-xl border p-5 space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest border-b pb-2">Ringkasan Data</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg">
                    <User className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{formData.nama}</p>
                      <p className="text-xs text-slate-500">NIK: {formData.nik} • {formData.gender === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
                      <Badge variant="outline" className="mt-1 text-[10px]">{formData.kategori_pm}</Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg">
                    <Home className="h-5 w-5 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{formData.kabupaten_kota}</p>
                      <p className="text-xs text-slate-500 line-clamp-2">{formData.alamat}</p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{formData.desa || '-'} • {formData.kelurahan_kecamatan || '-'}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-start bg-emerald-50 p-3 rounded-lg">
                    <ClipboardList className="h-5 w-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-emerald-600 uppercase">Program</p>
                      <p className="font-bold text-slate-900 text-sm">{formData.program_induk}</p>
                      <p className="text-xs text-slate-500">{formData.sub_program}</p>
                    </div>
                  </div>

                  {formData.dana_tersalur > 0 ? (
                    <div className="flex gap-3 items-start bg-amber-50 p-3 rounded-lg">
                      <Banknote className="h-5 w-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-amber-600 uppercase">Dana Tersalur (Create Fact)</p>
                        <p className="font-bold text-slate-900 text-lg leading-none mt-1">Rp {formData.dana_tersalur.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 items-start bg-slate-50 p-3 rounded-lg">
                      <MapPin className="h-5 w-5 text-rose-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-rose-600 uppercase">Geolokasi</p>
                        <p className="font-mono text-xs font-bold text-slate-700 mt-1">{formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</p>
                        <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 mt-1 text-[9px]">SPATIAL LOCKED</Badge>
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
        <div className="px-6 py-4 bg-slate-50 border-t flex justify-between shrink-0">
          <Button
            variant="ghost"
            onClick={() => setStep((s) => s - 1 as any)}
            disabled={step === 1 || loading}
            className="font-bold"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => s + 1 as any)}
              disabled={(step === 1 && !canGoToStep2) || (step === 2 && !canGoToStep3)}
              className="font-bold bg-slate-900 hover:bg-slate-800"
            >
              Lanjut
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading || !isGeoLocked}
              className="font-bold bg-emerald-600 hover:bg-emerald-700 min-w-[140px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Push to Warehouse</>}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
