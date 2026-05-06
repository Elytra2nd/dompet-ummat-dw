'use client'

import React, { useEffect, useState, useMemo } from 'react'
import {
  ShieldAlert, Activity, User as UserIcon, Clock, Database,
  Loader2, RefreshCw, ArrowLeft, Search, Filter, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import Pagination from '@/components/ui/pagination-numbered'

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

const ACTION_STYLE: Record<string, string> = {
  EXPORT_BACKUP: 'text-indigo-700 bg-indigo-50 border-indigo-200',
  CREATE_SURVEY: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  DELETE_SURVEY: 'text-rose-700 bg-rose-50 border-rose-200',
  LOGIN: 'text-sky-700 bg-sky-50 border-sky-200',
  LOGOUT: 'text-slate-600 bg-slate-50 border-slate-200',
}

const ROLE_STYLE: Record<string, string> = {
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
  SURVEYOR: 'bg-sky-50 text-sky-700 border-sky-200',
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 15

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users/audit')
      if (res.ok) setLogs(await res.json())
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLogs() }, [])

  const actionOptions = useMemo(() => {
    const set = new Set(logs.map(l => l.action).filter(Boolean))
    return Array.from(set).sort()
  }, [logs])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return logs.filter(l => {
      const matchSearch =
        l.user?.name?.toLowerCase().includes(q) ||
        l.user?.email?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.entity?.toLowerCase().includes(q)
      const matchAction = !filterAction || l.action === filterAction
      return matchSearch && matchAction
    })
  }, [logs, search, filterAction])

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage))
  const currentLogs = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Baru saja'
    if (mins < 60) return `${mins}m lalu`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}j lalu`
    const days = Math.floor(hours / 24)
    return `${days}h lalu`
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* HEADER BAR */}
      <div className="mb-6 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4 text-slate-500 font-semibold hover:bg-slate-50">
            <Link href="/users"><ArrowLeft className="mr-2 h-4 w-4" /> Manajemen User</Link>
          </Button>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold text-slate-900">
                <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-sm">
                  <ShieldAlert className="h-6 w-6 text-white" />
                </div>
                Sistem <span className="text-indigo-600">Audit Trail</span>
              </h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-1 ml-14">
                Pemantauan aktivitas pengguna secara real-time
              </p>
            </div>
            <Button onClick={fetchLogs} disabled={loading} variant="outline" className="gap-2 font-semibold w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Segarkan
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-8">
        {/* SUMMARY CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="border-none shadow-sm bg-white rounded-xl">
            <CardContent className="p-4 text-center">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest">Total Log</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{logs.length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-indigo-50 rounded-xl">
            <CardContent className="p-4 text-center">
              <p className="text-[9px] font-semibold text-indigo-500 uppercase tracking-widest">Export</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{logs.filter(l => l.action === 'EXPORT_BACKUP').length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-emerald-50 rounded-xl">
            <CardContent className="p-4 text-center">
              <p className="text-[9px] font-semibold text-emerald-500 uppercase tracking-widest">Create</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{logs.filter(l => l.action.startsWith('CREATE')).length}</p>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-rose-50 rounded-xl">
            <CardContent className="p-4 text-center">
              <p className="text-[9px] font-semibold text-rose-500 uppercase tracking-widest">Delete</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{logs.filter(l => l.action.startsWith('DELETE')).length}</p>
            </CardContent>
          </Card>
        </div>

        {/* TABLE CARD */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white rounded-xl">
          <CardHeader className="border-b py-4 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative w-full max-w-md">
                <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Cari pengguna, aksi, atau entitas..."
                  className="pl-10 font-medium w-full"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                />
              </div>
              <div className="relative">
                <Filter className="absolute top-3 left-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={filterAction}
                  onChange={(e) => { setFilterAction(e.target.value); setCurrentPage(1) }}
                  className="h-10 pl-10 pr-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 appearance-none cursor-pointer min-w-[180px]"
                >
                  <option value="">Semua Aksi</option>
                  {actionOptions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              </div>
            ) : currentLogs.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-medium text-sm">
                Belum ada log aktivitas yang tercatat.
              </div>
            ) : (
              <>
                {/* DESKTOP TABLE */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 text-slate-500 border-b uppercase text-[10px] font-semibold tracking-wider">
                      <tr>
                        <th className="px-6 py-3.5">Waktu</th>
                        <th className="px-6 py-3.5">Pengguna</th>
                        <th className="px-6 py-3.5">Aksi / Entitas</th>
                        <th className="px-6 py-3.5">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2 text-slate-700 font-medium text-xs">
                              <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                              {new Date(log.createdAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'medium' })}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 ml-5">
                              {timeAgo(log.createdAt)} • IP: {log.ipAddress || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 text-xs truncate">{log.user.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${ROLE_STYLE[log.user.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                    {log.user.role}
                                  </span>
                                  <span className="text-[10px] text-slate-400 truncate">{log.user.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex flex-col items-start gap-1">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${ACTION_STYLE[log.action] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                                {log.action}
                              </span>
                              <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                                <Database className="h-3 w-3" /> {log.entity}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 max-w-[250px]">
                            <pre className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-md overflow-x-auto border border-slate-100 whitespace-pre-wrap break-all">
                              {log.details || '-'}
                            </pre>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* MOBILE CARDS */}
                <div className="md:hidden divide-y divide-slate-100">
                  {currentLogs.map((log) => (
                    <div key={log.id} className="px-4 py-4 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <UserIcon className="h-3.5 w-3.5 text-slate-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 text-xs">{log.user.name}</p>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold border ${ROLE_STYLE[log.user.role] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {log.user.role}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400">{timeAgo(log.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${ACTION_STYLE[log.action] || 'text-slate-600 bg-slate-50 border-slate-200'}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                          <Database className="h-3 w-3" /> {log.entity}
                        </span>
                      </div>
                      {log.details && (
                        <pre className="text-[10px] font-mono text-slate-500 bg-slate-50 p-2 rounded-md border border-slate-100 whitespace-pre-wrap break-all">
                          {log.details}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* PAGINATION */}
            {!loading && filtered.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filtered.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
