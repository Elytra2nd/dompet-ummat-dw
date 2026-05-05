'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  ClipboardCheck, Wallet, Home, Loader2, Save, Star,
  ChevronRight, User, TrendingUp, CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'

import QuestionItem from './QuestionItem'
import SurveySummary from './SurveySummary'
import MustahikSelector from '@/components/penyaluran/MustahikSelector'

import {
  GOLONGAN_ASNAF,
  KONDISI_TEMPAT_TINGGAL,
  KATEGORI_REKOMENDASI,
} from '@/lib/constants-survey'
import { calculateAverage, determineKelayakan } from '@/lib/calc-survey'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Pertanyaan {
  sk_pertanyaan: number
  kode_pertanyaan: string
  teks_pertanyaan: string
  grup_pertanyaan?: string
}

// ─── Section Header ───────────────────────────────────────────────────────────

const SECTION_ICONS: Record<string, React.ReactNode> = {
  'Profil Ekonomi': <Wallet className="h-5 w-5 text-indigo-600" />,
  'Kondisi Sosial': <Home className="h-5 w-5 text-amber-600" />,
  'Aset & Kepemilikan': <TrendingUp className="h-5 w-5 text-emerald-600" />,
}

const SECTION_COLORS: Record<string, string> = {
  'Profil Ekonomi': 'border-indigo-200 bg-indigo-50/40',
  'Kondisi Sosial': 'border-amber-200 bg-amber-50/40',
  'Aset & Kepemilikan': 'border-emerald-200 bg-emerald-50/40',
}

const SECTION_BADGE_COLORS: Record<string, string> = {
  'Profil Ekonomi': 'bg-indigo-100 text-indigo-700',
  'Kondisi Sosial': 'bg-amber-100 text-amber-700',
  'Aset & Kepemilikan': 'bg-emerald-100 text-emerald-700',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SurveyForm({ id_survey }: { id_survey?: string }) {
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState<Pertanyaan[]>([])
  const [scores, setScores] = useState<{ [key: number]: number }>({})

  const [formData, setFormData] = useState({
    id_mustahik: '',
    sk_petugas: 1,
    pendapatan_bulanan: 0,
    pengeluaran_bulanan: 0,
    jumlah_tanggungan: 0,
    kondisi_tempat_tinggal: KONDISI_TEMPAT_TINGGAL[2].value,
    kategori_asnaf: GOLONGAN_ASNAF[0].value,
    kategori_rekomendasi: KATEGORI_REKOMENDASI[0].value,
  })

  // ─── Load Data ─────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      try {
        const resQ = await fetch('/api/survey/pertanyaan')
        const dataQ = await resQ.json()
        if (Array.isArray(dataQ)) {
          setQuestions(dataQ)
          const initialScores: Record<number, number> = {}
          dataQ.forEach((q: Pertanyaan) => (initialScores[q.sk_pertanyaan] = 3))

          if (id_survey) {
            const resS = await fetch(`/api/survey/${id_survey}`)
            const dataS = await resS.json()
            if (resS.ok && dataS.survey) {
              setFormData({
                id_mustahik: dataS.survey.dim_mustahik?.id_mustahik || '',
                sk_petugas: 1,
                pendapatan_bulanan: Number(dataS.skorData?.pendapatan_bulanan || 0),
                pengeluaran_bulanan: Number(dataS.skorData?.pengeluaran_bulanan || 0),
                jumlah_tanggungan: Number(dataS.skorData?.jumlah_tanggungan || 0),
                kondisi_tempat_tinggal: dataS.skorData?.kondisi_tempat_tinggal || KONDISI_TEMPAT_TINGGAL[2].value,
                kategori_asnaf: dataS.survey.golongan_penerima || GOLONGAN_ASNAF[0].value,
                kategori_rekomendasi: dataS.survey.kategori_rekomendasi || KATEGORI_REKOMENDASI[0].value,
              })
              setScores(dataS.detail_skor ? { ...initialScores, ...dataS.detail_skor } : initialScores)
            } else {
              toast.error('Gagal memuat data survey untuk diedit')
              setScores(initialScores)
            }
          } else {
            setScores(initialScores)
          }
        }
      } catch {
        toast.error('Terjadi kesalahan saat memuat kriteria survey')
      }
    }
    loadData()
  }, [id_survey])

  // ─── Group questions by grup_pertanyaan ────────────────────────────────────

  const groupedQuestions = questions.reduce<Record<string, Pertanyaan[]>>((acc, q) => {
    const group = q.grup_pertanyaan || 'Penilaian Umum'
    if (!acc[group]) acc[group] = []
    acc[group].push(q)
    return acc
  }, {})

  // ─── Scoring ───────────────────────────────────────────────────────────────

  const totalSkorAngka = calculateAverage(scores)
  const statusObj = determineKelayakan(totalSkorAngka)
  const answeredCount = Object.values(scores).filter(v => v > 0).length
  const totalQuestions = questions.length + 1 // +1 for kondisi_tempat_tinggal

  // ─── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id_mustahik) return toast.error('Pilih Mustahik terlebih dahulu')

    setLoading(true)
    try {
      const payload = {
        ...formData,
        skor_akhir: totalSkorAngka,
        status_kelayakan: statusObj.value,
        detail_skor: scores,
      }
      const endpoint = id_survey ? `/api/survey/${id_survey}` : '/api/survey/baru'
      const method = id_survey ? 'PUT' : 'POST'
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success(`Survey berhasil ${id_survey ? 'diperbarui' : 'disimpan'}`)
        if (!id_survey) {
          setFormData({ ...formData, id_mustahik: '', pendapatan_bulanan: 0, pengeluaran_bulanan: 0, jumlah_tanggungan: 0 })
        }
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal menyimpan')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-0 pb-20 pt-2">

      {/* ── Header Card ── */}
      <div className="mb-6 overflow-hidden rounded-2xl border-none bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-200 text-white px-8 py-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-2">
              {id_survey ? 'Mode Edit' : 'Formulir Baru'}
            </p>
            <h2 className="text-2xl font-black tracking-tight">Survey Kelayakan Mustahik</h2>
            <p className="mt-1.5 text-sm text-indigo-200 font-medium leading-relaxed">
              Isi semua seksi dengan cermat. Skor akan dihitung otomatis.
            </p>
          </div>
          <ClipboardCheck className="h-10 w-10 text-indigo-300 shrink-0 opacity-70" />
        </div>

        {/* Progress bar */}
        {questions.length > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-[11px] font-bold text-indigo-200 mb-1.5">
              <span>Progress Pengisian</span>
              <span>{answeredCount}/{totalQuestions} pertanyaan</span>
            </div>
            <div className="h-2 w-full rounded-full bg-indigo-900/50">
              <div
                className="h-2 rounded-full bg-white transition-all duration-500"
                style={{ width: `${Math.min((answeredCount / totalQuestions) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════
          SEKSI 1 — IDENTITAS MUSTAHIK
      ════════════════════════════════════════════════════════ */}
      <SectionWrapper
        number={1}
        icon={<User className="h-5 w-5 text-violet-600" />}
        title="Identitas Mustahik"
        subtitle="Pilih mustahik yang akan disurvei"
        colorClass="border-violet-200 bg-violet-50/40"
        badgeClass="bg-violet-100 text-violet-700"
      >
        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">
            Mustahik <span className="text-rose-500">*</span>
          </Label>
          <MustahikSelector
            selectedId={formData.id_mustahik}
            onSelect={(id) => setFormData({ ...formData, id_mustahik: id })}
          />
          <Link
            href="/mustahik/baru"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 hover:underline transition-colors mt-1"
          >
            <User className="h-3.5 w-3.5" />
            Mustahik belum terdaftar? Daftarkan sekarang
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Golongan Asnaf <span className="text-rose-500">*</span></Label>
            <select
              className="flex h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium focus:ring-2 focus:ring-violet-500 outline-none transition-all"
              value={formData.kategori_asnaf}
              onChange={(e) => setFormData({ ...formData, kategori_asnaf: e.target.value })}
            >
              {GOLONGAN_ASNAF.map((a) => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Jumlah Tanggungan (Jiwa)</Label>
            <Input
              type="number"
              placeholder="0"
              min={0}
              className="h-11"
              value={formData.jumlah_tanggungan || ''}
              onChange={(e) => setFormData({ ...formData, jumlah_tanggungan: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </SectionWrapper>

      <SectionDivider />

      {/* ════════════════════════════════════════════════════════
          SEKSI 2 — PROFIL EKONOMI
      ════════════════════════════════════════════════════════ */}
      <SectionWrapper
        number={2}
        icon={<Wallet className="h-5 w-5 text-indigo-600" />}
        title="Profil Ekonomi"
        subtitle="Data keuangan bulanan mustahik"
        colorClass="border-indigo-200 bg-indigo-50/40"
        badgeClass="bg-indigo-100 text-indigo-700"
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Pendapatan Bulanan</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
              <Input
                type="number"
                placeholder="0"
                className="pl-12 h-11"
                value={formData.pendapatan_bulanan || ''}
                onChange={(e) => setFormData({ ...formData, pendapatan_bulanan: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-bold text-slate-700">Pengeluaran Bulanan</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
              <Input
                type="number"
                placeholder="0"
                className="pl-12 h-11"
                value={formData.pengeluaran_bulanan || ''}
                onChange={(e) => setFormData({ ...formData, pengeluaran_bulanan: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>

        {/* Defisit indicator */}
        {(formData.pendapatan_bulanan > 0 || formData.pengeluaran_bulanan > 0) && (
          <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold mt-1 ${
            formData.pengeluaran_bulanan > formData.pendapatan_bulanan
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}>
            {formData.pengeluaran_bulanan > formData.pendapatan_bulanan
              ? '⚠ Defisit: pengeluaran melebihi pendapatan'
              : '✓ Surplus keuangan positif'}
            <span className="ml-auto font-black text-base">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
                .format(Math.abs(formData.pendapatan_bulanan - formData.pengeluaran_bulanan))}
            </span>
          </div>
        )}
      </SectionWrapper>

      <SectionDivider />

      {/* ════════════════════════════════════════════════════════
          SEKSI 3 — KONDISI TEMPAT TINGGAL
      ════════════════════════════════════════════════════════ */}
      <SectionWrapper
        number={3}
        icon={<Home className="h-5 w-5 text-amber-600" />}
        title="Kondisi Tempat Tinggal"
        subtitle="Penilaian visual kondisi hunian mustahik"
        colorClass="border-amber-200 bg-amber-50/40"
        badgeClass="bg-amber-100 text-amber-700"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {KONDISI_TEMPAT_TINGGAL.map((k) => {
            const isActive = formData.kondisi_tempat_tinggal === k.value
            return (
              <button
                key={k.value}
                type="button"
                onClick={() => setFormData({ ...formData, kondisi_tempat_tinggal: k.value })}
                className={`flex min-h-[64px] items-center justify-center rounded-xl border-2 p-3 text-center text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm scale-[1.02]'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50/30'
                }`}
              >
                {k.label}
              </button>
            )
          })}
        </div>
      </SectionWrapper>

      <SectionDivider />

      {/* ════════════════════════════════════════════════════════
          SEKSI 4+ — PERTANYAAN PER GRUP
      ════════════════════════════════════════════════════════ */}
      {questions.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400 font-medium">Memuat daftar kriteria penilaian...</p>
        </div>
      ) : (
        Object.entries(groupedQuestions).map(([group, qs], idx) => {
          const sectionNumber = idx + 4
          const icon = SECTION_ICONS[group] ?? <ClipboardCheck className="h-5 w-5 text-slate-500" />
          const colorClass = SECTION_COLORS[group] ?? 'border-slate-200 bg-slate-50/40'
          const badgeClass = SECTION_BADGE_COLORS[group] ?? 'bg-slate-100 text-slate-600'

          return (
            <div key={group}>
              <SectionWrapper
                number={sectionNumber}
                icon={icon}
                title={group}
                subtitle={`${qs.length} pertanyaan penilaian lapangan`}
                colorClass={colorClass}
                badgeClass={badgeClass}
              >
                <div className="space-y-4">
                  {qs.map((q) => (
                    <QuestionItem
                      key={q.sk_pertanyaan}
                      sk_pertanyaan={q.sk_pertanyaan}
                      kode_pertanyaan={q.kode_pertanyaan}
                      teks_pertanyaan={q.teks_pertanyaan}
                      currentScore={scores[q.sk_pertanyaan]}
                      onScoreChange={(sk, val) => setScores({ ...scores, [sk]: val })}
                    />
                  ))}
                </div>
              </SectionWrapper>
              <SectionDivider />
            </div>
          )
        })
      )}

      {/* ════════════════════════════════════════════════════════
          SEKSI AKHIR — KESIMPULAN & REKOMENDASI
      ════════════════════════════════════════════════════════ */}
      <SectionWrapper
        number={Object.keys(groupedQuestions).length + 4}
        icon={<Star className="h-5 w-5 text-emerald-600" />}
        title="Kesimpulan & Rekomendasi"
        subtitle="Penilaian akhir oleh surveyor"
        colorClass="border-emerald-200 bg-emerald-50/40"
        badgeClass="bg-emerald-100 text-emerald-700"
        isFinal
      >
        <div className="space-y-2">
          <Label className="text-sm font-bold text-slate-700">
            Rekomendasi Akhir Surveyor <span className="text-rose-500">*</span>
          </Label>
          <select
            className="flex h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-4 text-sm font-bold text-emerald-700 transition-all outline-none focus:border-emerald-500"
            value={formData.kategori_rekomendasi}
            onChange={(e) => setFormData({ ...formData, kategori_rekomendasi: e.target.value })}
          >
            {KATEGORI_REKOMENDASI.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <SurveySummary score={totalSkorAngka} status={statusObj.label} />
        </div>

        <Button
          type="submit"
          disabled={loading || !formData.id_mustahik}
          className="h-14 w-full gap-3 rounded-xl bg-slate-900 text-base font-bold text-white shadow-lg transition-all hover:bg-black hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
        >
          {loading
            ? <Loader2 className="h-5 w-5 animate-spin" />
            : <Save className="h-5 w-5" />
          }
          {loading ? 'Menyimpan...' : `${id_survey ? 'Perbarui' : 'Simpan'} Survey`}
        </Button>

        {!formData.id_mustahik && (
          <p className="text-center text-xs text-rose-500 font-medium -mt-2">
            ⚠ Pilih mustahik di Seksi 1 untuk mengaktifkan tombol simpan
          </p>
        )}
      </SectionWrapper>
    </form>
  )
}

// ─── Helper Components ────────────────────────────────────────────────────────

function SectionWrapper({
  number, icon, title, subtitle, colorClass, badgeClass, isFinal, children,
}: {
  number: number
  icon: React.ReactNode
  title: string
  subtitle?: string
  colorClass: string
  badgeClass: string
  isFinal?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`rounded-2xl border-2 ${colorClass} overflow-hidden shadow-sm`}>
      {/* Section header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200/70">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm border border-slate-200">
          <span className="text-xs font-black text-slate-600">{number}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon}
            <h2 className="font-black text-slate-800 text-base truncate">{title}</h2>
            {isFinal && (
              <Badge className={`ml-1 text-[9px] font-black uppercase tracking-wider ${badgeClass} border-0`}>
                Final
              </Badge>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-slate-500 font-medium mt-0.5">{subtitle}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />
      </div>

      {/* Section body */}
      <div className="bg-white px-6 py-6 space-y-4">
        {children}
      </div>
    </div>
  )
}

function SectionDivider() {
  return (
    <div className="flex items-center gap-3 my-1 px-4">
      <div className="flex-1 h-px bg-slate-200" />
      <CheckCircle2 className="h-4 w-4 text-slate-300" />
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  )
}
