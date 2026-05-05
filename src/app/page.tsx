'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  HeartHandshake, 
  Map as MapIcon, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Loader2,
  PlusCircle,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import DonationStats from '@/components/donasi/DonationStats'
import ProgramStats from '@/components/donasi/ProgramStats'
import DemografiStats from '@/components/mustahik/DemografiStats'

interface AuditLog {
  id: string
  action: string
  detail: string | null
  createdAt: string
  user?: { name: string | null; email: string; role: string }
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

function actionBadge(action: string): { label: string; color: string } {
  const a = action.toUpperCase()
  if (a.includes('LOGIN')) return { label: 'AUTH', color: 'text-emerald-600 border-emerald-200 bg-emerald-50' }
  if (a.includes('CREATE') || a.includes('INSERT')) return { label: 'CREATE', color: 'text-blue-600 border-blue-200 bg-blue-50' }
  if (a.includes('UPDATE') || a.includes('EDIT')) return { label: 'UPDATE', color: 'text-amber-600 border-amber-200 bg-amber-50' }
  if (a.includes('DELETE') || a.includes('HAPUS')) return { label: 'DELETE', color: 'text-rose-600 border-rose-200 bg-rose-50' }
  return { label: 'SYS', color: 'text-indigo-500 border-indigo-200 bg-indigo-50' }
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalDonasi: 0,
    jumlahDonatur: 0,
    jumlahMustahik: 0,
    pertumbuhan: 0,
    danaTersalur: 0,
    layananAmbulan: 0,
  })
  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [logsLoading, setLogsLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        
        if (data) {
          setStats({
            totalDonasi: data.totalDonasi || 0,
            jumlahDonatur: data.jumlahDonatur || 0,
            jumlahMustahik: data.jumlahMustahik || 0,
            pertumbuhan: data.pertumbuhan || 0,
            layananAmbulan: data.layananAmbulan || 0,
            danaTersalur: data.danaTersalur || 0
          })
        }
      } catch (error) {
        console.error("Gagal mengambil data dari Data Warehouse:", error)
      } finally {
        setLoading(false)
      }
    }

    async function fetchAuditLogs() {
      try {
        const res = await fetch('/api/users/audit')
        if (res.ok) {
          const data = await res.json()
          setAuditLogs(Array.isArray(data) ? data.slice(0, 6) : [])
        }
      } catch (err) {
        console.error('Gagal memuat audit logs:', err)
      } finally {
        setLogsLoading(false)
      }
    }

    fetchDashboardStats()
    fetchAuditLogs()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 md:pb-12 font-sans">
      {/* 1. HERO / GREETING SECTION */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${loading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700'}`}>
                  {loading ? (
                    <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Connecting...</>
                  ) : 'OLAP Core Connected'}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
                  SVM AI Active
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Dashboard <span className="text-emerald-600 font-extrabold">Amil</span> Analitik
              </h1>
              <p className="text-slate-500 font-medium max-w-xl text-sm md:text-base leading-relaxed">
                Sistem pendukung keputusan berbasis <span className="text-slate-900">Data Warehouse</span> untuk optimalisasi penghimpunan ZISWAF.
              </p>
            </div>
            
            {/* Quick Actions - Mobile Grid */}
            <div className="grid grid-cols-1 sm:flex gap-3">
              <Button asChild variant="outline" className="w-full sm:w-auto border-2 font-bold py-6 md:py-2">
                <Link href="/donasi/masuk">
                  <PlusCircle className="mr-2 h-4 w-4" /> Input Transaksi
                </Link>
              </Button>
              <Button asChild className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold py-6 md:py-2 transition-all">
                <Link href="/ambulan/layanan">
                  <HeartHandshake className="mr-2 h-4 w-4" /> Layanan Utama
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* 2. STATS OVERVIEW */}
        <section>
          {loading ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-24 md:h-32 border-2 border-slate-100 bg-white shadow-none animate-pulse flex items-center justify-center">
                   <div className="h-4 w-12 bg-slate-100 rounded" />
                </Card>
              ))}
            </div>
          ) : (
            <DonationStats 
              totalDonasi={stats.totalDonasi}
              jumlahDonatur={stats.jumlahDonatur}
              jumlahMustahik={stats.jumlahMustahik}
              pertumbuhan={stats.pertumbuhan}
              danaTersalur={stats.danaTersalur}
            />
          )}
        </section>

        <ProgramStats />

        <DemografiStats />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          
          {/* 3. MODUL CEPAT */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <h2 className="text-lg md:text-xl font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500 h-5 w-5 md:h-6 md:w-6" /> Modul Operasional
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <Link href="/donasi/donatur">
                <Card className="hover:border-indigo-400 transition-all group cursor-pointer border-2 shadow-none bg-white h-full">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 transition-colors">
                        <Users className="h-5 w-5 md:h-6 md:w-6 text-indigo-600 group-hover:text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                    </div>
                    <h3 className="mt-4 font-black text-lg text-slate-900">Database Donatur</h3>
                    <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed mt-1">
                      Manajemen profil Muzakki melalui skema tabel dimensi.
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/mustahik/spasial">
                <Card className="hover:border-red-400 transition-all group cursor-pointer border-2 shadow-none bg-white h-full">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-red-50 rounded-xl group-hover:bg-red-600 transition-colors">
                        <MapIcon className="h-5 w-5 md:h-6 md:w-6 text-red-600 group-hover:text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-red-600 transition-all group-hover:translate-x-1" />
                    </div>
                    <h3 className="mt-4 font-black text-lg text-slate-900">Pemetaan Spasial</h3>
                    <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed mt-1">
                      Analisis sebaran mustahik berbasis koordinat GIS.
                    </p>
                  </CardContent>
                </Card>
              </Link>

            </div>
          </div>

          {/* 4. AKTIVITAS TERKINI */}
          <Card className="border shadow-sm bg-white overflow-hidden flex flex-col h-full rounded-xl">
            <CardHeader className="bg-slate-50/50 border-b py-4">
              <CardTitle className="text-xs md:text-sm font-black flex items-center gap-2 text-slate-700 uppercase tracking-wider">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Aktivitas Terkini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-grow">
              <div className="divide-y">
                {logsLoading ? (
                  <div className="p-8 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat log...</p>
                  </div>
                ) : auditLogs.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-slate-400 font-medium">Belum ada aktivitas tercatat</p>
                  </div>
                ) : (
                  auditLogs.map((log) => {
                    const badge = actionBadge(log.action)
                    return (
                      <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <p className="text-[11px] font-bold text-slate-800 leading-tight">
                          {log.detail || log.action}
                        </p>
                        {log.user && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                            oleh {log.user.name || log.user.email}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[9px] font-black border px-1.5 py-0.5 rounded-md uppercase ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {timeAgo(log.createdAt)}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
            <div className="p-3 bg-slate-50/30 border-t text-center mt-auto">
              <Button variant="ghost" asChild className="w-full text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all">
                <Link href="/users">Audit Full Logs</Link>
              </Button>
            </div>
          </Card>

        </div>
      </div>
    </div>
  )
}