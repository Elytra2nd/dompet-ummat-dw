'use client'

import React, { useEffect, useState } from 'react'
import {
  ShieldAlert,
  Activity,
  User as UserIcon,
  Clock,
  Database,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type AuditLog = {
  id: string
  userId: string
  action: string
  entity: string
  details: string | null
  ipAddress: string | null
  createdAt: string
  user: {
    name: string | null
    email: string | null
    role: string
  }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users/audit')
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const formatAction = (action: string) => {
    switch (action) {
      case 'EXPORT_BACKUP': return <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md text-xs font-bold border border-indigo-200">EXPORT_BACKUP</span>
      case 'CREATE_SURVEY': return <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md text-xs font-bold border border-emerald-200">CREATE_SURVEY</span>
      case 'DELETE_SURVEY': return <span className="text-rose-600 bg-rose-50 px-2 py-1 rounded-md text-xs font-bold border border-rose-200">DELETE_SURVEY</span>
      default: return <span className="text-slate-600 bg-slate-100 px-2 py-1 rounded-md text-xs font-bold border border-slate-300">{action}</span>
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-lg shadow-slate-200">
              <ShieldAlert className="h-7 w-7 text-white" />
            </div>
            Sistem Audit Trail
          </h1>
          <p className="text-slate-500 mt-2 ml-14">
            Pemantauan log aktivitas pengguna secara real-time untuk menjamin kepatuhan keamanan data.
          </p>
        </div>
        <Button onClick={fetchLogs} disabled={loading} variant="outline" className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </Button>
      </div>

      <Card className="border-2 shadow-sm">
        <CardHeader className="bg-slate-50/50 border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-600" /> Histori Aktivitas (100 Terbaru)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-20 text-slate-500">Belum ada log aktivitas yang tercatat.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b uppercase text-[10px] font-black tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Waktu & IP</th>
                    <th className="px-6 py-4">Pengguna</th>
                    <th className="px-6 py-4">Aksi / Entitas</th>
                    <th className="px-6 py-4">Detail JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-slate-700 font-medium">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {new Date(log.createdAt).toLocaleString('id-ID', {
                            dateStyle: 'short',
                            timeStyle: 'medium'
                          })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1 ml-5">
                          IP: {log.ipAddress || 'unknown'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                            <UserIcon className="h-4 w-4 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{log.user.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                log.user.role === 'ADMIN' ? 'bg-rose-100 text-rose-700' :
                                log.user.role === 'SURVEYOR' ? 'bg-sky-100 text-sky-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {log.user.role}
                              </span>
                              <span className="text-[10px] text-slate-400">{log.user.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-start gap-1.5">
                          {formatAction(log.action)}
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                            <Database className="h-3 w-3" /> {log.entity}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <pre className="text-[10px] font-mono text-slate-600 bg-slate-50 p-2 rounded-md overflow-x-auto border border-slate-100">
                          {log.details ? log.details : '-'}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
