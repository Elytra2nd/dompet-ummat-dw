'use client'

import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  HeartHandshake, // Pengganti DollarSign untuk kesan ZISWAF
  Globe, // Mewakili Syiar/Spasial wilayah
  BarChart3,
  Activity,
  Zap
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

interface DonationStatsProps {
  totalDonasi: number
  jumlahDonatur: number
  targetBulanan: number
  pertumbuhan: number
  sebaranWilayah: number // Properti yang menyebabkan error sebelumnya
}

export default function DonationStats({
  totalDonasi = 0,
  jumlahDonatur = 0,
  targetBulanan = 100000000,
  pertumbuhan = 0,
  sebaranWilayah = 0,
}: DonationStatsProps) {
  
  const persentaseTarget = targetBulanan > 0 ? (totalDonasi / targetBulanan) * 100 : 0
  const isPositive = pertumbuhan >= 0

  return (
    <div className="grid gap-4 font-sans md:grid-cols-2 lg:grid-cols-4">
      
      {/* CARD 1: TOTAL PENGHIMPUNAN ZISWAF (DATA DARI FACT_DONASI) */}
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

      {/* CARD 2: MUZAKKI & MUNFIQ (DATA DARI DIM_DONATUR) */}
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

      {/* CARD 3: PROGRESS TARGET SYIAR */}
      <Card className="border-2 border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold tracking-tighter text-slate-500 uppercase">
              Realisasi Target
            </p>
            <div className="rounded-lg bg-indigo-50 p-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black text-slate-900">
                {persentaseTarget.toFixed(1)}%
              </h3>
              <p className="mb-1 text-[10px] font-bold text-slate-400">
                Goal: {targetBulanan / 1000000}jt
              </p>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-indigo-500 transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(persentaseTarget, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 4: SEBARAN MANFAAT (GIS INSIGHT) */}
      <Card className="border-2 border-dashed border-slate-200 bg-slate-50/50 shadow-sm">
        <CardContent className="flex h-full flex-col justify-center p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
              Cakupan Wilayah
            </p>
            <Globe className="h-4 w-4 text-slate-400" />
          </div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-black text-slate-800">{sebaranWilayah}</h3>
            <div className="leading-tight">
              <p className="text-[10px] font-bold text-slate-600 uppercase">Titik Distribusi</p>
              <p className="text-[9px] font-bold italic text-indigo-500">Kalimantan Barat</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}