'use client'

import { useEffect, useState } from 'react'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardCheck, Search, UserCheck, AlertTriangle, CheckCircle2, XCircle, Eye, Edit3, Trash2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import Link from 'next/link'
import { toast } from 'sonner'

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

export default function SurveyMainPage() {
  const [surveys, setSurveys] = useState<SurveyData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

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

  const filteredSurveys = surveys.filter(s => 
    s.dim_mustahik?.nama?.toLowerCase().includes(search.toLowerCase()) ||
    s.no_register?.toLowerCase().includes(search.toLowerCase())
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

  // Hitung metrik
  const totalSurvey = surveys.length
  const countSangatLayak = surveys.filter(s => s.kelayakan_sistem === 'Sangat_Layak').length
  const countLayak = surveys.filter(s => s.kelayakan_sistem === 'Layak').length
  const countDipertimbangkan = surveys.filter(s => s.kelayakan_sistem === 'Dipertimbangkan').length
  const countTidakLayak = surveys.filter(s => s.kelayakan_sistem === 'Tidak_Layak').length

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-indigo-600" /> 
            Hasil <span className="text-indigo-600">Survey Kelayakan</span>
          </h1>
          <p className="text-slate-500 font-medium italic mt-1">Data Warehouse Decision Support System (DSS)</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari Mustahik..." 
            className="pl-10 border-slate-200 bg-white h-12 rounded-xl font-medium focus:ring-indigo-500 focus:border-indigo-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Survey</span>
            <span className="text-3xl font-black text-slate-800">{loading ? '-' : totalSurvey}</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-emerald-50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 mb-2 opacity-80" />
            <span className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mb-1">Sangat Layak</span>
            <span className="text-2xl font-black text-emerald-700">{loading ? '-' : countSangatLayak}</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-blue-50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <UserCheck className="h-5 w-5 text-blue-600 mb-2 opacity-80" />
            <span className="text-[10px] font-bold text-blue-600/70 uppercase tracking-widest mb-1">Layak</span>
            <span className="text-2xl font-black text-blue-700">{loading ? '-' : countLayak}</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <AlertTriangle className="h-5 w-5 text-amber-600 mb-2 opacity-80" />
            <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-widest mb-1">Dipertimbangkan</span>
            <span className="text-2xl font-black text-amber-700">{loading ? '-' : countDipertimbangkan}</span>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-rose-50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
            <XCircle className="h-5 w-5 text-rose-600 mb-2 opacity-80" />
            <span className="text-[10px] font-bold text-rose-600/70 uppercase tracking-widest mb-1">Tidak Layak</span>
            <span className="text-2xl font-black text-rose-700">{loading ? '-' : countTidakLayak}</span>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow>
                <TableHead className="text-white font-black text-[10px] uppercase py-4 pl-6">Mustahik & Reg</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase text-center">Skor Akhir</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase text-center">Status Kelayakan</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase pr-6">Rekomendasi Bantuan</TableHead>
                <TableHead className="text-white font-black text-[10px] uppercase text-right pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold animate-pulse text-slate-400">Sinkronisasi Data...</TableCell></TableRow>
              ) : filteredSurveys.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 font-bold text-slate-400">Belum ada data survey.</TableCell></TableRow>
              ) : filteredSurveys.map((item) => (
                <TableRow key={item.sk_survey} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                  <TableCell className="pl-6 py-4">
                    <p className="font-black text-slate-800 uppercase text-sm">{item.dim_mustahik?.nama || 'N/A'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">{item.no_register}</span>
                      <span className="text-[10px] font-bold text-slate-400">{item.dim_mustahik?.id_mustahik}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="inline-flex items-center justify-center min-w-[3rem] p-2 bg-slate-100 rounded-lg">
                       <span className="text-lg font-black text-slate-700">{item.total_skor_sistem}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={`font-black text-[10px] px-3 py-1 shadow-none border-none ${
                      item.kelayakan_sistem === 'Sangat_Layak' ? 'bg-emerald-100 text-emerald-700' :
                      item.kelayakan_sistem === 'Layak' ? 'bg-blue-100 text-blue-700' :
                      item.kelayakan_sistem === 'Dipertimbangkan' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {item.kelayakan_sistem?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5"><ClipboardCheck className="h-4 w-4 text-slate-400" /></div>
                      <p className="text-xs font-bold text-slate-600 max-w-[200px] leading-relaxed">
                        {item.kategori_rekomendasi?.replace(/__/g, ' (').replace(/_/g, ' ').replace(/ \(/g, '(')}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/survey/hasil/${item.sk_survey}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Detail Survey">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/survey/baru?id=${item.sk_survey}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50" title="Edit Survey">
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50" onClick={() => confirmDelete(item)} title="Hapus Survey">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <AlertDialogContent className="sm:max-w-[425px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-rose-600 font-black uppercase tracking-tight">
              <AlertTriangle className="h-5 w-5" /> Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription className="font-medium text-slate-600 pt-2">
              Apakah Anda yakin ingin menghapus data survey kelayakan untuk <strong>{deletingItem?.dim_mustahik?.nama}</strong>? Tindakan ini akan menghapus data penilaian kelayakan dari warehouse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel className="font-bold uppercase text-[10px]">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-rose-600 hover:bg-rose-700 font-bold uppercase text-[10px]">
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Ya, Hapus Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}