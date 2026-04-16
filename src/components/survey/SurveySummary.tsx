'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react'

interface SurveySummaryProps {
  score: number
  status: string
}

export default function SurveySummary({ score, status }: SurveySummaryProps) {
  const getStatusConfig = (statusName: string) => {
    switch (statusName) {
      case 'Sangat Layak':
        return {
          color: 'text-emerald-600',
          bgColor: 'bg-emerald-50',
          borderColor: 'border-emerald-200',
          // Kita pakai class Tailwind untuk target anak elemen (indicator)
          progressClass: '[&>div]:bg-emerald-500',
          icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
        }
      case 'Layak':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          progressClass: '[&>div]:bg-blue-500',
          icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />,
        }
      case 'Dipertimbangkan':
        return {
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          progressClass: '[&>div]:bg-amber-500',
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        }
      case 'Tidak Layak':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          progressClass: '[&>div]:bg-red-500',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
        }
      default:
        return {
          color: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
          progressClass: '[&>div]:bg-slate-500',
          icon: <Info className="h-5 w-5 text-slate-600" />,
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <Card
      className={`overflow-hidden border-2 transition-all duration-500 ${config.borderColor} ${config.bgColor}`}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <div className="flex items-center gap-2">
            {config.icon}
            <span
              className={`text-xs font-bold tracking-widest uppercase ${config.color}`}
            >
              Hasil Analisis Sistem
            </span>
          </div>

          <div className="relative flex items-center justify-center">
            <div
              className={`text-5xl font-black tracking-tighter ${config.color}`}
            >
              {score.toFixed(1)}
              <span className="ml-1 text-sm font-normal text-slate-400">
                /100
              </span>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`bg-white px-4 py-1 text-sm font-bold shadow-sm ${config.color} ${config.borderColor}`}
          >
            {status}
          </Badge>

          <div className="w-full space-y-1.5">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Kelayakan</span>
              <span>{score.toFixed(0)}%</span>
            </div>
            {/* PERBAIKAN DI SINI: 
                Hapus indicatorClassName, gunakan selector [&>div] di className 
            */}
            <Progress
              value={score}
              className={`h-2 w-full bg-slate-200 ${config.progressClass}`}
            />
          </div>

          <p className="text-[10px] leading-relaxed text-slate-500 italic">
            *Status ini dihasilkan secara otomatis berdasarkan algoritma
            pembobotan kriteria survey Dompet Ummat.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
