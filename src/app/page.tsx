'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Ambulance, 
  Map as MapIcon, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import DonationStats from '@/components/donasi/DonationStats'

export default function DashboardPage() {
  // State untuk menyimpan data riil dari DW
  const [stats, setStats] = useState({
    totalDonasi: 0,
    jumlahDonatur: 0,
    pertumbuhan: 0,
    layananAmbulan: 0,
    sebaranWilayah: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetching data dari API DW saat komponen dimuat
  useEffect(() => {
    async function fetchDashboardStats() {
      try {
        const response = await fetch('/api/stats')
        const data = await response.json()
        
        if (data) {
          setStats({
            totalDonasi: data.totalDonasi || 0,
            jumlahDonatur: data.jumlahDonatur || 0,
            pertumbuhan: data.pertumbuhan || 0,
            layananAmbulan: data.layananAmbulan || 0,
            sebaranWilayah: data.sebaranWilayah || 0
          })
        }
      } catch (error) {
        console.error("Gagal mengambil data dari Data Warehouse:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardStats()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* 1. HERO / GREETING SECTION */}
      <div className="bg-white border-b mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-3 py-1 ${loading ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-700'} text-[10px] font-black uppercase tracking-widest rounded-full transition-colors`}>
                  {loading ? 'Connecting to DW...' : 'OLAP Core Connected'}
                </span>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full">
                  SVM AI Active
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900">
                Dashboard <span className="text-emerald-600">Amil</span> Analitik
              </h1>
              <p className="text-slate-500 mt-2 font-medium max-w-xl">
                Sistem pendukung keputusan berbasis Data Warehouse untuk optimalisasi penghimpunan dan penyaluran ZISWAF di Kalimantan Barat.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button asChild variant="outline" className="border-2 font-bold hover:bg-slate-50">
                <Link href="/donasi/masuk">
                  Input Transaksi
                </Link>
              </Button>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100 font-bold transition-all">
                <Link href="/ambulan/layanan">
                  <Ambulance className="mr-2 h-4 w-4" /> Layanan Ambulans
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 space-y-8">
        
        {/* 2. STATS OVERVIEW (Dengan Loading State) */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-32 border-2 border-slate-100 bg-white shadow-none animate-pulse flex items-center justify-center">
                 <Loader2 className="h-6 w-6 animate-spin text-slate-200" />
              </Card>
            ))}
          </div>
        ) : (
          <DonationStats 
            totalDonasi={stats.totalDonasi}
            jumlahDonatur={stats.jumlahDonatur}
            pertumbuhan={stats.pertumbuhan}
            targetBulanan={2000000000} // Target 2 Milyar
            sebaranWilayah={stats.sebaranWilayah}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 3. MODUL CEPAT / MENU UTAMA */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <ShieldCheck className="text-emerald-500 h-6 w-6" /> Modul Operasional
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <Link href="/donasi/donatur">
                <Card className="hover:border-indigo-400 transition-all group cursor-pointer border-2 shadow-none bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 transition-colors">
                        <Users className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-600 transition-all group-hover:translate-x-1" />
                    </div>
                    <h3 className="mt-4 font-black text-lg text-slate-900">Database Donatur</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Manajemen profil Muzakki, Munfiq, dan rekam jejak kedermawanan melalui tabel dimensi.</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/ambulan/layanan">
                <Card className="hover:border-red-400 transition-all group cursor-pointer border-2 shadow-none bg-white">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-red-50 rounded-xl group-hover:bg-red-600 transition-colors">
                        <MapIcon className="h-6 w-6 text-red-600 group-hover:text-white" />
                      </div>
                      <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-red-600 transition-all group-hover:translate-x-1" />
                    </div>
                    <h3 className="mt-4 font-black text-lg text-slate-900">Pemetaan Spasial</h3>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">Analisis sebaran mustahik dan rute efektif layanan ambulans gratis berbasis koordinat GIS.</p>
                  </CardContent>
                </Card>
              </Link>

            </div>
          </div>

          {/* 4. AKTIVITAS TERKINI (SCD LOG) */}
          <Card className="border-2 shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b py-4">
              <CardTitle className="text-sm font-black flex items-center gap-2 text-slate-700">
                <TrendingUp className="h-4 w-4 text-emerald-500" /> Log Warehouse (SCD)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-b">
                {[
                  { msg: "Data PM Sosial diperbarui via AI", time: "Baru saja", type: "AI" },
                  { msg: "Batch ETL Donasi Berhasil", time: "1 jam lalu", type: "DW" },
                  { msg: "Mapping Wilayah: Kubu Raya", time: "3 jam lalu", type: "GIS" },
                  { msg: "SCD Type 2: Update Alamat Donatur", time: "5 jam lalu", type: "SCD" },
                ].map((log, i) => (
                  <div key={i} className="p-4 hover:bg-slate-50 transition-colors">
                    <p className="text-[11px] font-bold text-slate-800 leading-snug">{log.msg}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] font-black text-indigo-500 border border-indigo-200 px-1.5 rounded uppercase">{log.type}</span>
                      <span className="text-[9px] text-slate-400 font-bold">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 bg-white text-center">
                <Button variant="ghost" className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 hover:bg-transparent">
                  Buka Detail Log Audit
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}