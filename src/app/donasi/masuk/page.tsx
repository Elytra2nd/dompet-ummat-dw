'use client'

import { useState, useEffect } from 'react'
import AddDonasiForm from '@/components/donasi/AddDonasiForm'
import DonationStats from '@/components/donasi/DonationStats'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HeartHandshake, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function DonasiMasukPage() {
  const [stats, setStats] = useState({
    totalDonasi: 0,
    jumlahDonatur: 0,
    targetBulanan: 100000000, // Kamu bisa sesuaikan targetnya di sini
    pertumbuhan: 0
  })
  const [loading, setLoading] = useState(true)

  // Fungsi untuk mengambil data statistik dari API
  const fetchStats = async () => {
    try {
      const res = await fetch('/api/donasi/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error("Gagal memuat statistik donasi:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="bg-white border-b mb-8 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-500 hover:text-indigo-600 transition-colors">
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Dashboard
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                <HeartHandshake className="h-8 w-8 text-indigo-600" />
                Penerimaan <span className="text-indigo-600">Donasi</span>
              </h1>
              <p className="text-slate-500 mt-1 font-medium">
                Pencatatan dana Ziswaf masuk untuk pemberdayaan ummat Melawi
              </p>
            </div>
            {loading && (
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sinkronisasi Data...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 space-y-8">
        {/* WIDGET STATISTIK DINAMIS */}
        <DonationStats 
          totalDonasi={stats.totalDonasi} 
          jumlahDonatur={stats.jumlahDonatur} 
          targetBulanan={stats.targetBulanan} 
          pertumbuhan={stats.pertumbuhan} 
        />

        {/* FORM UTAMA */}
        <AddDonasiForm />
      </div>
    </div>
  )
}