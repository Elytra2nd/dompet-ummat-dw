'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ClipboardCheck, Loader2, Save, Star, User, Check, UserPlus } from 'lucide-react'

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

export default function SurveyEditForm({ id_survey }: { id_survey: string }) {
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [questions, setQuestions] = useState<Pertanyaan[]>([])
  const [scores, setScores] = useState<Record<number, number>>({})
  const [mustahikId, setMustahikId] = useState('')
  const [mustahikName, setMustahikName] = useState('')
  
  const [surveyData, setSurveyData] = useState({
    sk_petugas: 1,
    pendapatan_bulanan: 0,
    pengeluaran_bulanan: 0,
    jumlah_tanggungan: 0,
    kondisi_tempat_tinggal: KONDISI_TEMPAT_TINGGAL[2].value,
    kategori_asnaf: GOLONGAN_ASNAF[0].value,
    kategori_rekomendasi: KATEGORI_REKOMENDASI[0].value,
  })

  // ── Load data ────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoadingData(true)
      try {
        // 1. Fetch pertanyaan
        const resQ = await fetch('/api/survey/pertanyaan')
        const dataQ = await resQ.json()
        if (!Array.isArray(dataQ)) return
        setQuestions(dataQ)
        
        // 2. Fetch existing survey detail
        const resSurvey = await fetch(`/api/survey/${id_survey}`)
        if (resSurvey.ok) {
          const { survey, skorData, detail_skor } = await resSurvey.json()
          
          setMustahikId(survey.dim_mustahik?.id_mustahik || '')
          setMustahikName(survey.dim_mustahik?.nama || '')
          
          setSurveyData({
            sk_petugas: survey.sk_petugas || 1,
            pendapatan_bulanan: Number(skorData?.pendapatan_bulanan) || 0,
            pengeluaran_bulanan: Number(skorData?.pengeluaran_bulanan) || 0,
            jumlah_tanggungan: Number(skorData?.jumlah_tanggungan) || 0,
            kondisi_tempat_tinggal: skorData?.kondisi_tempat_tinggal || KONDISI_TEMPAT_TINGGAL[2].value,
            kategori_asnaf: skorData?.kategori_asnaf || survey.golongan_penerima || GOLONGAN_ASNAF[0].value,
            kategori_rekomendasi: survey.kategori_rekomendasi || KATEGORI_REKOMENDASI[0].value,
          })
          
          // Map detail skor
          const initScores: Record<number, number> = detail_skor || {}
          // Merge with default 3 for any missing questions
          dataQ.forEach((q: Pertanyaan) => {
            if (!initScores[q.sk_pertanyaan]) {
              initScores[q.sk_pertanyaan] = 3
            }
          })
          setScores(initScores)
        } else {
          toast.error('Gagal mengambil detail survey')
          // Initialize empty if failed
          const init: Record<number, number> = {}
          dataQ.forEach((q: Pertanyaan) => (init[q.sk_pertanyaan] = 3))
          setScores(init)
        }
      } catch (err) {
        toast.error('Gagal memuat kriteria survey')
      } finally {
        setLoadingData(false)
      }
    }
    load()
  }, [id_survey])

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

  // ── Scoring ────────────────────────────────────────────────────────────────
  const totalSkor = calculateAverage(scores)
  const statusObj = determineKelayakan(totalSkor)

  // ── Submit Edit ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!mustahikId) return toast.error('Data Mustahik tidak valid')
    setLoading(true)
    try {
      const payload = {
        ...surveyData,
        skor_akhir: totalSkor,
        status_kelayakan: statusObj.value,
        detail_skor: scores,
      }
      const res = await fetch(`/api/survey/${id_survey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success('Perubahan survey berhasil disimpan!')
        // Optional: redirect or reload
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal menyimpan perubahan survey')
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
        <p className="text-sm text-slate-400 font-medium">Memuat data survey...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl pb-16 space-y-6">
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Mustahik Info */}
        <div className="border-b bg-indigo-50/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Informasi Mustahik</p>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{mustahikName || 'Data Mustahik'}</h3>
          </div>
          <Badge className="bg-indigo-100 text-indigo-700 border-0 font-mono self-start sm:self-auto">
            {mustahikId}
          </Badge>
        </div>

        <div className="p-6 space-y-10">
          
          {/* Bagian 1: Profil Ekonomi */}
          <section>
            <h4 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs">1</span> 
              Profil Ekonomi
            </h4>
            <StepEkonomi data={surveyData} setData={setSurveyData} />
          </section>

          {/* Bagian 2: Kondisi Hunian */}
          <section>
            <h4 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs">2</span> 
              Kondisi Tempat Tinggal
            </h4>
            <StepHunian data={surveyData} setData={setSurveyData} />
          </section>

          {/* Bagian 3: Pertanyaan Dinamis */}
          <section>
            <h4 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs">3</span> 
              Penilaian Kriteria
            </h4>
            <div className="space-y-8">
              {dynamicGroups.map((group, idx) => {
                const qs = groupedQuestions[group] || []
                return (
                  <div key={group} className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                    <p className="text-sm font-bold text-indigo-700">{group}</p>
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
              })}
            </div>
          </section>

          {/* Bagian 4: Kesimpulan */}
          <section>
            <h4 className="text-md font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs">4</span> 
              Hasil & Rekomendasi
            </h4>
            <div className="space-y-5 rounded-xl border border-slate-100 p-4 bg-white">
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
          </section>

        </div>

        {/* Footer actions */}
        <div className="border-t bg-slate-50 px-6 py-4 flex justify-end">
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !mustahikId}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold min-w-[200px] h-11"
          >
            {loading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyimpan Perubahan...</>
              : <><Save className="h-4 w-4" /> Simpan Perubahan</>
            }
          </Button>
        </div>
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {[
          { label: 'Pendapatan Bulanan', key: 'pendapatan_bulanan' },
          { label: 'Pengeluaran Bulanan', key: 'pengeluaran_bulanan' },
        ].map(({ label, key }) => (
          <div key={key} className="space-y-2">
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
          <span className="font-bold">{fmt(Math.abs(selisih))}</span>
        </div>
      )}
    </div>
  )
}

// ── Step Hunian ───────────────────────────────────────────────────────────────
function StepHunian({ data, setData }: { data: any; setData: any }) {
  return (
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
  )
}
