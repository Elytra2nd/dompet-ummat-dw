'use client'

import { ArrowLeft, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ClusteringPage() {
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
            <Target className="h-8 w-8 text-emerald-600" />
            K-Means & K-Medoids <span className="text-emerald-600">Clustering</span>
          </h1>
          <p className="mt-1 font-medium text-slate-500">
            Pengelompokan donatur menggunakan algoritma K-Means dan K-Medoids dengan evaluasi metrik
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8">
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center">
          <Target className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-400">Halaman Clustering</h3>
          <p className="mt-2 text-sm text-slate-400">Akan menampilkan Elbow Method, Silhouette Score, scatter plot, dan perbandingan K-Means vs K-Medoids</p>
        </div>
      </div>
    </div>
  )
}
