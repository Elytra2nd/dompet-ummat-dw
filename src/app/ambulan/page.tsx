'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Truck, 
  Settings2, 
  ArrowRight, 
  Activity,
  History,
  TrendingUp,
  HandHeart,
  DollarSign,
  Loader2,
  Car,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { KATEGORI_AKTIVITAS } from '@/lib/constants-ambulan'

const getEnumLabel = (val: string, type: 'aktivitas' | 'layanan') => {
  if (!val) return 'Unknown'
  return val.replace(/_/g, ' ')
}

const formatIDR = (val: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val)

export default function AmbulanExecutivePage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ambulan/aktivitas')
      .then(res => res.json())
      .then(data => { setStats(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-slate-50/50 min-h-screen font-sans text-slate-900">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-5">
        <div>
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-black tracking-tighter uppercase">
            <Car className="h-7 w-7 text-rose-600 shrink-0" />
            Dashboard <span className="text-rose-600">Ambulan</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.15em]">
            Analytical Operational Hub • BIDA Warehouse
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1.5 self-start sm:self-auto">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-bold uppercase tracking-tight text-emerald-700">Live Sync</span>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Total Biaya */}
        <Card className="col-span-2 md:col-span-1 border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Alokasi Biaya</p>
                <h3 className="text-lg sm:text-xl font-black mt-1 text-rose-600 tracking-tighter break-all">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : formatIDR(stats?.totalExp || 0)}
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0 group-hover:rotate-12 transition-transform ml-2">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase">
              <TrendingUp size={11} /> Data Faktual Aktivitas
            </div>
          </CardContent>
        </Card>

        {/* Aktivitas Terdata */}
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all border-l-4 border-emerald-500">
          <CardContent className="p-4 sm:p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktivitas Terdata</p>
                <h3 className="text-2xl sm:text-3xl font-black mt-1 text-slate-900 tracking-tighter">
                  {loading ? '...' : (stats?.totalCount || 0)}
                  <span className="text-xs font-bold text-slate-400 ml-1">Log</span>
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:-rotate-12 transition-transform">
                <Activity size={20} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-[9px] font-bold text-emerald-600 uppercase">
              <HandHeart size={11} /> Pencatatan Internal
            </div>
          </CardContent>
        </Card>

        {/* Kesiapan Armada */}
        <Card className="border-none shadow-sm bg-slate-900 rounded-2xl overflow-hidden group hover:shadow-md transition-all text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Settings2 size={80} />
          </div>
          <CardContent className="p-4 sm:p-5 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Kesiapan Armada</p>
                <h3 className="text-lg sm:text-xl font-black mt-1 tracking-tighter italic text-yellow-400 flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400 animate-pulse" /> OPTIMAL
                </h3>
              </div>
              <div className="p-2 sm:p-3 bg-slate-800 text-yellow-400 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                <Truck size={20} />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              2 Unit Aktif (KB 1234, KB 5678)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CORE PATHWAYS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* External Services */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <h2 className="font-black uppercase text-xs tracking-[0.15em] text-slate-500">External Services</h2>
          </div>
          <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 sm:p-7 hover:border-emerald-500 transition-all shadow-sm group">
            <div className="flex gap-4 items-start">
              <div className="h-12 w-12 sm:h-14 sm:w-14 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl sm:rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <HandHeart size={26} />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">
                  Fakta Layanan Pasien
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  Pusat kendali interaksi eksternal. Data mencakup informasi pasien, status sosial ekonomi, serta geolokasi penjemputan.
                </p>
                <div className="pt-3 flex flex-col sm:flex-row gap-2">
                  <Link href="/ambulan/monitoring" className="flex-1 sm:flex-none">
                    <Button className="w-full sm:w-auto bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 shadow-md h-10">
                      Buka Monitoring
                    </Button>
                  </Link>
                  <Link href="/ambulan/layanan" className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full sm:w-auto border-2 border-emerald-600 text-emerald-600 font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-50 hover:text-emerald-700 h-10">
                      Catat Layanan Baru
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Internal Operational */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
            <h2 className="font-black uppercase text-xs tracking-[0.15em] text-slate-500">Internal Operational</h2>
          </div>
          <div className="bg-white border-2 border-slate-100 rounded-2xl p-5 sm:p-7 hover:border-rose-500 transition-all shadow-sm group">
            <div className="flex gap-4 items-start">
              <div className="h-12 w-12 sm:h-14 sm:w-14 bg-rose-50 text-rose-600 flex items-center justify-center rounded-xl sm:rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <Activity size={26} />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-black uppercase text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors">
                  Log Biaya & Aktivitas
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                  Pencatatan beban operasional armada. Pantau pengeluaran BBM, biaya servis, ganti oli, hingga pemeliharaan unit.
                </p>
                <div className="pt-3 flex flex-col sm:flex-row gap-2">
                  <Link href="/ambulan/riwayat" className="flex-1 sm:flex-none">
                    <Button className="w-full sm:w-auto bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest hover:bg-slate-800 shadow-md h-10">
                      Cek Riwayat Biaya
                    </Button>
                  </Link>
                  <Link href="/ambulan/aktivitas" className="flex-1 sm:flex-none">
                    <Button variant="outline" className="w-full sm:w-auto border-2 border-rose-600 text-rose-600 font-bold uppercase text-[10px] tracking-widest hover:bg-rose-50 hover:text-rose-700 h-10">
                      Catat Biaya Internal
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK LOGS */}
      <Card className="border-none shadow-md rounded-2xl bg-white overflow-hidden">
        <CardHeader className="border-b border-slate-100 py-4 bg-slate-50/50 px-4 sm:px-6">
          <CardTitle className="text-xs font-black uppercase tracking-[0.15em] text-slate-500 flex items-center gap-2">
            <History size={15} className="text-indigo-500" /> Log Aktivitas Terakhir
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {loading && (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <Loader2 size={22} className="text-slate-300 animate-spin" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat log...</p>
              </div>
            )}
            {!loading && !stats?.recentLogs?.length && (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <div className="bg-slate-50 p-3 rounded-full">
                  <Activity size={22} className="text-slate-300" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Belum ada aktivitas terekam</p>
              </div>
            )}
            {stats?.recentLogs?.slice(0, 5).map((log: any, i: number) => (
              <div key={i} className="px-4 sm:px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 transition-colors">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${log.biaya_operasional ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  {log.biaya_operasional ? <DollarSign size={16} /> : <Truck size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-black text-slate-900 uppercase truncate">{log.id_transaksi}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold uppercase shrink-0">
                      {log.armada?.includes('1') ? 'AMB-1' : 'AMB-2'}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5 truncate">
                    {log.kategori_aktivitas?.replace(/_/g, ' ')}
                    {log.biaya_operasional > 0 && (
                      <span className="text-rose-600 ml-2">• Rp {Number(log.biaya_operasional).toLocaleString('id-ID')}</span>
                    )}
                  </p>
                </div>
                <ArrowRight size={15} className="text-slate-300 shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}