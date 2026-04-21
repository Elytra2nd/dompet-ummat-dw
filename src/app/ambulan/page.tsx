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
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

export default function AmbulanExecutivePage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mengambil data dari API aktivitas yang sudah kita buat sebelumnya
    fetch('/api/ambulan/aktivitas')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans text-slate-900">
      {/* HEADER WITH CONTEXT */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 pb-6 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase">
            Dashboard <span className="text-rose-600">Ambulan</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1 uppercase text-[10px] tracking-[0.2em]">
            Analytical Operational Hub • BIDA Warehouse
          </p>
        </div>
        <div className="text-right group cursor-help">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Status Integrasi</p>
          <div className="flex items-center gap-2 text-emerald-600">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-tighter text-emerald-700">Warehouse Live Sync</span>
          </div>
        </div>
      </div>

      {/* BIG STATS - Analisis Efisiensi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Alokasi Biaya</p>
                <h3 className="text-2xl font-black mt-1 text-rose-600 tracking-tighter">
                  {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(stats?.totalExp || 0)
                  }
                </h3>
              </div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl group-hover:rotate-12 transition-transform">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
              <TrendingUp size={12} /> Data Faktual Aktivitas
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group hover:shadow-md transition-all border-l-4 border-emerald-500">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layanan Tersalurkan</p>
                <h3 className="text-3xl font-black mt-1 text-slate-900 tracking-tighter">
                  {loading ? "..." : (stats?.totalCount || 0)} <span className="text-sm font-bold text-slate-400 uppercase">Trip</span>
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:-rotate-12 transition-transform">
                <Truck size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase">
              <HandHeart size={12} /> Bantuan Masyarakat
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 rounded-2xl overflow-hidden group hover:shadow-md transition-all text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kesiapan Armada</p>
                <h3 className="text-2xl font-black mt-1 tracking-tighter italic text-yellow-400">
                  OPTIMAL
                </h3>
              </div>
              <div className="p-3 bg-slate-800 text-yellow-400 rounded-xl group-hover:scale-110 transition-transform">
                <Settings2 size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              2 Unit Aktif (KB 1234, KB 5678)
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CORE PATHWAYS - Redefined */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        
        {/* JALUR LAYANAN */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <h2 className="font-black uppercase text-xs tracking-[0.2em] text-slate-500">External Services</h2>
            </div>
          </div>
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 hover:border-emerald-500 transition-all shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-16 w-16 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl shrink-0">
                <HandHeart size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Fakta Layanan Pasien</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Pusat kendali interaksi pasien. Data mencakup informasi mustahik, tujuan rujukan, dan jenis bantuan ambulans yang diberikan.
                </p>
                <div className="pt-4 flex flex-wrap gap-2">
                  <Link href="/ambulan/monitoring">
                    <Button className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest px-6 hover:bg-slate-800">
                      Buka Monitoring
                    </Button>
                  </Link>
                  <Link href="/ambulan/layanan">
                    <Button variant="outline" className="border-2 border-emerald-600 text-emerald-600 font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-50">
                      Catat Layanan Baru
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JALUR AKTIVITAS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              <h2 className="font-black uppercase text-xs tracking-[0.2em] text-slate-500">Internal Operational</h2>
            </div>
          </div>
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 hover:border-rose-500 transition-all shadow-sm">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-16 w-16 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl shrink-0">
                <Activity size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight">Log Biaya & Aktivitas</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Pencatatan beban operasional armada. Pantau pengeluaran BBM, biaya servis, ganti oli, hingga pemeliharaan peralatan medis unit.
                </p>
                <div className="pt-4 flex flex-wrap gap-2">
                  <Link href="/ambulan/riwayat">
                    <Button className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest px-6 hover:bg-slate-800">
                      Cek Riwayat Biaya
                    </Button>
                  </Link>
                  <Link href="/ambulan/aktivitas">
                    <Button variant="outline" className="border-2 border-rose-600 text-rose-600 font-bold uppercase text-[10px] tracking-widest hover:bg-rose-50">
                      Catat Biaya Internal
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK LOGS PREVIEW */}
      <div className="mt-8">
        <Card className="border-none shadow-sm rounded-2xl bg-slate-900 text-white overflow-hidden">
          <CardHeader className="border-b border-slate-800 py-4">
            <div className="flex justify-between items-center px-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <History size={14} /> Entri Data Terakhir
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-800">
              {stats?.recentLogs?.slice(0, 3).map((log: any, i: number) => (
                <div key={i} className="p-5 flex justify-between items-center group hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${log.biaya_operasional ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {log.biaya_operasional ? <DollarSign size={14}/> : <Truck size={14}/>}
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase group-hover:text-white transition-colors">{log.id_transaksi}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {log.kategori_aktivitas?.replace(/_/g, ' ') || log.kategori_layanan?.replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-slate-700 group-hover:text-slate-400 transition-all -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
              ))}
              {!stats?.recentLogs?.length && (
                <div className="p-8 text-center text-[10px] font-bold text-slate-600 uppercase tracking-widest italic">
                  Belum ada aktivitas terekam hari ini
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}