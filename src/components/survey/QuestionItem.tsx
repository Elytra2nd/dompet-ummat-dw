'use client'

import { Star } from 'lucide-react'

interface QuestionItemProps {
  sk_pertanyaan: number;
  kode_pertanyaan: string;
  teks_pertanyaan: string;
  currentScore: number;
  onScoreChange: (sk: number, val: number) => void;
}

export default function QuestionItem({
  sk_pertanyaan,
  kode_pertanyaan,
  teks_pertanyaan,
  currentScore,
  onScoreChange
}: QuestionItemProps) {
  
  const scores = [1, 2, 3, 4, 5];

  return (
    <div className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-sm transition-all duration-200">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
            {kode_pertanyaan}
          </span>
        </div>
        <p className="text-sm font-semibold text-slate-700 leading-relaxed">
          {teks_pertanyaan}
        </p>
      </div>

      <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-full border border-slate-100">
        {scores.map((val) => {
          const isActive = currentScore === val;
          
          return (
            <button
              key={val}
              type="button"
              onClick={() => onScoreChange(sk_pertanyaan, val)}
              className={`
                relative w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-200
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md scale-110 z-10' 
                  : 'bg-transparent text-slate-400 hover:bg-white hover:text-blue-500'
                }
              `}
            >
              {isActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
              )}
              {val}
            </button>
          );
        })}
      </div>
    </div>
  )
}