'use client'

import { useState, useEffect } from 'react'
import AddDonasiForm from '@/components/donasi/AddDonasiForm'
import DonationStats from '@/components/donasi/DonationStats'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HeartHandshake, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DonasiMasukPage() {
  // 1. Perbarui Initial State agar sinkron dengan interface DonationStatsProps
  const [stats, setStats] = useState({
    totalDonasi: 0,
    jumlahDonatur: 0,
    jumlahMustahik: 0, // Tambahkan ini
    dana_tersalur: 0,
    targetBulanan: 100000000,
    pertumbuhan: 0,
  })
  
  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/donasi/stats')
      if (res.ok) {
        const data = await res.json()
        // Gunakan spread untuk menjaga nilai default (seperti targetBulanan) 
        // jika API tidak mengirimkan semua field
        setStats((prev) => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Gagal memuat statistik donasi:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="mb-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 text-slate-500 transition-colors hover:text-indigo-600"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
                <HeartHandshake className="h-8 w-8 text-indigo-600" />
                Penerimaan <span className="text-indigo-600">Donasi</span>
              </h1>
              <p className="mt-1 font-medium text-slate-500">
                Pencatatan dana Ziswaf masuk untuk pemberdayaan ummat
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sinkronisasi Data...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-8">
        {/* 2. Kirim Props secara lengkap ke komponen DonationStats */}
        <DonationStats
          totalDonasi={stats.totalDonasi}
          jumlahDonatur={stats.jumlahDonatur}
          jumlahMustahik={stats.jumlahMustahik}
          dana_tersalur={stats.dana_tersalur}
          targetBulanan={stats.targetBulanan}
          pertumbuhan={stats.pertumbuhan}
        />

        {/* FORM UTAMA */}
        <AddDonasiForm />
      </div>
    </div>
  )
}