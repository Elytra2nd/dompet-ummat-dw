'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  ArrowDownRight, ArrowUpRight, Minus,
  HandCoins, HeartHandshake, PieChart,
  UserCheck, Users, Zap,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'
import { type FilterState, type ProgramFilter, PROGRAM_FILTER_DEFAULT, buildQueryParams, appendProgramParams } from '@/components/donasi/FilterBar'

interface KpiData {
  totalDonasi: number
  jumlahDonatur: number
  jumlahMustahik: number
  danaTersalur: number
  pertumbuhan: number
  statusPertumbuhan: 'naik' | 'turun' | 'stabil' | 'data_tidak_cukup'
}

const KPI_DEFAULT: KpiData = {
  totalDonasi: 0,
  jumlahDonatur: 0,
  jumlahMustahik: 0,
  danaTersalur: 0,
  pertumbuhan: 0,
  statusPertumbuhan: 'data_tidak_cukup',
}

interface DonationStatsProps {
  appliedFilter: FilterState
  programFilter?: ProgramFilter
}

export default function DonationStats({ appliedFilter, programFilter = PROGRAM_FILTER_DEFAULT }: DonationStatsProps) {
  const [kpi, setKpi] = useState<KpiData>(KPI_DEFAULT)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchKpi = async () => {
      setLoading(true)
      try {
        const params = appendProgramParams(buildQueryParams(appliedFilter), programFilter)
        const res = await fetch(`/api/donasi/stats?${params.toString()}`)
        if (!res.ok) throw new Error()
        setKpi(await res.json())
      } catch {
        setKpi(KPI_DEFAULT)
      } finally {
        setLoading(false)
      }
    }
    fetchKpi()
  }, [appliedFilter, programFilter?.program])

  const isPositive = kpi.pertumbuhan >= 0
  const persentasePenyaluran = kpi.totalDonasi > 0 ? (kpi.danaTersalur / kpi.totalDonasi) * 100 : 0
  const cls = loading ? 'opacity-50 animate-pulse pointer-events-none' : 'opacity-100 transition-opacity duration-300'

  return (
    <div className={`grid gap-4 grid-cols-2 lg:grid-cols-5 ${cls}`}>
      {/* Total ZISWAF */}
      <Card className="col-span-2 lg:col-span-1 relative overflow-hidden border-none bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xl">
        <div className="absolute top-[-10px] right-[-10px] opacity-10"><HeartHandshake size={100} /></div>
        <CardContent className="relative z-10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Total ZISWAF</p>
            <div className="rounded-full bg-white/20 p-2 backdrop-blur-md">
              <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300" />
            </div>
          </div>
          <div className="mt-3 overflow-hidden">
            <h3 className="text-sm sm:text-base md:text-lg font-extrabold leading-tight break-all">{formatRupiah(kpi.totalDonasi)}</h3>
            {kpi.statusPertumbuhan === 'data_tidak_cukup' ? (
              <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-gray-500/20 text-gray-400">
                <Minus className="h-3 w-3" /> Belum ada data bulan lalu
              </div>
            ) : (
              <div className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase ${isPositive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(kpi.pertumbuhan)}%
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tersalurkan */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-xl">
        <div className="absolute top-[-10px] right-[-10px] opacity-10"><HandCoins size={100} /></div>
        <CardContent className="relative z-10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Tersalurkan</p>
            <div className="rounded-full bg-white/20 p-2 backdrop-blur-md"><HandCoins className="h-4 w-4 text-white" /></div>
          </div>
          <div className="mt-3 overflow-hidden">
            <h3 className="text-sm sm:text-base md:text-lg font-extrabold leading-tight break-all">{formatRupiah(kpi.danaTersalur)}</h3>
            <div className="mt-1 inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-white/20 text-white/80">Realisasi Manfaat</div>
          </div>
        </CardContent>
      </Card>

      {/* Absorpsi */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xl">
        <div className="absolute top-[-10px] right-[-10px] opacity-10"><PieChart size={100} /></div>
        <CardContent className="relative z-10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Absorpsi</p>
            <div className="rounded-full bg-white/20 p-2 backdrop-blur-md"><PieChart className="h-4 w-4 text-white" /></div>
          </div>
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base md:text-lg font-extrabold">{persentasePenyaluran.toFixed(1)}%</h3>
              <div className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-white/20 text-white/80">Tingkat Penyaluran</div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${Math.min(persentasePenyaluran, 100)}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Muzakki */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-xl">
        <div className="absolute top-[-10px] right-[-10px] opacity-10"><Users size={100} /></div>
        <CardContent className="relative z-10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Muzakki</p>
            <div className="rounded-full bg-white/20 p-2 backdrop-blur-md"><Users className="h-4 w-4 text-white" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold truncate">
              {kpi.jumlahDonatur.toLocaleString()}<span className="text-[10px] ml-1 text-white/70">Jiwa</span>
            </h3>
            <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-white/20 text-white/80">
              <span className="h-1 w-1 rounded-full bg-white animate-ping" /> Aktif
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mustahik */}
      <Card className="relative overflow-hidden border-none bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl">
        <div className="absolute top-[-10px] right-[-10px] opacity-10"><UserCheck size={100} /></div>
        <CardContent className="relative z-10 p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider">Mustahik</p>
            <div className="rounded-full bg-white/20 p-2 backdrop-blur-md"><UserCheck className="h-4 w-4 text-white" /></div>
          </div>
          <div className="mt-3">
            <h3 className="text-base sm:text-lg md:text-xl font-extrabold truncate">
              {kpi.jumlahMustahik.toLocaleString()}<span className="text-[10px] ml-1 text-white/70">Jiwa</span>
            </h3>
            <div className="mt-1 inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-white/20 text-white/80">Penerima</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}