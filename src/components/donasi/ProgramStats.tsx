'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatRupiah } from '@/lib/utils-ambulan'

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

interface SubProgramResponse {
  parent?: string
  data?: SubProgramItem[]
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
  Pendidikan: 'pendidikan',
}

export default function ProgramStats() {
  const [chartData, setChartData] = useState<ChartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedParent, setSelectedParent] = useState<string | null>(null)

  const fetchProgramData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch('/api/donasi/program', { cache: 'no-store' })
      if (!res.ok) throw new Error('Gagal memuat distribusi program')

      const json: ProgramItem[] = await res.json()

      const mapped: ChartItem[] = (json || []).map((item) => ({
        label: item.program,
        parentKey: PROGRAM_KEY_MAP[item.program],
        jumlahTransaksi: Number(item.jumlahTransaksi) || 0,
        totalDonasi: Number(item.totalDonasi) || 0,
      }))

      setChartData(mapped)
      setSelectedParent(null)
    } catch (err: any) {
      console.error('Gagal memuat data program:', err)
      setError(err?.message ?? 'Terjadi kesalahan saat memuat distribusi program')
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSubProgramData = async (parentKey: string, parentLabel: string) => {
    try {
      setLoading(true)
      setError(null)

      const url = `/api/donasi/subprogram?parent=${encodeURIComponent(parentKey)}`
      const res = await fetch(url, { cache: 'no-store' })

      const rawText = await res.text()
      let body: any = null

      try {
        body = rawText ? JSON.parse(rawText) : null
      } catch {
        body = rawText
      }

      console.log('SUB PROGRAM URL:', url)
      console.log('SUB PROGRAM STATUS:', res.status)
      console.log('SUB PROGRAM BODY:', body)

      if (!res.ok) {
        const message =
          typeof body === 'object' && body !== null
            ? body.detail || body.error || `HTTP ${res.status}`
            : body || `HTTP ${res.status}`

        throw new Error(message)
      }

      const rawData = Array.isArray(body?.data) ? body.data : []

      const mapped = rawData.map((item: any) => ({
        label: item.sub_program ?? item.program ?? 'Tidak Diketahui',
        jumlahTransaksi: Number(item.jumlahTransaksi) || 0,
        totalDonasi: Number(item.totalDonasi) || 0,
      }))

      setChartData(mapped)
      setSelectedParent(parentLabel)
    } catch (err: any) {
      console.error('Gagal memuat data sub program:', err)
      setError(err?.message ?? 'Terjadi kesalahan saat memuat distribusi sub program')
      setChartData([])
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchProgramData()
  }, [])

  const handleBarClick = async (barData: any) => {
    if (selectedParent) return

    const payload = barData?.payload as ChartItem | undefined
    if (!payload?.parentKey) {
      setError('Parent key tidak ditemukan untuk bar yang dipilih')
      return
    }

    await fetchSubProgramData(payload.parentKey, payload.label)
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-xl font-black text-slate-800">
            {selectedParent ? 'Distribusi Donasi Sub Program' : 'Distribusi Donasi per Program'}
          </CardTitle>
          <CardDescription>
            {selectedParent
              ? `Rincian sub program untuk ${selectedParent}`
              : 'Klik salah satu bar untuk melihat rincian sub program'}
          </CardDescription>
        </div>

        {selectedParent && (
          <Button variant="outline" onClick={fetchProgramData}>
            Kembali
          </Button>
        )}
      </CardHeader>

      <CardContent>
        <div className="h-[380px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
              Memuat data...
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
              Tidak ada data untuk ditampilkan
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                key={selectedParent ?? 'program'}
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />

                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${Number(value) / 1000000}jt`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />

                <YAxis
                  type="category"
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  width={170}
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                />

                <Tooltip
                  cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value) => [formatRupiah(Number(value)), 'Total Donasi']}
                />

                <Bar
                  dataKey="totalDonasi"
                  radius={[0, 8, 8, 0]}
                  cursor={selectedParent ? 'default' : 'pointer'}
                  onClick={handleBarClick}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={selectedParent ? '#3b82f6' : '#10b981'}
                    />
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