'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart3,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  TrendingUp,
  Info,
} from 'lucide-react'
import Link from 'next/link'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts'
import { SEGMENT_CONFIGS } from '@/lib/constants-segmentasi'

const SEGMENT_COLORS: Record<string, string> = {
  champions: '#059669',
  loyal: '#2563eb',
  potential: '#0d9488',
  new_donors: '#4f46e5',
  promising: '#0891b2',
  need_attention: '#d97706',
  at_risk: '#ea580c',
  hibernating: '#64748b',
  lost: '#dc2626',
}

interface SegmentData {
  key: string
  label: string
  count: number
  percentage: number
  avg_recency: number
  avg_frequency: number
  avg_monetary: number
  total_monetary: number
}

function formatRupiah(value: number): string {
  if (value >= 1_000_000_000) return `Rp${(value / 1_000_000_000).toFixed(1)}M`
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `Rp${(value / 1_000).toFixed(0)}rb`
  return `Rp${value}`
}

// Auto-generate insights dari data
function generateInsights(segments: SegmentData[], totalDonatur: number): string[] {
  const insights: string[] = []

  // Segmen terbesar
  const largest = [...segments].sort((a, b) => b.count - a.count)[0]
  if (largest) {
    const cfg = SEGMENT_CONFIGS[largest.key]
    insights.push(
      `Segmen "${cfg?.label || largest.label}" mendominasi dengan ${largest.count.toLocaleString()} donatur (${largest.percentage}%).`
    )
  }

  // Risk group
  const riskSegments = segments.filter(s => ['at_risk', 'hibernating', 'lost'].includes(s.key))
  const riskCount = riskSegments.reduce((sum, s) => sum + s.count, 0)
  const riskPct = Math.round((riskCount / totalDonatur) * 100)
  if (riskPct > 25) {
    insights.push(
      `Perhatian: ${riskPct}% donatur (${riskCount.toLocaleString()}) berada di kategori berisiko. Pertimbangkan kampanye re-aktivasi.`
    )
  }

  // Premium contribution
  const premiumSegments = segments.filter(s => ['champions', 'loyal'].includes(s.key))
  const premiumMonetary = premiumSegments.reduce((sum, s) => sum + s.total_monetary, 0)
  const totalMonetary = segments.reduce((sum, s) => sum + s.total_monetary, 0)
  if (totalMonetary > 0) {
    const premiumPct = Math.round((premiumMonetary / totalMonetary) * 100)
    insights.push(
      `Donatur Premium (Utama + Setia) menyumbang ${premiumPct}% dari total donasi keseluruhan.`
    )
  }

  // New donors
  const newDonors = segments.find(s => s.key === 'new_donors')
  if (newDonors && newDonors.count > 0) {
    insights.push(
      `${newDonors.count.toLocaleString()} donatur baru teridentifikasi. Kirim sambutan hangat untuk retensi awal.`
    )
  }

  // Top frequency
  const topFreq = [...segments].sort((a, b) => b.avg_frequency - a.avg_frequency)[0]
  if (topFreq) {
    const cfg = SEGMENT_CONFIGS[topFreq.key]
    insights.push(
      `"${cfg?.label || topFreq.label}" memiliki frekuensi donasi tertinggi (rata-rata ${topFreq.avg_frequency}x).`
    )
  }

  return insights
}

export default function PerbandinganPage() {
  const [segments, setSegments] = useState<SegmentData[]>([])
  const [totalDonatur, setTotalDonatur] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/segmentasi/run', { method: 'POST' })
        if (!res.ok) throw new Error('Gagal memuat data')
        const data = await res.json()
        setSegments(data.segments)
        setTotalDonatur(data.total_donatur)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Chart data
  const countData = segments.map(s => ({
    name: SEGMENT_CONFIGS[s.key]?.label || s.label,
    value: s.count,
    color: SEGMENT_COLORS[s.key] || '#94a3b8',
  }))

  const monetaryData = segments.map(s => ({
    name: SEGMENT_CONFIGS[s.key]?.label || s.label,
    value: s.total_monetary,
    color: SEGMENT_COLORS[s.key] || '#94a3b8',
  }))

  const insights = generateInsights(segments, totalDonatur)

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
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-slate-900">
            <BarChart3 className="h-8 w-8 text-emerald-600" />
            Perbandingan <span className="text-emerald-600">Segmen</span>
          </h1>
          <p className="mt-1 max-w-xl font-medium text-slate-500">
            Bandingkan jumlah donatur dan kontribusi antar segmen.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-8">
        {/* Bar Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Jumlah Donatur */}
          <Card className="border-2 bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-black text-slate-700">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
                Jumlah Donatur per Segmen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [`${value} donatur`, '']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                      {countData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Kontribusi Donasi */}
          <Card className="border-2 bg-white shadow-sm">
            <CardHeader className="border-b bg-slate-50/50 py-4">
              <CardTitle className="flex items-center gap-2 text-sm font-black text-slate-700">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Total Kontribusi per Segmen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monetaryData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => formatRupiah(v)} />
                    <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10, fontWeight: 600, fill: '#475569' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                      formatter={(value: any) => [formatRupiah(value), '']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                      {monetaryData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabel Ringkasan */}
        <Card className="border-2 bg-white shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 py-4">
            <CardTitle className="text-sm font-black text-slate-700">Ringkasan Semua Segmen</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-left">
                    <th className="px-4 py-3 font-bold uppercase text-slate-500">Segmen</th>
                    <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right">Donatur</th>
                    <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right">%</th>
                    <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right">Avg Terakhir</th>
                    <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right">Avg Frekuensi</th>
                    <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right">Avg Donasi</th>
                    <th className="px-4 py-3 font-bold uppercase text-slate-500 text-right">Total Kontribusi</th>
                  </tr>
                </thead>
                <tbody>
                  {segments.map((s, i) => (
                    <tr key={s.key} className={`border-b transition-colors hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-25'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: SEGMENT_COLORS[s.key] }} />
                          <Link href={`/segmentasi/${s.key}`} className="font-bold text-slate-800 hover:text-emerald-600 transition-colors">
                            {SEGMENT_CONFIGS[s.key]?.label || s.label}
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-800">{s.count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{s.percentage}%</td>
                      <td className="px-4 py-3 text-right text-slate-600">{s.avg_recency} hari</td>
                      <td className="px-4 py-3 text-right text-slate-600">{s.avg_frequency}x</td>
                      <td className="px-4 py-3 text-right text-slate-600">{formatRupiah(s.avg_monetary)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatRupiah(s.total_monetary)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Insight Box */}
        <Card className="border-2 border-emerald-200 bg-emerald-50/50 shadow-sm">
          <CardHeader className="border-b border-emerald-100 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-black text-emerald-800">
              <Info className="h-4 w-4" />
              Insight Otomatis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {insights.map((insight, i) => {
              const isWarning = insight.includes('Perhatian')
              return (
                <div key={i} className="flex items-start gap-3">
                  {isWarning ? (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  ) : (
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  )}
                  <p className="text-sm leading-relaxed text-slate-700">{insight}</p>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
