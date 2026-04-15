'use client'

import { Card, CardContent } from "@/components/ui/card"
import { 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign,
  PieChart
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

interface DonationStatsProps {
  totalDonasi: number;
  jumlahDonatur: number;
  targetBulanan: number;
  pertumbuhan: number; // Dalam persen
}

export default function DonationStats({ 
  totalDonasi, 
  jumlahDonatur, 
  targetBulanan, 
  pertumbuhan 
}: DonationStatsProps) {
  
  const persentaseTarget = (totalDonasi / targetBulanan) * 100;
  const isPositive = pertumbuhan >= 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* CARD 1: TOTAL DONASI */}
      <Card className="border-none shadow-sm bg-indigo-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium opacity-80">Total Penghimpunan</p>
            <div className="p-2 bg-white/20 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold">{formatRupiah(totalDonasi)}</h3>
            <p className="text-xs mt-1 flex items-center gap-1 opacity-90">
              {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(pertumbuhan)}% dari bulan lalu
            </p>
          </div>
        </CardContent>
      </Card>

      {/* CARD 2: JUMLAH DONATUR */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Donatur Aktif</p>
            <div className="p-2 bg-slate-100 rounded-lg">
              <Users className="h-4 w-4 text-indigo-600" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-bold text-slate-900">{jumlahDonatur}</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">Muzakki Terdaftar</p>
          </div>
        </CardContent>
      </Card>

      {/* CARD 3: TARGET BULANAN */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Pencapaian Target</p>
            <div className="p-2 bg-slate-100 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <h3 className="text-2xl font-bold text-slate-900">{persentaseTarget.toFixed(1)}%</h3>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${Math.min(persentaseTarget, 100)}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CARD 4: RATIO ANALYTICS */}
      <Card className="border-slate-200 shadow-sm bg-slate-50/50 border-dashed">
        <CardContent className="p-6 flex flex-col justify-center h-full">
          <div className="flex items-center gap-3">
            <PieChart className="h-8 w-8 text-indigo-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Status Gudang Data</p>
              <p className="text-xs font-bold text-slate-600 italic">Syncing with fact_donasi...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}