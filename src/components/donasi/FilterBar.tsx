'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Filter, X } from 'lucide-react'
import { toast } from 'sonner'

export type FilterType = 'none' | 'year' | 'month' | 'day'
export type Grain = 'year' | 'month' | 'day'

export interface FilterState {
  filterType: FilterType
  grain: Grain
  startYear: string
  endYear: string
  startMonth: string
  endMonth: string
  startDate: string
  endDate: string
}

export function buildDefaultFilter(minYear?: string | null, maxYear?: string | null): FilterState {
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

export function normalizeFilter(filter: FilterState): FilterState {
  if (filter.filterType === 'none') return { ...filter, grain: 'year' }
  if (filter.filterType === 'year') return { ...filter, grain: 'year' }
  if (filter.filterType === 'month') return { ...filter, grain: 'month' }
  return { ...filter, grain: 'day' }
}

export function getFilterLabel(filter: FilterState) {
  if (filter.filterType === 'none') return 'Semua Tahun'
  if (filter.filterType === 'year') return `${filter.startYear} - ${filter.endYear}`
  if (filter.filterType === 'month') return `${filter.startMonth} s.d. ${filter.endMonth}`
  return `${filter.startDate} s.d. ${filter.endDate}`
}

export function buildQueryParams(filter: FilterState): URLSearchParams {
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

interface FilterBarProps {
  appliedFilter: FilterState
  availableYears: string[]
  onApply: (filter: FilterState) => void
  onReset: () => void
}

export default function FilterBar({
  appliedFilter,
  availableYears,
  onApply,
  onReset,
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<FilterState>(appliedFilter)

  const activeLabel = getFilterLabel(appliedFilter)

  const handleFilterTypeChange = (value: FilterType) => {
    setDraft((prev) => normalizeFilter({ ...prev, filterType: value }))
  }

  const handleApply = () => {
    const normalized = normalizeFilter(draft)
    if (normalized.filterType === 'year' && (!normalized.startYear || !normalized.endYear)) {
      toast.error('Pilih tahun awal dan tahun akhir terlebih dahulu')
      return
    }
    if (normalized.filterType === 'month' && (!normalized.startMonth || !normalized.endMonth)) {
      toast.error('Pilih bulan awal dan bulan akhir terlebih dahulu')
      return
    }
    if (normalized.filterType === 'day' && (!normalized.startDate || !normalized.endDate)) {
      toast.error('Pilih tanggal awal dan tanggal akhir terlebih dahulu')
      return
    }
    onApply(normalized)
    setIsOpen(false)
  }

  const handleReset = () => {
    setDraft(appliedFilter)
    onReset()
    setIsOpen(false)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {/* Label periode aktif */}
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
          <Calendar className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter Periode Aktif</p>
          <p className="text-sm font-bold text-slate-800">{activeLabel}</p>
        </div>
        {appliedFilter.filterType !== 'none' && (
          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
            Filter aktif
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="relative flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setDraft(appliedFilter)
            setIsOpen((prev) => !prev)
          }}
          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-bold shadow-sm transition ${
            isOpen
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filter
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {appliedFilter.filterType !== 'none' && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
          >
            <X className="h-4 w-4" />
            Reset
          </button>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 top-11 z-20 w-[min(340px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Pilih Tipe Filter</p>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['none', 'year', 'month', 'day'] as FilterType[]).map((type) => {
                const labels: Record<FilterType, string> = { none: 'Semua', year: 'Tahun', month: 'Bulan', day: 'Hari' }
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleFilterTypeChange(type)}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                      draft.filterType === type
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {labels[type]}
                  </button>
                )
              })}
            </div>

            {draft.filterType === 'year' && (
              <div className="mt-4 grid grid-cols-2 gap-3">
                {(['startYear', 'endYear'] as const).map((field, i) => (
                  <div key={field}>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                      {i === 0 ? 'Tahun Awal' : 'Tahun Akhir'}
                    </label>
                    <select
                      value={draft[field]}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="">Pilih</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {draft.filterType === 'month' && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                {(['startMonth', 'endMonth'] as const).map((field, i) => (
                  <div key={field}>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                      {i === 0 ? 'Bulan Awal' : 'Bulan Akhir'}
                    </label>
                    <input
                      type="month"
                      value={draft[field]}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                ))}
              </div>
            )}

            {draft.filterType === 'day' && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                {(['startDate', 'endDate'] as const).map((field, i) => (
                  <div key={field}>
                    <label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
                      {i === 0 ? 'Tanggal Awal' : 'Tanggal Akhir'}
                    </label>
                    <input
                      type="date"
                      value={draft[field]}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"
              >
                Terapkan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Spatial Filter ────────────────────────────────────────────────────────
// Dipakai untuk filter wilayah dari klik peta, di-pass ke semua chart

export interface SpatialFilter {
  level: 'nasional' | 'provinsi' | 'kabupaten' | 'kecamatan'
  provinsi: string | null
  kabupaten: string | null
  kecamatan: string | null
}

export const SPATIAL_DEFAULT: SpatialFilter = {
  level: 'nasional',
  provinsi: null,
  kabupaten: null,
  kecamatan: null,
}

/** Tambahkan spatial filter params ke URLSearchParams yang sudah ada */
export function appendSpatialParams(
  params: URLSearchParams,
  spatial: SpatialFilter
): URLSearchParams {
  if (spatial.provinsi) params.set('provinsi', spatial.provinsi)
  if (spatial.kabupaten) params.set('kabupaten', spatial.kabupaten)
  if (spatial.kecamatan) params.set('kecamatan', spatial.kecamatan)
  return params
}

/** Label ringkas untuk badge spatial filter */
export function getSpatialLabel(spatial: SpatialFilter): string | null {
  if (spatial.kecamatan) return `Kec. ${spatial.kecamatan}`
  if (spatial.kabupaten) return spatial.kabupaten
  if (spatial.provinsi) return `Prov. ${spatial.provinsi}`
  return null
}


// ─── Program Filter ────────────────────────────────────────────────────────

// Program yang relevan untuk filter (excludes meta values)
export const PROGRAM_OPTIONS = [
  { value: 'Pendidikan',        label: 'Pendidikan',         color: 'bg-blue-500',   light: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'Kesehatan',         label: 'Kesehatan',          color: 'bg-rose-500',   light: 'bg-rose-50 text-rose-700 border-rose-200' },
  { value: 'Ekonomi',           label: 'Ekonomi',            color: 'bg-amber-500',  light: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'Sosial Kemanusiaan',label: 'Sosial Kemanusiaan', color: 'bg-emerald-500',light: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'Dakwah & Advokasi', label: 'Dakwah & Advokasi',  color: 'bg-violet-500', light: 'bg-violet-50 text-violet-700 border-violet-200' },
] as const

export type ProgramValue = typeof PROGRAM_OPTIONS[number]['value'] | null

export interface ProgramFilter {
  program: ProgramValue
}

export const PROGRAM_FILTER_DEFAULT: ProgramFilter = { program: null }

/** Tambahkan program filter params ke URLSearchParams yang sudah ada */
export function appendProgramParams(
  params: URLSearchParams,
  programFilter: ProgramFilter
): URLSearchParams {
  if (programFilter.program) {
    params.set('program', programFilter.program)
    // Saat program aktif, ProgramStats langsung ke level subprogram
    params.set('showSubProgram', 'true')
  }
  return params
}

export function getProgramLabel(programFilter: ProgramFilter): string | null {
  if (!programFilter.program) return null
  return PROGRAM_OPTIONS.find(p => p.value === programFilter.program)?.label ?? programFilter.program
}