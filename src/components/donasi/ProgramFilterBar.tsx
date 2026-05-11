'use client'

import { PROGRAM_OPTIONS, type ProgramFilter, type ProgramValue } from '@/components/donasi/FilterBar'
import { X } from 'lucide-react'

interface ProgramFilterBarProps {
  programFilter: ProgramFilter
  onChange: (filter: ProgramFilter) => void
}

export default function ProgramFilterBar({ programFilter, onChange }: ProgramFilterBarProps) {
  const active = programFilter.program

  const handleClick = (value: ProgramValue) => {
    // Toggle — klik yang sama → reset
    onChange({ program: active === value ? null : value })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      {/* Label */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter Program</span>
        {active && (
          <button
            type="button"
            onClick={() => onChange({ program: null })}
            className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100 transition"
          >
            <X className="h-3 w-3" /> Reset
          </button>
        )}
      </div>

      <div className="h-4 w-px bg-slate-200 hidden sm:block" />

      {/* Pill buttons */}
      <div className="flex flex-wrap gap-2">
        {PROGRAM_OPTIONS.map((opt) => {
          const isActive = active === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleClick(opt.value)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold transition-all ${
                isActive
                  ? `${opt.light} shadow-sm scale-105`
                  : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 hover:bg-white'
              }`}
            >
              {/* Dot indikator warna */}
              <span className={`h-2 w-2 rounded-full ${isActive ? opt.color : 'bg-slate-300'}`} />
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Badge program aktif */}
      {active && (
        <div className="ml-auto hidden sm:flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 border border-slate-100">
          <span>Menampilkan sub-program</span>
          <span className="font-black text-slate-800">{active}</span>
        </div>
      )}
    </div>
  )
}