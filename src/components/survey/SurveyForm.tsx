'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ClipboardCheck, Wallet, Home, Loader2, Save } from 'lucide-react'

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
    kondisi_tempat_tinggal: KONDISI_TEMPAT_TINGGAL[2],
    kategori_asnaf: GOLONGAN_ASNAF[0],
    kategori_rekomendasi: KATEGORI_REKOMENDASI[0],
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
  const statusKelayakan = determineKelayakan(totalSkorAngka)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id_mustahik)
      return toast.error('Isi ID Mustahik terlebih dahulu')

    setLoading(true)
    try {
      const payload = {
        ...formData,
        skor_akhir: totalSkorAngka,
        status_kelayakan: statusKelayakan,
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
      className="mx-auto grid max-w-7xl gap-6 pb-10 md:grid-cols-3"
    >
      {/* SEKSI 1: SIDEBAR (SUMMARY & PROFIL) */}
      <div className="space-y-6 md:col-span-1">
        {/* KOMPONEN SUMMARY BARU */}
        <SurveySummary score={totalSkorAngka} status={statusKelayakan} />

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Wallet className="h-4 w-4 text-emerald-600" /> Profil Ekonomi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">
                ID Mustahik
              </Label>
              <Input
                placeholder="MST-..."
                required
                value={formData.id_mustahik}
                onChange={(e) =>
                  setFormData({ ...formData, id_mustahik: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">
                Golongan Asnaf
              </Label>
              <select
                className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                value={formData.kategori_asnaf}
                onChange={(e) =>
                  setFormData({ ...formData, kategori_asnaf: e.target.value })
                }
              >
                {GOLONGAN_ASNAF.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">
                  Pendapatan
                </Label>
                <Input
                  type="number"
                  placeholder="Rp"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pendapatan_bulanan: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">
                  Pengeluaran
                </Label>
                <Input
                  type="number"
                  placeholder="Rp"
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pengeluaran_bulanan: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">
                Jumlah Tanggungan
              </Label>
              <Input
                type="number"
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
      </div>

      {/* SEKSI 2: FORM PENILAIAN (KRITERIA) */}
      <div className="space-y-6 md:col-span-2">
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <ClipboardCheck className="h-4 w-4 text-blue-600" /> Kriteria
              Penilaian Lapangan
            </CardTitle>
            <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700">
              DSS ENGINE READY
            </span>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* KONDISI TEMPAT TINGGAL */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Label className="mb-3 flex items-center gap-2 font-bold text-slate-700">
                  <Home className="h-4 w-4 text-blue-500" /> Kondisi Tempat
                  Tinggal
                </Label>
                <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                  {KONDISI_TEMPAT_TINGGAL.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, kondisi_tempat_tinggal: k })
                      }
                      className={`rounded-lg border p-2 text-[10px] transition-all duration-200 ${
                        formData.kondisi_tempat_tinggal === k
                          ? 'border-blue-600 bg-blue-600 font-bold text-white shadow-md'
                          : 'bg-white text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* LIST PERTANYAAN DENGAN QUESTION ITEM */}
              <div className="space-y-1">
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
                  <div className="py-10 text-center text-sm text-slate-400">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Memuat daftar kriteria...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* REKOMENDASI & SIMPAN */}
        <Card className="border-slate-200 shadow-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-bold text-slate-700">
                  Rekomendasi Akhir Surveyor
                </Label>
                <select
                  className="flex h-12 w-full rounded-md border-2 border-slate-200 bg-white px-3 text-sm font-bold text-blue-700 transition-all outline-none focus:border-blue-500"
                  value={formData.kategori_rekomendasi}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kategori_rekomendasi: e.target.value,
                    })
                  }
                >
                  {KATEGORI_REKOMENDASI.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-14 w-full gap-3 bg-slate-900 text-lg font-bold text-white shadow-lg transition-all hover:bg-black"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-6 w-6" />
                )}
                Simpan & Finalisasi Survey
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
