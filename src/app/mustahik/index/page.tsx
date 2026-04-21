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
  Users, Search, UserPlus, MapPin, 
  Filter, MoreHorizontal, ClipboardList, RefreshCw 
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <Users className="h-8 w-8 text-emerald-600" /> 
            Database <span className="text-emerald-600">Mustahik</span>
          </h1>
          <p className="text-slate-500 font-medium italic text-sm">Master Data Dimension - BIDA Platform</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="sm" onClick={fetchMustahik} className="bg-white border-2 font-bold">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Link href="/mustahik/baru" className="w-full md:w-auto">
            <Button className="bg-emerald-600 hover:bg-emerald-700 font-black uppercase text-[10px] tracking-widest w-full">
              <UserPlus className="h-4 w-4 mr-2" /> Tambah Mustahik
            </Button>
          </Link>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <Card className="border-2 shadow-sm">
        <div className="p-2 relative flex items-center">
          <Search className="absolute left-4 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Cari berdasarkan Nama, NIK, atau ID Mustahik..." 
            className="pl-10 border-none shadow-none font-bold text-slate-700 focus-visible:ring-0"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      {/* DATA TABLE */}
      <Card className="border-none shadow-xl overflow-hidden bg-white">
        <CardHeader className="bg-slate-900 text-white py-4 flex flex-row justify-between items-center">
          <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-emerald-400" /> Penerima Manfaat Registry
          </CardTitle>
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50 font-black text-[10px]">
            {filteredData.length} TOTAL MUSTAHIK
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-100">
              <TableRow>
                <TableHead className="font-black text-[10px] uppercase w-[250px]">Identitas Mustahik</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Kategori & NIK</TableHead>
                <TableHead className="font-black text-[10px] uppercase">Domisili</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-right pr-6">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold animate-pulse text-slate-400">LOADING DATABASE...</TableCell></TableRow>
              ) : filteredData.map((item) => (
                <TableRow key={item.sk_mustahik} className="hover:bg-emerald-50/30 transition-colors group">
                  <TableCell>
                    <p className="font-black text-slate-800 uppercase text-sm leading-tight">{item.nama}</p>
                    <p className="font-mono text-[10px] text-emerald-600 font-bold mt-0.5">{item.id_mustahik}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-black text-[9px] uppercase border-none mb-1">
                      {item.kategori_pm?.replace(/_/g, ' ')}
                    </Badge>
                    <p className="text-[10px] text-slate-400 font-bold">NIK: {item.nik || '-'}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-600 uppercase leading-tight">
                          {item.dim_lokasi?.desa_kelurahan || item.kabupaten_kota}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium italic truncate max-w-[200px]">
                          {item.alamat}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-emerald-100 hover:text-emerald-700">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}