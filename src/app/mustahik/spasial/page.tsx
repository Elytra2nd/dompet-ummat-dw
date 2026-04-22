'use client'

import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, MapPinned } from 'lucide-react'

// 1. Definisikan komponen peta secara dinamis dengan ssr: false
const SpatialMustahikMap = dynamic(
  () => import('@/components/mustahik/SpatialMustahikMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[600px] w-full rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="text-sm font-medium text-slate-500">Menyiapkan data peta...</p>
      </div>
    )
  }
)

export default function MustahikSpasialPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
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

          <div>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-slate-900">
              <MapPinned className="h-8 w-8 text-indigo-600" />
              Peta Spasial <span className="text-indigo-600">Mustahik</span>
            </h1>
            <p className="mt-1 font-medium text-slate-500">
              Visualisasi Spatial OLAP untuk sebaran mustahik berdasarkan wilayah administratif
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8">
        {/* 2. Gunakan komponen dinamis yang sudah didefinisikan di atas */}
        <div className="overflow-hidden rounded-xl bg-white shadow-md border border-slate-200">
           <SpatialMustahikMap />
        </div>
      </div>
    </div>
  )
}