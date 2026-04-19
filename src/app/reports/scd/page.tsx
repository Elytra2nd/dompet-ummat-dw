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
import { History, DatabaseZap, AlertCircle, Building2, User } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// 1. Interface yang sinkron dengan skema Prisma & Database
interface AuditLog {
  id_donatur: string;
  nama_lengkap: string;
  alamat: string;
  perusahaan: string;
  tipe: string;
  valid_from: string;
  valid_to: string;
  is_active: number;
  status_record: string;
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="space-y-6 p-4 md:p-8 bg-slate-50/30 min-h-screen font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-3">
          <History className="h-8 w-8 text-indigo-600" />
          Audit Log <span className="text-indigo-600">SCD Type 2</span>
        </h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">
          Melihat silsilah data (*Data Lineage*) dan perubahan histori Muzakki di Dompet Ummat.
        </p>
      </div>

      <Card className="border-2 shadow-sm overflow-hidden bg-white">
        <CardHeader className="border-b bg-slate-50/50 py-4">
          <CardTitle className="text-xs font-black flex items-center gap-2 text-slate-500 uppercase tracking-[0.2em]">
            <DatabaseZap className="h-4 w-4 text-amber-500" /> 
            OLAP Data Lineage
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                <TableHead className="font-black text-[10px] uppercase text-slate-500">ID & Nama</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500">Kategori / Perusahaan</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500">Alamat Historis</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 text-center">Masa Berlaku</TableHead>
                <TableHead className="font-black text-[10px] uppercase text-slate-500 text-center">Status Record</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Querying TiDB Cloud...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length > 0 ? (
                logs.map((log, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell>
                      <p className="font-mono text-[10px] font-black text-indigo-500 mb-0.5">{log.id_donatur}</p>
                      <p className="font-black text-slate-900 uppercase tracking-tighter text-sm">{log.nama_lengkap}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                          <User className="h-3 w-3" /> {log.tipe?.replace('_', ' ')}
                        </div>
                        {log.perusahaan && log.perusahaan !== '-' && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                            <Building2 className="h-3 w-3" /> {log.perusahaan}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="text-xs font-medium text-slate-500 leading-relaxed italic truncate group-hover:whitespace-normal">
                        "{log.alamat}"
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-slate-700">
                          {new Date(log.valid_from).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="h-2 w-px bg-slate-200 my-0.5" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {log.is_active ? 'Present' : new Date(log.valid_to).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant="outline"
                        className={`font-black text-[9px] uppercase tracking-tighter rounded-md ${
                          log.is_active 
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
                  <TableCell colSpan={5} className="py-20">
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                      <AlertCircle className="h-12 w-12 opacity-20" />
                      <p className="font-bold text-sm italic">Data Lineage tidak ditemukan.</p>
                    </div>
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