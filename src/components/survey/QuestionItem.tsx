'use client'

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
    <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6 transition-all duration-200 hover:shadow-md">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold tracking-widest text-slate-500 uppercase">
            {kode_pertanyaan}
          </span>
        </div>
        <p className="text-base leading-relaxed font-medium text-slate-800">
          {teks_pertanyaan}
        </p>
      </div>

      {/* Linear Scale */}
      <div className="mt-4 flex flex-col items-center gap-2">
        <div className="flex w-full items-center justify-between sm:justify-center sm:gap-6">
          <span className="hidden text-xs font-medium text-slate-400 sm:block">Sangat Buruk</span>
          
          <div className="flex w-full justify-between gap-1 rounded-full border border-slate-100 bg-slate-50 p-1.5 sm:w-auto sm:gap-3">
            {scores.map((val) => {
              const isActive = currentScore === val
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => onScoreChange(sk_pertanyaan, val)}
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-200 sm:h-12 sm:w-12 ${
                    isActive
                      ? 'z-10 scale-110 bg-indigo-600 text-white shadow-md'
                      : 'bg-transparent text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {isActive && (
                    <span className="absolute -right-1 -top-1 flex h-3 w-3">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-indigo-500"></span>
                    </span>
                  )}
                  {val}
                </button>
              )
            })}
          </div>
          
          <span className="hidden text-xs font-medium text-slate-400 sm:block">Sangat Baik</span>
        </div>
        
        {/* Mobile Labels */}
        <div className="flex w-full justify-between px-2 pt-1 sm:hidden">
           <span className="text-[10px] font-medium text-slate-400">Sangat Buruk</span>
           <span className="text-[10px] font-medium text-slate-400">Sangat Baik</span>
        </div>
      </div>
    </div>
  )
}
