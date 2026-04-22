'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatRupiah } from '@/lib/utils-ambulan'

interface ProgramItem {
  program: string
  jumlahTransaksi: number
  totalDonasi: number
}

export default function ProgramStats() {
  const [programData, setProgramData] = useState<ProgramItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProgramData = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/donasi/program')
        if (!res.ok) throw new Error('Gagal memuat distribusi program')

        const data: ProgramItem[] = await res.json()
        setProgramData(data)
      } catch (err: any) {
        console.error('Gagal memuat data program:', err)
        setError(err?.message ?? 'Terjadi kesalahan saat memuat distribusi program')
        setProgramData([])
      } finally {
        setLoading(false)
      }
    }

    fetchProgramData()
  }, [])

  return (
    <Card className="border-none shadow-md">
      <CardHeader>
        <CardTitle className="text-xl font-black text-slate-800">
          Distribusi Donasi per Program
        </CardTitle>
        <CardDescription>
          Kontribusi nominal penghimpunan berdasarkan program utama
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="h-[380px] w-full">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
              Memuat distribusi program...
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-rose-600">
              {error}
            </div>
          ) : programData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm font-medium text-slate-500">
              Tidak ada data distribusi program
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={programData}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />

                <XAxis
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value / 1000000}jt`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                />

                <YAxis
                  type="category"
                  dataKey="program"
                  axisLine={false}
                  tickLine={false}
                  width={140}
                  tick={{ fill: '#334155', fontSize: 12, fontWeight: 600 }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [formatRupiah(value), 'Total Donasi']}
                />

                <Bar
                  dataKey="totalDonasi"
                  fill="#10b981"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </CardContent>
    </Card>
  )
}