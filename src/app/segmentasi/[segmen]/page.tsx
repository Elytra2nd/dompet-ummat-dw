'use client'

import { useState, useEffect, use, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Clock,
  Repeat,
  Banknote,
  Loader2,
  Lightbulb,
  MessageSquare,
  Search,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  FileDown,
  ChevronDown,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  exportExcel,
  exportPDF,
  downloadBlob,
  buildFilename,
  SEGMEN_DONATUR_SCHEMA,
} from '@/lib/export'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import Link from 'next/link'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import { SEGMENT_CONFIGS, SEGMENT_ORDER, getSegmentConfig } from '@/lib/constants-segmentasi'
import { useSegmentasi } from '@/contexts/SegmentasiContext'

interface DonaturRow {
  sk_donatur: number
  id_donatur: string
  nama_lengkap: string
  tipe: string
  kontak: string
  recency: number
  frequency: number
  monetary: number
  r_score: number
  f_score: number
  m_score: number
  rfm_score: number
  segment_key: string
  segment_label: string
}

interface SegmentDetail {
  key: string
  label: string
  count: number
  percentage: number
  avg_recency: number
  avg_frequency: number
  avg_monetary: number
  total_monetary: number
  avg_r_score: number
  avg_f_score: number
  avg_m_score: number
}

// Format Rupiah
function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function SegmentDetailPage({
  params,
}: {
  params: Promise<{ segmen: string }>
}) {
  const { segmen } = use(params)
  const config = getSegmentConfig(segmen)

  const router = useRouter()
  const searchParamsHook = useSearchParams()

  // Init state dari URL params
  const [segment, setSegment] = useState<SegmentDetail | null>(null)
  const [donaturList, setDonaturList] = useState<DonaturRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDonatur, setLoadingDonatur] = useState(true)
  const [page, setPage] = useState(() => parseInt(searchParamsHook.get('page') ?? '1'))
  const [totalPages, setTotalPages] = useState(1)
  const [totalDonatur, setTotalDonatur] = useState(0)
  const [overallStats, setOverallStats] = useState({ avg_recency: 0, avg_frequency: 0, avg_monetary: 0 })
  const [searchQuery, setSearchQuery] = useState(() => searchParamsHook.get('search') ?? '')
  const [debouncedSearch, setDebouncedSearch] = useState(() => searchParamsHook.get('search') ?? '')
  const [sortKey, setSortKey] = useState<'recency' | 'frequency' | 'monetary' | 'rfm_score' | 'nama_lengkap' | ''>(
    () => (searchParamsHook.get('sort') ?? '') as 'recency' | 'frequency' | 'monetary' | 'rfm_score' | 'nama_lengkap' | ''
  )
  const [sortAsc, setSortAsc] = useState(() => (searchParamsHook.get('order') ?? 'desc') === 'asc')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [minMonetary, setMinMonetary] = useState('')
  const [maxMonetary, setMaxMonetary] = useState('')
  const [maxRecency, setMaxRecency] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const { data: analysisData, loading: analysisLoading, runAnalysis } = useSegmentasi()

  // Sync state ke URL (biar bisa share/refresh dan tetap di posisi yang sama)
  const syncURL = useCallback((p: number, s: string, sk: string, sa: boolean) => {
    const params = new URLSearchParams()
    if (p > 1) params.set('page', String(p))
    if (s) params.set('search', s)
    if (sk) { params.set('sort', sk); params.set('order', sa ? 'asc' : 'desc') }
    const qs = params.toString()
    router.replace(`/segmentasi/${segmen}${qs ? `?${qs}` : ''}`, { scroll: false })
  }, [segmen, router])

  useEffect(() => {
    runAnalysis()
  }, [segmen])

  useEffect(() => {
    if (analysisData) {
      const found = analysisData.segments.find((s: { key: string }) => s.key === segmen)
      if (found) setSegment(found)
      setOverallStats({
        avg_recency: analysisData.stats.avg_recency,
        avg_frequency: analysisData.stats.avg_frequency,
        avg_monetary: analysisData.stats.avg_monetary,
      })
      setLoading(false)
    }
  }, [analysisData, segmen])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch donatur + sync URL
  useEffect(() => {
    syncURL(page, debouncedSearch, sortKey, sortAsc)

    async function fetchDonatur() {
      setLoadingDonatur(true)
      try {
        const apiParams = new URLSearchParams({
          segment: segmen,
          page: String(page),
          limit: '15',
        })
        if (debouncedSearch) apiParams.set('search', debouncedSearch)
        if (sortKey) { apiParams.set('sort', sortKey); apiParams.set('order', sortAsc ? 'asc' : 'desc') }
        if (minMonetary) apiParams.set('min_monetary', minMonetary)
        if (maxMonetary) apiParams.set('max_monetary', maxMonetary)
        if (maxRecency) apiParams.set('max_recency', maxRecency)
        const res = await fetch(`/api/segmentasi/donatur?${apiParams}`)
        if (!res.ok) throw new Error('Gagal memuat donatur')
        const data = await res.json()
        setDonaturList(data.donatur)
        setTotalPages(data.total_pages)
        setTotalDonatur(data.total)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingDonatur(false)
      }
    }
    fetchDonatur()
  }, [segmen, page, debouncedSearch, sortKey, sortAsc, minMonetary, maxMonetary, maxRecency])

  // Keyboard shortcuts: "/" focus search, Esc clear search/filter
  const searchInputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // "/" → focus search (kalau tidak sedang typing di input lain)
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
      }
      // Esc → clear search dan filter
      if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQuery('')
        setMinMonetary('')
        setMaxMonetary('')
        setMaxRecency('')
        searchInputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Radar chart: pakai RFM score (1–5) yang sudah terstandarisasi — jauh lebih akurat
  const radarData = segment ? [
    { metric: 'Recency', segment: segment.avg_r_score, overall: 3, max: 5 },
    { metric: 'Frequency', segment: segment.avg_f_score, overall: 3, max: 5 },
    { metric: 'Monetary', segment: segment.avg_m_score, overall: 3, max: 5 },
  ] : []

  const IconComponent = (LucideIcons as any)[config.iconName] || LucideIcons.Users

  // Donatur sudah di-filter & sort dari server, langsung pakai
  const filteredDonatur = donaturList

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(key === 'recency') // recency: ascending default, others: desc
    }
  }

  // Escape CSV value — wrap in quotes if contains comma, quote, or newline
  const escapeCSV = (value: string | number | null | undefined): string => {
    const str = String(value ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const exportTitle = `Segmen_${config.label}_Donatur`

  const exportXLSX = async () => {
    try {
      const res = await fetch(`/api/segmentasi/donatur?segment=${segmen}&page=1&limit=99999`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const rows = data.donatur as Record<string, unknown>[]
      const blob = await exportExcel({
        title: exportTitle,
        subtitle: config.description,
        columns: SEGMEN_DONATUR_SCHEMA,
        rows,
      })
      downloadBlob(blob, buildFilename(exportTitle, 'xlsx'))
      toast.success('Excel berhasil diunduh')
    } catch {
      toast.error('Gagal export Excel')
    }
  }

  const exportPDFFile = async () => {
    try {
      const res = await fetch(`/api/segmentasi/donatur?segment=${segmen}&page=1&limit=99999`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const rows = data.donatur as Record<string, unknown>[]
      const blob = exportPDF({
        title: exportTitle,
        subtitle: config.description,
        columns: SEGMEN_DONATUR_SCHEMA,
        rows,
        landscape: true,
      })
      downloadBlob(blob, buildFilename(exportTitle, 'pdf'))
      toast.success('PDF berhasil dibuat')
    } catch {
      toast.error('Gagal export PDF')
    }
  }

  // Export CSV — all donatur in this segment
  const exportCSV = async (all = false) => {
    let rows = donaturList
    if (all) {
      try {
        const res = await fetch(`/api/segmentasi/donatur?segment=${segmen}&page=1&limit=99999`)
        if (res.ok) {
          const data = await res.json()
          rows = data.donatur
        }
      } catch (err) {
        console.error(err)
      }
    }
    if (rows.length === 0) return
    const headers = ['ID', 'Nama', 'Tipe', 'Kontak', 'Recency', 'Frequency', 'Monetary', 'RFM Score']
    const csvRows = rows.map((d: any) => [
      escapeCSV(d.id_donatur), escapeCSV(d.nama_lengkap), escapeCSV(d.tipe), escapeCSV(d.kontak),
      d.recency, d.frequency, d.monetary, d.rfm_score,
    ])
    const csv = [headers.map(escapeCSV), ...csvRows].map(r => r.join(',')).join('\n')
    // BOM UTF-8 prefix agar Excel bisa baca karakter Indonesia dengan benar
    const bom = '\ufeff'
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    // Dynamic filename dengan tanggal (YYYYMMDD)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    a.download = `donatur_${segmen}${all ? '_semua' : `_page${page}`}_${dateStr}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleSelect = (sk: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(sk) ? next.delete(sk) : next.add(sk)
      return next
    })
  }
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredDonatur.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredDonatur.map(d => d.sk_donatur)))
    }
  }
  const selectedDonatur = filteredDonatur.filter(d => selectedIds.has(d.sk_donatur))

  const exportSelected = async (fmt: 'csv' | 'xlsx' | 'pdf') => {
    if (selectedDonatur.length === 0) return
    const rows = selectedDonatur as unknown as Record<string, unknown>[]
    if (fmt === 'csv') {
      const headers = ['ID', 'Nama', 'Tipe', 'Kontak', 'Recency', 'Frequency', 'Monetary', 'RFM Score']
      const csvRows = selectedDonatur.map(d => [
        escapeCSV(d.id_donatur), escapeCSV(d.nama_lengkap), escapeCSV(d.tipe), escapeCSV(d.kontak),
        d.recency, d.frequency, d.monetary, d.rfm_score,
      ])
      const csv = [headers, ...csvRows].map(r => r.join(',')).join('\n')
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `seleksi_${segmen}_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`${selectedDonatur.length} donatur diekspor ke CSV`)
    } else {
      const title = `Seleksi_${config.label}_${selectedDonatur.length}donatur`
      const blob = fmt === 'xlsx'
        ? await exportExcel({ title, subtitle: config.description, columns: SEGMEN_DONATUR_SCHEMA, rows })
        : exportPDF({ title, subtitle: config.description, columns: SEGMEN_DONATUR_SCHEMA, rows, landscape: true })
      downloadBlob(blob, buildFilename(title, fmt))
      toast.success(`${selectedDonatur.length} donatur diekspor ke ${fmt.toUpperCase()}`)
    }
    setSelectedIds(new Set())
  }

  // Normalize nomor WA: 0xxx / +62xxx / 8xxx → 62xxx (return null kalau invalid)
  const normalizeWA = (raw: string | null | undefined): string | null => {
    if (!raw) return null
    const digits = String(raw).replace(/\D/g, '')
    if (digits.length < 9) return null
    if (digits.startsWith('0')) return '62' + digits.slice(1)
    if (digits.startsWith('62')) return digits
    if (digits.startsWith('8')) return '62' + digits
    return digits
  }

  // Format display nomor: 628987749739 → +62 898 7749 739
  const formatPhoneDisplay = (wa: string | null): string => {
    if (!wa) return '-'
    if (wa.length < 10) return wa
    return `+${wa.slice(0, 2)} ${wa.slice(2, 5)} ${wa.slice(5, 9)} ${wa.slice(9)}`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12 font-sans">
      {/* Header */}
      <div className="mb-8 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-8 py-6">
          <Link href="/segmentasi" className="mb-4 inline-flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors">
            <ArrowLeft className="h-3 w-3" /> Kembali ke Overview
          </Link>
          {/* Segmen switcher */}
          <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {SEGMENT_ORDER.map(key => {
              const cfg = SEGMENT_CONFIGS[key]
              const segData = analysisData?.segments.find((s: { key: string }) => s.key === key)
              const isActive = key === segmen
              return (
                <Link
                  key={key}
                  href={`/segmentasi/${key}`}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all whitespace-nowrap ${
                    isActive
                      ? `${cfg.bgColor} ${cfg.color} ${cfg.borderColor}`
                      : 'border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600'
                  }`}
                >
                  {cfg.label}
                  {segData ? <span className="ml-1.5 opacity-60">({segData.count.toLocaleString()})</span> : null}
                </Link>
              )
            })}
          </div>
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-4 ${config.bgColor}`}>
              <IconComponent className={`h-8 w-8 ${config.color}`} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold tracking-tight ${config.color}`}>{config.label}</h1>
              <p className="mt-1 font-medium text-slate-500">{config.description}</p>
            </div>
            {segment && (
              <div className="ml-auto text-right">
                <p className="text-3xl font-bold text-slate-900">{segment.count.toLocaleString()}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">{segment.percentage}% dari total</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-8">
        {segment && (
          <>
            {/* Profil + Radar */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Profil Box */}
              <Card className="border-2 bg-white shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 py-4">
                  <CardTitle className="text-sm font-bold text-slate-700">Profil Segmen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                    <div className="rounded-lg bg-blue-50 p-3"><Clock className="h-5 w-5 text-blue-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Waktu Sejak Donasi Terakhir</p>
                      <p className="text-xl font-bold text-slate-900">{segment.avg_recency.toLocaleString()} hari</p>
                    </div>
                    <p className="text-xs text-slate-400">avg keseluruhan: {overallStats.avg_recency} hari</p>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                    <div className="rounded-lg bg-emerald-50 p-3"><Repeat className="h-5 w-5 text-emerald-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Frekuensi Donasi</p>
                      <p className="text-xl font-bold text-slate-900">{segment.avg_frequency}x</p>
                    </div>
                    <p className="text-xs text-slate-400">avg keseluruhan: {overallStats.avg_frequency.toFixed(1)}x</p>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                    <div className="rounded-lg bg-amber-50 p-3"><Banknote className="h-5 w-5 text-amber-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Kontribusi</p>
                      <p className="text-xl font-bold text-slate-900">{formatRupiah(segment.avg_monetary)}</p>
                    </div>
                    <p className="text-xs text-slate-400">avg: {formatRupiah(overallStats.avg_monetary)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card className="border-2 bg-white shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 py-4">
                  <CardTitle className="text-sm font-bold text-slate-700">Perbandingan vs Rata-rata</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 8, fill: '#94a3b8' }} axisLine={false} />
                        <Radar name={config.label} dataKey="segment" stroke="#059669" fill="#059669" fillOpacity={0.3} strokeWidth={2} />
                        <Radar name="Rata-rata" dataKey="overall" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={1} strokeDasharray="5 5" />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-6 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      <span className="font-semibold text-slate-600">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-400" />
                      <span className="font-semibold text-slate-600">Rata-rata Keseluruhan</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rekomendasi Strategi */}
            <Card className={`border-2 ${config.borderColor} bg-white shadow-sm`}>
              <CardHeader className={`border-b ${config.bgColor} py-4`}>
                <CardTitle className={`flex items-center gap-2 text-sm font-bold ${config.color}`}>
                  <Lightbulb className="h-4 w-4" />
                  Rekomendasi Strategi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-slate-800">{config.recommendation.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{config.recommendation.description}</p>
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400">
                    <MessageSquare className="h-3 w-3" />
                    Channel yang Disarankan
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {config.recommendation.channels.map((ch, i) => (
                      <span key={i} className={`rounded-full px-3 py-1 text-xs font-bold ${config.bgColor} ${config.color}`}>
                        {ch}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabel Donatur */}
            <Card className="border-2 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50 py-4">
                <CardTitle className="text-sm font-bold text-slate-700">
                  Daftar Donatur ({totalDonatur.toLocaleString()})
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="bg-slate-900 text-xs font-bold text-white hover:bg-slate-800">
                      <FileDown className="mr-1.5 h-3.5 w-3.5" />
                      Export
                      <ChevronDown className="ml-1.5 h-3 w-3 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Format Resmi</DropdownMenuLabel>
                    <DropdownMenuItem onClick={exportXLSX}>
                      <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Excel <span className="font-normal text-slate-400">(.xlsx)</span></span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportPDFFile}>
                      <FileText className="h-3.5 w-3.5 text-rose-600" />
                      <span>PDF <span className="font-normal text-slate-400">(.pdf)</span></span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Data Mentah</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => exportCSV(true)}>
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span>CSV — semua donatur</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportCSV(false)}>
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <span>CSV — halaman ini</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="p-0">
                {/* Search + Filter toggle */}
                <div className="border-b px-4 py-3 space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Cari nama, ID, atau tipe... (tekan / untuk fokus)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => setShowAdvanced(v => !v)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-all ${
                        showAdvanced || minMonetary || maxMonetary || maxRecency
                          ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filter
                      {(minMonetary || maxMonetary || maxRecency) && (
                        <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  </div>

                  {showAdvanced && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Minimum Donasi (Rp)</label>
                        <input
                          type="number"
                          placeholder="e.g. 1000000"
                          value={minMonetary}
                          onChange={e => { setMinMonetary(e.target.value); setPage(1) }}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Donasi Max (Rp)</label>
                        <input
                          type="number"
                          placeholder="e.g. 10000000"
                          value={maxMonetary}
                          onChange={e => { setMaxMonetary(e.target.value); setPage(1) }}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 mb-1 block">Terakhir Donasi ≤ (hari)</label>
                        <input
                          type="number"
                          placeholder="e.g. 90"
                          value={maxRecency}
                          onChange={e => { setMaxRecency(e.target.value); setPage(1) }}
                          className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-200"
                        />
                      </div>
                      {(minMonetary || maxMonetary || maxRecency) && (
                        <div className="sm:col-span-3">
                          <button
                            onClick={() => { setMinMonetary(''); setMaxMonetary(''); setMaxRecency(''); setPage(1) }}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-600"
                          >
                            Reset semua filter
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Bulk action bar — muncul saat ada selection */}
                {selectedIds.size > 0 && (
                  <div className="flex items-center justify-between border-b bg-emerald-50 px-4 py-2.5">
                    <span className="text-xs font-bold text-emerald-700">
                      {selectedIds.size} donatur dipilih
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => exportSelected('csv')} className="rounded-lg border border-emerald-300 bg-white px-3 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition-colors">CSV</button>
                      <button onClick={() => exportSelected('xlsx')} className="rounded-lg border border-emerald-500 bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 transition-colors">Excel</button>
                      <button onClick={() => exportSelected('pdf')} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1 text-[10px] font-bold text-white hover:bg-slate-800 transition-colors">PDF</button>
                      <button onClick={() => setSelectedIds(new Set())} className="ml-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors">Batal</button>
                    </div>
                  </div>
                )}
                {loadingDonatur ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <tbody>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <tr key={i} className="border-b">
                            <td className="px-4 py-3"><div className="h-3 w-32 rounded-full bg-slate-100 animate-pulse" /></td>
                            <td className="px-4 py-3"><div className="h-3 w-16 rounded-full bg-slate-100 animate-pulse" /></td>
                            <td className="px-4 py-3"><div className="h-6 w-28 rounded-full bg-slate-100 animate-pulse ml-auto" /></td>
                            <td className="px-4 py-3"><div className="h-3 w-12 rounded-full bg-slate-100 animate-pulse ml-auto" /></td>
                            <td className="px-4 py-3"><div className="h-3 w-10 rounded-full bg-slate-100 animate-pulse ml-auto" /></td>
                            <td className="px-4 py-3"><div className="h-3 w-20 rounded-full bg-slate-100 animate-pulse ml-auto" /></td>
                            <td className="px-4 py-3"><div className="h-5 w-8 rounded-full bg-slate-100 animate-pulse ml-auto" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-slate-50 text-left">
                            <th className="w-10 px-4 py-3">
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 accent-emerald-600"
                                checked={filteredDonatur.length > 0 && selectedIds.size === filteredDonatur.length}
                                onChange={toggleSelectAll}
                              />
                            </th>
                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer hover:text-emerald-600 select-none" onClick={() => handleSort('nama_lengkap')}>
                              <span className="inline-flex items-center gap-1">Nama <ArrowUpDown className="h-3 w-3" /></span>
                            </th>
                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500">Tipe</th>
                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500">Kontak WA</th>
                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500 text-right cursor-pointer hover:text-emerald-600 select-none" onClick={() => handleSort('recency')}>
                              <span className="inline-flex items-center gap-1 justify-end w-full">Terakhir (hari) <ArrowUpDown className="h-3 w-3" /></span>
                            </th>
                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500 text-right cursor-pointer hover:text-emerald-600 select-none" onClick={() => handleSort('frequency')}>
                              <span className="inline-flex items-center gap-1 justify-end w-full">Frekuensi <ArrowUpDown className="h-3 w-3" /></span>
                            </th>
                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500 text-right cursor-pointer hover:text-emerald-600 select-none" onClick={() => handleSort('monetary')}>
                              <span className="inline-flex items-center gap-1 justify-end w-full">Total Donasi <ArrowUpDown className="h-3 w-3" /></span>
                            </th>
                            <th className="px-4 py-3 font-bold text-[10px] uppercase tracking-wider text-slate-500 text-right cursor-pointer hover:text-emerald-600 select-none" onClick={() => handleSort('rfm_score')}>
                              <span className="inline-flex items-center gap-1 justify-end w-full">Skor <ArrowUpDown className="h-3 w-3" /></span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDonatur.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                  <div className={`rounded-2xl p-4 ${config.bgColor}`}>
                                    <Users className={`h-8 w-8 ${config.color} opacity-50`} />
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-600">
                                      {debouncedSearch ? 'Tidak ditemukan donatur yang cocok' : 'Belum ada donatur di segmen ini'}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                      {debouncedSearch
                                        ? `Coba kata kunci lain — pencarian "${debouncedSearch}" tidak menghasilkan data.`
                                        : 'Jalankan ulang analisis segmentasi untuk memperbarui data donatur.'
                                      }
                                    </p>
                                  </div>
                                  {debouncedSearch && (
                                    <Button variant="outline" size="sm" className="text-xs font-bold" onClick={() => setSearchQuery('')}>
                                      Reset Pencarian
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ) : (
                          filteredDonatur.map((d, i) => {
                            const wa = normalizeWA(d.kontak)
                            return (
                              <tr key={d.sk_donatur} className={`border-b transition-colors hover:bg-slate-50 ${selectedIds.has(d.sk_donatur) ? 'bg-emerald-50' : i % 2 === 0 ? '' : 'bg-slate-25'}`}>
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    className="rounded border-slate-300 accent-emerald-600"
                                    checked={selectedIds.has(d.sk_donatur)}
                                    onChange={() => toggleSelect(d.sk_donatur)}
                                  />
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-800">{d.nama_lengkap}</td>
                                <td className="px-4 py-3 text-slate-500">{d.tipe}</td>
                                <td className="px-4 py-3">
                                  {wa ? (
                                    <a
                                      href={`https://wa.me/${wa}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-[11px] font-semibold text-green-700 hover:bg-green-100 transition-colors"
                                      title={`Chat ${d.nama_lengkap} via WhatsApp`}
                                    >
                                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                                      {formatPhoneDisplay(wa)}
                                    </a>
                                  ) : (
                                    <span className="text-[11px] text-slate-300">-</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-right text-slate-600">{d.recency.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-slate-600">{d.frequency}x</td>
                                <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatRupiah(d.monetary)}</td>
                                <td className="px-4 py-3 text-right">
                                  <Badge size="sm" className={`${config.bgColor} ${config.color}`}>
                                    {d.rfm_score}
                                  </Badge>
                                </td>
                              </tr>
                            )
                          })
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <p className="text-xs text-slate-400">
                        {(() => {
                          const from = (page - 1) * 15 + 1
                          const to = Math.min(page * 15, totalDonatur)
                          return totalDonatur > 0
                            ? `${from}–${to} dari ${totalDonatur.toLocaleString()} donatur`
                            : '0 donatur'
                        })()}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page <= 1}
                          onClick={() => setPage(p => p - 1)}
                          className="text-xs font-bold"
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={page >= totalPages}
                          onClick={() => setPage(p => p + 1)}
                          className="text-xs font-bold"
                        >
                          Selanjutnya
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
