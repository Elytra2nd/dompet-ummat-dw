'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table"
import { toast } from "sonner"
import { 
  ArrowLeft, Plus, Trash2, ListChecks, 
  Search, Loader2, HelpCircle 
} from 'lucide-react'
import Link from 'next/link'

interface Pertanyaan {
  sk_pertanyaan: number;
  kode_pertanyaan: string;
  grup_pertanyaan: string;
  teks_pertanyaan: string;
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
    teks_pertanyaan: ''
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
      toast.error("Gagal memuat data")
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
        body: JSON.stringify(newQuestion)
      })
      if (res.ok) {
        toast.success("Pertanyaan berhasil ditambahkan")
        setIsAdding(false)
        fetchQuestions()
      }
    } catch (e) {
      toast.error("Gagal menyimpan")
    } finally {
      setLoading(false)
    }
  }

  const filteredQuestions = questions.filter(q => 
    q.teks_pertanyaan.toLowerCase().includes(search.toLowerCase()) ||
    q.kode_pertanyaan.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="bg-white border-b mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-500 hover:text-blue-600 transition-colors">
              <Link href="/survey/baru">
                <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Form Survey
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                <ListChecks className="h-8 w-8 text-blue-600" />
                Daftar <span className="text-blue-600">Kriteria Survey</span>
              </h1>
              <p className="text-slate-500 mt-1 font-medium">
                Kelola indikator penilaian untuk perhitungan skor kelayakan mustahik
              </p>
            </div>
            <Button onClick={() => setIsAdding(!isAdding)} className="bg-blue-600 hover:bg-blue-700 font-bold">
              {isAdding ? "Batal" : <><Plus className="h-4 w-4 mr-2" /> Tambah Kriteria</>}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 space-y-6">
        {/* FORM TAMBAH PERTANYAAN (COLLAPSIBLE) */}
        {isAdding && (
          <Card className="border-2 border-blue-100 shadow-lg animate-in fade-in slide-in-from-top-4">
            <CardHeader className="bg-blue-50/50 border-b py-4">
              <CardTitle className="text-sm font-bold text-blue-700 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" /> Tambah Indikator Penilaian Baru
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">Kode</Label>
                  <Input placeholder="Misal: P001" required value={newQuestion.kode_pertanyaan} onChange={e => setNewQuestion({...newQuestion, kode_pertanyaan: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase">Grup</Label>
                  <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm" value={newQuestion.grup_pertanyaan} onChange={e => setNewQuestion({...newQuestion, grup_pertanyaan: e.target.value})}>
                    <option value="Ekonomi">Ekonomi</option>
                    <option value="Kesehatan">Kesehatan</option>
                    <option value="Sosial">Sosial</option>
                    <option value="Pendidikan">Pendidikan</option>
                  </select>
                </div>
                <div className="md:col-span-1 space-y-2">
                  <Label className="text-[10px] font-bold uppercase">Teks Pertanyaan</Label>
                  <Input placeholder="Apa yang dinilai?" required value={newQuestion.teks_pertanyaan} onChange={e => setNewQuestion({...newQuestion, teks_pertanyaan: e.target.value})} />
                </div>
                <Button type="submit" className="bg-slate-900">Simpan Kriteria</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* TABEL DAFTAR PERTANYAAN */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="py-4 border-b">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Cari berdasarkan teks atau kode..." 
                  className="pl-9" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
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
                  <TableHead className="font-bold">INDIKATOR PENILAIAN</TableHead>
                  <TableHead className="text-right font-bold">AKSI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                    </TableCell>
                  </TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                      Belum ada data kriteria survey.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map((q) => (
                    <TableRow key={q.sk_pertanyaan} className="hover:bg-slate-50/50">
                      <TableCell className="font-mono text-xs font-bold text-blue-600">{q.kode_pertanyaan}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
                          {q.grup_pertanyaan}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-700 font-medium">{q.teks_pertanyaan}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
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