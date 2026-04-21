'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Truck, 
  Activity, 
  History, 
  LayoutDashboard, 
  ArrowRight, 
  PlusCircle,
  Clock,
  MapPin,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function AktivitasAmbulanPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/ambulan/aktivitas')
      .then(res => res.json())
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => toast.error("Gagal memuat ringkasan aktivitas"))
  }, [])

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans">
      {/* HERO SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Aktivitas Ambulan</h1>
          <p className="text-slate-500 mt-1">Pusat kendali dan ringkasan layanan operasional harian.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/ambulan/monitoring">
            <Button className="bg-slate-900 hover:bg-slate-800 shadow-sm">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Monitoring Room
            </Button>
          </Link>
        </div>
      </div>

      {/* QUICK STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Layanan (Bulan Ini)</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : stats?.totalMonth || 0}</h3>
              </div>
              <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                <TrendingUp size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Armada Aktif</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">{loading ? '...' : '2 Unit'}</h3>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500">
                <Truck size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wilayah Jangkauan</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-1">Pontianak & Sekitarnya</h3>
              </div>
              <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
                <MapPin size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN ACTIONS */}
        <div className="lg:col-span-2 space-y-6">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <PlusCircle size={16} /> Pintasan Cepat
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/ambulan/monitoring">
              <div className="group p-6 bg-white border border-slate-200 rounded-xl hover:border-rose-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                <div className="relative z-10">
                  <Activity className="text-rose-500 mb-4" size={32} />
                  <h5 className="font-bold text-lg text-slate-900">Input Layanan Baru</h5>
                  <p className="text-sm text-slate-500 mt-1">Catat aktivitas penggunaan ambulan ke tabel fakta warehouse.</p>
                  <div className="flex items-center text-rose-600 font-bold text-xs mt-4">
                    BUKA MONITORING <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>
                <Activity className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:text-rose-50 group-hover:opacity-20 transition-all" size={120} />
              </div>
            </Link>

            <Link href="/reports">
              <div className="group p-6 bg-white border border-slate-200 rounded-xl hover:border-blue-500 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                <div className="relative z-10">
                  <History className="text-blue-500 mb-4" size={32} />
                  <h5 className="font-bold text-lg text-slate-900">Analisis Laporan</h5>
                  <p className="text-sm text-slate-500 mt-1">Lihat tren bulanan, efektivitas armada, dan sebaran lokasi.</p>
                  <div className="flex items-center text-blue-600 font-bold text-xs mt-4">
                    BUKA LAPORAN <ArrowRight size={14} className="ml-1" />
                  </div>
                </div>
                <History className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 group-hover:text-blue-50 group-hover:opacity-20 transition-all" size={120} />
              </div>
            </Link>
          </div>
        </div>

        {/* RECENT FEED (Optional/Simulasi) */}
        <div className="space-y-6">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} /> Aktivitas Terakhir
          </h4>
          <Card className="border-none shadow-sm rounded-xl overflow-hidden">
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="p-8 text-center text-slate-400 animate-pulse">Memuat log...</div>
                ) : (
                  stats?.recentLogs?.map((log: any, i: number) => (
                    <div key={i} className="p-4 flex items-start gap-3 hover:bg-slate-50 transition-colors">
                      <div className="mt-1 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 uppercase">{log.id_transaksi}</p>
                        <p className="text-[11px] text-slate-500 font-medium">{log.kategori_layanan.replace(/_/g, ' ')}</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-bold italic">{log.armada.split('__')[0]}</p>
                      </div>
                    </div>
                  ))
                )}
                <div className="p-4 bg-slate-50/50 text-center">
                   <Link href="/ambulan/monitoring" className="text-[10px] font-black text-slate-400 uppercase hover:text-rose-600 transition-all">Lihat Semua Log Layanan</Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}