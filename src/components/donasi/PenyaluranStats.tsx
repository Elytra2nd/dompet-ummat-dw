'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowUpRight,
  Calendar,
  Filter,
  X,
  BarChart2,
  TrendingUp,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'
import { toast } from 'sonner'

type FilterType = 'none' | 'year' | 'month' | 'day'
type ChartType = 'area' | 'bar'

interface TrendItem {
  label: string
  year: string
  month: string | null
  monthValue: string | null
  day: string | null
  date: string | null
  total: number
}

interface FilterState {
  filterType: FilterType
  startYear: string
  endYear: string
  startMonth: string
  endMonth: string
  startDate: string
  endDate: string
}

function buildDefaultFilter(): FilterState {
  return {
    filterType: 'none',
    startYear: '',
    endYear: '',
    startMonth: '',
    endMonth: '',
    startDate: '',
    endDate: '',
  }
}

function getFilterLabel(filter: FilterState) {
  if (filter.filterType === 'none') return 'Semua Tahun'
  if (filter.filterType === 'year') return `${filter.startYear} - ${filter.endYear}`
  if (filter.filterType === 'month') return `${filter.startMonth} s.d. ${filter.endMonth}`
  return `${filter.startDate} s.d. ${filter.endDate}`
}

interface PenyaluranStatsProps {
  totalDana: number
  totalTransaksi: number
}

export default function PenyaluranStats({ totalDana = 0, totalTransaksi = 0 }: PenyaluranStatsProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [chartType, setChartType] = useState<ChartType>('area')

  const [availableYears, setAvailableYears] = useState<string[]>([])

  const [draftFilter, setDraftFilter] = useState<FilterState>(buildDefaultFilter())
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(buildDefaultFilter())

  const [chartData, setChartData] = useState<TrendItem[]>([])
  const [loadingChart, setLoadingChart] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Reuse the same tahun API since it lists available years
  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch('/api/donasi/tahun')
        if (!res.ok) throw new Error('Gagal memuat daftar tahun')
        const data = await res.json()
        const years = Array.isArray(data) ? data : data.years ?? []
        setAvailableYears(years)
      } catch (error) {
        console.error('Gagal memuat tahun:', error)
      }
    }
    fetchYears()
  }, [])

  useEffect(() => {
    if (!appliedFilter.filterType) return

    const fetchTrend = async () => {
      setLoadingChart(true)
      setChartError(null)

      try {
        const params = new URLSearchParams()
        params.set('filterType', appliedFilter.filterType)

        if (appliedFilter.filterType === 'year') {
          params.set('startYear', appliedFilter.startYear)
          params.set('endYear', appliedFilter.endYear)
        }
        if (appliedFilter.filterType === 'month') {
          params.set('startMonth', appliedFilter.startMonth)
          params.set('endMonth', appliedFilter.endMonth)
        }
        if (appliedFilter.filterType === 'day') {
          params.set('startDate', appliedFilter.startDate)
          params.set('endDate', appliedFilter.endDate)
        }

        const res = await fetch(`/api/donasi/keluar/tren?${params.toString()}`)
        if (!res.ok) throw new Error('Gagal memuat data tren')

        const data: TrendItem[] = await res.json()
        setChartData(data)
      } catch (error: any) {
        console.error(error)
        setChartError(error?.message ?? 'Terjadi kesalahan saat memuat grafik')
        setChartData([])
      } finally {
        setLoadingChart(false)
      }
    }

    fetchTrend()
  }, [appliedFilter])

  const activeFilterLabel = useMemo(() => getFilterLabel(appliedFilter), [appliedFilter])

  const handleApplyFilter = () => {
    if (draftFilter.filterType === 'year' && (!draftFilter.startYear || !draftFilter.endYear)) {
      toast.error('Pilih tahun awal dan tahun akhir terlebih dahulu')
      return
    }
    if (draftFilter.filterType === 'month' && (!draftFilter.startMonth || !draftFilter.endMonth)) {
      toast.error('Pilih bulan awal dan bulan akhir terlebih dahulu')
      return
    }
    if (draftFilter.filterType === 'day' && (!draftFilter.startDate || !draftFilter.endDate)) {
      toast.error('Pilih tanggal awal dan tanggal akhir terlebih dahulu')
      return
    }
    setAppliedFilter({ ...draftFilter })
    setIsFilterOpen(false)
  }

  const handleResetFilter = () => {
    const resetFilter = buildDefaultFilter()
    setDraftFilter(resetFilter)
    setAppliedFilter(resetFilter)
    setIsFilterOpen(false)
  }

  if (!isMounted) {
    return <div className="p-10 text-center font-sans">Memuat...</div>
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-xl">
          <div className="absolute top-[-10px] right-[-10px] opacity-10">
            <ArrowUpRight size={100} />
          </div>
          <CardContent className="relative z-10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Total Tersalurkan</p>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="mt-3 overflow-hidden">
              <h3 className="text-sm sm:text-base md:text-lg font-bold leading-tight break-all">
                {formatRupiah(totalDana)}
              </h3>
              <div className="mt-1 inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white/20 text-white/80">
                Realisasi Penyaluran
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl">
          <CardContent className="relative z-10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Jumlah Transaksi</p>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                <BarChart2 className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-base sm:text-lg md:text-xl font-bold truncate">
                {totalTransaksi.toLocaleString()}
                <span className="text-[10px] ml-1 text-white/70">Record</span>
              </h3>
              <div className="mt-1 inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-white/20 text-white/80">
                Fact Penyaluran
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart Card */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-7">
          <div>
            <CardTitle className="text-xl font-bold text-slate-800">Grafik Penyaluran Dana</CardTitle>
            <CardDescription>Visualisasi distribusi penyaluran ZISWAF dari waktu ke waktu</CardDescription>
            <div className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              {activeFilterLabel}
            </div>
          </div>

          <div className="relative flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setChartType('area')}
                title="Area Chart"
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all ${
                  chartType === 'area'
                    ? 'bg-white text-amber-700 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Area</span>
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                title="Bar Chart"
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold transition-all ${
                  chartType === 'bar'
                    ? 'bg-white text-amber-700 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BarChart2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Bar</span>
              </button>
            </div>

            {/* Filter Button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>

            {appliedFilter.filterType !== 'none' && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
              >
                <X className="h-4 w-4" />
                Reset
              </button>
            )}

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute right-0 top-12 z-20 w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-bold text-slate-800">Filter Waktu</p>
                </div>

                <div className="space-y-3">
                  {(['none', 'year', 'month', 'day'] as FilterType[]).map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="radio"
                        name="filterType"
                        checked={draftFilter.filterType === type}
                        onChange={() => setDraftFilter((prev) => ({ ...prev, filterType: type }))}
                      />
                      {type === 'none' ? 'Tanpa Range' : type === 'year' ? 'Range Tahun' : type === 'month' ? 'Range Bulan' : 'Range Hari'}
                    </label>
                  ))}
                </div>

                {draftFilter.filterType === 'year' && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Tahun Awal</label>
                      <select
                        value={draftFilter.startYear}
                        onChange={(e) => setDraftFilter((prev) => ({ ...prev, startYear: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">Pilih</option>
                        {availableYears.map((year) => (
                          <option key={`start-${year}`} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Tahun Akhir</label>
                      <select
                        value={draftFilter.endYear}
                        onChange={(e) => setDraftFilter((prev) => ({ ...prev, endYear: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">Pilih</option>
                        {availableYears.map((year) => (
                          <option key={`end-${year}`} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {draftFilter.filterType === 'month' && (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Bulan Awal</label>
                      <input type="month" value={draftFilter.startMonth} onChange={(e) => setDraftFilter((prev) => ({ ...prev, startMonth: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Bulan Akhir</label>
                      <input type="month" value={draftFilter.endMonth} onChange={(e) => setDraftFilter((prev) => ({ ...prev, endMonth: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}

                {draftFilter.filterType === 'day' && (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Tanggal Awal</label>
                      <input type="date" value={draftFilter.startDate} onChange={(e) => setDraftFilter((prev) => ({ ...prev, startDate: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Tanggal Akhir</label>
                      <input type="date" value={draftFilter.endDate} onChange={(e) => setDraftFilter((prev) => ({ ...prev, endDate: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button type="button" onClick={handleResetFilter} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Reset</button>
                  <button type="button" onClick={handleApplyFilter} className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white hover:bg-amber-700">Terapkan</button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-[350px] w-full">
            {loadingChart ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Memuat grafik...</div>
            ) : chartError ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-rose-600">{chartError}</div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Tidak ada data untuk filter yang dipilih</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorTotalKeluar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d97706" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}jt`} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Dana Tersalur']}
                    />
                    <Area type="monotone" dataKey="total" stroke="#d97706" strokeWidth={3} fillOpacity={1} fill="url(#colorTotalKeluar)" animationDuration={1500} />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} barSize={chartData.length > 20 ? 10 : chartData.length > 10 ? 18 : 32}>
                    <defs>
                      <linearGradient id="colorBarKeluar" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d97706" stopOpacity={1} />
                        <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000000}jt`} tick={{ fill: '#64748b', fontSize: 12 }} />
                    <Tooltip
                      cursor={{ fill: '#fffbeb', radius: 4 }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [formatRupiah(Number(value)), 'Dana Tersalur']}
                    />
                    <Bar dataKey="total" fill="url(#colorBarKeluar)" radius={[6, 6, 0, 0]} animationDuration={1200} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
