'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { BarChart2, TrendingUp } from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'
import { type FilterState, type ProgramFilter, PROGRAM_FILTER_DEFAULT, buildQueryParams, appendProgramParams, getFilterLabel, getProgramLabel } from '@/components/donasi/FilterBar'

type ChartType = 'area' | 'bar'

interface TrendItem {
  label: string
  total: number
}

interface TrendChartProps {
  appliedFilter: FilterState
  programFilter?: ProgramFilter
}

export default function TrendChart({ appliedFilter, programFilter = PROGRAM_FILTER_DEFAULT }: TrendChartProps) {
  const [chartType, setChartType] = useState<ChartType>('area')
  const [chartData, setChartData] = useState<TrendItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTrend = async () => {
      setLoading(true)
      setError(null)
      try {
        const params = appendProgramParams(buildQueryParams(appliedFilter), programFilter)
        const res = await fetch(`/api/donasi/tren?${params.toString()}`)
        if (!res.ok) throw new Error('Gagal memuat data tren')
        setChartData(await res.json())
      } catch (err: any) {
        setError(err?.message ?? 'Terjadi kesalahan')
        setChartData([])
      } finally {
        setLoading(false)
      }
    }
    fetchTrend()
  }, [appliedFilter, programFilter?.program])

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-4 space-y-0 pb-7">
        <div>
          <CardTitle className="text-lg sm:text-xl font-bold text-slate-800">Grafik Penghimpunan Dana</CardTitle>
          <CardDescription>Visualisasi pertumbuhan donasi Ziswaf dari waktu ke waktu</CardDescription>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{getFilterLabel(appliedFilter)}</span>
            {getProgramLabel(programFilter) && (
              <span className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">📂 {getProgramLabel(programFilter)}</span>
            )}
          </div>
        </div>

        {/* Toggle area / bar */}
        <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-sm">
          {(['area', 'bar'] as ChartType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setChartType(type)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all ${
                chartType === type
                  ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {type === 'area'
                ? <TrendingUp className="h-3.5 w-3.5" />
                : <BarChart2 className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline capitalize">{type}</span>
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        <div className="h-[300px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Memuat grafik...</div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-rose-600">{error}</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Tidak ada data untuk filter yang dipilih</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}jt`} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(v: any) => [formatRupiah(Number(v)), 'Total Donasi']}
                  />
                  <Area type="monotone" dataKey="total" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" animationDuration={1500} />
                </AreaChart>
              ) : (
                <BarChart data={chartData} barSize={chartData.length > 20 ? 10 : chartData.length > 10 ? 18 : 32}>
                  <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}jt`} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    cursor={{ fill: '#f0fdf4', radius: 4 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(v: any) => [formatRupiah(Number(v)), 'Total Donasi']}
                  />
                  <Bar dataKey="total" fill="url(#colorBar)" radius={[6, 6, 0, 0]} animationDuration={1200} />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}