'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  ClipboardCheck, Search, UserCheck, AlertTriangle, CheckCircle2,
  XCircle, Eye, Edit3, Trash2, Loader2, ArrowLeft, Filter,
  ChevronLeft, ChevronRight, Plus
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from 'next/link'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

interface SurveyData {
  sk_survey: number;
  no_register: string;
  total_skor_sistem: string;
  kelayakan_sistem: string;
  kategori_rekomendasi: string;
  dim_mustahik: {
    nama: string;
    id_mustahik: string;
  };
  dim_date?: {
    tanggal: string;
  };
}

const KELAYAKAN_COLOR: Record<string, string> = {
  Sangat_Layak: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Layak: 'bg-blue-50 text-blue-700 border-blue-200',
  Dipertimbangkan: 'bg-amber-50 text-amber-700 border-amber-200',
  Tidak_Layak: 'bg-rose-50 text-rose-700 border-rose-200',
}

export default function SurveyMainPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const [surveys, setSurveys] = useState<SurveyData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterKelayakan, setFilterKelayakan] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Delete State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deletingItem, setDeletingItem] = useState<SurveyData | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/survey/hasil')
      .then(res => res.json())
      .then(data => {
        setSurveys(Array.isArray(data) ? data : [])
        setLoading(false)
      })
  }, [])

  const kelayakanOptions = useMemo(() => {
    const set = new Set(surveys.map(s => s.kelayakan_sistem).filter(Boolean))
    return Array.from(set).sort()
  }, [surveys])

  const filteredSurveys = useMemo(() => {
    return surveys.filter(s => {
      const matchSearch =
        s.dim_mustahik?.nama?.toLowerCase().includes(search.toLowerCase()) ||
        s.no_register?.toLowerCase().includes(search.toLowerCase())
      const matchKelayakan = !filterKelayakan || s.kelayakan_sistem === filterKelayakan
      return matchSearch && matchKelayakan
    })
  }, [surveys, search, filterKelayakan])

  const totalPages = Math.ceil(filteredSurveys.length / itemsPerPage)
  const currentSurveys = filteredSurveys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const confirmDelete = (item: SurveyData) => {
    setDeletingItem(item)
    setDeleteModalOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/survey/hasil?sk=${deletingItem.sk_survey}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`Data survey ${deletingItem.dim_mustahik?.nama} berhasil dihapus`)
        setSurveys(prev => prev.filter(s => s.sk_survey !== deletingItem.sk_survey))
      } else {
        toast.error('Gagal menghapus data survey')
      }
    } catch (e) {
      toast.error('Terjadi kesalahan saat menghapus')
    } finally {
      setIsDeleting(false)
      setDeleteModalOpen(false)
      setDeletingItem(null)
    }
  }

  // Metrics
  const totalSurvey = surveys.length
  const countSangatLayak = surveys.filter(s => s.kelayakan_sistem === 'Sangat_Layak').length
  const countLayak = surveys.filter(s => s.kelayakan_sistem === 'Layak').length
  const countDipertimbangkan = surveys.filter(s => s.kelayakan_sistem === 'Dipertimbangkan').length
  const countTidakLayak = surveys.filter(s => s.kelayakan_sistem === 'Tidak_Layak').length

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* HEADER BAR */}
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-bold hover:bg-slate-50">
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
          </Button>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-black text-slate-900">
                <ClipboardCheck className="h-7 w-7 text-indigo-600 shrink-0" />
                Hasil <span className="text-indigo-600">Survey Kelayakan</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                Data Warehouse • Decision Support System (DSS)
              </p>
            </div>
            <Button asChild className="bg-indigo-600 font-bold shadow-md hover:bg-indigo-700 w-full sm:w-auto">
              <Link href="/survey/baru">
                <Plus className="mr-2 h-4 w-4" /> Buat Survey Baru
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8">
        {/* METRICS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <Card className="border-none shadow-sm bg-white rounded-2xl">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Survey</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-800">{loading ? '-' : totalSurvey}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-emerald-50 rounded-2xl">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-1.5 opacity-80" />
              <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Sangat Layak</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-700">{loading ? '-' : countSangatLayak}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-blue-50 rounded-2xl">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <UserCheck className="h-5 w-5 text-blue-600 mb-1.5 opacity-80" />
              <span className="text-[9px] sm:text-[10px] font-bold text-blue-600/70 uppercase tracking-widest mb-1">Layak</span>
              <span className="text-xl sm:text-2xl font-black text-blue-700">{loading ? '-' : countLayak}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-amber-50 rounded-2xl">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <AlertTriangle className="h-5 w-5 text-amber-600 mb-1.5 opacity-80" />
              <span className="text-[9px] sm:text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Dipertimbangkan</span>
              <span className="text-xl sm:text-2xl font-black text-amber-700">{loading ? '-' : countDipertimbangkan}</span>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-rose-50 rounded-2xl col-span-2 sm:col-span-1">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
              <XCircle className="h-5 w-5 text-rose-600 mb-1.5 opacity-80" />
              <span className="text-[9px] sm:text-[10px] font-bold text-rose-600/70 uppercase tracking-widest mb-1">Tidak Layak</span>
              <span className="text-xl sm:text-2xl font-black text-rose-700">{loading ? '-' : countTidakLayak}</span>
            </CardContent>
          </Card>
        </div>

        {/* TABLE CARD */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
          <CardHeader className="border-b py-4 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari mustahik atau no. register..."
                  className="pl-10 font-bold w-full"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setCurrentPage(1)
                  }}
                />
              </div>
              <div className="relative">
                <Filter className="absolute top-3 left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={filterKelayakan}
                  onChange={(e) => { setFilterKelayakan(e.target.value); setCurrentPage(1) }}
                  className="h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="">Semua Status</option>
                  {kelayakanOptions.map((k) => (
                    <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 pl-6">Mustahik & Reg</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 text-center">Skor Akhir</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 text-center">Status Kelayakan</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Rekomendasi Bantuan</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-40 text-center">
                      <Loader2 className="mx-auto animate-spin text-indigo-400" />
                    </TableCell>
                  </TableRow>
                ) : currentSurveys.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 font-bold text-slate-400">
                      Belum ada data survey.
                    </TableCell>
                  </TableRow>
                ) : currentSurveys.map((item) => (
                  <TableRow key={item.sk_survey} className="group hover:bg-indigo-50/30 transition-colors">
                    <TableCell className="pl-6 py-4">
                      <p className="font-black text-slate-900 uppercase text-sm leading-tight">{item.dim_mustahik?.nama || 'N/A'}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className="font-mono text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">
                          {item.no_register}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {item.dim_mustahik?.id_mustahik}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center justify-center min-w-[3rem] p-2 bg-slate-100 rounded-lg">
                        <span className="text-lg font-black text-slate-700">{item.total_skor_sistem}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`font-black text-[10px] px-3 py-1 rounded-lg ${KELAYAKAN_COLOR[item.kelayakan_sistem] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {item.kelayakan_sistem?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <ClipboardCheck className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                        <p className="text-xs font-bold text-slate-600 max-w-[200px] leading-relaxed">
                          {item.kategori_rekomendasi?.replace(/__/g, ' (').replace(/_/g, ' ').replace(/ \(/g, '(')}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/survey/hasil/${item.sk_survey}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" title="Detail Survey">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/survey/baru?id=${item.sk_survey}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" title="Edit Survey">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </Link>
                        {isAdmin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" onClick={() => confirmDelete(item)} title="Hapus Survey">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* PAGINATION */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/30">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Records {filteredSurveys.length === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, filteredSurveys.length)} - {Math.min(currentPage * itemsPerPage, filteredSurveys.length)} of {filteredSurveys.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-lg border">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-black text-slate-900 mx-2 tracking-tighter">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="h-8 w-8 p-0 rounded-lg border">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DELETE DIALOG */}
      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="rounded-2xl border border-slate-200 shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-rose-600 mb-2">
              <div className="p-2 bg-rose-50 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
              <AlertDialogTitle className="font-black text-xl">Hapus Data Survey?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="font-medium text-slate-500 text-sm">
              Apakah Anda yakin ingin menghapus data survey kelayakan untuk <strong>{deletingItem?.dim_mustahik?.nama}</strong>? Tindakan ini akan menghapus data penilaian dari warehouse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-2">
            <AlertDialogCancel className="rounded-xl font-bold">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}