'use client'

import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

type WilayahItem = { label: string; total: number }
type GenderItem = { name: string; value: number; raw: string }

// Palet warna wilayah
const COLORS = [
  '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#16a34a',
  '#0891b2', '#4f46e5', '#ca8a04', '#2dd4bf', '#fb7185'
]

const GENDER_LABEL: Record<string, string> = {
  L: 'Laki-laki',
  P: 'Perempuan',
  Unknown: 'Tidak Diketahui',
}

const GENDER_COLOR: Record<string, string> = {
  L: '#2563eb',
  P: '#ec4899',
  Unknown: '#94a3b8',
}

const GENDER_BG: Record<string, string> = {
  L: '#eff6ff',
  P: '#fdf2f8',
  Unknown: '#f8fafc',
}

function extractArray(json: any): any[] {
  console.log('[DemografiStats] Raw API response:', json)

  if (Array.isArray(json)) return json
  if (Array.isArray(json?.data)) return json.data
  if (Array.isArray(json?.result)) return json.result
  if (Array.isArray(json?.items)) return json.items

  console.warn('[DemografiStats] Tidak menemukan array dalam response:', json)
  return []
}

function DemografiWilayah() {
  const [data, setData] = useState<WilayahItem[]>([])
  const [loading, setLoading] = useState(true)
  const [history, setHistory] = useState<{ kab: string | null; kec: string | null }>({
    kab: null,
    kec: null
  })

  const levelLabel = useMemo(() => {
    if (history.kec) return 'Desa'
    if (history.kab) return 'Kecamatan'
    return 'Kabupaten'
  }, [history])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (history.kab) params.append('kabupaten', history.kab)
      if (history.kec) params.append('kecamatan', history.kec)

      const res = await fetch(`/api/mustahik/wilayah?${params.toString()}`)
      const json = await res.json()

      if (json.success) {
        setData(json.data)
      }
    } catch (err) {
      console.error('Gagal memuat data wilayah:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [history])

  const onPieClick = (data: any, _index: number) => {
    const entry = data?.payload as WilayahItem | undefined
    if (!entry) return

    if (!history.kab) {
      setHistory((prev) => ({ ...prev, kab: entry.label }))
    } else if (!history.kec) {
      setHistory((prev) => ({ ...prev, kec: entry.label }))
    }
  }

  const goBack = () => {
    if (history.kec) setHistory({ ...history, kec: null })
    else if (history.kab) setHistory({ ...history, kab: null })
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white px-4 py-2 rounded-2xl shadow-xl text-xs font-bold border border-slate-700">
          {payload[0].name}: {payload[0].value.toLocaleString('id-ID')} Mustahik
        </div>
      )
    }
    return null
  }

  const total = useMemo(() => data.reduce((sum, item) => sum + item.total, 0), [data])

  const legendData = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.total - a.total)
    const top4 = sorted.slice(0, 4)
    const rest = sorted.slice(4)
    if (rest.length === 0) return top4    
    const restTotal = rest.reduce((sum, item) => sum + item.total, 0)
    return [...top4, { label: 'Lainnya', total: restTotal }]
  }, [data])

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 h-full border border-slate-100 transition-all">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            Sebaran Wilayah Mustahik
          </h2>
          <div className="flex items-center gap-2 mt-1 text-sm font-bold text-blue-600 uppercase tracking-tighter">
            <span className={!history.kab ? 'opacity-100' : 'opacity-40'}>SEMUA</span>
            {history.kab && (
              <>
                <span className="text-slate-300">/</span>
                <span className={!history.kec ? 'opacity-100' : 'opacity-40'}>{history.kab}</span>
              </>
            )}
            {history.kec && (
              <>
                <span className="text-slate-300">/</span>
                <span className="opacity-100">{history.kec}</span>
              </>
            )}
          </div>
        </div>

        {history.kab && (
          <button
            onClick={goBack}
            className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl transition-all active:scale-95"
          >
            ← Kembali
          </button>
        )}
      </div>

      {loading ? (
        <div className="h-[240px] flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sinkronisasi...</p>
        </div>
      ) : (
        <div className="flex flex-col xl:flex-row xl:items-center gap-6">
          <div className="relative w-full xl:w-[260px] h-[240px] xl:flex-shrink-0 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="total"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                  minAngle={6}
                  stroke="none"
                  onClick={onPieClick}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      className="hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
              <p className="text-3xl font-black text-slate-900">
                {total.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-2">
            {legendData.map((entry, index) => {
              const pct = total > 0 ? Math.round((entry.total / total) * 100) : 0
              const color = entry.label === 'Lainnya'
                ? '#94a3b8'
                : COLORS[index % COLORS.length]

              return (
                <div
                  key={entry.label}
                  className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-slate-100 transition-all hover:translate-x-1 cursor-pointer"
                  onClick={() => {
                    if (entry.label === 'Lainnya') return
                    if (!history.kab) setHistory((prev) => ({ ...prev, kab: entry.label }))
                    else if (!history.kec) setHistory((prev) => ({ ...prev, kec: entry.label }))
                  }}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate">{entry.label}</p>
                    <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-slate-900">
                      {entry.total.toLocaleString('id-ID')}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">{pct}%</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <p className="mt-3 text-[11px] text-slate-400 font-medium text-center italic">
        Klik item atau bagian grafik untuk drill-down ke level yang lebih dalam
      </p>
    </div>
  )
}

function DemografiStats() {
  const [data, setData] = useState<GenderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGenderStats = async () => {
      try {
        const res = await fetch('/api/mustahik/gender', { cache: 'no-store' })

        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)

        const json = await res.json()
        const rawArray = extractArray(json)

        const normalized: GenderItem[] = rawArray.map((item: any) => {
          const key = item.gender ?? 'Unknown'
          return {
            name: GENDER_LABEL[key] || key,
            value: Number(item.total) || 0,
            raw: key,
          }
        })

        setData(normalized)
      } catch (err: any) {
        console.error('[DemografiStats] Error:', err)
        setError(err.message || 'Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }

    fetchGenderStats()
  }, [])

  const total = useMemo(() => data.reduce((s, d) => s + d.value, 0), [data])
  const laki = useMemo(() => data.find((d) => d.raw === 'L')?.value ?? 0, [data])
  const perempuan = useMemo(() => data.find((d) => d.raw === 'P')?.value ?? 0, [data])
  const ratio = laki > 0 && perempuan > 0 ? (laki / perempuan).toFixed(2) : '–'
  const mayoritas = perempuan >= laki ? 'Perempuan' : 'Laki-laki'
  const mayorNum = Math.max(laki, perempuan)

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    const d = payload[0].payload
    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0

    return (
      <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg">
        {d.name}: {d.value.toLocaleString('id-ID')} orang ({pct}%)
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 rounded-3xl bg-white shadow-md">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Memuat data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 rounded-3xl bg-white shadow-md border border-red-100">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-500 mb-1">Gagal memuat data</p>
          <p className="text-xs text-slate-400">{error}</p>
          <p className="text-xs text-slate-400 mt-2">Cek console browser untuk detail response API</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Demografi Mustahik</h2>
        <p className="text-sm text-slate-400 mt-1">Distribusi berdasarkan gender</p>
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center gap-6">
        <div className="w-full xl:w-[260px] h-[240px] xl:flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                strokeWidth={3}
                stroke="#ffffff"
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={GENDER_COLOR[entry.raw] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {data.map((item) => {
            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0
            const color = GENDER_COLOR[item.raw] || '#94a3b8'
            const bg = GENDER_BG[item.raw] || '#f8fafc'

            return (
              <div
                key={item.raw}
                className="flex items-center gap-3 p-3 rounded-2xl border border-slate-100 transition-all hover:translate-x-1"
                style={{ background: bg }}
              >
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700">{item.name}</p>
                  <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-slate-900">
                    {item.value.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-slate-400 font-medium">{pct}%</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-slate-100" />

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Rasio L:P</p>
          <p className="text-xl font-extrabold text-blue-600">{ratio}</p>
          <p className="text-xs text-slate-400 mt-0.5">per perempuan</p>
        </div>
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Mayoritas</p>
          <p className="text-xl font-extrabold text-pink-500 truncate">{mayoritas}</p>
          <p className="text-xs text-slate-400 mt-0.5">{mayorNum.toLocaleString('id-ID')} orang</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Total</p>
          <p className="text-xl font-extrabold text-slate-900">{total.toLocaleString('id-ID')}</p>
          <p className="text-xs text-slate-400 mt-0.5">mustahik</p>
        </div>
      </div>
    </div>
  )
}

export default function DemografiGabungan() {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <DemografiStats />
      <DemografiWilayah />
    </div>
  )
}