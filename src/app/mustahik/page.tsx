'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import Pagination from '@/components/ui/pagination-numbered'
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
  Filter,
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
  const [filterKategori, setFilterKategori] = useState('')

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
        toast.success(`Data ${nama} telah dinonaktifkan`)
        fetchMustahik()
      }
    } catch (e) { toast.error('Gagal menonaktifkan data') }
  }

  const kategoriOptions = useMemo(() => {
    const set = new Set(mustahik.map(m => m.kategori_pm).filter(Boolean))
    return Array.from(set).sort()
  }, [mustahik])

  const filteredMustahik = mustahik.filter((m) => {
    const nama = (m.nama || '').toLowerCase()
    const id = (m.id_mustahik || '').toLowerCase()
    const nik = m.nik || ''
    const matchSearch = nama.includes(search.toLowerCase()) || id.includes(search.toLowerCase()) || nik.includes(search)
    const matchKategori = !filterKategori || m.kategori_pm === filterKategori
    return matchSearch && matchKategori
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
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
          </Button>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-slate-900">
              <Users className="h-7 w-7 text-emerald-600 shrink-0" /> Database <span className="text-emerald-600">Mustahik</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <ImportButton modul="mustahik" onImportSuccess={fetchMustahik} />
              <Button asChild className="bg-emerald-600 font-semibold shadow-md hover:bg-emerald-700 text-sm h-10 w-full sm:w-auto">
                <Link href="/mustahik/baru">
                  <Plus className="mr-2 h-4 w-4" /> Tambah Mustahik
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8">
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
          <CardHeader className="border-b py-4 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Cari nama, NIK, atau ID Mustahik..." 
                  className="h-10 pl-10 text-sm font-medium w-full bg-white" 
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
                  value={filterKategori}
                  onChange={(e) => { setFilterKategori(e.target.value); setCurrentPage(1) }}
                  className="h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="">Semua Kategori</option>
                  {kategoriOptions.map((k) => (
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
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 w-[200px] text-left px-6">ID & Kategori</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 min-w-[300px] text-left">Profil & Lokasi</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 w-[150px] text-center pr-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && !mustahik.length ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-40 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-emerald-400 mx-auto" />
                      <p className="mt-2 text-xs font-bold text-slate-400">Memuat data...</p>
                    </TableCell>
                  </TableRow>
                ) : currentMustahik.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-20">
                      <EmptyState asTableRow={false} title="Belum ada mustahik" description="Data mustahik akan tampil setelah proses import." />
                    </TableCell>
                  </TableRow>
                ) : currentMustahik.map((m) => (
                  <TableRow key={m.sk_mustahik} className="group hover:bg-emerald-50/30 transition-colors">
                    <TableCell className="px-6 text-left">
                      <p className="font-mono text-[10px] font-semibold text-emerald-600 leading-none mb-1">{m.id_mustahik}</p>
                      <Badge size="sm" variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                        {m.kategori_pm?.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left">
                      <p className="font-semibold text-slate-900 uppercase leading-none mb-1 tracking-tight">{m.nama}</p>
                      <div className="text-[10px] font-bold text-slate-400 flex flex-wrap items-center gap-2">
                        <Badge size="sm" variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Score: {m.skoring}</Badge>
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-rose-500"/> {m.kabupaten_kota}</span>
                        {m.latitude && m.longitude && (
                          <Badge size="sm" className="bg-emerald-50 text-emerald-600 border-none">LOKASI SIAP</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/mustahik/${m.id_mustahik}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600" aria-label="Lihat detail dan riwayat">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Link href={`/mustahik/baru?id=${m.id_mustahik}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-indigo-600" aria-label="Edit data dan lokasi spasial">
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </Link>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-rose-600" aria-label="Nonaktifkan mustahik">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border border-slate-200 shadow-xl">
                            <AlertDialogHeader>
                              <div className="flex items-center gap-3 text-rose-600 mb-2">
                                <div className="p-2 bg-rose-50 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                                <AlertDialogTitle className="font-semibold text-xl">Nonaktifkan Mustahik?</AlertDialogTitle>
                              </div>
                              <AlertDialogDescription className="font-medium text-slate-500 text-sm">
                                Record <strong>{m.nama}</strong> akan dinonaktifkan. Histori (SCD Type 2) tetap aman di warehouse.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-6 gap-2">
                              <AlertDialogCancel className="rounded-xl font-bold">Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(m.sk_mustahik, m.nama)} className="bg-rose-600 hover:bg-rose-700 rounded-xl font-bold">Ya, Nonaktifkan</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMustahik.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
