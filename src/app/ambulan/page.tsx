'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Truck, 
  HandHeart, 
  Settings2, 
  ArrowRight, 
  Activity,
  History,
  ShieldCheck,
  TrendingUp,
  PlusCircle
} from 'lucide-react'
import Link from 'next/link'

export default function AmbulanHubPage() {
  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50/50 min-h-screen font-sans">
      {/* HEADER */}
      <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">
            Portal Layanan & <span className="text-rose-600">Operasional</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Sistem Manajemen Terpadu Armada Dompet Ummat</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* JALUR 1: LAYANAN (EKSTERNAL) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <HandHeart className="text-emerald-600 h-5 w-5" />
            <h2 className="font-black uppercase text-sm tracking-widest text-slate-400">Layanan Masyarakat</h2>
          </div>
          <Card className="border-2 border-slate-200 shadow-sm hover:border-emerald-500 transition-all overflow-hidden bg-white group">
            <CardContent className="p-0">
              <div className="p-8 space-y-4">
                <div className="h-14 w-14 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                  <Truck size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase">Monitoring Layanan</h3>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    Pencatatan fakta interaksi dengan pasien/mustahik. Meliputi antar-jemput pasien, 
                    layanan jenazah, dan koordinasi lokasi tujuan.
                  </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Link href="/ambulan/monitoring" className="flex-1">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold uppercase text-[10px] tracking-widest h-11">
                      Buka Monitoring <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </Link>
                  <Link href="/ambulan/layanan" className="flex-1">
                    <Button variant="outline" className="w-full border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 font-bold uppercase text-[10px] tracking-widest h-11">
                      <PlusCircle size={14} className="mr-2" /> Catat Layanan
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="bg-emerald-50 p-4 border-t border-emerald-100 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Fact Table: fact_layanan_ambulan</span>
                 <ShieldCheck size={14} className="text-emerald-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* JALUR 2: AKTIVITAS (INTERNAL) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <Settings2 className="text-rose-600 h-5 w-5" />
            <h2 className="font-black uppercase text-sm tracking-widest text-slate-400">Aktivitas Internal</h2>
          </div>
          <Card className="border-2 border-slate-200 shadow-sm hover:border-rose-500 transition-all overflow-hidden bg-white group">
            <CardContent className="p-0">
              <div className="p-8 space-y-4">
                <div className="h-14 w-14 bg-rose-50 text-rose-600 flex items-center justify-center rounded-2xl group-hover:scale-110 transition-transform">
                  <Activity size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase">Log Aktivitas & Biaya</h3>
                  <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                    Manajemen pengeluaran operasional armada. Meliputi pengisian BBM, servis rutin, 
                    perbaikan, dan pemeliharaan inventaris medis.
                  </p>
                </div>
                <div className="pt-4 flex flex-col sm:flex-row gap-3">
                  <Link href="/ambulan/riwayat" className="flex-1">
                    <Button className="w-full bg-rose-600 hover:bg-rose-700 font-bold uppercase text-[10px] tracking-widest h-11">
                      Buka Log Biaya <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </Link>
                  <Link href="/ambulan/aktivitas" className="flex-1">
                    <Button variant="outline" className="w-full border-2 border-rose-600 text-rose-600 hover:bg-rose-50 font-bold uppercase text-[10px] tracking-widest h-11">
                      <PlusCircle size={14} className="mr-2" /> Catat Aktivitas
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="bg-rose-50 p-4 border-t border-rose-100 flex justify-between items-center">
                 <span className="text-[10px] font-bold text-rose-700 uppercase tracking-tighter">Fact Table: fact_aktivitas_ambulan</span>
                 <TrendingUp size={14} className="text-rose-400" />
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* FOOTER INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="bg-slate-100 p-2.5 rounded-xl"><History size={20} className="text-slate-500"/></div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Integritas Data</p>
              <p className="text-xs font-bold text-slate-700">Terhubung Real-time ke Warehouse</p>
            </div>
          </div>
      </div>
    </div>
  )
}