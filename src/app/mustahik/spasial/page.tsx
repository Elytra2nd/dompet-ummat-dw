'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, MapPinned } from 'lucide-react'
import dynamic from 'next/dynamic'

const SpatialMustahikMap = dynamic(
  () => import('@/components/mustahik/SpatialMustahikMap'),
  { ssr: false, loading: () => <div className="flex items-center justify-center py-20 text-slate-400">Memuat peta...</div> }
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
        <SpatialMustahikMap />
      </div>
    </div>
  )
}