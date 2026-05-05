'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, ClipboardCheck, User, Wallet, Home, Star,
  Loader2, Edit3, CheckCircle2, AlertTriangle, XCircle, Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SurveyDetail {
  survey: {
    sk_survey: number
    no_register: string
    total_skor_sistem: string
    kelayakan_sistem: string
    kategori_rekomendasi: string
    golongan_penerima: string
    dim_mustahik: {
      id_mustahik: string
      nama: string
      nik: string
      no_hp: string
      alamat: string
      kabupaten_kota: string
      kategori_pm: string
      jumlah_jiwa: number
    }
    dim_date?: { tanggal: string }
  }
  skorData: {
    pendapatan_bulanan: string
    pengeluaran_bulanan: string
    jumlah_tanggungan: number
    kondisi_tempat_tinggal: string
    kategori_asnaf: string
    skor_akhir: string
  } | null
  detail_skor: Record<string, number>
}

interface Pertanyaan {
  sk_pertanyaan: number
  kode_pertanyaan: string
  teks_pertanyaan: string
  grup_pertanyaan?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (val: string | number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
    .format(Number(val))

const toLabel = (raw: string) => raw?.replace(/_/g, ' ').replace(/\s+/g, ' ').trim() ?? '-'

const KELAYAKAN_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  Sangat_Layak:     { label: 'Sangat Layak',    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" /> },
  Layak:            { label: 'Layak',            color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: <CheckCircle2 className="h-6 w-6 text-blue-600" /> },
  Dipertimbangkan:  { label: 'Dipertimbangkan',  color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: <AlertTriangle className="h-6 w-6 text-amber-500" /> },
  Tidak_Layak:      { label: 'Tidak Layak',      color: 'text-rose-700',    bg: 'bg-rose-50 border-rose-200',       icon: <XCircle className="h-6 w-6 text-rose-500" /> },
}

const SKOR_COLOR = (s: number) =>
  s >= 4 ? 'bg-emerald-500' : s === 3 ? 'bg-amber-400' : 'bg-rose-400'

// ─── Component ────────────────────────────────────────────────────────────────

export default function SurveyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [data, setData]           = useState<SurveyDetail | null>(null)
  const [questions, setQuestions] = useState<Pertanyaan[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [resS, resQ] = await Promise.all([
          fetch(`/api/survey/${id}`),
          fetch('/api/survey/pertanyaan'),
        ])
        if (!resS.ok) throw new Error('Survey tidak ditemukan')
        const [dataS, dataQ] = await Promise.all([resS.json(), resQ.json()])
        setData(dataS)
        if (Array.isArray(dataQ)) setQuestions(dataQ)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  // ─── Loading / Error ────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  )

  if (error || !data) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <XCircle className="h-12 w-12 text-rose-400" />
      <p className="font-bold text-slate-600">{error || 'Data tidak ditemukan'}</p>
      <Button variant="outline" onClick={() => router.back()}>Kembali</Button>
    </div>
  )

  const { survey, skorData, detail_skor } = data
  const kelayakan = KELAYAKAN_CONFIG[survey.kelayakan_sistem] ?? KELAYAKAN_CONFIG['Dipertimbangkan']
  const skor      = Number(survey.total_skor_sistem)

  // Group questions
  const grouped = questions.reduce<Record<string, Pertanyaan[]>>((acc, q) => {
    const g = q.grup_pertanyaan || 'Penilaian Umum'
    ;(acc[g] = acc[g] || []).push(q)
    return acc
  }, {})

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans">
      {/* ── Top Bar ── */}
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 py-5">
          <Button variant="ghost" size="sm" asChild className="text-slate-500 font-bold px-0 hover:bg-transparent hover:text-slate-800 mb-3 -ml-1">
            <Link href="/survey/hasil">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Kembali ke Riwayat
            </Link>
          </Button>
          
          <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-black text-slate-900 truncate">
                <ClipboardCheck className="h-6 w-6 text-indigo-600 shrink-0" />
                <span className="truncate">Detail Survey Kelayakan</span>
              </h1>
              <p className="text-xs font-mono text-slate-400 mt-1 sm:mt-1.5">{survey.no_register}</p>
            </div>
            
            <Button asChild size="sm" className="bg-indigo-600 hover:bg-indigo-700 font-bold shrink-0 w-full sm:w-auto">
              <Link href={`/survey/baru?id=${survey.sk_survey}`}>
                <Edit3 className="mr-2 h-4 w-4" /> Edit Survey
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 sm:px-8 py-8 space-y-6">

        {/* ── Verdict Banner ── */}
        <div className={`rounded-2xl border-2 p-5 sm:p-6 ${kelayakan.bg}`}>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
              {kelayakan.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Hasil Penilaian</p>
              <p className={`text-2xl sm:text-3xl font-black leading-tight ${kelayakan.color}`}>{kelayakan.label}</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 line-clamp-2">
                {toLabel(survey.kategori_rekomendasi?.replace(/__/g, ' (').replace(/_/g, ' ').replace(/ \(/g, '('))}
              </p>
            </div>
            <div className="text-center shrink-0">
              <div className="text-4xl sm:text-5xl font-black text-slate-800">{skor.toFixed(1)}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">/ 100</div>
              <div className="mt-1.5 h-1.5 w-20 sm:w-28 rounded-full bg-white/60 mx-auto overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-indigo-500 transition-all"
                  style={{ width: `${Math.min(skor, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ── Identitas Mustahik ── */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b py-4 px-5 bg-violet-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                <User className="h-4 w-4 text-violet-600" /> Identitas Mustahik
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <InfoRow label="Nama" value={survey.dim_mustahik?.nama ?? '-'} bold />
              <InfoRow label="ID Mustahik" value={survey.dim_mustahik?.id_mustahik ?? '-'} mono />
              <InfoRow label="NIK" value={survey.dim_mustahik?.nik ?? '-'} mono />
              <InfoRow label="No. HP" value={survey.dim_mustahik?.no_hp ?? '-'} />
              <InfoRow label="Kategori PM" value={toLabel(survey.dim_mustahik?.kategori_pm ?? '-')} />
              <InfoRow label="Golongan Asnaf" value={toLabel(survey.golongan_penerima ?? '-')} />
              <InfoRow label="Alamat" value={survey.dim_mustahik?.alamat ?? '-'} />
              <InfoRow label="Kota" value={survey.dim_mustahik?.kabupaten_kota ?? '-'} />
              {survey.dim_date?.tanggal && (
                <InfoRow label="Tanggal Survey" value={new Date(survey.dim_date.tanggal).toLocaleDateString('id-ID', { dateStyle: 'long' })} />
              )}
            </CardContent>
          </Card>

          {/* ── Profil Ekonomi ── */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b py-4 px-5 bg-indigo-50/50">
              <div className="flex items-center gap-2 font-bold text-slate-700 text-sm">
                <Wallet className="h-4 w-4 text-indigo-600" /> Profil Ekonomi
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              {skorData ? (
                <>
                  <InfoRow label="Pendapatan Bulanan" value={fmt(skorData.pendapatan_bulanan)} />
                  <InfoRow label="Pengeluaran Bulanan" value={fmt(skorData.pengeluaran_bulanan)} />
                  <div className="border-t pt-3">
                    {(() => {
                      const surplus = Number(skorData.pendapatan_bulanan) - Number(skorData.pengeluaran_bulanan)
                      const defisit = surplus < 0
                      return (
                        <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-bold ${
                          defisit ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          <span>{defisit ? '⚠ Defisit' : '✓ Surplus'}</span>
                          <span className="font-black">{fmt(Math.abs(surplus))}</span>
                        </div>
                      )
                    })()}
                  </div>
                  <InfoRow label="Jumlah Tanggungan" value={`${skorData.jumlah_tanggungan} jiwa`} />
                  <InfoRow label="Kondisi Hunian" value={toLabel(skorData.kondisi_tempat_tinggal)} />
                  <InfoRow label="Skor Akhir" value={Number(skorData.skor_akhir).toFixed(2)} bold />
                </>
              ) : (
                <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
                  <Clock className="h-4 w-4" /> Data ekonomi tidak tersedia
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Detail Skor Per Pertanyaan ── */}
        {Object.keys(grouped).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-indigo-500" />
              <h2 className="font-black text-slate-800 text-lg">Detail Penilaian Lapangan</h2>
            </div>

            {Object.entries(grouped).map(([group, qs]) => (
              <Card key={group} className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="border-b py-3 px-5 bg-slate-50">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-slate-400" />
                    <span className="font-bold text-slate-700 text-sm">{group}</span>
                    <Badge variant="outline" className="ml-auto text-[10px] font-bold">
                      {qs.length} kriteria
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-slate-100">
                  {qs.map((q) => {
                    const s = detail_skor[q.sk_pertanyaan] ?? 0
                    return (
                      <div key={q.sk_pertanyaan} className="px-4 sm:px-5 py-3 sm:py-4 hover:bg-slate-50">
                        {/* Baris atas: kode + pertanyaan */}
                        <div className="flex items-start gap-2 mb-2">
                          <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500 uppercase">
                            {q.kode_pertanyaan}
                          </span>
                          <p className="text-sm font-medium text-slate-700 leading-snug">{q.teks_pertanyaan}</p>
                        </div>
                        {/* Baris bawah: bar + angka */}
                        <div className="flex items-center gap-2">
                          <div className="flex gap-1 flex-nowrap">
                            {[1, 2, 3, 4, 5].map(v => (
                              <div
                                key={v}
                                className={`h-2 w-8 sm:w-10 rounded-full transition-colors ${v <= s ? SKOR_COLOR(s) : 'bg-slate-200'}`}
                              />
                            ))}
                          </div>
                          <span className={`ml-1 text-sm font-black w-5 text-center ${
                            s >= 4 ? 'text-emerald-600' : s === 3 ? 'text-amber-600' : 'text-rose-600'
                          }`}>
                            {s || '-'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">/ 5</span>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ── No questions ── */}
        {questions.length > 0 && Object.keys(detail_skor).length === 0 && (
          <Card className="border-dashed border-slate-300">
            <CardContent className="py-10 text-center text-slate-400">
              <ClipboardCheck className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">Detail skor per pertanyaan tidak tersedia</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

// ─── InfoRow ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value, bold, mono }: { label: string; value: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide shrink-0 pt-0.5 leading-tight w-28">
        {label}
      </span>
      <span className={`text-right text-sm flex-1 min-w-0 break-words ${
        bold ? 'font-black text-slate-900' : 'font-medium text-slate-700'
      } ${mono ? 'font-mono text-xs' : ''}`}>
        {value}
      </span>
    </div>
  )
}
