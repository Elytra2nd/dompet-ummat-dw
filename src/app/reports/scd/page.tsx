'use client'

import { useEffect, useState } from 'react'
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
import { 
  History, 
  DatabaseZap, 
  AlertCircle, 
  Building2, 
  User, 
  ChevronLeft, 
  ChevronRight,
  Layers
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// 1. Interface Universal untuk Gabungan Entitas Warehouse
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

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/audit')
        const data = await res.json()
        if (Array.isArray(data)) {
          setLogs(data)
        } else {
          setLogs([])
        }
      } catch (error) {
        console.error("Gagal mengambil data audit:", error)
        setLogs([])
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
  }, [])

  // LOGIKA PAGINASI
  const totalPages = Math.ceil(logs.length / itemsPerPage)
  const currentLogs = logs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50/30 min-h-screen font-sans">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
          <History className="h-8 w-8 text-indigo-600" />
          Log Audit <span className="text-indigo-600">Terpadu</span>
        </h1>
        <p className="text-slate-500 font-medium text-sm md:text-base leading-relaxed">
          Pusat pelacakan histori perubahan data master (*Data Lineage*) untuk seluruh entitas organisasi di Dompet Ummat.
        </p>
      </div>

      <Card className="border-2 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b bg-slate-50/50 py-4 flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-black flex items-center gap-2 text-slate-500 uppercase tracking-[0.2em]">
            <DatabaseZap className="h-4 w-4 text-amber-500" /> 
            Cross-Entity Audit Trail
          </CardTitle>
          <Badge variant="outline" className="font-black text-[10px] border-slate-200 text-slate-400">
            SCD TYPE 2 ACTIVE
          </Badge>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="font-black text-[10px] uppercase text-slate-500">Entitas</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500">ID & Nama Master</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 text-center">Masa Berlaku</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 text-center">Status Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compiling Audit Logs...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentLogs.length > 0 ? (
                currentLogs.map((log, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/50 transition-colors group">
                    {/* ENTITAS BADGE */}
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={`font-black text-[9px] uppercase tracking-wider px-2 py-1 ${
                          log.entitas === 'Donatur' ? 'bg-blue-50 text-blue-700' :
                          log.entitas === 'Mustahik' ? 'bg-emerald-50 text-emerald-700' :
                          log.entitas === 'Petugas' ? 'bg-purple-50 text-purple-700' :
                          'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <Layers className="h-2.5 w-2.5 mr-1" /> {log.entitas}
                      </Badge>
                    </TableCell>

                    {/* ID & NAMA */}
                    <TableCell>
                      <p className="font-mono text-[10px] font-black text-indigo-500 mb-0.5">{log.id_bisnis}</p>
                      <p className="font-black text-slate-900 uppercase tracking-tighter text-sm">{log.nama}</p>
                    </TableCell>

                    {/* MASA BERLAKU */}
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-700 leading-none">
                          {new Date(log.valid_from).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="h-3 w-px bg-slate-200 my-1" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase leading-none">
                          {log.is_active ? 'Present' : new Date(log.valid_to).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </TableCell>

                    {/* STATUS RECORD */}
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline"
                        className={`font-black text-[9px] uppercase tracking-tighter rounded-md ${
                          log.status_record.includes('Active')
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                          : "bg-slate-50 text-slate-400 border-slate-200"
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
                      <p className="font-bold text-sm italic">Audit trail kosong.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* CONTROLS PAGINASI */}
          <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/30">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
              Record {Math.min(logs.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(logs.length, currentPage * itemsPerPage)} of {logs.length}
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-lg border-2"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs font-black text-slate-900 mx-2">
                Page {currentPage} of {totalPages || 1}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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