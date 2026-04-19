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
  Filter
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

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
    <div className="space-y-6 p-4 md:p-8 bg-slate-50/30 min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
            <History className="h-8 w-8 text-indigo-600" />
            Log Audit <span className="text-indigo-600">Terpadu</span>
          </h1>
          <p className="text-slate-500 font-medium text-sm max-w-2xl">
            Sistem pelacakan perubahan data master (SCD Type 2) untuk seluruh entitas organisasi.
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchLogs} 
          disabled={loading}
          className="font-bold border-2 hover:bg-indigo-50 bg-white"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-3 border-2 shadow-sm">
           <div className="relative p-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Cari berdasarkan nama master atau ID Bisnis..." 
                className="pl-10 border-none shadow-none focus-visible:ring-0 font-bold text-slate-700"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </Card>
        <Card className="border-2 shadow-sm flex items-center px-4 bg-white">
          <Filter className="h-4 w-4 text-slate-400 mr-3" />
          <select 
            className="w-full bg-transparent text-sm font-black text-slate-600 outline-none cursor-pointer"
            value={filterEntitas}
            onChange={(e) => setFilterEntitas(e.target.value)}
          >
            <option value="Semua">Semua Entitas</option>
            <option value="Donatur">Donatur</option>
            <option value="Mustahik">Mustahik</option>
            <option value="Petugas">Petugas</option>
          </select>
        </Card>
      </div>

      <Card className="border-2 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b bg-slate-50/50 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black flex items-center gap-2 text-slate-500 uppercase tracking-[0.2em]">
            <DatabaseZap className="h-4 w-4 text-amber-500" /> 
            Audit Trail Result
          </CardTitle>
          <Badge variant="outline" className="font-black text-[10px] border-indigo-200 text-indigo-600 bg-indigo-50">
            {filteredLogs.length} RECORDS FOUND
          </Badge>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="font-black text-[10px] uppercase text-slate-500 w-[120px]">Entitas</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500">ID & Nama Master</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 text-center">Masa Berlaku Record</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 text-center">Status Audit</TableHead>
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
                    <TableCell>
                      <Badge 
                        className={`font-black text-[9px] uppercase tracking-wider px-2 py-1 border-none shadow-none ${
                          log.entitas === 'Donatur' ? 'bg-blue-100 text-blue-700' :
                          log.entitas === 'Mustahik' ? 'bg-emerald-100 text-emerald-700' :
                          log.entitas === 'Petugas' ? 'bg-purple-100 text-purple-700' :
                          'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <Layers className="h-2.5 w-2.5 mr-1" /> {log.entitas}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <p className="font-mono text-[10px] font-black text-indigo-500 mb-0.5">{log.id_bisnis}</p>
                      <p className="font-black text-slate-900 uppercase tracking-tighter text-sm">{log.nama}</p>
                    </TableCell>

                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span suppressHydrationWarning className="text-[10px] font-black text-slate-700">
                          {formatDate(log.valid_from)}
                        </span>
                        <div className="h-2 w-px bg-slate-300 my-1" />
                        <span suppressHydrationWarning className="text-[10px] font-bold text-slate-400 uppercase">
                          {log.is_active ? 'PRESENT (NOW)' : formatDate(log.valid_to)}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge 
                        variant="outline"
                        className={`font-black text-[9px] uppercase tracking-tighter rounded-md ${
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

          {/* PAGINASI */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/30">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Showing {filteredLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(filteredLogs.length, currentPage * itemsPerPage)} of {filteredLogs.length} records
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                   setCurrentPage(prev => Math.max(prev - 1, 1))
                   window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-lg border-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-black text-slate-900 mx-2">
                {currentPage} / {totalPages || 1}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                   setCurrentPage(prev => Math.min(prev + 1, totalPages))
                   window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                disabled={currentPage === totalPages || totalPages === 0}
                className="h-8 w-8 p-0 rounded-lg border-2"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}