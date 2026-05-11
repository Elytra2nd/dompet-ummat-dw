'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { formatRupiah } from '@/lib/utils-ambulan'
import { type FilterState, type ProgramFilter, PROGRAM_FILTER_DEFAULT, buildQueryParams, appendProgramParams, getFilterLabel, PROGRAM_OPTIONS } from '@/components/donasi/FilterBar'

interface ProgramItem {
  program: string
  jumlahTransaksi: number | string
  totalDonasi: number | string
}

interface SubProgramItem {
  sub_program: string
  jumlahTransaksi: number | string
  totalDonasi: number | string
}

interface ChartItem {
  label: string
  parentKey?: string
  jumlahTransaksi: number
  totalDonasi: number
}

const PROGRAM_KEY_MAP: Record<string, string> = {
  'Sosial Kemanusiaan': 'sosial',
  'Dakwah & Advokasi': 'dakwah',
  'Pendidikan': 'pendidikan',
}

interface ProgramStatsProps {
  appliedFilter: FilterState
  programFilter?: ProgramFilter
}

export default function ProgramStats({ appliedFilter, programFilter = PROGRAM_FILTER_DEFAULT }: ProgramStatsProps) {
  const abortControllerRef = useRef<AbortController | null>(null)
  const [chartData, setChartData] = useState<ChartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [selectedParentKey, setSelectedParentKey] = useState<string | null>(null)

  const fetchProgramData = async (filter: FilterState) => {
    try {
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()
      setLoading(true)
      setError(null)
      const params = appendProgramParams(buildQueryParams(filter), programFilter)
      const res = await fetch(`/api/donasi/program?${params.toString()}`, {
        cache: 'no-store',
        signal: abortControllerRef.current.signal
      })
      if (!res.ok) throw new Error('Gagal memuat distribusi program')
      const json: ProgramItem[] = await res.json()
      setChartData((json || []).map((item) => ({
        label: item.program,
        parentKey: PROGRAM_KEY_MAP[item.program],
        jumlahTransaksi: Number(item.jumlahTransaksi) || 0,
        totalDonasi: Number(item.totalDonasi) || 0,
      })))
      setSelectedParent(null)
      setSelectedParentKey(null)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err?.message ?? 'Terjadi kesalahan saat memuat distribusi program')
        setChartData([])
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchSubProgramData = async (parentKey: string, parentLabel: string, filter: FilterState) => {
    try {
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()
      setLoading(true)
      setError(null)
      const params = buildQueryParams(filter)
      params.set('parent', parentKey)
      const res = await fetch(`/api/donasi/subprogram?${params.toString()}`, {
        cache: 'no-store',
        signal: abortControllerRef.current.signal
      })
      const rawText = await res.text()
      let body: any = null
      try { body = rawText ? JSON.parse(rawText) : null } catch { body = rawText }
      if (!res.ok) {
        const message = typeof body === 'object' && body !== null
          ? body.detail || body.error || `HTTP ${res.status}`
          : body || `HTTP ${res.status}`
        throw new Error(message)
      }
      const rawData: SubProgramItem[] = Array.isArray(body?.data) ? body.data : []
      setChartData(rawData.map((item) => ({
        label: item.sub_program ?? 'Tidak Diketahui',
        jumlahTransaksi: Number(item.jumlahTransaksi) || 0,
        totalDonasi: Number(item.totalDonasi) || 0,
      })))
      setSelectedParent(parentLabel)
      setSelectedParentKey(parentKey)
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err?.message ?? 'Terjadi kesalahan saat memuat distribusi sub program')
        setChartData([])
      }
    } finally {
      setLoading(false)
    }
  }

  // Re-fetch setiap filter berubah dari parent
  // Jika programFilter aktif → langsung tampil sub-program dari program tsb
  useEffect(() => {
    if (programFilter.program) {
      // Cari parentKey dari nilai program
      const opt = PROGRAM_OPTIONS.find(p => p.value === programFilter.program)
      const keyMap: Record<string, string> = {
        'Sosial Kemanusiaan': 'sosial',
        'Dakwah & Advokasi': 'dakwah',
        'Pendidikan': 'pendidikan',
        'Kesehatan': 'kesehatan',
        'Ekonomi': 'ekonomi',
      }
      const parentKey = keyMap[programFilter.program] ?? programFilter.program.toLowerCase()
      fetchSubProgramData(parentKey, programFilter.program, appliedFilter)
      return
    }

    if (selectedParent && selectedParentKey) {
      fetchSubProgramData(selectedParentKey, selectedParent, appliedFilter)
    } else {
      fetchProgramData(appliedFilter)
    }

    return () => {
      abortControllerRef.current?.abort()
    }
  }, [appliedFilter, programFilter])

  const handleBarClick = async (barData: any) => {
    if (selectedParent) return
    const payload = barData?.payload as ChartItem | undefined
    if (!payload?.parentKey) {
      setError('Parent key tidak ditemukan untuk bar yang dipilih')
      return
    }
    await fetchSubProgramData(payload.parentKey, payload.label, appliedFilter)
  }

  return (
    <Card className="border border-slate-200 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-7">
        <div>
          <CardTitle className="text-xl font-black text-slate-800">
            {selectedParent ? `Sub Program — ${selectedParent}` : programFilter.program ? `Program: ${programFilter.program}` : 'Distribusi Donasi per Program'}
          </CardTitle>
          <CardDescription>
            {selectedParent
              ? `Rincian sub program untuk ${selectedParent}`
              : 'Klik salah satu bar untuk melihat rincian sub program'}
          </CardDescription>
          <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {getFilterLabel(appliedFilter)}
          </div>
        </div>
        {selectedParent && (
          <Button variant="outline" onClick={() => fetchProgramData(appliedFilter)}>
            Kembali
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <div className="h-[380px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Memuat data...</div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-rose-600">{error}</div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">Tidak ada data untuk ditampilkan</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={selectedParent ?? 'program'}
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tickFormatter={(v) => `${Number(v) / 1000000}jt`} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis type="category" dataKey="label" axisLine={false} tickLine={false} width={170} tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(v) => [formatRupiah(Number(v)), 'Total Donasi']}
                />
                <Bar dataKey="totalDonasi" radius={[0, 8, 8, 0]} cursor={selectedParent ? 'default' : 'pointer'} onClick={handleBarClick}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={selectedParent ? '#3b82f6' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}