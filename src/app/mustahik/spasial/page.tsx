'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  ArrowLeft, MapPinned, Users, Globe, Database,
  MapPin, AlertCircle, UserPlus, Trophy, Star,
  TrendingUp, TrendingDown, Layers, AlertTriangle, CheckCircle2,
} from 'lucide-react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'

// ✅ Import FilterBar dan helpers untuk dipakai di level page
import FilterBar, {
  FilterState,
  buildDefaultFilter,
  buildQueryParams,
} from '@/components/donasi/FilterBar'

interface SpatialPoint {
  id: number
  nama: string
  lat: number
  lng: number
  kategori: string
  wilayah: string
  alamat: string
  provinsi: string
  kabupaten: string
  kecamatan: string
  desa: string
  tanggal?: string | null  // ✅ Sekarang API mengembalikan field ini
}

interface RankItem { label: string; jumlah: number; rank: number }

interface SpasialStats {
  mustahikBaru: number
  mustahikBaruBulanLalu?: number
  mustahikBaruPctChange?: number
  programTerbanyak: { nama: string; jumlah: number; ranking: RankItem[] } | null
  golonganTerbanyak: { nama: string; jumlah: number; ranking: RankItem[] } | null
}

// ✅ MustahikMap sekarang hanya terima points — filter waktu sudah dihandle di page ini
const SpatialMustahikMap = dynamic(
  () => import('@/components/map/MustahikMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] w-full items-center justify-center rounded-2xl border-2 border-dashed bg-white text-slate-400">
        <div className="text-center">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600 mx-auto" />
          <p className="font-bold uppercase tracking-tighter text-xs">Menginisialisasi Engine Spasial...</p>
        </div>
      </div>
    ),
  }
)

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />
}

export default function MustahikSpasialPage() {
  const [points, setPoints] = useState<SpatialPoint[]>([])
  const [totalMustahik, setTotalMustahik] = useState(0)
  const [spasialStats, setSpasialStats] = useState<SpasialStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [mapLoading, setMapLoading] = useState(false)

  // ✅ Filter waktu dikelola di page (lifted up), bukan di dalam MustahikMap
  // availableYears di-derive dari data yang sudah di-load
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [timeFilter, setTimeFilter] = useState<FilterState>(buildDefaultFilter())

  // -----------------------------------------------------------------------
  // Fetch data peta — dipanggil ulang setiap kali filter waktu berubah
  // Filter dikirim ke API sebagai query params sehingga filtering terjadi
  // di database (server-side), bukan di browser
  // -----------------------------------------------------------------------
  const fetchMapData = useCallback(async (filter: FilterState) => {
    try {
      setMapLoading(true)
      const params = buildQueryParams(filter)
      const res = await fetch(`/api/mustahik/map?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal mengambil data peta')
      const mapData: SpatialPoint[] = await res.json()
      if (Array.isArray(mapData)) {
        setPoints(mapData)
      }
    } catch (error) {
      console.error(error)
      toast.error('Gagal memuat data peta')
    } finally {
      setMapLoading(false)
    }
  }, [])

  // -----------------------------------------------------------------------
  // Load awal: data peta + stats + derive availableYears
  // -----------------------------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const [mapRes, statsRes, spasialRes] = await Promise.all([
          fetch('/api/mustahik/map'),           // tanpa filter — ambil semua untuk derive tahun
          fetch('/api/donasi/stats'),
          fetch('/api/mustahik/stats'),
        ])

        if (!mapRes.ok) throw new Error('Gagal mengambil data peta')

        type StatsResponse = { jumlahMustahik?: number }
        type SpasialResponse = SpasialStats & { error?: string }

        const [mapData, statsData, spasialData] = await Promise.all([
          mapRes.json() as Promise<SpatialPoint[]>,
          (statsRes.ok ? statsRes.json() : Promise.resolve({})) as Promise<StatsResponse>,
          (spasialRes.ok ? spasialRes.json() : Promise.resolve(null)) as Promise<SpasialResponse | null>,
        ])

        if (Array.isArray(mapData)) {
          setPoints(mapData)

          // ✅ Derive availableYears dari field tanggal yang kini ada di response
          const years = Array.from(
            new Set(
              mapData
                .map(p => p.tanggal?.slice(0, 4))
                .filter((y): y is string => !!y && y.length === 4 && !isNaN(Number(y)))
            )
          ).sort()

          setAvailableYears(years)

          // Set default filter dengan range tahun dari data
          if (years.length > 0) {
            setTimeFilter(buildDefaultFilter(years[0], years[years.length - 1]))
          }
        }

        if (statsData?.jumlahMustahik) setTotalMustahik(statsData.jumlahMustahik)
        if (spasialData && !spasialData.error) setSpasialStats(spasialData)
      } catch (error) {
        console.error(error)
        toast.error('Gagal sinkronisasi data spasial dari warehouse')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // -----------------------------------------------------------------------
  // Handler filter: saat user klik "Terapkan" di FilterBar
  // → kirim filter baru ke API, update peta dengan data hasil filter server
  // -----------------------------------------------------------------------
  const handleFilterApply = useCallback((filter: FilterState) => {
    setTimeFilter(filter)
    fetchMapData(filter)
  }, [fetchMapData])

  const handleFilterReset = useCallback(() => {
    const resetFilter = buildDefaultFilter(
      availableYears[0],
      availableYears[availableYears.length - 1]
    )
    setTimeFilter(resetFilter)
    fetchMapData(resetFilter)   // reset = ambil semua data lagi dari server
  }, [availableYears, fetchMapData])

  // -----------------------------------------------------------------------
  // Kalkulasi KPI
  // -----------------------------------------------------------------------
  const terpetakan = points.length
  const belumTerpetakan = Math.max(totalMustahik - terpetakan, 0)
  const pctTerpetakan = totalMustahik > 0 ? (terpetakan / totalMustahik) * 100 : 0

  const mustahikBaru = spasialStats?.mustahikBaru ?? 0
  const mustahikBaruBulanLalu = spasialStats?.mustahikBaruBulanLalu
  const pctChange: number | null = (() => {
    if (spasialStats?.mustahikBaruPctChange != null) return spasialStats.mustahikBaruPctChange
    if (mustahikBaruBulanLalu != null && mustahikBaruBulanLalu > 0)
      return ((mustahikBaru - mustahikBaruBulanLalu) / mustahikBaruBulanLalu) * 100
    return null
  })()

  const pctChangeLabel = pctChange != null
    ? `${pctChange >= 0 ? '+' : ''}${Math.round(pctChange)}% vs bulan lalu`
    : 'vs bulan lalu'

  const pctChangeColor = pctChange == null
    ? 'text-slate-400'
    : pctChange >= 0 ? 'text-sky-600' : 'text-rose-500'

  const PctChangeIcon = pctChange != null && pctChange < 0 ? TrendingDown : TrendingUp

  const programJumlah = spasialStats?.programTerbanyak?.jumlah ?? 0
  const programRankingTotal = spasialStats?.programTerbanyak?.ranking?.length ?? 0
  const golonganJumlah = spasialStats?.golonganTerbanyak?.jumlah ?? 0
  const golonganPct = totalMustahik > 0
    ? Math.round((golonganJumlah / totalMustahik) * 100)
    : 0

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* HEADER */}
      <div className="mb-4 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tighter text-slate-900">
                <MapPinned className="h-5 w-5 text-indigo-600" />
                Peta Spasial <span className="text-indigo-600">Mustahik</span>
              </h1>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                Visualisasi Spatial OLAP • Dompet Ummat Kalbar
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 border border-emerald-100">
                <Database className="h-3 w-3 text-emerald-600" />
                <span className="text-[8px] font-semibold text-emerald-700 uppercase">Warehouse Synced</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 border border-indigo-100">
                <Globe className="h-3 w-3 text-indigo-600" />
                <span className="text-[8px] font-semibold text-indigo-700 uppercase">Geo Ready</span>
              </div>
              {/* ✅ Indikator loading saat filter diterapkan */}
              {mapLoading && (
                <div className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 border border-amber-100">
                  <div className="h-2 w-2 animate-spin rounded-full border border-amber-500 border-t-transparent" />
                  <span className="text-[8px] font-semibold text-amber-700 uppercase">Memuat Peta...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-8 space-y-4">

        {/* ── KPI CARDS ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">

          {/* 1. Total Mustahik */}
          <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 p-3 text-white shadow-sm relative overflow-hidden">
            <p className="text-[8px] font-bold uppercase tracking-wider text-indigo-200 mb-1">Total Mustahik</p>
            {loading ? <Skeleton className="h-6 w-16 bg-white/20" /> : (
              <p className="text-lg font-extrabold leading-none">{totalMustahik.toLocaleString('id-ID')}</p>
            )}
            <p className="mt-1.5 flex items-center gap-1 text-[9px] text-indigo-200">
              <Users size={9} />
              Jiwa aktif terdaftar sistem
            </p>
          </div>

          {/* 2. Terpetakan */}
          <div className="rounded-xl bg-emerald-500 p-3 text-white shadow-sm relative overflow-hidden">
            <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-100 mb-1">Terpetakan</p>
            {loading ? <Skeleton className="h-6 w-16 bg-white/20" /> : (
              <p className="text-lg font-extrabold leading-none">{pctTerpetakan.toFixed(1)}%</p>
            )}
            <div className="mt-1.5 h-1 w-full rounded-full bg-white/30 overflow-hidden">
              <div className="h-full bg-white" style={{ width: `${pctTerpetakan}%` }} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-[9px] text-emerald-100">
              <MapPin size={9} />
              {loading ? '–' : `${terpetakan.toLocaleString('id-ID')} titik koordinat valid`}
            </p>
          </div>

          {/* 3. Belum Terpetakan */}
          <div className="rounded-xl bg-amber-500 p-3 text-white shadow-sm relative overflow-hidden">
            <p className="text-[8px] font-bold uppercase tracking-wider text-amber-100 mb-1">Belum Terpetakan</p>
            {loading ? <Skeleton className="h-6 w-16 bg-white/20" /> : (
              <p className="text-lg font-extrabold leading-none">{belumTerpetakan.toLocaleString('id-ID')}</p>
            )}
            <p className="mt-1.5 flex items-center gap-1 text-[9px] text-amber-100">
              <AlertTriangle size={9} />
              Perlu verifikasi alamat & GPS
            </p>
          </div>

          {/* 4. Mustahik Baru */}
          <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm relative">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Mustahik Baru</p>
            {loading ? <Skeleton className="h-6 w-16" /> : (
              <div className="flex items-baseline gap-1.5">
                <p className="text-lg font-extrabold text-slate-900 leading-none">
                  +{mustahikBaru}
                </p>
                {pctChange != null && (
                  <span className={`text-[10px] font-bold leading-none ${pctChangeColor}`}>
                    {pctChange >= 0 ? '+' : ''}{Math.round(pctChange)}%
                  </span>
                )}
              </div>
            )}
            <p className={`mt-1.5 flex items-center gap-1 text-[9px] font-medium ${pctChangeColor}`}>
              <PctChangeIcon size={9} />
              {loading ? '–' : pctChangeLabel}
            </p>
          </div>

          {/* 5. Top Program */}
          <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm relative overflow-hidden">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Top Program</p>
            {!loading && spasialStats?.programTerbanyak ? (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-800 truncate leading-tight uppercase">
                  {spasialStats.programTerbanyak.nama}
                </p>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '70%' }} />
                </div>
                <p className="flex items-center gap-1 text-[9px] text-emerald-600 font-medium">
                  <Trophy size={9} />
                  {programJumlah.toLocaleString('id-ID')} mustahik
                  {programRankingTotal > 0 && ` dari ${programRankingTotal} program`}
                </p>
              </div>
            ) : <Skeleton className="h-10 w-full" />}
          </div>

          {/* 6. Top Golongan */}
          <div className="rounded-xl bg-white border border-slate-100 p-3 shadow-sm relative overflow-hidden">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400 mb-1">Top Golongan</p>
            {!loading && spasialStats?.golonganTerbanyak ? (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-800 truncate leading-tight uppercase">
                  {spasialStats.golonganTerbanyak.nama}
                </p>
                <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500 rounded-full" style={{ width: '70%' }} />
                </div>
                <p className="flex items-center gap-1 text-[9px] text-violet-600 font-medium">
                  <Star size={9} />
                  {golonganPct}% dari total penerima manfaat
                </p>
              </div>
            ) : <Skeleton className="h-10 w-full" />}
          </div>

        </div>

        {/* ✅ FILTER WAKTU — dikelola di page level, bukan di dalam MustahikMap */}
        <FilterBar
          appliedFilter={timeFilter}
          availableYears={availableYears}
          onApply={handleFilterApply}
          onReset={handleFilterReset}
        />

        {/* PETA — terima points yang sudah difilter server */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <SpatialMustahikMap points={points} />
        </div>

      </div>
    </div>
  )
}