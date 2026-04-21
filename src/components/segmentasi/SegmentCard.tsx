'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import type { SegmentConfig } from '@/lib/constants-segmentasi'

interface SegmentCardProps {
  segment: SegmentConfig & {
    count: number
    percentage: number
    avg_recency: number
    avg_frequency: number
    avg_monetary: number
  }
}

function formatRupiah(value: number): string {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `Rp${(value / 1_000).toFixed(0)}rb`
  return `Rp${value}`
}

export function SegmentCard({ segment }: SegmentCardProps) {
  // Dynamic icon lookup
  const IconComponent = (LucideIcons as any)[segment.iconName] || LucideIcons.Users

  return (
    <Link href={`/segmentasi/${segment.key}`} className="group">
      <Card className={`relative overflow-hidden border-2 ${segment.borderColor} bg-white shadow-sm transition-all hover:shadow-md hover:scale-[1.02]`}>
        <CardContent className="p-5">
          {/* Header: Icon + Count */}
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${segment.bgColor} transition-colors`}>
              <IconComponent className={`h-5 w-5 ${segment.color}`} />
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-900">{segment.count.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{segment.percentage}% donatur</p>
            </div>
          </div>

          {/* Title + Description */}
          <div className="mt-3">
            <h3 className={`text-sm font-black ${segment.color}`}>{segment.label}</h3>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">
              {segment.description}
            </p>
          </div>

          {/* Mini Stats */}
          <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Terakhir</p>
              <p className="text-xs font-black text-slate-700">{segment.avg_recency}hr</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Frekuensi</p>
              <p className="text-xs font-black text-slate-700">{segment.avg_frequency}x</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase">Donasi</p>
              <p className="text-xs font-black text-slate-700">{formatRupiah(segment.avg_monetary)}</p>
            </div>
          </div>

          {/* Hover Arrow */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className={`h-4 w-4 ${segment.color}`} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
