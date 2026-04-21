'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowUpRight, 
  Search, 
  Plus, 
  Filter, 
  Loader2, 
  HandCoins, 
  History,
  FileText,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { toast } from 'sonner'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

// 1. Definisikan Interface untuk Tipe Data (Menghilangkan error 'never[]')
interface PenyaluranZiswaf {
  sk_fakta_penyaluran: number;
  id_transaksi: string;
  jumlah_penyaluran: number;
  metode_penyaluran: string;
  dim_program?: {
    nama_program: string;
  };
  dim_mustahik?: {
    nama_mustahik: string;
    kategori: string;
  };
}

export default function DonasiKeluarPage() {
  // Gunakan Interface pada useState
  const [data, setData] = useState<PenyaluranZiswaf[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')

  // Helper Formatter Rupiah (Cegah Hydration Error)
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val)
  }

  const fetchPenyaluran = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/donasi/keluar')
      const d = await res.json()
      setData(Array.isArray(d) ? d : [])
    } catch (error) {
      toast.error("Gagal sinkronisasi data penyaluran")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchPenyaluran()
  }, [])

  const filteredData = useMemo(() => {
    return data.filter((item) => 
      item.id_transaksi?.toLowerCase().includes(search.toLowerCase()) ||
      item.dim_mustahik?.nama_mustahik?.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  // Cegah Hydration Error #418
  if (!mounted) return null

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2 text-slate-900">
            <ArrowUpRight className="text-amber-500 h-7 w-7" /> Penyaluran <span className="text-amber-600">ZISWAF</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1 italic">
            Outflow Fact Management • BIDA Platform
          </p>
        </div>
        <Link href="/donasi/keluar/baru">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-amber-100 h-11 px-8 rounded-xl transition-all hover:scale-105 active:scale-95">
            <Plus className="mr-2 h-4 w-4" /> Input Penyaluran
          </Button>
        </Link>
      </div>

      {/* SEARCH & FILTER AREA */}
      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
        <div className="p-4 flex flex-col md:flex-row gap-4 bg-slate-50/50 border-b">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <input 
              placeholder="Cari ID transaksi atau nama penerima..." 
              className="pl-10 w-full h-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="rounded-xl border-slate-200 uppercase text-[10px] font-bold h-10 px-6 hover:bg-white hover:text-amber-600 shadow-sm">
            <Filter className="mr-2 h-3.5 w-3.5" /> Filter Periode
          </Button>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent border-b">
                  <TableHead className="font-bold text-[10px] uppercase py-5 px-6 tracking-widest text-slate-400">ID & Program</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Penerima Manfaat</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Nominal Penyaluran</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Metode</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400 text-right pr-8">Opsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="animate-spin h-8 w-8 text-amber-500" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synchronizing Fact Table...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <TableRow key={item.sk_fakta_penyaluran} className="hover:bg-amber-50/30 transition-colors border-b last:border-0 group">
                      <TableCell className="px-6 py-5">
                        <p className="font-black text-xs text-slate-900 uppercase tracking-tight group-hover:text-amber-700 transition-colors">
                          {item.dim_program?.nama_program || 'Program Umum'}
                        </p>
                        <p className="text-[10px] font-mono font-bold text-slate-400 mt-1 uppercase tracking-tighter italic border-l-2 border-amber-200 pl-2">
                          {item.id_transaksi}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-sm text-slate-700 uppercase">{item.dim_mustahik?.nama_mustahik || 'Masyarakat Umum'}</span>
                          <span className="text-[9px] font-black text-amber-600/70 uppercase tracking-widest mt-0.5">{item.dim_mustahik?.kategori || 'Individu'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-black text-sm text-slate-900 tracking-tighter">
                          {formatIDR(item.jumlah_penyaluran || 0)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-md border-amber-200 text-amber-700 bg-amber-50 px-2 py-0.5 font-bold text-[9px] uppercase tracking-tighter">
                          {item.metode_penyaluran}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                         <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-lg">
                              <FileText size={16} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                              <MoreVertical size={16} />
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-24 text-center">
                      <div className="flex flex-col items-center gap-2 opacity-30">
                        <AlertCircle size={40} className="text-slate-300" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Belum ada data fakta penyaluran</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* FOOTER INFO SUMMARY */}
      {!loading && filteredData.length > 0 && (
        <div className="flex justify-between items-center px-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Menampilkan {filteredData.length} entri dari database warehouse
          </p>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 shadow-sm"><ChevronLeft size={14}/></Button>
            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-slate-200 shadow-sm"><ChevronRight size={14}/></Button>
          </div>
        </div>
      )}
    </div>
  )
}