'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PieChart,
  Activity,
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

interface DonationStatsProps {
  totalDonasi: number
  jumlahDonatur: number
  targetBulanan: number
  pertumbuhan: number
}

export default function DonationStats({
  totalDonasi = 0,
  jumlahDonatur = 0,
  targetBulanan = 100000000,
  pertumbuhan = 0,
}: DonationStatsProps) {
  // Hitung persentase, cegah pembagian dengan nol
  const persentaseTarget =
    targetBulanan > 0 ? (totalDonasi / targetBulanan) * 100 : 0
  const isPositive = pertumbuhan >= 0

  return (
    <div className="grid gap-4 font-sans md:grid-cols-2 lg:grid-cols-4">
      {/* CARD 1: TOTAL PENGHIMPUNAN (DW FACT_DONASI) */}
      <Card className="relative overflow-hidden border-none bg-indigo-600 text-white shadow-md">
        <div className="absolute top-[-10px] right-[-10px] opacity-10">
          <DollarSign size={100} />
        </div>
        <CardContent className="relative z-10 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium opacity-80">Total Penghimpunan</p>
            <div className="rounded-lg bg-white/20 p-2">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight">
              {formatRupiah(totalDonasi)}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase opacity-90">
              {isPositive ? (
                <ArrowUpRight className="h-3 w-3 text-emerald-300" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-rose-300" />
              )}
              <span
                className={isPositive ? 'text-emerald-300' : 'text-rose-300'}
              >
                {Math.abs(pertumbuhan)}%
              </span>
              vs bulan lalu
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: DONATUR (DIM_DONATUR) */}
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-tighter text-slate-500 uppercase">
              Donatur Aktif
            </p>
            <div className="rounded-lg bg-indigo-50 p-2">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              {jumlahDonatur.toLocaleString()}
            </h3>
            <p className="mt-1 text-[10px] font-bold text-slate-400 uppercase">
              Muzakki & Munfiq Terdata
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CARD 3: PROGRESS TARGET */}
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-tighter text-slate-500 uppercase">
              Pencapaian Target
            </p>
            <div className="rounded-lg bg-emerald-50 p-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black text-slate-900">
                {persentaseTarget.toFixed(1)}%
              </h3>
              <p className="mb-1 text-[10px] font-bold text-slate-400"></p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(persentaseTarget, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 4: STATUS GUDANG DATA */}
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 shadow-sm">
        <CardContent className="flex h-full flex-col justify-center p-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PieChart className="h-8 w-8 text-indigo-400" />
              <span className="absolute top-0 right-0 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                OLAP Status
              </p>
              <p className="text-xs font-bold text-slate-600 italic">
                Connected to TiDB Core
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
