'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowUpRight, Search, Plus, Filter, Loader2, FileText, AlertCircle 
} from 'lucide-react'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { toast } from 'sonner'
import Link from 'next/link'

interface PenyaluranZiswaf {
  sk_fakta_penyaluran: number;
  id_transaksi: string;
  dana_tersalur: number;
  domain_program: string;
  kategori_program: string;
  jenis_bantuan: string;
  dim_mustahik?: {
    nama: string;
    kategori_pm: string;
  };
}

export default function DonasiKeluarPage() {
  const [data, setData] = useState<PenyaluranZiswaf[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', maximumFractionDigits: 0
    }).format(val)
  }

  useEffect(() => {
    setMounted(true)
    fetch('/api/donasi/keluar')
      .then(res => res.json())
      .then(d => {
        setData(Array.isArray(d) ? d : [])
        setLoading(false)
      })
      .catch(() => {
        toast.error("Gagal sinkronisasi data")
        setLoading(false)
      })
  }, [])

  const filteredData = useMemo(() => {
    return data.filter((item) => 
      item.id_transaksi?.toLowerCase().includes(search.toLowerCase()) ||
      item.dim_mustahik?.nama?.toLowerCase().includes(search.toLowerCase())
    )
  }, [data, search])

  if (!mounted) return null

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans text-slate-900">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-2">
            <ArrowUpRight className="text-amber-500 h-7 w-7" /> Penyaluran <span className="text-amber-600">ZISWAF</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">
            Data Warehouse • Fact Penyaluran
          </p>
        </div>
        <Link href="/donasi/keluar/baru">
          <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase text-[10px] tracking-widest h-11 px-8 rounded-xl shadow-lg shadow-amber-100">
            <Plus className="mr-2 h-4 w-4" /> Input Penyaluran
          </Button>
        </Link>
      </div>

      <Card className="border-none shadow-sm bg-white overflow-hidden rounded-2xl">
        <div className="p-4 bg-slate-50/50 border-b flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input 
              placeholder="Cari transaksi atau nama mustahik..." 
              className="pl-10 w-full h-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-bold text-[10px] uppercase px-6">ID & Domain</TableHead>
                <TableHead className="font-bold text-[10px] uppercase">Mustahik</TableHead>
                <TableHead className="font-bold text-[10px] uppercase">Kategori</TableHead>
                <TableHead className="font-bold text-[10px] uppercase">Dana Tersalur</TableHead>
                <TableHead className="font-bold text-[10px] uppercase text-right pr-8">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-20 text-center animate-pulse text-[10px] font-bold uppercase text-slate-400">Loading Warehouse Data...</TableCell></TableRow>
              ) : filteredData.map((item) => (
                <TableRow key={item.sk_fakta_penyaluran} className="group hover:bg-amber-50/30 transition-colors">
                  <TableCell className="px-6 py-5">
                    <p className="font-black text-xs uppercase text-slate-900">{item.domain_program?.replace(/_/g, ' ')}</p>
                    <p className="text-[10px] font-mono font-bold text-slate-400 uppercase">{item.id_transaksi}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-bold text-sm text-slate-700 uppercase">{item.dim_mustahik?.nama || 'UMUM'}</p>
                    <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">{item.dim_mustahik?.kategori_pm}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="rounded-md border-amber-200 text-amber-700 bg-amber-50 font-bold text-[9px] uppercase">
                      {item.kategori_program?.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-sm text-slate-900">
                    {formatIDR(item.dana_tersalur || 0)}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="icon" className="text-slate-300 hover:text-amber-600 rounded-lg"><FileText size={18} /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}