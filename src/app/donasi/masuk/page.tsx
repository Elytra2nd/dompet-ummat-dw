'use client'

import { useState, useEffect } from 'react'
import DonationStats from '@/components/donasi/DonationStats'
import TransactionHistoryTable from '@/components/donasi/TransactionHistoryTable'
import FilterBar, { type FilterState, buildDefaultFilter, PROGRAM_FILTER_DEFAULT, type ProgramFilter } from '@/components/donasi/FilterBar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, HeartHandshake, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import ImportButton from '@/components/import/ImportButton'

export default function DonasiMasukPage() {
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(buildDefaultFilter())
  const [programFilter, setProgramFilter] = useState<ProgramFilter>(PROGRAM_FILTER_DEFAULT)
  const [stats, setStats] = useState({
    totalDonasi: 0,
    jumlahDonatur: 0,
    jumlahMustahik: 0,
    danaTersalur: 0,
    targetBulanan: 100000000,
    pertumbuhan: 0,
  })

  const [loading, setLoading] = useState(true)

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/donasi/stats')
      if (res.ok) {
        const data = await res.json()
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
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
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                <HeartHandshake className="h-7 w-7 text-indigo-600 shrink-0" />
                Penerimaan <span className="text-indigo-600">Donasi</span>
              </h1>
              <p className="mt-1 font-medium text-slate-500 text-sm">
                Pencatatan dana Ziswaf masuk untuk pemberdayaan ummat
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ImportButton modul="donasi" onImportSuccess={fetchStats} />
              <Button asChild className="bg-indigo-600 hover:bg-indigo-700 font-semibold text-sm shadow-md h-10">
                <Link href="/donasi/masuk/baru">
                  <Plus className="mr-2 h-4 w-4" /> Input Transaksi
                </Link>
              </Button>
              {loading && (
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Sinkronisasi...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <DonationStats
          appliedFilter={appliedFilter}
          programFilter={programFilter}
        />

        <TransactionHistoryTable />
      </div>
    </div>
  )
}