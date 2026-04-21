'use client'

import { useEffect, useState, useMemo } from 'react'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
import { 
  Users, Search, UserPlus, MapPin, 
  ClipboardList, RefreshCw, Eye, Edit3, Trash2, AlertTriangle 
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface MustahikData {
  sk_mustahik: number;
  id_mustahik: string;
  nama: string;
  nik: string;
  kategori_pm: string;
  alamat: string;
  kabupaten_kota: string;
  dim_lokasi?: {
    kecamatan: string;
    desa_kelurahan: string;
  };
}

export default function MustahikMainPage() {
  const [data, setData] = useState<MustahikData[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [mounted, setMounted] = useState(false)

  const fetchMustahik = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/mustahik/index')
      const d = await res.json()
      setData(Array.isArray(d) ? d : [])
    } catch (error) {
      toast.error("Gagal memuat data master mustahik")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (sk: number, nama: string) => {
    try {
      const res = await fetch(`/api/mustahik/delete?sk=${sk}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success(`Data ${nama} berhasil dinonaktifkan (SCD Type 2)`)
        fetchMustahik()
      } else {
        toast.error("Gagal menghapus data dari warehouse")
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi")
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchMustahik()
  }, [])

  const filteredData = useMemo(() => {
    return data.filter(m => 
      m.nama?.toLowerCase().includes(search.toLowerCase()) ||
      m.id_mustahik?.toLowerCase().includes(search.toLowerCase()) ||
      m.nik?.includes(search)
    )
  }, [data, search])

  if (!mounted) return null

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3 text-[28px]">
            <Users className="h-8 w-8 text-emerald-600" /> 
            Database <span className="text-emerald-600">Mustahik</span>
          </h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">
            Master Data Dimension • BIDA Analytical Platform
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={fetchMustahik} className="bg-white border-2 font-bold hover:bg-slate-50 transition-all">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync Data
          </Button>
          <Link href="/mustahik/baru" className="w-full md:w-auto">
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[10px] tracking-widest w-full shadow-[4px_4px_0px_0px_rgba(6,78,59,1)]">
              <UserPlus className="h-4 w-4 mr-2" /> Tambah Mustahik
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <Card className="border-2 border-slate-200 shadow-none rounded-none">
        <div className="p-1 relative flex items-center bg-white">
          <Search className="absolute left-4 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari berdasarkan Nama, NIK, atau ID Mustahik..." 
            className="pl-12 border-none shadow-none font-bold text-slate-700 focus-visible:ring-0 h-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-2 border-slate-900 shadow-none rounded-none overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 text-white py-4 flex flex-row justify-between items-center">
          <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-400" /> Registry Penerima Manfaat
          </CardTitle>
          <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] px-3 py-1 rounded-none">
            {filteredData.length} TOTAL RECORDS
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100 border-b-2 border-slate-900">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase text-slate-900 py-4">Identitas Mustahik</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-900">Kategori & NIK</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-900">Domisili Warehouse</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-900 text-right pr-8">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 font-black uppercase tracking-widest text-slate-300 animate-pulse">
                    Retrieving Data From Warehouse...
                  </TableCell>
                </TableRow>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <TableRow key={item.sk_mustahik} className="hover:bg-emerald-50/50 transition-colors group border-b border-slate-100">
                    <TableCell className="py-4">
                      <p className="font-black text-slate-800 uppercase text-sm leading-tight group-hover:text-emerald-700 transition-colors">
                        {item.nama}
                      </p>
                      <p className="font-mono text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                        {item.id_mustahik}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-300 bg-white mb-1.5 px-2">
                        {item.kategori_pm?.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-[10px] text-slate-400 font-bold font-mono">NIK: {item.nik || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[11px] font-black text-slate-700 uppercase leading-tight">
                            {item.dim_lokasi?.desa_kelurahan || item.kabupaten_kota}
                          </p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[200px] mt-0.5">
                            {item.alamat || 'Alamat Belum Terdata'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1">
                        {/* DETAIL */}
                        <Link href={`/mustahik/${item.id_mustahik}`}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            title="Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* EDIT */}
                        <Link href={`/mustahik/edit/${item.sk_mustahik}`}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Edit Dimensi"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        </Link>

                        {/* HAPUS DENGAN KONFIRMASI */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Hapus / Nonaktifkan"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-none border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(225,29,72,1)]">
                            <AlertDialogHeader>
                              <div className="flex items-center gap-3 text-rose-600 mb-2">
                                <div className="p-2 bg-rose-50 rounded-full"><AlertTriangle className="h-6 w-6" /></div>
                                <AlertDialogTitle className="font-black text-xl uppercase tracking-tighter">Konfirmasi Penghapusan</AlertDialogTitle>
                              </div>
                              <AlertDialogDescription className="font-bold text-slate-600 text-sm">
                                Apakah Anda yakin ingin menonaktifkan <span className="text-slate-900 underline">{item.nama}</span>? 
                                <br /><br />
                                <span className="text-[10px] uppercase p-1 bg-amber-100 text-amber-700">Peringatan SCD:</span> Data lama akan tetap tersimpan di warehouse sebagai arsip (SCD Type 2), namun record ini tidak akan muncul di operasional aktif.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4 gap-2">
                              <AlertDialogCancel className="rounded-none border-2 border-slate-900 font-black uppercase text-xs">Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(item.sk_mustahik, item.nama)}
                                className="bg-rose-600 hover:bg-rose-700 rounded-none font-black uppercase text-xs px-6"
                              >
                                Ya, Hapus Data
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 font-bold text-slate-400 uppercase italic">
                    Data tidak ditemukan dalam index pencarian.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}