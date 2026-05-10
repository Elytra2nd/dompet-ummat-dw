'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Truck, Settings2, ArrowRight, Activity, History, TrendingUp,
  HandHeart, DollarSign, Loader2, Car, MapPin, BarChart3, Layers3
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts'

const formatIDR = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

const COLORS = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#6366f1', '#ec4899']

type CubeSlice = 'tahun' | 'armada' | 'kategori'

export default function AmbulanExecutivePage() {
  const [stats, setStats] = useState<any>(null)
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cubeSlice, setCubeSlice] = useState<CubeSlice>('tahun')
  const [spatialLevel, setSpatialLevel] = useState<'kabupaten' | 'kecamatan'>('kabupaten')

  useEffect(() => {
    Promise.all([
      fetch('/api/ambulan/aktivitas').then(r => r.json()),
      fetch('/api/ambulan/analytics').then(r => r.json()).catch(() => null),
    ]).then(([s, a]) => {
      setStats(s)
      setAnalytics(a)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  // OLAP Cube aggregation by selected slice
  const cubeAgg = useMemo(() => {
    if (!analytics?.cube) return []
    const map = new Map<string, number>()
    analytics.cube.forEach((row: any) => {
      const key = row[cubeSlice] || '-'
      map.set(key, (map.get(key) || 0) + Number(row.jumlah))
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [analytics, cubeSlice])

  // Spatial SOLAP aggregation
  const spatialAgg = useMemo(() => {
    if (!analytics?.spatial) return []
    if (spatialLevel === 'kabupaten') {
      const map = new Map<string, number>()
      analytics.spatial.forEach((r: any) => {
        map.set(r.kabupaten, (map.get(r.kabupaten) || 0) + r.jumlah)
      })
      return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    }
    return analytics.spatial.map((r: any) => ({ name: r.kecamatan, value: r.jumlah })).sort((a: any, b: any) => b.value - a.value).slice(0, 15)
  }, [analytics, spatialLevel])

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-lg text-xs font-bold">
        {payload[0].name || payload[0].dataKey}: {typeof payload[0].value === 'number' && payload[0].value > 10000 ? formatIDR(payload[0].value) : payload[0].value}
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-slate-50/50 min-h-screen font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-black tracking-tight">
            <Car className="h-7 w-7 text-rose-600 shrink-0" />
            Dashboard <span className="text-rose-600">Ambulan</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-xs tracking-wide">
            Pusat Analisis Ambulan • BIDA Analytics
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5 self-start sm:self-auto">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold uppercase tracking-tight text-emerald-700">Live Sync</span>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="col-span-2 md:col-span-1 border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Alokasi Biaya</p>
                <h3 className="text-lg sm:text-xl font-black mt-1 text-rose-600 tracking-tighter break-all">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : formatIDR(stats?.totalExp || 0)}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0 group-hover:rotate-12 transition-transform ml-2">
                <DollarSign size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktivitas Terdata</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-slate-900 tracking-tighter">
                  {loading ? '...' : (stats?.totalCount || 0)}
                  <span className="text-xs font-bold text-slate-400 ml-1">Log</span>
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:-rotate-12 transition-transform">
                <Activity size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-800 rounded-2xl overflow-hidden group hover:shadow-md transition-all text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-10"><Settings2 size={80} /></div>
          <CardContent className="p-4 sm:p-5 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Kesiapan Armada</p>
                <h3 className="text-lg sm:text-xl font-black mt-1 tracking-tighter text-yellow-400 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" /> OPTIMAL
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-slate-700 text-yellow-400 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                <Truck size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Trend Layanan */}
          <Card className="border-none shadow-md rounded-2xl bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-700">
                <TrendingUp size={16} className="text-rose-500" /> Tren Layanan Ambulans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                {analytics.trend?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.trend}>
                      <defs>
                        <linearGradient id="colorTrendAmb" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" stroke="#f43f5e" strokeWidth={2.5} fill="url(#colorTrendAmb)" animationDuration={1200} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-slate-400 text-center pt-20">Belum ada data pertumbuhan</p>}
              </div>
            </CardContent>
          </Card>

          {/* Distribusi Kategori Layanan (Donut) */}
          <Card className="border-none shadow-md rounded-2xl bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-700">
                <BarChart3 size={16} className="text-violet-500" /> Distribusi Kategori Layanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] flex items-center">
                {analytics.kategori?.length > 0 ? (
                  <div className="flex w-full items-center gap-4">
                    <div className="w-[160px] h-[200px] flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={analytics.kategori} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                            {analytics.kategori.map((_: any, i: number) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[220px]">
                      {analytics.kategori.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="truncate text-slate-600 font-medium">{item.name}</span>
                          <span className="ml-auto font-black text-slate-800">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <p className="text-sm text-slate-400 text-center w-full">Belum ada data kategori</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* OLAP & SOLAP ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* OLAP 3D CUBE SLICE & DICE */}
        {analytics?.cube && (
          <Card className="border-none shadow-md rounded-2xl bg-white">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-700">
                  <Layers3 size={16} className="text-indigo-500" /> OLAP Cube — Slice & Dice
                </CardTitle>
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-sm">
                  {(['tahun', 'armada', 'kategori'] as CubeSlice[]).map(s => (
                    <button key={s} onClick={() => setCubeSlice(s)}
                      className={`rounded-md px-3 py-1.5 text-[10px] sm:text-xs font-bold capitalize transition-all ${cubeSlice === s ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
                      {s === 'tahun' ? 'Waktu' : s === 'armada' ? 'Armada' : 'Layanan'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-1">Aggregasi jumlah layanan berdasarkan dimensi <strong className="text-indigo-600">{cubeSlice}</strong></p>
            </CardHeader>
            <CardContent>
              <div className="h-[240px]">
                {cubeAgg.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cubeAgg} layout="vertical" barSize={18}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={140} axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} animationDuration={800} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-slate-400 text-center pt-20">Data cube kosong</p>}
              </div>
            </CardContent>
          </Card>
        )}

        {/* SOLAP Spatial Drill-Down */}
        {analytics?.spatial && analytics.spatial.length > 0 && (
          <Card className="border-none shadow-md rounded-2xl bg-white">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-700">
                <MapPin size={16} className="text-emerald-500" /> SOLAP — Spatial Drill-Down
              </CardTitle>
              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-sm">
                <button onClick={() => setSpatialLevel('kabupaten')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${spatialLevel === 'kabupaten' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}>
                  Kabupaten
                </button>
                <button onClick={() => setSpatialLevel('kecamatan')}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all ${spatialLevel === 'kecamatan' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500'}`}>
                  Kecamatan
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Distribusi layanan ambulans per wilayah (level: <strong className="text-emerald-600">{spatialLevel}</strong>)</p>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={spatialAgg} layout="vertical" barSize={16}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" width={160} axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 10, fontWeight: 700 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      {/* CORE PATHWAYS & QUICK LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <h2 className="font-black uppercase text-xs tracking-[0.15em] text-slate-500">External Services</h2>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-emerald-500 transition-all shadow-sm group">
            <div className="flex gap-3 items-start flex-col sm:flex-row">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <HandHeart size={22} />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">Fakta Layanan Pasien</h3>
                <p className="text-slate-500 text-[11px] leading-relaxed">Data interaksi eksternal mencakup pasien, status ekonomi, dan geolokasi.</p>
                <div className="pt-2 flex flex-col gap-2">
                  <Link href="/ambulan/monitoring">
                    <Button className="w-full bg-slate-800 text-white font-bold text-[10px] tracking-widest hover:bg-slate-700 shadow-md h-9 rounded-xl">Buka Monitoring</Button>
                  </Link>
                  <Link href="/ambulan/layanan">
                    <Button variant="outline" className="w-full border-2 border-emerald-600 text-emerald-600 font-bold text-[10px] tracking-widest hover:bg-emerald-50 h-9 rounded-xl">Catat Layanan Baru</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
            <h2 className="font-black uppercase text-xs tracking-[0.15em] text-slate-500">Internal Operational</h2>
          </div>
          <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 hover:border-rose-500 transition-all shadow-sm group">
            <div className="flex gap-3 items-start flex-col sm:flex-row">
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <Activity size={22} />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors">Log Biaya & Aktivitas</h3>
                <p className="text-slate-500 text-[11px] leading-relaxed">Pencatatan beban operasional armada: BBM, servis, ganti oli, pemeliharaan.</p>
                <div className="pt-2 flex flex-col gap-2">
                  <Link href="/ambulan/riwayat">
                    <Button className="w-full bg-slate-800 text-white font-bold text-[10px] tracking-widest hover:bg-slate-700 shadow-md h-9 rounded-xl">Cek Riwayat Biaya</Button>
                  </Link>
                  <Link href="/ambulan/aktivitas">
                    <Button variant="outline" className="w-full border-2 border-rose-600 text-rose-600 font-bold text-[10px] tracking-widest hover:bg-rose-50 h-9 rounded-xl">Catat Biaya Internal</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
            <h2 className="font-black uppercase text-xs tracking-[0.15em] text-slate-500">Live Tracker</h2>
          </div>
          <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden flex flex-col h-full lg:max-h-[240px]">
            <CardHeader className="border-b border-slate-100 py-3 bg-slate-50/50 px-4">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
                <History size={14} className="text-indigo-500" /> Log Aktivitas Terakhir
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-y-auto custom-scrollbar flex-1">
              <div className="divide-y divide-slate-100">
            {loading && (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <Loader2 size={22} className="text-slate-300 animate-spin" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat log...</p>
              </div>
            )}
            {!loading && !stats?.recentLogs?.length && (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <div className="bg-slate-50 p-3 rounded-full"><Activity size={22} className="text-slate-300" /></div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada aktivitas</p>
              </div>
            )}
            {stats?.recentLogs?.slice(0, 5).map((log: any, i: number) => (
              <div key={i} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${log.biaya_operasional ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {log.biaya_operasional ? <DollarSign size={16} /> : <Truck size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-black text-slate-900 uppercase truncate">{log.id_transaksi}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase shrink-0">
                      {log.armada?.includes('1') ? 'AMB-1' : 'AMB-2'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 truncate">
                    {log.kategori_aktivitas?.replace(/_/g, ' ')}
                    {log.biaya_operasional > 0 && (
                      <span className="text-rose-600 ml-2">• Rp {Number(log.biaya_operasional).toLocaleString('id-ID')}</span>
                    )}
                  </p>
                </div>
                <ArrowRight size={15} className="text-slate-300 shrink-0" />
              </div>
            ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}