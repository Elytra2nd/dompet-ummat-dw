'use client'

import { ArrowLeft, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function RFMPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="mb-2">
            <Button variant="ghost" size="sm" asChild className="-ml-2 text-slate-500 hover:text-emerald-600">
              <Link href="/segmentasi"><ArrowLeft className="mr-2 h-4 w-4" /> Kembali</Link>
            </Button>
          </div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
            <BarChart3 className="h-8 w-8 text-emerald-600" />
            Analisis <span className="text-emerald-600">RFM</span>
          </h1>
          <p className="mt-1 font-medium text-slate-500">
            Perhitungan skor Recency, Frequency, dan Monetary untuk setiap donatur
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8">
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center">
          <BarChart3 className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-400">Halaman Analisis RFM</h3>
          <p className="mt-2 text-sm text-slate-400">Akan menampilkan tabel RFM, distribusi skor, dan statistik deskriptif</p>
        </div>
      </div>
    </div>
  )
}
