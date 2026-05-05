'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ClipboardCheck, Wallet, Home, Loader2, Save,
  Star, User, ChevronRight, ChevronLeft, Check, UserPlus,
} from 'lucide-react'

import QuestionItem from './QuestionItem'
import SurveySummary from './SurveySummary'

import {
  GOLONGAN_ASNAF,
  KONDISI_TEMPAT_TINGGAL,
  KATEGORI_REKOMENDASI,
} from '@/lib/constants-survey'
import { calculateAverage, determineKelayakan } from '@/lib/calc-survey'

interface Pertanyaan {
  sk_pertanyaan: number
  kode_pertanyaan: string
  teks_pertanyaan: string
  grup_pertanyaan?: string
}

interface MustahikBaru {
  nama: string
  nik: string
  no_hp: string
  gender: string
  kategori_pm: string
  jumlah_jiwa: number
  kabupaten_kota: string
  alamat: string
  program_induk: string
}

const DEFAULT_MUSTAHIK: MustahikBaru = {
  nama: '',
  nik: '',
  no_hp: '',
  gender: 'L',
  kategori_pm: 'Fakir',
  jumlah_jiwa: 1,
  kabupaten_kota: '',
  alamat: '',
  program_induk: 'Sosial Kemanusiaan',
}

export default function SurveyForm({ id_survey }: { id_survey?: string }) {
  const [currentStep, setCurrentStep]   = useState(0)
  const [loading, setLoading]           = useState(false)
  const [loadingData, setLoadingData]   = useState(true)
  const [creatingMustahik, setCreating] = useState(false)
  const [questions, setQuestions]       = useState<Pertanyaan[]>([])
  const [scores, setScores]             = useState<Record<number, number>>({})
  const [generatedId, setGeneratedId]   = useState('')    // id_mustahik hasil generate
  const [skMustahik, setSkMustahik]     = useState(0)    // sk internal setelah create

  // Form mustahik baru (Step 1)
  const [mustahikForm, setMustahikForm] = useState<MustahikBaru>(DEFAULT_MUSTAHIK)

  // Form survey
  const [surveyData, setSurveyData] = useState({
    sk_petugas:             1,
    pendapatan_bulanan:     0,
    pengeluaran_bulanan:    0,
    jumlah_tanggungan:      0,
    kondisi_tempat_tinggal: KONDISI_TEMPAT_TINGGAL[2].value,
    kategori_asnaf:         GOLONGAN_ASNAF[0].value,
    kategori_rekomendasi:   KATEGORI_REKOMENDASI[0].value,
  })

  // ── Load pertanyaan ────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingData(true)
      try {
        const resQ  = await fetch('/api/survey/pertanyaan')
        const dataQ = await resQ.json()
        if (!Array.isArray(dataQ)) return
        setQuestions(dataQ)
        const init: Record<number, number> = {}
        dataQ.forEach((q: Pertanyaan) => (init[q.sk_pertanyaan] = 3))
        setScores(init)
      } catch {
        toast.error('Gagal memuat kriteria survey')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [])

  // ── Grup pertanyaan ────────────────────────────────────────────────────────
  const groupedQuestions = useMemo(() => {
    const acc: Record<string, Pertanyaan[]> = {}
    questions.forEach((q) => {
      const g = q.grup_pertanyaan || 'Penilaian Umum'
      ;(acc[g] = acc[g] || []).push(q)
    })
    return acc
  }, [questions])

  const dynamicGroups = Object.keys(groupedQuestions)
  const TOTAL_STEPS   = 3 + dynamicGroups.length + 1
  const FINAL_STEP    = TOTAL_STEPS - 1

  // ── Scoring ────────────────────────────────────────────────────────────────
  const totalSkor = calculateAverage(scores)
  const statusObj = determineKelayakan(totalSkor)

  // ── Step labels ────────────────────────────────────────────────────────────
  const allStepTitles = [
    'Data Mustahik',
    'Profil Ekonomi',
    'Kondisi Hunian',
    ...dynamicGroups,
    'Rekomendasi',
  ]

  // ── Validasi lanjut ────────────────────────────────────────────────────────
  const canProceed = useMemo(() => {
    if (currentStep === 0) return mustahikForm.nama.trim().length >= 3
    return true
  }, [currentStep, mustahikForm.nama])

  // ── Buat mustahik baru sebelum masuk Step 1 ────────────────────────────────
  const handleNextFromStep0 = async () => {
    if (generatedId) { setCurrentStep(1); return } // Sudah dibuat sebelumnya

    setCreating(true)
    try {
      const payload = {
        ...mustahikForm,
        latitude:  0,
        longitude: 0,
        sub_program: 'To Be Determined',
        dana_tersalur: 0,
      }
      const res    = await fetch('/api/mustahik/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Gagal membuat mustahik')

      setGeneratedId(result.id_generated)
      toast.success(`Mustahik terdaftar: ${result.id_generated}`)
      setCurrentStep(1)
    } catch (err: any) {
      toast.error(err.message || 'Gagal mendaftarkan mustahik')
    } finally {
      setCreating(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 0) { handleNextFromStep0(); return }
    setCurrentStep(s => s + 1)
  }

  // ── Submit survey ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!generatedId) return toast.error('Mustahik belum terdaftar')
    setLoading(true)
    try {
      const payload = {
        ...surveyData,
        id_mustahik:     generatedId,
        jumlah_tanggungan: mustahikForm.jumlah_jiwa,
        skor_akhir:      totalSkor,
        status_kelayakan: statusObj.value,
        detail_skor:     scores,
      }
      const res = await fetch('/api/survey/baru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success('Survey berhasil disimpan!')
        setMustahikForm(DEFAULT_MUSTAHIK)
        setGeneratedId('')
        setCurrentStep(0)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal menyimpan survey')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
        <p className="text-sm text-slate-400 font-medium">Memuat formulir...</p>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-2xl pb-16">
      <StepProgress current={currentStep} total={TOTAL_STEPS} titles={allStepTitles} />

      <div className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100">
              {currentStep === 0 ? <UserPlus className="h-5 w-5 text-indigo-700" />
               : currentStep === FINAL_STEP ? <Star className="h-5 w-5 text-emerald-700" />
               : <ClipboardCheck className="h-5 w-5 text-indigo-600" />}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Langkah {currentStep + 1} dari {TOTAL_STEPS}
              </p>
              <h2 className="text-lg font-black text-slate-900">{allStepTitles[currentStep]}</h2>
            </div>
            {/* Tampilkan ID yang sudah di-generate */}
            {generatedId && (
              <Badge className="ml-auto bg-emerald-100 text-emerald-700 border-0 font-mono text-xs">
                {generatedId}
              </Badge>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-5">

          {/* STEP 0 — Data Mustahik Baru */}
          {currentStep === 0 && (
            <div className="space-y-4">
              {generatedId ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Mustahik berhasil terdaftar</p>
                    <p className="text-xs font-mono text-emerald-600">{generatedId}</p>
                  </div>
                  <Button
                    variant="ghost" size="sm"
                    className="ml-auto text-xs text-slate-500 hover:text-rose-600"
                    onClick={() => setGeneratedId('')}
                  >
                    Ubah
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-slate-400 font-medium bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                  Isi data mustahik berikut. ID akan di-generate otomatis saat Anda menekan <strong>Lanjut</strong>.
                </p>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Nama Lengkap <span className="text-rose-500">*</span></Label>
                  <Input
                    placeholder="Nama lengkap mustahik"
                    className="h-11 font-semibold"
                    value={mustahikForm.nama}
                    onChange={e => setMustahikForm(f => ({ ...f, nama: e.target.value }))}
                    disabled={!!generatedId}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase">NIK (KTP)</Label>
                  <Input
                    placeholder="16 digit NIK"
                    className="h-11 font-mono"
                    maxLength={16}
                    value={mustahikForm.nik}
                    onChange={e => setMustahikForm(f => ({ ...f, nik: e.target.value }))}
                    disabled={!!generatedId}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase">No. WhatsApp</Label>
                  <Input
                    placeholder="08..."
                    className="h-11"
                    value={mustahikForm.no_hp}
                    onChange={e => setMustahikForm(f => ({ ...f, no_hp: e.target.value }))}
                    disabled={!!generatedId}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Gender</Label>
                  <select
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    value={mustahikForm.gender}
                    onChange={e => setMustahikForm(f => ({ ...f, gender: e.target.value }))}
                    disabled={!!generatedId}
                  >
                    <option value="L">Laki-Laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Kategori PM (Asnaf)</Label>
                  <select
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    value={mustahikForm.kategori_pm}
                    onChange={e => setMustahikForm(f => ({ ...f, kategori_pm: e.target.value }))}
                    disabled={!!generatedId}
                  >
                    {['Fakir','Miskin','Amil','Muallaf','Riqab','Gharimin','Fisabilillah','Ibnu Sabil']
                      .map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Jumlah Jiwa dalam KK</Label>
                  <Input
                    type="number" min={1} placeholder="1"
                    className="h-11"
                    value={mustahikForm.jumlah_jiwa}
                    onChange={e => setMustahikForm(f => ({ ...f, jumlah_jiwa: parseInt(e.target.value) || 1 }))}
                    disabled={!!generatedId}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Program</Label>
                  <select
                    className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                    value={mustahikForm.program_induk}
                    onChange={e => setMustahikForm(f => ({ ...f, program_induk: e.target.value }))}
                    disabled={!!generatedId}
                  >
                    {['Kesehatan','Pendidikan','Ekonomi','Sosial Kemanusiaan','Dakwah & Advokasi']
                      .map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-bold text-slate-600 uppercase">Kabupaten / Kota</Label>
                  <Input
                    placeholder="Contoh: Kota Pontianak"
                    className="h-11"
                    value={mustahikForm.kabupaten_kota}
                    onChange={e => setMustahikForm(f => ({ ...f, kabupaten_kota: e.target.value }))}
                    disabled={!!generatedId}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 — Profil Ekonomi */}
          {currentStep === 1 && (
            <StepEkonomi data={surveyData} setData={setSurveyData} />
          )}

          {/* STEP 2 — Kondisi Hunian */}
          {currentStep === 2 && (
            <StepHunian data={surveyData} setData={setSurveyData} />
          )}

          {/* STEP 3+ — Pertanyaan per grup */}
          {currentStep >= 3 && currentStep < FINAL_STEP && (() => {
            const group = dynamicGroups[currentStep - 3]
            const qs    = groupedQuestions[group] || []
            return (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 font-semibold">
                  {qs.length} pertanyaan — nilai 1 (sangat buruk) hingga 5 (sangat baik)
                </p>
                {qs.map(q => (
                  <QuestionItem
                    key={q.sk_pertanyaan}
                    sk_pertanyaan={q.sk_pertanyaan}
                    kode_pertanyaan={q.kode_pertanyaan}
                    teks_pertanyaan={q.teks_pertanyaan}
                    currentScore={scores[q.sk_pertanyaan]}
                    onScoreChange={(sk, val) => setScores(s => ({ ...s, [sk]: val }))}
                  />
                ))}
              </div>
            )
          })()}

          {/* FINAL — Rekomendasi */}
          {currentStep === FINAL_STEP && (
            <div className="space-y-5">
              <SurveySummary score={totalSkor} status={statusObj.label} />
              <div className="space-y-2">
                <Label className="text-sm font-bold text-slate-700">
                  Rekomendasi Akhir <span className="text-rose-500">*</span>
                </Label>
                <select
                  className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-emerald-700 outline-none focus:border-emerald-500"
                  value={surveyData.kategori_rekomendasi}
                  onChange={e => setSurveyData(d => ({ ...d, kategori_rekomendasi: e.target.value }))}
                >
                  {KATEGORI_REKOMENDASI.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 border-t bg-slate-50 px-6 py-4">
          <Button
            type="button" variant="outline"
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 0}
            className="gap-2 font-bold"
          >
            <ChevronLeft className="h-4 w-4" /> Kembali
          </Button>

          {currentStep < FINAL_STEP ? (
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed || creatingMustahik}
              className="gap-2 bg-indigo-600 hover:bg-indigo-700 font-bold min-w-[120px]"
            >
              {creatingMustahik
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Mendaftarkan...</>
                : <>Lanjut <ChevronRight className="h-4 w-4" /></>
              }
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !generatedId}
              className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold min-w-[160px]"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...</>
                : <><Save className="h-4 w-4" /> Simpan Survey</>
              }
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Progress ──────────────────────────────────────────────────────────────────

function StepProgress({ current, total, titles }: { current: number; total: number; titles: string[] }) {
  const pct = Math.round(((current + 1) / total) * 100)
  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500 font-semibold sm:hidden">{current + 1}/{total} — {titles[current]}</p>
      <div className="hidden sm:flex items-center gap-1">
        {titles.map((_, i) => {
          const done   = i < current
          const active = i === current
          return (
            <div key={i} className="flex items-center gap-1 flex-1 min-w-0">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-black transition-all
                ${done ? 'bg-indigo-600 text-white' : active ? 'bg-slate-900 text-white scale-110' : 'bg-slate-100 text-slate-400'}`}>
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {i < titles.length - 1 && (
                <div className={`h-0.5 flex-1 rounded-full ${done ? 'bg-indigo-400' : 'bg-slate-200'}`} />
              )}
            </div>
          )
        })}
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-200">
        <div className="h-1.5 rounded-full bg-indigo-600 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

// ── Step Ekonomi ──────────────────────────────────────────────────────────────

function StepEkonomi({ data, setData }: { data: any; setData: any }) {
  const selisih  = data.pendapatan_bulanan - data.pengeluaran_bulanan
  const hasInput = data.pendapatan_bulanan > 0 || data.pengeluaran_bulanan > 0
  const defisit  = selisih < 0
  const fmt      = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: 'Pendapatan Bulanan', key: 'pendapatan_bulanan' },
          { label: 'Pengeluaran Bulanan', key: 'pengeluaran_bulanan' },
        ].map(({ label, key }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-600 uppercase">{label}</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
              <Input
                type="number" placeholder="0"
                className="pl-12 h-11"
                value={data[key] || ''}
                onChange={e => setData((d: any) => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
        ))}
      </div>
      {hasInput && (
        <div className={`flex items-center justify-between gap-2 rounded-xl border px-4 py-3 text-sm font-bold ${
          defisit ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          <span>{defisit ? '⚠ Defisit' : '✓ Surplus'}</span>
          <span className="font-black">{fmt(Math.abs(selisih))}</span>
        </div>
      )}
    </>
  )
}

// ── Step Hunian ───────────────────────────────────────────────────────────────

function StepHunian({ data, setData }: { data: any; setData: any }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500 font-medium">Pilih kondisi berdasarkan pengamatan langsung.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {KONDISI_TEMPAT_TINGGAL.map(k => {
          const active = data.kondisi_tempat_tinggal === k.value
          return (
            <button
              key={k.value} type="button"
              onClick={() => setData((d: any) => ({ ...d, kondisi_tempat_tinggal: k.value }))}
              className={`flex min-h-[72px] flex-col items-center justify-center rounded-xl border-2 p-3 text-center text-xs font-bold transition-all duration-200
                ${active ? 'border-amber-500 bg-amber-50 text-amber-800 shadow-md scale-[1.03]'
                         : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50/30'}`}
            >
              {active && <Check className="h-4 w-4 mb-1 text-amber-600" />}
              {k.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
