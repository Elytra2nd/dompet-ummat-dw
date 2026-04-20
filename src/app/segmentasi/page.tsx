'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, BrainCircuit, BarChart3, Users, Target } from 'lucide-react'
import Link from 'next/link'

export default function SegmentasiPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="mb-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 text-slate-500 transition-colors hover:text-emerald-600"
            >
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
                <BrainCircuit className="h-8 w-8 text-emerald-600" />
                Segmentasi <span className="text-emerald-600">Donatur</span>
              </h1>
              <p className="mt-1 font-medium text-slate-500">
                Analisis RFM & Clustering untuk pengelompokan donatur menggunakan K-Means dan K-Medoids
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-8">
        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/segmentasi/rfm" className="group">
            <div className="rounded-xl border bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
              <BarChart3 className="mb-4 h-10 w-10 text-emerald-600 transition-transform group-hover:scale-110" />
              <h3 className="text-lg font-semibold text-slate-900">Analisis RFM</h3>
              <p className="mt-2 text-sm text-slate-500">
                Hitung skor Recency, Frequency, dan Monetary untuk setiap donatur
              </p>
            </div>
          </Link>

          <Link href="/segmentasi/clustering" className="group">
            <div className="rounded-xl border bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
              <Target className="mb-4 h-10 w-10 text-emerald-600 transition-transform group-hover:scale-110" />
              <h3 className="text-lg font-semibold text-slate-900">Clustering</h3>
              <p className="mt-2 text-sm text-slate-500">
                Jalankan K-Means & K-Medoids clustering dengan evaluasi Silhouette, DBI, dan CHI
              </p>
            </div>
          </Link>

          <Link href="/segmentasi/profil" className="group">
            <div className="rounded-xl border bg-white p-6 shadow-sm transition-all hover:border-emerald-200 hover:shadow-md">
              <Users className="mb-4 h-10 w-10 text-emerald-600 transition-transform group-hover:scale-110" />
              <h3 className="text-lg font-semibold text-slate-900">Profil Segmen</h3>
              <p className="mt-2 text-sm text-slate-500">
                Lihat karakteristik dan rekomendasi strategi untuk setiap segmen donatur
              </p>
            </div>
          </Link>
        </div>

        {/* Placeholder — akan diisi nanti */}
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white/50 p-12 text-center">
          <BrainCircuit className="mx-auto mb-4 h-16 w-16 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-400">Fitur Segmentasi — Coming Soon</h3>
          <p className="mt-2 text-sm text-slate-400">
            Halaman ini akan menampilkan ringkasan hasil segmentasi terbaru
          </p>
        </div>
      </div>
    </div>
  )
}
