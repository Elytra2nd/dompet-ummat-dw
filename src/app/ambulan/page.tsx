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
  Loader2,
  Car
} from 'lucide-react'
import Link from 'next/link'
import { KATEGORI_AKTIVITAS, KATEGORI_LAYANAN } from '@/lib/constants-ambulan'
import ImportButton from '@/components/import/ImportButton'

// Helper to get nice readable label from Prisma Enum value
const getEnumLabel = (val: string, type: 'aktivitas' | 'layanan') => {
  if (!val) return 'Unknown'
  const source = type === 'aktivitas' ? KATEGORI_AKTIVITAS : KATEGORI_LAYANAN
  const found = source.find(item => item.value === val)
  return found ? found.label : val.replace(/_/g, ' ')
}

export default function AmbulanExecutivePage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mengambil data dari API aktivitas
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
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tighter uppercase">
            <Car className="h-8 w-8 text-rose-600" />
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
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aktivitas Terdata</p>
                <h3 className="text-3xl font-black mt-1 text-slate-900 tracking-tighter">
                  {loading ? "..." : (stats?.totalCount || 0)} <span className="text-sm font-bold text-slate-400 uppercase">Log</span>
                </h3>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:-rotate-12 transition-transform">
                <Activity size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase">
              <HandHeart size={12} /> Pencatatan Internal
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 rounded-2xl overflow-hidden group hover:shadow-md transition-all text-white relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Settings2 size={100} />
          </div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kesiapan Armada</p>
                <h3 className="text-2xl font-black mt-1 tracking-tighter italic text-yellow-400 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-400 animate-pulse" /> OPTIMAL
                </h3>
              </div>
              <div className="p-3 bg-slate-800 text-yellow-400 rounded-xl group-hover:scale-110 transition-transform shadow-lg">
                <Truck size={24} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 hover:border-emerald-500 transition-all shadow-sm group">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-16 w-16 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <HandHeart size={32} />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight group-hover:text-emerald-600 transition-colors">Fakta Layanan Pasien</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Pusat kendali interaksi eksternal. Data mencakup informasi pasien, status sosial ekonomi, serta geolokasi penjemputan ambulans yang terintegrasi dengan peta.
                </p>
                <div className="pt-4 flex flex-wrap gap-2">
                  <Link href="/ambulan/monitoring">
                    <Button className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest px-6 hover:bg-slate-800 shadow-md">
                      Buka Monitoring
                    </Button>
                  </Link>
                  <Link href="/ambulan/layanan">
                    <Button variant="outline" className="border-2 border-emerald-600 text-emerald-600 font-bold uppercase text-[10px] tracking-widest hover:bg-emerald-50 hover:text-emerald-700 shadow-sm">
                      Catat Layanan Baru
                    </Button>
                  </Link>
                  <ImportButton modul="ambulan_layanan" onImportSuccess={() => window.location.reload()} />
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
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 hover:border-rose-500 transition-all shadow-sm group">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="h-16 w-16 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <Activity size={32} />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-xl font-black uppercase text-slate-900 tracking-tight group-hover:text-rose-600 transition-colors">Log Biaya & Aktivitas</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Pencatatan beban operasional armada. Pantau pengeluaran BBM, biaya servis, ganti oli, hingga pemeliharaan peralatan unit untuk audit fact table.
                </p>
                <div className="pt-4 flex flex-wrap gap-2">
                  <Link href="/ambulan/riwayat">
                    <Button className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-widest px-6 hover:bg-slate-800 shadow-md">
                      Cek Riwayat Biaya
                    </Button>
                  </Link>
                  <Link href="/ambulan/aktivitas">
                    <Button variant="outline" className="border-2 border-rose-600 text-rose-600 font-bold uppercase text-[10px] tracking-widest hover:bg-rose-50 hover:text-rose-700 shadow-sm">
                      Catat Biaya Internal
                    </Button>
                  </Link>
                  <ImportButton modul="ambulan_aktivitas" onImportSuccess={() => window.location.reload()} />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* QUICK LOGS PREVIEW */}
      <div className="mt-8">
        <Card className="border-none shadow-lg rounded-2xl bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-100 py-5 bg-slate-50/50">
            <div className="flex justify-between items-center px-2">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                <History size={16} className="text-indigo-500" /> Log Aktivitas Operasional Terakhir
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {stats?.recentLogs?.slice(0, 5).map((log: any, i: number) => (
                <div key={i} className="p-5 flex justify-between items-center group hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-inner ${log.biaya_operasional ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {log.biaya_operasional ? <DollarSign size={18}/> : <Truck size={18}/>}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                        {log.id_transaksi}
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold tracking-widest">
                          {log.armada?.includes('1') ? 'AMB-1' : 'AMB-2'}
                        </span>
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1 flex items-center gap-2">
                        <span>{getEnumLabel(log.kategori_aktivitas, 'aktivitas')}</span>
                        {log.biaya_operasional > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-rose-600">Rp {Number(log.biaya_operasional).toLocaleString('id-ID')}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-all -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
              ))}
              {!loading && !stats?.recentLogs?.length && (
                <div className="p-10 text-center flex flex-col items-center justify-center">
                  <div className="bg-slate-50 p-4 rounded-full mb-3">
                    <Activity size={24} className="text-slate-300" />
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Belum ada aktivitas terekam
                  </p>
                </div>
              )}
              {loading && (
                 <div className="p-10 text-center flex flex-col items-center justify-center">
                    <Loader2 size={24} className="text-slate-300 animate-spin mb-3" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat log...</p>
                 </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}