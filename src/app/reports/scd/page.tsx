'use client'

import { useEffect, useState, useMemo } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  History, 
  DatabaseZap, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Layers,
  RefreshCw,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import Pagination from '@/components/ui/pagination-numbered'

// 1. Interface Universal untuk Gabungan Entitas Warehouse (SCD Type 2)
interface AuditLog {
  id_bisnis: string;
  nama: string;
  entitas: 'Donatur' | 'Mustahik' | 'Petugas' | 'Pasien';
  valid_from: string;
  valid_to: string;
  is_active: number;
  status_record: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  // STATE FILTER & SEARCH
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEntitas, setFilterEntitas] = useState('Semua')

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  // 2. Fungsi Fetch dengan Cache Buster
  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/audit?t=${new Date().getTime()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      })
      const data = await res.json()
      if (Array.isArray(data)) {
        setLogs(data)
      } else {
        setLogs([])
      }
    } catch (error) {
      console.error("Gagal mengambil data audit:", error)
      toast.error("Gagal sinkronisasi data warehouse")
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchLogs()
  }, [])

  // 3. LOGIKA FILTERING & SEARCHING (Client-side)
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchSearch = 
        log.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
        log.id_bisnis.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchEntitas = filterEntitas === 'Semua' || log.entitas === filterEntitas;
      
      return matchSearch && matchEntitas;
    });
  }, [logs, searchTerm, filterEntitas]);

  // LOGIKA PAGINASI BERDASARKAN HASIL FILTER
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage)
  const currentLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  // Reset page ke 1 jika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterEntitas]);

  // Fungsi helper untuk render tanggal aman
  const formatDate = (dateStr: string) => {
    if (!mounted) return "..." 
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      })
    } catch (e) {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* HEADER BAR */}
      <div className="mb-6 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-semibold hover:bg-slate-50">
            <Link href="/reports"><ArrowLeft className="mr-2 h-4 w-4" /> Pusat Laporan</Link>
          </Button>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-slate-900">
                <History className="h-7 w-7 text-indigo-600 shrink-0" />
                Log Audit <span className="text-indigo-600">Terpadu</span>
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1">
                Pelacakan Perubahan Data Master • SCD Type 2
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchLogs} 
              disabled={loading}
              className="h-10 text-sm font-semibold bg-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8">

      {/* SEARCH & FILTER BAR */}
      <Card className="border-slate-200 shadow-sm rounded-xl bg-white">
        <CardHeader className="border-b py-4 bg-slate-50/50">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari nama master atau ID Bisnis..." 
                className="h-10 pl-10 text-sm font-medium w-full bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute top-3 left-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <select 
                className="h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer min-w-[180px]"
                value={filterEntitas}
                onChange={(e) => setFilterEntitas(e.target.value)}
              >
                <option value="Semua">Semua Entitas</option>
                <option value="Donatur">Donatur</option>
                <option value="Mustahik">Mustahik</option>
                <option value="Petugas">Petugas</option>
                <option value="Pasien">Pasien</option>
              </select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
        <CardHeader className="border-b bg-slate-50/50 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold flex items-center gap-2 text-slate-500 uppercase tracking-widest">
            <DatabaseZap className="h-4 w-4 text-amber-500" /> 
            Audit Trail Result
          </CardTitle>
          <Badge variant="outline" className="font-semibold text-[10px] border-indigo-200 text-indigo-600 bg-indigo-50">
            {filteredLogs.length} RECORDS
          </Badge>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                  <TableHead className="font-semibold text-[10px] uppercase text-slate-500 w-[150px] text-left px-6">Entitas</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase text-slate-500 min-w-[300px] text-left">ID & Nama Master</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase text-slate-500 w-[200px] text-center">Masa Berlaku Record</TableHead>
                  <TableHead className="font-semibold text-[10px] uppercase text-slate-500 w-[150px] text-center pr-6">Status Audit</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
              {loading && logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fetching Lineage Data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentLogs.length > 0 ? (
                currentLogs.map((log, i) => (
                  <TableRow key={i} className={`hover:bg-slate-50/50 transition-colors ${!log.is_active ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                    <TableCell className="px-6 text-left">
                      <Badge 
                        className={`font-semibold text-[9px] uppercase tracking-wider px-2 py-1 border-none shadow-none ${
                          log.entitas === 'Donatur' ? 'bg-blue-100 text-blue-700' :
                          log.entitas === 'Mustahik' ? 'bg-emerald-100 text-emerald-700' :
                          log.entitas === 'Petugas' ? 'bg-purple-100 text-purple-700' :
                          'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <Layers className="h-2.5 w-2.5 mr-1" /> {log.entitas}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-left">
                      <p className="font-mono text-[10px] font-semibold text-indigo-500 mb-0.5">{log.id_bisnis}</p>
                      <p className="font-semibold text-slate-900 uppercase text-sm">{log.nama}</p>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span suppressHydrationWarning className="text-[10px] font-semibold text-slate-700">
                          {formatDate(log.valid_from)}
                        </span>
                        <div className="h-2 w-px bg-slate-300 my-1" />
                        <span suppressHydrationWarning className="text-[10px] font-bold text-slate-400 uppercase">
                          {log.is_active ? 'PRESENT (NOW)' : formatDate(log.valid_to)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center pr-6">
                      <Badge 
                        variant="outline"
                        className={`font-semibold text-[9px] uppercase tracking-tighter rounded-md ${
                          log.status_record.includes('Active')
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {log.status_record}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <AlertCircle className="h-12 w-12 opacity-20" />
                      <p className="font-bold text-sm italic">Data tidak ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLogs.length}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
