'use client'

import { Star } from 'lucide-react'

interface QuestionItemProps {
  sk_pertanyaan: number
  kode_pertanyaan: string
  teks_pertanyaan: string
  currentScore: number
  onScoreChange: (sk: number, val: number) => void
}

export default function QuestionItem({
  sk_pertanyaan,
  kode_pertanyaan,
  teks_pertanyaan,
  currentScore,
  onScoreChange,
}: QuestionItemProps) {
  const scores = [1, 2, 3, 4, 5]

  return (
    <div className="group flex flex-col justify-between gap-4 rounded-xl border border-transparent p-4 transition-all duration-200 hover:border-slate-200 hover:bg-white hover:shadow-sm md:flex-row md:items-center">
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
            {kode_pertanyaan}
          </span>
        </div>
        <p className="text-sm leading-relaxed font-semibold text-slate-700">
          {teks_pertanyaan}
        </p>
      </div>

      <div className="flex items-center gap-1 rounded-full border border-slate-100 bg-slate-50 p-1.5">
        {scores.map((val) => {
          const isActive = currentScore === val

          return (
            <button
              key={val}
              type="button"
              onClick={() => onScoreChange(sk_pertanyaan, val)}
              className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'z-10 scale-110 bg-blue-600 text-white shadow-md'
                  : 'bg-transparent text-slate-400 hover:bg-white hover:text-blue-500'
              } `}
            >
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500"></span>
                </span>
              )}
              {val}
            </button>
          )
        })}
      </div>
    </div>
  )
}
