'use client' // Paksa jadi Client Component total

import { useState, useEffect } from 'react'
import LocationPickerWrapper from '@/components/map/LocationPickerWrapper'
import { Loader2 } from 'lucide-react'

export default function InputLokasiPage() {
  const [mustahikList, setMustahikList] = useState([])
  const [loading, setLoading] = useState(true)

  // Ambil data lewat API saat halaman SUDAH terbuka di browser (bukan pas build)
  useEffect(() => {
    const fetchMustahik = async () => {
      try {
        const res = await fetch('/api/mustahik/tanpa-lokasi')
        if (res.ok) {
          const data = await res.json()
          setMustahikList(data)
        }
      } catch (error) {
        console.error('Gagal mengambil data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMustahik()
  }, [])

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8 font-sans">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Input Geospasial <span className="text-emerald-600">Dompet Ummat</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Tentukan titik rumah mustahik pada peta untuk memperbaiki data warehouse.
        </p>
      </header>

      <hr className="border-slate-200" />

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm font-bold text-slate-500">Menghubungkan ke TiDB Cloud...</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white shadow-sm p-2">
          <LocationPickerWrapper mustahikList={mustahikList} />
        </div>
      )}
    </div>
  )
}