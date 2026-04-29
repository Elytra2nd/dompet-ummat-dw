'use client'

import { useEffect, useMemo, useState } from 'react'
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
import { Calendar, Filter, X } from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

type FilterType = 'none' | 'year' | 'month' | 'day'
type Grain = 'year' | 'month' | 'day'

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

interface FilterState {
  filterType: FilterType
  grain: Grain
  startYear: string
  endYear: string
  startMonth: string
  endMonth: string
  startDate: string
  endDate: string
}

const PROGRAM_KEY_MAP: Record<string, string> = {
  'Sosial Kemanusiaan': 'sosial',
  'Dakwah & Advokasi': 'dakwah',
  Pendidikan: 'pendidikan',
}

function buildDefaultFilter(minYear?: string | null, maxYear?: string | null): FilterState {
  return {
    filterType: 'none',
    grain: 'year',
    startYear: minYear ?? '',
    endYear: maxYear ?? '',
    startMonth: '',
    endMonth: '',
    startDate: '',
    endDate: '',
  }
}

function normalizeFilter(filter: FilterState): FilterState {
  if (filter.filterType === 'none') {
    return { ...filter, grain: 'year' }
  }

  if (filter.filterType === 'year') {
    return { ...filter, grain: 'year' }
  }

  if (filter.filterType === 'month') {
    return { ...filter, grain: 'month' }
  }

  return { ...filter, grain: 'day' }
}

function getFilterLabel(filter: FilterState) {
  if (filter.filterType === 'none') return 'Semua Tahun'
  if (filter.filterType === 'year') return `${filter.startYear} - ${filter.endYear}`
  if (filter.filterType === 'month') return `${filter.startMonth} s.d. ${filter.endMonth}`
  return `${filter.startDate} s.d. ${filter.endDate}`
}

function buildQueryParams(filter: FilterState) {
  const params = new URLSearchParams()
  params.set('filterType', filter.filterType)
  params.set('grain', filter.grain)

  if (filter.filterType === 'year') {
    params.set('startYear', filter.startYear)
    params.set('endYear', filter.endYear)
  }

  if (filter.filterType === 'month') {
    params.set('startMonth', filter.startMonth)
    params.set('endMonth', filter.endMonth)
  }

  if (filter.filterType === 'day') {
    params.set('startDate', filter.startDate)
    params.set('endDate', filter.endDate)
  }

  return params
}

export default function ProgramStats() {
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const [chartData, setChartData] = useState<ChartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedParent, setSelectedParent] = useState<string | null>(null)
  const [selectedParentKey, setSelectedParentKey] = useState<string | null>(null)

  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [minYear, setMinYear] = useState<string | null>(null)
  const [maxYear, setMaxYear] = useState<string | null>(null)

  const [draftFilter, setDraftFilter] = useState<FilterState>(buildDefaultFilter())
  const [appliedFilter, setAppliedFilter] = useState<FilterState>(buildDefaultFilter())

  const activeFilterLabel = useMemo(() => {
    return getFilterLabel(appliedFilter)
  }, [appliedFilter])

  const fetchProgramData = async (filter: FilterState) => {
    try {
      setLoading(true)
      setError(null)

      const params = buildQueryParams(filter)
      const res = await fetch(`/api/donasi/program?${params.toString()}`, {
        cache: 'no-store',
      })

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
      setSelectedParentKey(null)
    } catch (err: any) {
      console.error('Gagal memuat data program:', err)
      setError(err?.message ?? 'Terjadi kesalahan saat memuat distribusi program')
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  const fetchSubProgramData = async (
    parentKey: string,
    parentLabel: string,
    filter: FilterState
  ) => {
    try {
      setLoading(true)
      setError(null)

      const params = buildQueryParams(filter)
      params.set('parent', parentKey)

      const url = `/api/donasi/subprogram?${params.toString()}`
      const res = await fetch(url, { cache: 'no-store' })

      const rawText = await res.text()
      let body: any = null

      try {
        body = rawText ? JSON.parse(rawText) : null
      } catch {
        body = rawText
      }

      if (!res.ok) {
        const message =
          typeof body === 'object' && body !== null
            ? body.detail || body.error || `HTTP ${res.status}`
            : body || `HTTP ${res.status}`

        throw new Error(message)
      }

      const rawData: SubProgramItem[] = Array.isArray(body?.data) ? body.data : []

      const mapped: ChartItem[] = rawData.map((item) => ({
        label: item.sub_program ?? 'Tidak Diketahui',
        jumlahTransaksi: Number(item.jumlahTransaksi) || 0,
        totalDonasi: Number(item.totalDonasi) || 0,
      }))

      setChartData(mapped)
      setSelectedParent(parentLabel)
      setSelectedParentKey(parentKey)
    } catch (err: any) {
      console.error('Gagal memuat data sub program:', err)
      setError(err?.message ?? 'Terjadi kesalahan saat memuat distribusi sub program')
      setChartData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await fetch('/api/donasi/tahun')
        if (!res.ok) throw new Error('Gagal memuat daftar tahun')

        const data = await res.json()

        const years = Array.isArray(data) ? data : data.years ?? []
        const min = Array.isArray(data) ? data[0] ?? null : data.minYear ?? null
        const max = Array.isArray(data) ? data[data.length - 1] ?? null : data.maxYear ?? null

        setAvailableYears(years)
        setMinYear(min)
        setMaxYear(max)

        const initialFilter = buildDefaultFilter(min, max)
        setDraftFilter(initialFilter)
        setAppliedFilter(initialFilter)
      } catch (error) {
        console.error('Gagal memuat tahun:', error)
      }
    }

    fetchYears()
  }, [])

  useEffect(() => {
    if (!appliedFilter.filterType) return

    if (selectedParent && selectedParentKey) {
      fetchSubProgramData(selectedParentKey, selectedParent, appliedFilter)
      return
    }

    fetchProgramData(appliedFilter)
  }, [appliedFilter])

  const handleBarClick = async (barData: any) => {
    if (selectedParent) return

    const payload = barData?.payload as ChartItem | undefined
    if (!payload?.parentKey) {
      setError('Parent key tidak ditemukan untuk bar yang dipilih')
      return
    }

    await fetchSubProgramData(payload.parentKey, payload.label, appliedFilter)
  }

  const handleBack = async () => {
    await fetchProgramData(appliedFilter)
  }

  const handleFilterTypeChange = (value: FilterType) => {
    setDraftFilter((prev) =>
      normalizeFilter({
        ...prev,
        filterType: value,
      })
    )
  }

  const handleApplyFilter = () => {
    const normalized = normalizeFilter(draftFilter)

    if (normalized.filterType === 'year') {
      if (!normalized.startYear || !normalized.endYear) {
        alert('Pilih tahun awal dan tahun akhir terlebih dahulu')
        return
      }
    }

    if (normalized.filterType === 'month') {
      if (!normalized.startMonth || !normalized.endMonth) {
        alert('Pilih bulan awal dan bulan akhir terlebih dahulu')
        return
      }
    }

    if (normalized.filterType === 'day') {
      if (!normalized.startDate || !normalized.endDate) {
        alert('Pilih tanggal awal dan tanggal akhir terlebih dahulu')
        return
      }
    }

    setAppliedFilter(normalized)
    setIsFilterOpen(false)
  }

  const handleResetFilter = () => {
    const resetFilter = buildDefaultFilter(minYear, maxYear)
    setDraftFilter(resetFilter)
    setAppliedFilter(resetFilter)
    setIsFilterOpen(false)
  }

  return (
    <Card className="border-none shadow-md">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-7">
        <div>
          <CardTitle className="text-xl font-black text-slate-800">
            {selectedParent ? 'Distribusi Donasi Sub Program' : 'Distribusi Donasi per Program'}
          </CardTitle>
          <CardDescription>
            {selectedParent
              ? `Rincian sub program untuk ${selectedParent}`
              : 'Klik salah satu bar untuk melihat rincian sub program'}
          </CardDescription>

          <div className="mt-3 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {activeFilterLabel}
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          {selectedParent && (
            <Button variant="outline" onClick={handleBack}>
              Kembali
            </Button>
          )}

          <button
            type="button"
            onClick={() => setIsFilterOpen((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Filter className="h-4 w-4" />
            Filter
          </button>

          {appliedFilter.filterType !== 'none' && (
            <button
              type="button"
              onClick={handleResetFilter}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
            >
              <X className="h-4 w-4" />
              Reset
            </button>
          )}

          {isFilterOpen && (
            <div className="absolute right-0 top-12 z-20 w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <p className="text-sm font-black text-slate-800">Filter Waktu</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="filterType"
                    checked={draftFilter.filterType === 'none'}
                    onChange={() => handleFilterTypeChange('none')}
                  />
                  Tanpa Range
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="filterType"
                    checked={draftFilter.filterType === 'year'}
                    onChange={() => handleFilterTypeChange('year')}
                  />
                  Range Tahun
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="filterType"
                    checked={draftFilter.filterType === 'month'}
                    onChange={() => handleFilterTypeChange('month')}
                  />
                  Range Bulan
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="filterType"
                    checked={draftFilter.filterType === 'day'}
                    onChange={() => handleFilterTypeChange('day')}
                  />
                  Range Hari
                </label>
              </div>

              {draftFilter.filterType === 'year' && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                      Tahun Awal
                    </label>
                    <select
                      value={draftFilter.startYear}
                      onChange={(e) =>
                        setDraftFilter((prev) => ({ ...prev, startYear: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">Pilih</option>
                      {availableYears.map((year) => (
                        <option key={`start-${year}`} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                      Tahun Akhir
                    </label>
                    <select
                      value={draftFilter.endYear}
                      onChange={(e) =>
                        setDraftFilter((prev) => ({ ...prev, endYear: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">Pilih</option>
                      {availableYears.map((year) => (
                        <option key={`end-${year}`} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {draftFilter.filterType === 'month' && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                      Bulan Awal
                    </label>
                    <input
                      type="month"
                      value={draftFilter.startMonth}
                      onChange={(e) =>
                        setDraftFilter((prev) => ({ ...prev, startMonth: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                      Bulan Akhir
                    </label>
                    <input
                      type="month"
                      value={draftFilter.endMonth}
                      onChange={(e) =>
                        setDraftFilter((prev) => ({ ...prev, endMonth: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              {draftFilter.filterType === 'day' && (
                <div className="mt-4 grid grid-cols-1 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                      Tanggal Awal
                    </label>
                    <input
                      type="date"
                      value={draftFilter.startDate}
                      onChange={(e) =>
                        setDraftFilter((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">
                      Tanggal Akhir
                    </label>
                    <input
                      type="date"
                      value={draftFilter.endDate}
                      onChange={(e) =>
                        setDraftFilter((prev) => ({ ...prev, endDate: e.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleApplyFilter}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  Terapkan
                </button>
              </div>
            </div>
          )}
        </div>
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