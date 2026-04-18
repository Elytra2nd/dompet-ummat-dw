'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts'
import {
  Users,
  ArrowUpRight,
  ArrowDownRight,
  HeartHandshake,
  Zap,
  HandCoins,
  PieChart,
  Calendar,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

interface DonationStatsProps {
  totalDonasi: number
  jumlahDonatur: number
  jumlahMustahik: number
  dana_tersalur: number
  pertumbuhan: number
}

interface TrendItem {
  month: string
  year: string
  total: number
}

export default function DonationDashboard({
  totalDonasi = 0,
  jumlahDonatur = 0,
  jumlahMustahik = 0,
  pertumbuhan = 0,
  dana_tersalur = 0,
}: DonationStatsProps) {
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [filterYear, setFilterYear] = useState('2024')
  const [chartData, setChartData] = useState<TrendItem[]>([])
  const [loadingChart, setLoadingChart] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch('/api/donasi/tahun', { cache: 'no-store' })

        if (!res.ok) {
          throw new Error('Gagal mengambil daftar tahun')
        }

        const years = await res.json()
        setAvailableYears(years)

        if (years.length > 0 && !years.includes(filterYear)) {
          setFilterYear(years[0])
        }
      } catch (error) {
        console.error(error)
        setAvailableYears([])
      }
    }

    fetchYears()
  }, [])

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        setLoadingChart(true)
        const res = await fetch(`/api/donasi/tren?year=${filterYear}`, {
          cache: 'no-store',
        })

        if (!res.ok) {
          throw new Error('Gagal mengambil data tren')
        }

        const data = await res.json()
        setChartData(data)
      } catch (error) {
        console.error(error)
        setChartData([])
      } finally {
        setLoadingChart(false)
      }
    }

    if (isMounted) {
      fetchTrend()
    }
  }, [filterYear, isMounted])

  const isPositive = pertumbuhan >= 0
  const persentasePenyaluran =
    totalDonasi > 0 ? (dana_tersalur / totalDonasi) * 100 : 0

  const validYears = availableYears.filter((year) => {
    const y = Number(year)
    const currentYear = new Date().getFullYear()
    return Number.isInteger(y) && y >= 2011 && y <= currentYear
  })

  return (
    <div className="space-y-6 font-sans">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg">
          <div className="absolute top-[-10px] right-[-10px] opacity-10">
            <HeartHandshake size={100} />
          </div>
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold tracking-tight uppercase opacity-90">Total Dana ZISWAF</p>
              <div className="rounded-lg bg-white/20 p-2 backdrop-blur-sm">
                <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black tracking-tight">
                {formatRupiah(totalDonasi)}
              </h3>
              <p className="mt-2 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
                {isPositive ? (
                  <ArrowUpRight className="h-3 w-3 text-emerald-300" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-rose-300" />
                )}
                <span className={isPositive ? 'text-emerald-300' : 'text-rose-300'}>
                  {Math.abs(pertumbuhan)}%
                </span>
                Efektivitas Fundraising
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: DANA TERSALUR */}
        <Card className="border-2 border-orange-100 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold tracking-tighter text-slate-500 uppercase">
                Dana Tersalurkan
              </p>
              <div className="rounded-lg bg-orange-50 p-2">
                <HandCoins className="h-4 w-4 text-orange-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">
                {formatRupiah(dana_tersalur)}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-orange-600 uppercase">
                <span className="inline-flex h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                Realisasi Manfaat
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CARD 3 (TENGAH): PERSENTASE PENYALURAN (RASIO PENYALURAN/PENGHIMPUNAN) */}
        <Card className="border-2 border-sky-100 bg-sky-50/30 shadow-sm border-dashed">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold tracking-tighter text-sky-700 uppercase">
                Rasio Penyaluran
              </p>
              <div className="rounded-lg bg-sky-100 p-2">
                <PieChart className="h-4 w-4 text-sky-600" />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-black text-sky-900">
                  {persentasePenyaluran.toFixed(2)}%
                </h3>
                <p className="mb-1 text-[9px] font-bold text-sky-600/70 uppercase">
                  Absorpsi Dana
                </p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-sky-200/50">
                <div
                  className="h-full bg-sky-500 transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(persentasePenyaluran, 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 4: MUZAKKI & MUNFIQ */}
        <Card className="border-2 border-emerald-100 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold tracking-tighter text-slate-500 uppercase">
                Total Muzakki
              </p>
              <div className="rounded-lg bg-emerald-50 p-2">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">
                {jumlahDonatur.toLocaleString()} <span className="text-sm font-medium text-slate-400">Jiwa</span>
              </h3>
              <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                Basis Data Munfiq Aktif
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CARD 5: PROGRESS TARGET BULANAN */}
        <Card className="border-2 border-emerald-100 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase tracking-tighter text-slate-500">
                Total Mustahik
              </p>

              <div className="rounded-lg bg-indigo-50 p-2">
                <Users className="h-4 w-4 text-indigo-600" />
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-black text-slate-900">
                {jumlahMustahik.toLocaleString()}
                <span className="ml-1 text-sm font-medium text-slate-400">
                  Jiwa
                </span>
              </h3>

              <p className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase text-indigo-600">
                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-500"></span>
                Penerima Bantuan
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div>
            <CardTitle className="text-xl font-black text-slate-800">
              Tren Penghimpunan Dana
            </CardTitle>
            <CardDescription>
              Visualisasi pertumbuhan donasi bulanan
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="w-[120px] font-bold">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                {validYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    Tahun {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          <div className="h-[350px] w-full">
            {!isMounted || loadingChart ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Memuat data grafik...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Belum ada data donasi untuk tahun {filterYear}
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
                    dataKey="month"
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
                    formatter={(value: number) => [formatRupiah(value), 'Total Donasi']}
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