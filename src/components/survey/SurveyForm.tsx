'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ClipboardCheck, Wallet, Home, Loader2, Save, Star } from 'lucide-react'

// IMPORT KOMPONEN BARU
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
}

export default function SurveyForm() {
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

  // 1. Ambil daftar pertanyaan dari DB
  useEffect(() => {
    fetch('/api/survey/pertanyaan')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setQuestions(data)
          const initialScores: any = {}
          data.forEach((q: Pertanyaan) => (initialScores[q.sk_pertanyaan] = 3))
          setScores(initialScores)
        }
      })
      .catch(() => toast.error('Gagal memuat kriteria survey'))
  }, [])

  const totalSkorAngka = calculateAverage(scores)
  const statusObj = determineKelayakan(totalSkorAngka)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id_mustahik)
      return toast.error('Isi ID Mustahik terlebih dahulu')

    setLoading(true)
    try {
      const payload = {
        ...formData,
        skor_akhir: totalSkorAngka,
        status_kelayakan: statusObj.value,
        detail_skor: scores,
      }

      const res = await fetch('/api/survey/baru', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success('Hasil Survey Berhasil Disimpan')
        // Reset form jika perlu
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal menyimpan')
      }
    } catch (e) {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-3xl flex-col gap-6 pb-20 pt-2"
    >
      {/* HEADER CARD - Google Form style with top border */}
      <Card className="overflow-hidden border-none shadow-md rounded-2xl">
        <div className="h-3 w-full bg-indigo-600" />
        <CardHeader className="bg-white pb-6 pt-8">
          <CardTitle className="text-3xl font-black text-slate-800 tracking-tight">
            Formulir Survey Kelayakan
          </CardTitle>
          <p className="mt-2 text-sm text-slate-500 font-medium leading-relaxed">
            Harap isi profil ekonomi mustahik dan berikan penilaian yang seobjektif mungkin berdasarkan kondisi riil di lapangan.
          </p>
        </CardHeader>
      </Card>

      {/* PROFIL EKONOMI */}
      <Card className="border-none shadow-md rounded-2xl overflow-hidden">
        <div className="bg-indigo-50/50 px-6 py-4 border-b border-indigo-100 flex items-center gap-3">
          <Wallet className="h-5 w-5 text-indigo-600" />
          <h2 className="font-bold text-slate-700 text-base">Profil Ekonomi Mustahik</h2>
        </div>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700">
              ID Mustahik <span className="text-rose-500">*</span>
            </Label>
            <Input
              placeholder="Contoh: MST-001"
              required
              className="h-12 bg-slate-50 focus:bg-white transition-colors"
              value={formData.id_mustahik}
              onChange={(e) =>
                setFormData({ ...formData, id_mustahik: e.target.value })
              }
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700">
              Golongan Asnaf <span className="text-rose-500">*</span>
            </Label>
            <select
              className="flex h-12 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              value={formData.kategori_asnaf}
              onChange={(e) =>
                setFormData({ ...formData, kategori_asnaf: e.target.value })
              }
            >
              {GOLONGAN_ASNAF.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Pendapatan Bulanan</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                <Input
                  type="number"
                  placeholder="0"
                  className="pl-12 h-12 bg-slate-50 focus:bg-white transition-colors"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pendapatan_bulanan: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Pengeluaran Bulanan</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                <Input
                  type="number"
                  placeholder="0"
                  className="pl-12 h-12 bg-slate-50 focus:bg-white transition-colors"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pengeluaran_bulanan: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700">Jumlah Tanggungan (Jiwa)</Label>
            <Input
              type="number"
              placeholder="0"
              className="h-12 bg-slate-50 focus:bg-white transition-colors"
              onChange={(e) =>
                setFormData({
                  ...formData,
                  jumlah_tanggungan: parseInt(e.target.value) || 0,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* KRITERIA PENILAIAN LAPANGAN */}
      <div className="flex items-center gap-3 mt-4 mb-2 px-2">
        <ClipboardCheck className="h-6 w-6 text-indigo-600" />
        <h2 className="text-xl font-black text-slate-800">Penilaian Lapangan</h2>
      </div>

      <div className="space-y-6">
        {/* KONDISI TEMPAT TINGGAL - Tampil seperti QuestionItem */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:shadow-md">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
                UMUM
              </span>
            </div>
            <p className="text-base leading-relaxed font-medium text-slate-800">
              Bagaimana kondisi tempat tinggal mustahik secara keseluruhan?
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {KONDISI_TEMPAT_TINGGAL.map((k) => {
              const isActive = formData.kondisi_tempat_tinggal === k.value
              return (
                <button
                  key={k.value}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, kondisi_tempat_tinggal: k.value })
                  }
                  className={`flex h-full min-h-[60px] items-center justify-center rounded-xl border-2 p-3 text-center text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm'
                      : 'border-slate-100 bg-white text-slate-500 hover:border-indigo-200 hover:bg-slate-50'
                  }`}
                >
                  {k.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* LIST PERTANYAAN DINAMIS */}
        {questions.length > 0 ? (
          questions.map((q) => (
            <QuestionItem
              key={q.sk_pertanyaan}
              sk_pertanyaan={q.sk_pertanyaan}
              kode_pertanyaan={q.kode_pertanyaan}
              teks_pertanyaan={q.teks_pertanyaan}
              currentScore={scores[q.sk_pertanyaan]}
              onScoreChange={(sk, val) =>
                setScores({ ...scores, [sk]: val })
              }
            />
          ))
        ) : (
          <div className="py-12 text-center text-sm text-slate-400 bg-white rounded-xl border border-slate-200">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-indigo-400" />
            <p>Memuat daftar kriteria penilaian...</p>
          </div>
        )}
      </div>

      {/* REKOMENDASI & SIMPAN */}
      <Card className="border-none shadow-md mt-6 rounded-2xl overflow-hidden">
        <div className="bg-emerald-50/50 px-6 py-4 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <Star className="h-5 w-5 text-emerald-600" />
             <h2 className="font-bold text-slate-700 text-base">Kesimpulan & Rekomendasi</h2>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-widest">
            Final Step
          </span>
        </div>
        <CardContent className="p-6 space-y-8">
          
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700">
              Rekomendasi Akhir Surveyor <span className="text-rose-500">*</span>
            </Label>
            <select
              className="flex h-14 w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-base font-bold text-emerald-700 transition-all outline-none focus:border-emerald-500 focus:bg-white"
              value={formData.kategori_rekomendasi}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  kategori_rekomendasi: e.target.value,
                })
              }
            >
              {KATEGORI_REKOMENDASI.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <SurveySummary score={totalSkorAngka} status={statusObj.label} />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-14 w-full gap-3 rounded-xl bg-slate-900 text-lg font-bold text-white shadow-lg transition-all hover:bg-black hover:shadow-xl active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Save className="h-6 w-6" />
            )}
            Simpan & Finalisasi Survey
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
