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
import { History, DatabaseZap, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// 1. Definisikan Interface untuk Log Audit (Mencegah Error 'never[]')
interface AuditLog {
  nama_donatur: string;
  alamat: string;
  tgl_mulai: string;
  tgl_akhir: string;
  is_active: number;
  status_record: string;
}

export default function AuditLogPage() {
  // 2. Gunakan Generic Type <AuditLog[]> pada useState
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/audit')
        const data = await res.json()
        
        // Validasi apakah data yang diterima sesuai ekspektasi
        if (Array.isArray(data)) {
          setLogs(data)
        } else {
          console.error("API tidak mengembalikan array:", data)
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
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
          <History className="h-8 w-8 text-indigo-600" />
          Log Audit <span className="text-indigo-600">SCD Type 2</span>
        </h1>
        <p className="text-slate-500 font-medium">
          Pelacakan histori perubahan data master donatur dalam Data Warehouse.
        </p>
      </div>

      <Card className="border-2 shadow-none overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 py-3">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <DatabaseZap className="h-4 w-4 text-amber-500" /> 
            Data Lineage & History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-bold text-slate-700">Nama Donatur</TableHead>
                <TableHead className="font-bold text-slate-700">Alamat (Historical)</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Mulai Berlaku</TableHead>
                <TableHead className="font-bold text-slate-700 text-center">Berakhir</TableHead>
                <TableHead className="font-bold text-center text-slate-700">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Menghubungkan ke TiDB...
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length > 0 ? (
                logs.map((log, i) => (
                  <TableRow key={i} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-slate-800">{log.nama_donatur}</TableCell>
                    <TableCell className="text-slate-500">{log.alamat}</TableCell>
                    <TableCell className="text-center text-xs font-semibold text-slate-600">
                      {new Date(log.tgl_mulai).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold text-slate-400">
                      {log.is_active ? '-' : new Date(log.tgl_akhir).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        variant={log.is_active ? "default" : "secondary"} 
                        className={log.is_active ? "bg-emerald-500 hover:bg-emerald-600" : "bg-slate-100 text-slate-500 border-none shadow-none"}
                      >
                        {log.status_record}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <AlertCircle className="h-10 w-10 opacity-20" />
                      <p className="font-medium italic">Tidak ada histori perubahan data yang ditemukan.</p>
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