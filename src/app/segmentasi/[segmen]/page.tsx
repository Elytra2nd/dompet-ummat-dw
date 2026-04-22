'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Clock,
  Repeat,
  Banknote,
  Loader2,
  Download,
  Lightbulb,
  MessageSquare,
  Search,
  ArrowUpDown,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import Link from 'next/link'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts'
import { SEGMENT_CONFIGS, getSegmentConfig, SEGMENT_ORDER } from '@/lib/constants-segmentasi'
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
  description: string
  color: string
  bgColor: string
  borderColor: string
  iconName: string
  count: number
  percentage: number
  avg_recency: number
  avg_frequency: number
  avg_monetary: number
  total_monetary: number
  recommendation: {
    title: string
    description: string
    channels: string[]
  }
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

  const [segment, setSegment] = useState<SegmentDetail | null>(null)
  const [donaturList, setDonaturList] = useState<DonaturRow[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingDonatur, setLoadingDonatur] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDonatur, setTotalDonatur] = useState(0)
  const [overallStats, setOverallStats] = useState({ avg_recency: 0, avg_frequency: 0, avg_monetary: 0 })
  const [searchQuery, setSearchQuery] = useState('')
  const [sortKey, setSortKey] = useState<'recency' | 'frequency' | 'monetary' | 'rfm_score' | ''>('')
  const [sortAsc, setSortAsc] = useState(true)

  const { data: analysisData, loading: analysisLoading, runAnalysis } = useSegmentasi()

  // Use cached data from context
  useEffect(() => {
    runAnalysis() // uses cache if available
  }, [segmen])

  useEffect(() => {
    if (analysisData) {
      const found = analysisData.segments.find((s: any) => s.key === segmen)
      if (found) setSegment(found)
      setOverallStats({
        avg_recency: analysisData.stats.avg_recency,
        avg_frequency: analysisData.stats.avg_frequency,
        avg_monetary: analysisData.stats.avg_monetary,
      })
      setLoading(false)
    }
  }, [analysisData, segmen])

  // Fetch donatur list
  useEffect(() => {
    async function fetchDonatur() {
      setLoadingDonatur(true)
      try {
        const res = await fetch(`/api/segmentasi/donatur?segment=${segmen}&page=${page}&limit=15`)
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
  }, [segmen, page])

  // Radar chart data: perbandingan segmen ini vs rata-rata keseluruhan
  const radarData = segment ? [
    {
      metric: 'Waktu Donasi',
      segment: Math.max(0, 5 - Math.min(5, segment.avg_recency / (overallStats.avg_recency || 1) * 2.5)),
      overall: 2.5,
    },
    {
      metric: 'Frekuensi',
      segment: Math.min(5, (segment.avg_frequency / (overallStats.avg_frequency || 1)) * 2.5),
      overall: 2.5,
    },
    {
      metric: 'Nominal',
      segment: Math.min(5, (segment.avg_monetary / (overallStats.avg_monetary || 1)) * 2.5),
      overall: 2.5,
    },
  ] : []

  const IconComponent = (LucideIcons as any)[config.iconName] || LucideIcons.Users

  // Filter + Sort donatur
  const filteredDonatur = donaturList
    .filter(d => searchQuery === '' || d.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (!sortKey) return 0
      const diff = a[sortKey] - b[sortKey]
      return sortAsc ? diff : -diff
    })

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc)
    } else {
      setSortKey(key)
      setSortAsc(key === 'recency') // recency: ascending default, others: desc
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
      d.id_donatur, d.nama_lengkap, d.tipe, d.kontak,
      d.recency, d.frequency, d.monetary, d.rfm_score,
    ])
    const csv = [headers, ...csvRows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `donatur_${segmen}${all ? '_semua' : `_page${page}`}.csv`
    a.click()
    URL.revokeObjectURL(url)
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
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-4 ${config.bgColor}`}>
              <IconComponent className={`h-8 w-8 ${config.color}`} />
            </div>
            <div>
              <h1 className={`text-3xl font-black tracking-tight ${config.color}`}>{config.label}</h1>
              <p className="mt-1 font-medium text-slate-500">{config.description}</p>
            </div>
            {segment && (
              <div className="ml-auto text-right">
                <p className="text-3xl font-black text-slate-900">{segment.count.toLocaleString()}</p>
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
                  <CardTitle className="text-sm font-black text-slate-700">Profil Segmen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                    <div className="rounded-lg bg-blue-50 p-3"><Clock className="h-5 w-5 text-blue-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-slate-400">Waktu Sejak Donasi Terakhir</p>
                      <p className="text-xl font-black text-slate-900">{segment.avg_recency.toLocaleString()} hari</p>
                    </div>
                    <p className="text-xs text-slate-400">avg keseluruhan: {overallStats.avg_recency} hari</p>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                    <div className="rounded-lg bg-emerald-50 p-3"><Repeat className="h-5 w-5 text-emerald-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-slate-400">Frekuensi Donasi</p>
                      <p className="text-xl font-black text-slate-900">{segment.avg_frequency}x</p>
                    </div>
                    <p className="text-xs text-slate-400">avg keseluruhan: {overallStats.avg_frequency.toFixed(1)}x</p>
                  </div>

                  <div className="flex items-center gap-4 rounded-xl border border-slate-100 p-4">
                    <div className="rounded-lg bg-amber-50 p-3"><Banknote className="h-5 w-5 text-amber-600" /></div>
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-slate-400">Total Kontribusi</p>
                      <p className="text-xl font-black text-slate-900">{formatRupiah(segment.avg_monetary)}</p>
                    </div>
                    <p className="text-xs text-slate-400">avg: {formatRupiah(overallStats.avg_monetary)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Radar Chart */}
              <Card className="border-2 bg-white shadow-sm">
                <CardHeader className="border-b bg-slate-50/50 py-4">
                  <CardTitle className="text-sm font-black text-slate-700">Perbandingan vs Rata-rata</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fontWeight: 700, fill: '#475569' }} />
                        <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />
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
                <CardTitle className={`flex items-center gap-2 text-sm font-black ${config.color}`}>
                  <Lightbulb className="h-4 w-4" />
                  Rekomendasi Strategi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <h3 className="text-lg font-black text-slate-800">{segment.recommendation.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{segment.recommendation.description}</p>
                <div className="mt-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase text-slate-400">
                    <MessageSquare className="h-3 w-3" />
                    Channel yang Disarankan
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {segment.recommendation.channels.map((ch, i) => (
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
                <CardTitle className="text-sm font-black text-slate-700">
                  Daftar Donatur ({totalDonatur.toLocaleString()})
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={() => exportCSV(false)} variant="outline" size="sm" className="text-xs font-bold">
                    <Download className="mr-1 h-3 w-3" /> Halaman Ini
                  </Button>
                  <Button onClick={() => exportCSV(true)} size="sm" className="bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700">
                    <Download className="mr-1 h-3 w-3" /> Semua ({totalDonatur})
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Search Box */}
                <div className="border-b px-4 py-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama donatur..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                    />
                  </div>
                </div>
                {loadingDonatur ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b bg-slate-50 text-left">
                            <th className="px-4 py-3 font-bold uppercase text-slate-500">Nama</th>
                            <th className="px-4 py-3 font-bold uppercase text-slate-500">Tipe</th>
                            <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right cursor-pointer hover:text-emerald-600 select-none" onClick={() => handleSort('recency')}>
                              <span className="inline-flex items-center gap-1">Terakhir (hari) <ArrowUpDown className="h-3 w-3" /></span>
                            </th>
                            <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right cursor-pointer hover:text-emerald-600 select-none" onClick={() => handleSort('frequency')}>
                              <span className="inline-flex items-center gap-1">Frekuensi <ArrowUpDown className="h-3 w-3" /></span>
                            </th>
                            <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right cursor-pointer hover:text-emerald-600 select-none" onClick={() => handleSort('monetary')}>
                              <span className="inline-flex items-center gap-1">Total Donasi <ArrowUpDown className="h-3 w-3" /></span>
                            </th>
                            <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right cursor-pointer hover:text-emerald-600 select-none" onClick={() => handleSort('rfm_score')}>
                              <span className="inline-flex items-center gap-1">Skor <ArrowUpDown className="h-3 w-3" /></span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDonatur.map((d, i) => (
                            <tr key={d.sk_donatur} className={`border-b transition-colors hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-25'}`}>
                              <td className="px-4 py-3 font-semibold text-slate-800">{d.nama_lengkap}</td>
                              <td className="px-4 py-3 text-slate-500">{d.tipe}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{d.recency.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-slate-600">{d.frequency}x</td>
                              <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatRupiah(d.monetary)}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${config.bgColor} ${config.color}`}>
                                  {d.rfm_score}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t px-4 py-3">
                      <p className="text-xs text-slate-400">
                        Halaman {page} dari {totalPages}
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
