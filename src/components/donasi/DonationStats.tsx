'use client'

import { Card, CardContent } from "@/components/ui/card"
import { 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  PieChart,
  Activity
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

interface DonationStatsProps {
  totalDonasi: number;
  jumlahDonatur: number;
  targetBulanan: number;
  pertumbuhan: number; 
}

export default function DonationStats({ 
  totalDonasi = 0, 
  jumlahDonatur = 0, 
  targetBulanan = 100000000, 
  pertumbuhan = 0 
}: DonationStatsProps) {
  
  // Hitung persentase, cegah pembagian dengan nol
  const persentaseTarget = targetBulanan > 0 ? (totalDonasi / targetBulanan) * 100 : 0;
  const isPositive = pertumbuhan >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 font-sans">
      {/* CARD 1: TOTAL PENGHIMPUNAN (DW FACT_DONASI) */}
      <Card className="border-none shadow-md bg-indigo-600 text-white overflow-hidden relative">
        <div className="absolute right-[-10px] top-[-10px] opacity-10">
          <DollarSign size={100} />
        </div>
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium opacity-80">Total Penghimpunan</p>
            <div className="p-2 bg-white/20 rounded-lg">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black tracking-tight">
              {formatRupiah(totalDonasi)}
            </h3>
            <p className="text-[10px] mt-1 flex items-center gap-1 font-bold uppercase tracking-wider opacity-90">
              {isPositive ? <ArrowUpRight className="h-3 w-3 text-emerald-300" /> : <ArrowDownRight className="h-3 w-3 text-rose-300" />}
              <span className={isPositive ? "text-emerald-300" : "text-rose-300"}>
                {Math.abs(pertumbuhan)}%
              </span> 
              vs bulan lalu
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: DONATUR (DIM_DONATUR) */}
      <Card className="border-slate-200 shadow-sm border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Donatur Aktif</p>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">{jumlahDonatur.toLocaleString()}</h3>
            <p className="text-[10px] text-slate-400 mt-1 font-bold uppercase">Muzakki & Munfiq Terdata</p>
          </div>
        </CardContent>
      </Card>

      {/* CARD 3: PROGRESS TARGET */}
      <Card className="border-slate-200 shadow-sm border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Pencapaian Target</p>
            <div className="p-2 bg-emerald-50 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-black text-slate-900">{persentaseTarget.toFixed(1)}%</h3>
              <p className="text-[10px] font-bold text-slate-400 mb-1">
                Goal: {targetBulanan / 1000000}jt
              </p>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-out" 
                style={{ width: `${Math.min(persentaseTarget, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 4: STATUS GUDANG DATA */}
      <Card className="border-slate-200 shadow-sm bg-slate-50/50 border-dashed border-2">
        <CardContent className="p-6 flex flex-col justify-center h-full">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PieChart className="h-8 w-8 text-indigo-400" />
              <span className="absolute top-0 right-0 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">OLAP Status</p>
              <p className="text-xs font-bold text-slate-600 italic">Connected to TiDB Core</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}