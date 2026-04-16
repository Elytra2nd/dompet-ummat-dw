'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  ArrowLeft,
  Plus,
  Trash2,
  ListChecks,
  Search,
  Loader2,
  HelpCircle,
} from 'lucide-react'
import Link from 'next/link'

interface Pertanyaan {
  sk_pertanyaan: number
  kode_pertanyaan: string
  grup_pertanyaan: string
  teks_pertanyaan: string
}

export default function KelolaPertanyaanPage() {
  const [questions, setQuestions] = useState<Pertanyaan[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [search, setSearch] = useState('')

  // Form State untuk Pertanyaan Baru
  const [newQuestion, setNewQuestion] = useState({
    kode_pertanyaan: '',
    grup_pertanyaan: 'Ekonomi',
    teks_pertanyaan: '',
  })

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const res = await fetch('/api/survey/pertanyaan')
      const data = await res.json()
      if (Array.isArray(data)) setQuestions(data)
    } catch (e) {
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Kita asumsikan ada API POST di route yang sama
      const res = await fetch('/api/survey/pertanyaan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuestion),
      })
      if (res.ok) {
        toast.success('Pertanyaan berhasil ditambahkan')
        setIsAdding(false)
        fetchQuestions()
      }
    } catch (e) {
      toast.error('Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter(
    (q) =>
      q.teks_pertanyaan.toLowerCase().includes(search.toLowerCase()) ||
      q.kode_pertanyaan.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="mb-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 text-slate-500 transition-colors hover:text-blue-600"
            >
              <Link href="/survey/baru">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Form Survey
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
                <ListChecks className="h-8 w-8 text-blue-600" />
                Daftar <span className="text-blue-600">Kriteria Survey</span>
              </h1>
              <p className="mt-1 font-medium text-slate-500">
                Kelola indikator penilaian untuk perhitungan skor kelayakan
                mustahik
              </p>
            </div>
            <Button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-blue-600 font-bold hover:bg-blue-700"
            >
              {isAdding ? (
                'Batal'
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Kriteria
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-8">
        {/* FORM TAMBAH PERTANYAAN (COLLAPSIBLE) */}
        {isAdding && (
          <Card className="animate-in fade-in slide-in-from-top-4 border-2 border-blue-100 shadow-lg">
            <CardHeader className="border-b bg-blue-50/50 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-bold text-blue-700">
                <HelpCircle className="h-4 w-4" /> Tambah Indikator Penilaian
                Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form
                onSubmit={handleSave}
                className="grid grid-cols-1 items-end gap-4 md:grid-cols-4"
              >
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">
                    Kode
                  </Label>
                  <Input
                    placeholder="Misal: P001"
                    required
                    value={newQuestion.kode_pertanyaan}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        kode_pertanyaan: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">
                    Grup
                  </Label>
                  <select
                    className="flex h-10 w-full rounded-md border bg-white px-3 text-sm"
                    value={newQuestion.grup_pertanyaan}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        grup_pertanyaan: e.target.value,
                      })
                    }
                  >
                    <option value="Ekonomi">Ekonomi</option>
                    <option value="Kesehatan">Kesehatan</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Pendidikan">Pendidikan</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label className="text-[10px] font-bold uppercase">
                    Teks Pertanyaan
                  </Label>
                  <Input
                    placeholder="Apa yang dinilai?"
                    required
                    value={newQuestion.teks_pertanyaan}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        teks_pertanyaan: e.target.value,
                      })
                    }
                  />
                </div>
                <Button type="submit" className="bg-slate-900">
                  Simpan Kriteria
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* TABEL DAFTAR PERTANYAAN */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b py-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari berdasarkan teks atau kode..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[100px] font-bold">KODE</TableHead>
                  <TableHead className="font-bold">GRUP</TableHead>
                  <TableHead className="font-bold">
                    INDIKATOR PENILAIAN
                  </TableHead>
                  <TableHead className="text-right font-bold">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-slate-500"
                    >
                      Belum ada data kriteria survey.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map((q) => (
                    <TableRow
                      key={q.sk_pertanyaan}
                      className="hover:bg-slate-50/50"
                    >
                      <TableCell className="font-mono text-xs font-bold text-blue-600">
                        {q.kode_pertanyaan}
                      </TableCell>
                      <TableCell>
                        <span className="rounded bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 uppercase">
                          {q.grup_pertanyaan}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-slate-700">
                        {q.teks_pertanyaan}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
