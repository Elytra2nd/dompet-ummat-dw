'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from 'sonner'
import {
  Users,
  Plus,
  Search,
  Loader2,
  MapPin,
  ArrowLeft,
  Edit3,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import ImportButton from '@/components/import/ImportButton'

interface Mustahik {
  sk_mustahik: number
  id_mustahik: string
  nama: string
  nik: string
  kategori_pm: string
  alamat: string
  kabupaten_kota: string
  skoring: number
  latitude?: number
  longitude?: number
}

export default function ManajemenMustahikPage() {
  const [mustahik, setMustahik] = useState<Mustahik[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // --- STATE PAGINASI ---
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => { fetchMustahik() }, [])

  const fetchMustahik = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mustahik/index')
      const data = await res.json()
      if (Array.isArray(data)) setMustahik(data)
    } catch (e) {
      toast.error('Gagal memuat data mustahik dari warehouse')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sk: number, nama: string) => {
    try {
      const res = await fetch(`/api/mustahik/index?sk=${sk}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`Record ${nama} telah dinonaktifkan di warehouse`)
        fetchMustahik()
      }
    } catch (e) { toast.error('Gagal menonaktifkan record') }
  }

  const filteredMustahik = mustahik.filter((m) => {
    const nama = (m.nama || '').toLowerCase()
    const id = (m.id_mustahik || '').toLowerCase()
    const nik = m.nik || ''
    return nama.includes(search.toLowerCase()) || id.includes(search.toLowerCase()) || nik.includes(search)
  })

  const totalPages = Math.ceil(filteredMustahik.length / itemsPerPage)
  const currentMustahik = filteredMustahik.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-bold hover:bg-slate-50">
            <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
          </Button>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">
              <Users className="h-7 w-7 text-emerald-600 shrink-0" /> Database <span className="text-emerald-600">Mustahik</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <ImportButton modul="mustahik" onImportSuccess={fetchMustahik} />
              <Button asChild className="bg-emerald-600 font-bold shadow-md hover:bg-emerald-700 uppercase text-xs h-9">
                <Link href="/mustahik/baru">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Mustahik
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8">
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-none">
          <CardHeader className="border-b py-4 bg-slate-50/50">
            <div className="relative w-full max-w-md">
              <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama, NIK, atau ID Mustahik..." 
                className="pl-10 font-bold w-full" 
                value={search} 
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }} 
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">ID & Kategori</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500">Profil & Lokasi</TableHead>
                  <TableHead className="font-black text-[10px] uppercase text-slate-500 text-right pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !mustahik.length ? (
                  <TableRow><TableCell colSpan={3} className="h-40 text-center"><Loader2 className="mx-auto animate-spin text-emerald-400" /></TableCell></TableRow>
                ) : currentMustahik.map((m) => (
                  <TableRow key={m.sk_mustahik} className="group hover:bg-emerald-50/30 transition-colors">
                    <TableCell>
                      <p className="font-mono text-[10px] font-black text-emerald-600 leading-none mb-1">{m.id_mustahik}</p>
                      <span className="px-1.5 py-0.5 text-[8px] font-black rounded uppercase bg-slate-100 text-slate-600 border border-slate-200">
                        {m.kategori_pm?.replace(/_/g, ' ')}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-slate-900 uppercase leading-none mb-1 tracking-tight">{m.nama}</p>
                      <div className="text-[10px] font-bold text-slate-400 flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[8px] h-4 font-black bg-blue-50 text-blue-600 border-blue-200 uppercase">Score: {m.skoring}</Badge>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500"/> {m.kabupaten_kota}</span>
                        {m.latitude && m.longitude && (
                          <Badge variant="secondary" className="text-[7px] h-3 bg-emerald-50 text-emerald-600 border-none px-1">SPATIAL READY</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/mustahik/${m.id_mustahik}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" title="Detail & Histori">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        <Link href={`/mustahik/baru?id=${m.id_mustahik}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" title="Edit Data & Spasial">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </Link>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-none border-4 border-slate-900">
                            <AlertDialogHeader>
                              <div className="flex items-center gap-3 text-rose-600 mb-2">
                                <AlertTriangle className="h-6 w-6" />
                                <AlertDialogTitle className="font-black text-xl uppercase tracking-tighter">Nonaktifkan?</AlertDialogTitle>
                              </div>
                              <AlertDialogDescription className="font-bold text-slate-600 text-sm">
                                Record <strong>{m.nama}</strong> akan dinonaktifkan. Histori (SCD Type 2) tetap aman di warehouse.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-2">
                              <AlertDialogCancel className="rounded-none border-2 border-slate-900">Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(m.sk_mustahik, m.nama)} className="bg-rose-600 hover:bg-rose-700 rounded-none font-black">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/30">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                Records {Math.min((currentPage - 1) * itemsPerPage + 1, filteredMustahik.length)} - {Math.min(currentPage * itemsPerPage, filteredMustahik.length)} of {filteredMustahik.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="h-8 w-8 p-0 rounded-none border-2">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-black text-slate-900 mx-2 tracking-tighter">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0} className="h-8 w-8 p-0 rounded-none border-2">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}