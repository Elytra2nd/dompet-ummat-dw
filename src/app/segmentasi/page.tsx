'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BrainCircuit,
  Users,
  Crown,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Star,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'
import { SegmentCard } from '@/components/segmentasi/SegmentCard'
import { useSegmentasi } from '@/contexts/SegmentasiContext'

// Warna untuk pie chart sesuai segment order
const SEGMENT_COLORS: Record<string, string> = {
  champions: '#059669',
  loyal: '#2563eb',
  potential: '#0d9488',
  new_donors: '#4f46e5',
  promising: '#0891b2',
  need_attention: '#d97706',
  at_risk: '#ea580c',
  hibernating: '#64748b',
  lost: '#dc2626',
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-4 w-4 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`}
        />
      ))}
    </div>
  )
}

export default function SegmentasiPage() {
  const { data, loading, error, runAnalysis } = useSegmentasi()

  // Auto-run on mount (uses cache if available)
  useEffect(() => {
    runAnalysis()
  }, [])

  // Hitung KPI dari segments
  const premiumCount = data?.segments
    .filter(s => ['champions', 'loyal'].includes(s.key))
    .reduce((sum, s) => sum + s.count, 0) || 0

  const riskCount = data?.segments
    .filter(s => ['at_risk', 'hibernating', 'lost'].includes(s.key))
    .reduce((sum, s) => sum + s.count, 0) || 0

  // Pie chart data
  const pieData = data?.segments.map(s => ({
    name: s.label,
    value: s.count,
    color: SEGMENT_COLORS[s.key] || '#94a3b8',
  })) || []

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* Header */}
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                {data && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                    {data.clustering.rating.label}
                  </span>
                )}
                {data?.timestamp && (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {new Date(data.timestamp).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </span>
                )}
              </div>
              <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900">
                <BrainCircuit className="h-8 w-8 text-emerald-600" />
                Segmentasi <span className="text-emerald-600">Donatur</span>
              </h1>
              <p className="mt-1 max-w-xl font-medium text-slate-500">
                Pengelompokan donatur berdasarkan perilaku donasi untuk optimalisasi strategi fundraising.
              </p>
            </div>

            <Button
              onClick={() => runAnalysis(true)}
              disabled={loading}
              className="bg-emerald-600 font-bold shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              {loading ? 'Menganalisis...' : 'Perbarui Analisis'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-8">
        {/* Error */}
        {error && (
          <Card className="border-2 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <p className="text-sm font-bold text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Loading */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center gap-4 py-20">
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
            <p className="text-sm font-bold text-slate-500">Menjalankan analisis segmentasi...</p>
            <p className="text-xs text-slate-400">Menghitung RFM, normalisasi, dan clustering</p>
          </div>
        )}

        {/* Results */}
        {data && (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              {/* Total Donatur */}
              <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg">
                <div className="absolute right-[-10px] top-[-10px] opacity-10">
                  <Users size={100} />
                </div>
                <CardContent className="relative z-10 p-6">
                  <p className="text-sm font-bold uppercase tracking-tight opacity-90">Total Donatur</p>
                  <h3 className="mt-2 text-3xl font-black">{data.total_donatur.toLocaleString()}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase opacity-70">donatur aktif teranalisis</p>
                </CardContent>
              </Card>

              {/* Donatur Premium */}
              <Card className="border-2 border-emerald-100 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold uppercase tracking-tighter text-slate-500">Donatur Premium</p>
                    <div className="rounded-lg bg-emerald-50 p-2"><Crown className="h-4 w-4 text-emerald-600" /></div>
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-slate-900">{premiumCount.toLocaleString()}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase text-emerald-600">
                    Champions + Setia
                  </p>
                </CardContent>
              </Card>

              {/* Donatur Berisiko */}
              <Card className="border-2 border-orange-100 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold uppercase tracking-tighter text-slate-500">Perlu Perhatian</p>
                    <div className="rounded-lg bg-orange-50 p-2"><AlertTriangle className="h-4 w-4 text-orange-600" /></div>
                  </div>
                  <h3 className="mt-4 text-2xl font-black text-slate-900">{riskCount.toLocaleString()}</h3>
                  <p className="mt-1 text-[10px] font-bold uppercase text-orange-600">
                    Berisiko + Tidak Aktif + Hilang
                  </p>
                </CardContent>
              </Card>

              {/* Kualitas */}
              <Card className="border-2 border-amber-100 bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold uppercase tracking-tighter text-slate-500">Kualitas Analisis</p>
                    <div className="rounded-lg bg-amber-50 p-2"><Star className="h-4 w-4 text-amber-600" /></div>
                  </div>
                  <div className="mt-4">
                    <StarRating stars={data.clustering.rating.stars} />
                    <p className="mt-1 text-[10px] font-bold uppercase text-amber-600">
                      {data.clustering.rating.label}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>



            {/* Donut Chart + Segment Cards */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Donut Chart */}
              <Card className="border-2 bg-white shadow-sm lg:col-span-1">
                <CardHeader className="border-b bg-slate-50/50 py-4">
                  <CardTitle className="flex items-center gap-2 text-sm font-black text-slate-700">
                    <BrainCircuit className="h-4 w-4 text-emerald-500" />
                    Komposisi Segmen
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          dataKey="value"
                          strokeWidth={2}
                          stroke="#fff"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                          formatter={(value: any, name: string | number | undefined) => [`${value} donatur`, String(name ?? '')]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="mt-2 space-y-1.5">
                    {data.segments.map(s => (
                      <div key={s.key} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: SEGMENT_COLORS[s.key] }}
                          />
                          <span className="font-semibold text-slate-600">{s.label}</span>
                        </div>
                        <span className="font-black text-slate-800">{s.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Segment Cards Grid */}
              <div className="lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-black text-slate-800">
                    <Users className="h-5 w-5 text-emerald-500" />
                    Segmen Donatur
                  </h2>
                  <Link href="/segmentasi/perbandingan">
                    <Button variant="ghost" className="text-[10px] font-black uppercase text-slate-400 hover:text-emerald-600">
                      Lihat Perbandingan <ArrowRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {data.segments.map(segment => (
                    <SegmentCard key={segment.key} segment={segment} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
