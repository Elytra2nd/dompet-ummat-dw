'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, MapPinned, Users, Globe, Database } from 'lucide-react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

// Inisialisasi tipe data untuk koordinat spasial
interface SpatialPoint {
  id: number;
  nama: string;
  lat: number;
  lng: number;
  kategori: string;
  wilayah: string;
  alamat: string;
}

// Import dinamis untuk komponen peta
const SpatialMustahikMap = dynamic(
  () => import('@/components/map/MustahikMap'),
  { 
    ssr: false, 
    loading: () => (
      <div className="flex h-[500px] w-full items-center justify-center rounded-2xl border-2 border-dashed bg-white text-slate-400">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600 mx-auto"></div>
          <p className="font-bold uppercase tracking-tighter text-xs">Menginisialisasi Engine Spasial...</p>
        </div>
      </div>
    ) 
  }
)

export default function MustahikSpasialPage() {
  // Solusi Error TS 2345: Memberikan tipe eksplisit <SpatialPoint[]>
  const [points, setPoints] = useState<SpatialPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMapData = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/mustahik/map')
        
        if (!res.ok) throw new Error("Gagal mengambil data")
        
        const data = await res.json()
        if (Array.isArray(data)) {
          setPoints(data)
        }
      } catch (error) {
        console.error(error)
        toast.error("Gagal sinkronisasi data spasial dari warehouse")
      } finally {
        setLoading(false)
      }
    }
    loadMapData()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* HEADER SECTION */}
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <div className="mb-2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="-ml-2 text-slate-500 font-bold transition-colors hover:text-indigo-600 uppercase text-[10px]"
            >
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-black tracking-tighter text-slate-900 uppercase">
                <MapPinned className="h-8 w-8 text-indigo-600" />
                Peta Spasial <span className="text-indigo-600">Mustahik</span>
              </h1>
              <p className="mt-1 text-sm font-bold text-slate-400 uppercase tracking-tight">
                Visualisasi <span className="text-indigo-500">Spatial OLAP</span> • Sebaran Administratif Dompet Ummat Kalbar
              </p>
            </div>
            
            {/* BADGE INFORMASI SSOT */}
            <div className="flex gap-2">
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 border border-emerald-100">
                <Database className="h-4 w-4 text-emerald-600" />
                <span className="text-[10px] font-black text-emerald-700 uppercase">Warehouse Synced</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 border border-indigo-100">
                <Globe className="h-4 w-4 text-indigo-600" />
                <span className="text-[10px] font-black text-indigo-700 uppercase">Geographic Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-8">
        {/* WIDGET RINGKASAN CEPAT */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-100">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-lg"><Users className="h-5 w-5 text-indigo-600" /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase">Total Objek Terpetakan</p>
                  <p className="text-xl font-black text-slate-900">
                    {loading ? "..." : `${points.length} Jiwa`}
                  </p>
                </div>
             </div>
          </div>
        </div>

        {/* CONTAINER UTAMA PETA & CHART */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <SpatialMustahikMap points={points} />
        </div>
      </div>
    </div>
  )
}