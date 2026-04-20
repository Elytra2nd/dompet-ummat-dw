'use client'

import React, { useState, useEffect } from 'react'
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
  UserCheck,
  HandCoins,
  PieChart,
  Calendar,
  Loader2,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

interface DonationStatsProps {
  totalDonasi: number
  jumlahDonatur: number
  jumlahMustahik: number
  dana_tersalur: number
  pertumbuhan: number
  targetBulanan?: number
  sebaranWilayah?: number
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
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString())
  const [chartData, setChartData] = useState<TrendItem[]>([])
  const [loadingChart, setLoadingChart] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch('/api/donasi/tahun', { cache: 'no-store' })
        if (!res.ok) throw new Error('Gagal mengambil daftar tahun')
        const years = await res.json()
        setAvailableYears(years)
        if (years.length > 0 && !years.includes(filterYear)) {
          setFilterYear(years[years.length - 1])
        }
      } catch (error) {
        console.error(error)
      }
    }
    fetchYears()
  }, [])

  useEffect(() => {
    const fetchTrend = async () => {
      if (!isMounted) return
      try {
        setLoadingChart(true)
        const res = await fetch(`/api/donasi/tren?year=${filterYear}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error('Gagal mengambil data tren')
        const data = await res.json()
        setChartData(data)
      } catch (error) {
        console.error(error)
        setChartData([])
      } finally {
        setLoadingChart(false)
      }
    }
    fetchTrend()
  }, [filterYear, isMounted])

  const isPositive = pertumbuhan >= 0
  const persentasePenyaluran = totalDonasi > 0 ? (dana_tersalur / totalDonasi) * 100 : 0

  const validYears = availableYears.filter((year) => {
    const y = Number(year)
    const currentYear = new Date().getFullYear()
    return Number.isInteger(y) && y >= 2011 && y <= currentYear
  })

  return (
    <div className="space-y-6 font-sans">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        {/* CARD 1: TOTAL DONASI */}
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

              <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${isPositive
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/20 text-rose-300'
                }`}>
                {isPositive
                  ? <ArrowUpRight className="h-3 w-3" />
                  : <ArrowDownRight className="h-3 w-3" />
                }
                {Math.abs(pertumbuhan)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 2: DANA TERSALUR */}
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
                {formatRupiah(dana_tersalur)}
              </h3>

              <div className="mt-1 inline-flex px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-white/20 text-white/80">
                Realisasi Manfaat
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: RASIO */}
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

        {/* CARD 4: MUZAKKI */}
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

        {/* CARD 5: MUSTAHIK */}
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
      <Card className="border-none shadow-xl bg-white overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 pb-2">
          <div>
            <CardTitle className="text-xl font-black text-slate-900">
              Tren Penghimpunan
            </CardTitle>
            <CardDescription className="text-xs font-medium">
              Visualisasi perolehan donasi bulanan di Kalimantan Barat
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
            <Calendar className="ml-2 h-4 w-4 text-slate-500" />
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="border-none bg-transparent shadow-none font-bold text-slate-700 focus:ring-0">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                {validYears.map((year) => (
                  <SelectItem key={year} value={year} className="font-bold">
                    Tahun {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full h-64">
            {!isMounted || loadingChart ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-xs font-black uppercase tracking-widest">
                  Sinkronisasi Data...
                </p>
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400 italic">
                Data donasi {filterYear} belum tersedia
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                    interval={0}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value: number) =>
                      value >= 1000000
                        ? `${value / 1000000}jt`
                        : value.toLocaleString()
                    }
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                  />

                  <Tooltip
                    contentStyle={{
                      borderRadius: "16px",
                      border: "none",
                      boxShadow:
                        "0 20px 25px -5px rgba(0,0,0,0.1)",
                      padding: "12px",
                    }}
                    itemStyle={{ fontWeight: "900", color: "#065f46" }}
                    formatter={(value: any) => [
                      formatRupiah(value),
                      "Total Donasi",
                    ]}
                  />

                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    animationDuration={2000}
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