'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Filter,
  HandCoins,
  HeartHandshake,
  PieChart,
  UserCheck,
  Users,
  X,
  Zap,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

type FilterType = 'none' | 'year' | 'month' | 'day'
type Grain = 'year' | 'month' | 'day'

interface DonationStatsProps {
  totalDonasi: number
  jumlahDonatur: number
  jumlahMustahik: number
  danaTersalur: number
  pertumbuhan: number
}

interface TrendItem {
  label: string
  year: string
  month: string | null
  monthValue: string | null
  day: string | null
  date: string | null
  total: number
}

interface YearResponse {
  years: string[]
  minYear: string | null
  maxYear: string | null
}

interface FilterState {
  filterType: FilterType
  grain: Grain
  startYear: string
  endYear: string
  startMonth: string
  endMonth: string
  startDate: string
  endDate: string
}

function buildDefaultFilter(minYear?: string | null, maxYear?: string | null): FilterState {
  return {
    filterType: 'none',
    grain: 'year',
    startYear: minYear ?? '',
    endYear: maxYear ?? '',
    startMonth: '',
    endMonth: '',
    startDate: '',
    endDate: '',
  }
}

function normalizeFilter(filter: FilterState): FilterState {
  if (filter.filterType === 'none') {
    return {
      ...filter,
      grain: 'year',
    }
  }

  if (filter.filterType === 'year') {
    return {
      ...filter,
      grain: 'year',
    }
  }

  if (filter.filterType === 'month') {
    return {
      ...filter,
      grain: 'month',
    }
  }

  return {
    ...filter,
    grain: 'day',
  }
}

function getFilterLabel(filter: FilterState) {
  if (filter.filterType === 'none') return 'Semua Tahun'
  if (filter.filterType === 'year') return `${filter.startYear} - ${filter.endYear}`
  if (filter.filterType === 'month') return `${filter.startMonth} s.d. ${filter.endMonth}`
  return `${filter.startDate} s.d. ${filter.endDate}`
}

export default function DonationStats({
  totalDonasi = 0,
  jumlahDonatur = 0,
  jumlahMustahik = 0,
  pertumbuhan = 0,
  danaTersalur = 0,
}: DonationStatsProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [minYear, setMinYear] = useState<string | null>(null)
  const [maxYear, setMaxYear] = useState<string | null>(null)

  const [draftFilter, setDraftFilter] = useState<FilterState>(buildDefaultFilter())
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(buildDefaultFilter())

  const [chartData, setChartData] = useState<TrendItem[]>([])
  const [loadingChart, setLoadingChart] = useState(false)
  const [chartError, setChartError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch('/api/donasi/tahun')
        if (!res.ok) throw new Error('Gagal memuat daftar tahun')

        const data = await res.json()

        const years = Array.isArray(data) ? data : data.years ?? []
        const min = Array.isArray(data) ? data[0] ?? null : data.minYear ?? null
        const max = Array.isArray(data) ? data[data.length - 1] ?? null : data.maxYear ?? null

        setAvailableYears(years)
        setMinYear(min)
        setMaxYear(max)

        const initialFilter = buildDefaultFilter(min, max)
        setDraftFilter(initialFilter)
        setAppliedFilter(initialFilter)
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
        params.set('grain', appliedFilter.grain)

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

        const res = await fetch(`/api/donasi/tren?${params.toString()}`)
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

  const isPositive = pertumbuhan >= 0

  const persentasePenyaluran =
    totalDonasi > 0 ? (danaTersalur / totalDonasi) * 100 : 0

  const activeFilterLabel = useMemo(() => {
    return getFilterLabel(appliedFilter)
  }, [appliedFilter])

  const handleFilterTypeChange = (value: FilterType) => {
    setDraftFilter((prev) =>
      normalizeFilter({
        ...prev,
        filterType: value,
      })
    )
  }

  const handleApplyFilter = () => {
    const normalized = normalizeFilter(draftFilter)

    if (normalized.filterType === 'year') {
      if (!normalized.startYear || !normalized.endYear) {
        alert('Pilih tahun awal dan tahun akhir terlebih dahulu')
        return
      }
    }

    if (normalized.filterType === 'month') {
      if (!normalized.startMonth || !normalized.endMonth) {
        alert('Pilih bulan awal dan bulan akhir terlebih dahulu')
        return
      }
    }

    if (normalized.filterType === 'day') {
      if (!normalized.startDate || !normalized.endDate) {
        alert('Pilih tanggal awal dan tanggal akhir terlebih dahulu')
        return
      }
    }

    setAppliedFilter(normalized)
    setIsFilterOpen(false)
  }

  const handleResetFilter = () => {
    const resetFilter = buildDefaultFilter(minYear, maxYear)
    setDraftFilter(resetFilter)
    setAppliedFilter(resetFilter)
    setIsFilterOpen(false)
  }

  if (!isMounted) {
    return <div className="p-10 text-center font-sans">Memuat Dashboard...</div>
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="col-span-2 lg:col-span-1 relative overflow-hidden border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl">
          <div className="absolute top-[-10px] right-[-10px] opacity-10">
            <HeartHandshake size={100} />
          </div>
          <CardContent className="relative z-10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-wider">
                Total ZISWAF
              </p>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              </div>
            </div>
            <div className="mt-3 overflow-hidden">
              <h3 className="text-sm sm:text-base md:text-lg font-black leading-tight break-all">
                {formatRupiah(totalDonasi)}
              </h3>

              <div
                className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isPositive
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                  }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(pertumbuhan)}%
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xl">
          <div className="absolute top-[-10px] right-[-10px] opacity-10">
            <HandCoins size={100} />
          </div>

          <CardContent className="relative z-10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">
                Tersalurkan
              </p>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                <HandCoins className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="mt-3 overflow-hidden">
              <h3 className="text-sm sm:text-base md:text-lg font-black leading-tight break-all">
                {formatRupiah(danaTersalur)}
              </h3>

              <div className="mt-1 inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-white/20 text-white/80">
                Realisasi Manfaat
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xl">
          <div className="absolute top-[-10px] right-[-10px] opacity-10">
            <PieChart size={100} />
          </div>

          <CardContent className="relative z-10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">
                Absorpsi
              </p>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                <PieChart className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="mt-3">
              <div className="mt-3 flex items-center gap-2">
                <h3 className="text-sm sm:text-base md:text-lg font-black">
                  {persentasePenyaluran.toFixed(1)}%
                </h3>

                <div className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-white/20 text-white/80">
                  Tingkat Penyaluran
                </div>
              </div>

              <div className="mt-2 h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(persentasePenyaluran, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl">
          <div className="absolute top-[-10px] right-[-10px] opacity-10">
            <Users size={100} />
          </div>

          <CardContent className="relative z-10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">
                Muzakki
              </p>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                <Users className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-base sm:text-lg md:text-xl font-black truncate">
                {jumlahDonatur.toLocaleString()}
                <span className="text-[10px] ml-1 text-white/70">Jiwa</span>
              </h3>

              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-white/20 text-white/80">
                <span className="h-1 w-1 rounded-full bg-white animate-ping" />
                Aktif
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl">
          <div className="absolute top-[-10px] right-[-10px] opacity-10">
            <UserCheck size={100} />
          </div>

          <CardContent className="relative z-10 p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-white/70 uppercase tracking-wider">
                Mustahik
              </p>
              <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
                <UserCheck className="h-4 w-4 text-white" />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-base sm:text-lg md:text-xl font-black truncate">
                {jumlahMustahik.toLocaleString()}
                <span className="text-[10px] ml-1 text-white/70">Jiwa</span>
              </h3>

              <div className="mt-1 inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-white/20 text-white/80">
                Penerima
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-7">
          <div>
            <CardTitle className="text-xl font-black text-slate-800">
              Grafik Penghimpunan Dana
            </CardTitle>
            <CardDescription>
              Visualisasi pertumbuhan donasi Ziswaf dari waktu ke waktu
            </CardDescription>
            <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
              {activeFilterLabel}
            </div>
          </div>

          <div className="relative flex items-center gap-2">
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

            {isFilterOpen && (
              <div className="absolute right-0 top-12 z-20 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <p className="text-sm font-black text-slate-800">Filter Waktu</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="filterType"
                      checked={draftFilter.filterType === 'none'}
                      onChange={() => handleFilterTypeChange('none')}
                    />
                    Tanpa Range
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="filterType"
                      checked={draftFilter.filterType === 'year'}
                      onChange={() => handleFilterTypeChange('year')}
                    />
                    Range Tahun
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="filterType"
                      checked={draftFilter.filterType === 'month'}
                      onChange={() => handleFilterTypeChange('month')}
                    />
                    Range Bulan
                  </label>

                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="radio"
                      name="filterType"
                      checked={draftFilter.filterType === 'day'}
                      onChange={() => handleFilterTypeChange('day')}
                    />
                    Range Hari
                  </label>
                </div>

                {draftFilter.filterType === 'year' && (
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                        Tahun Awal
                      </label>
                      <select
                        value={draftFilter.startYear}
                        onChange={(e) =>
                          setDraftFilter((prev) => ({ ...prev, startYear: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">Pilih</option>
                        {availableYears.map((year) => (
                          <option key={`start-${year}`} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                        Tahun Akhir
                      </label>
                      <select
                        value={draftFilter.endYear}
                        onChange={(e) =>
                          setDraftFilter((prev) => ({ ...prev, endYear: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      >
                        <option value="">Pilih</option>
                        {availableYears.map((year) => (
                          <option key={`end-${year}`} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {draftFilter.filterType === 'month' && (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                        Bulan Awal
                      </label>
                      <input
                        type="month"
                        value={draftFilter.startMonth}
                        onChange={(e) =>
                          setDraftFilter((prev) => ({ ...prev, startMonth: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                        Bulan Akhir
                      </label>
                      <input
                        type="month"
                        value={draftFilter.endMonth}
                        onChange={(e) =>
                          setDraftFilter((prev) => ({ ...prev, endMonth: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                {draftFilter.filterType === 'day' && (
                  <div className="mt-4 grid grid-cols-1 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                        Tanggal Awal
                      </label>
                      <input
                        type="date"
                        value={draftFilter.startDate}
                        onChange={(e) =>
                          setDraftFilter((prev) => ({ ...prev, startDate: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                        Tanggal Akhir
                      </label>
                      <input
                        type="date"
                        value={draftFilter.endDate}
                        onChange={(e) =>
                          setDraftFilter((prev) => ({ ...prev, endDate: e.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleResetFilter}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyFilter}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                  >
                    Terapkan
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-[350px] w-full">
            {loadingChart ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                Memuat grafik...
              </div>
            ) : chartError ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-rose-600">
                {chartError}
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
                Tidak ada data untuk filter yang dipilih
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    dy={10}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${value / 1000000}jt`}
                    tick={{ fill: '#64748b', fontSize: 12 }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    }}
                    formatter={(value: any) => [formatRupiah(Number(value)), 'Total Donasi']}
                  />

                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#059669"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}