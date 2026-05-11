'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import * as LucideIcons from 'lucide-react'
import { getSegmentConfig } from '@/lib/constants-segmentasi'

interface SegmentData {
  key: string
  label: string
  count: number
  percentage: number
  avg_recency: number
  avg_frequency: number
  avg_monetary: number
}

interface SegmentCardProps {
  segment: SegmentData
}

function formatRupiah(value: number): string {
  if (value >= 1_000_000) return `Rp${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `Rp${(value / 1_000).toFixed(0)}rb`
  return `Rp${value}`
}

// Status label untuk a11y — teks di samping warna (#29)
const SEGMENT_STATUS: Record<string, { text: string; badgeClass: string }> = {
  champions: { text: 'Terbaik', badgeClass: 'bg-emerald-100 text-emerald-700' },
  loyal: { text: 'Baik', badgeClass: 'bg-blue-100 text-blue-700' },
  potential: { text: 'Potensial', badgeClass: 'bg-teal-100 text-teal-700' },
  new_donors: { text: 'Baru', badgeClass: 'bg-indigo-100 text-indigo-700' },
  promising: { text: 'Menjanjikan', badgeClass: 'bg-cyan-100 text-cyan-700' },
  need_attention: { text: 'Perhatian', badgeClass: 'bg-amber-100 text-amber-700' },
  at_risk: { text: 'Berisiko', badgeClass: 'bg-orange-100 text-orange-700' },
  hibernating: { text: 'Tidak Aktif', badgeClass: 'bg-slate-100 text-slate-700' },
  lost: { text: 'Hilang', badgeClass: 'bg-red-100 text-red-700' },
}

export function SegmentCard({ segment }: SegmentCardProps) {
  // Resolve full config dari constants berdasarkan key
  const config = getSegmentConfig(segment.key)
  const status = SEGMENT_STATUS[segment.key] || { text: 'N/A', badgeClass: 'bg-slate-100 text-slate-600' }

  // Dynamic icon lookup
  const IconComponent = (LucideIcons as any)[config.iconName] || LucideIcons.Users

  return (
    <Link href={`/segmentasi/${segment.key}`} className="group">
      <Card className={`relative overflow-hidden border ${config.borderColor} bg-white shadow-sm transition-all hover:shadow-md`}>
        <CardContent className="p-5">
          {/* Header: Icon + Count */}
          <div className="flex items-start justify-between">
            <div className={`p-2.5 rounded-xl ${config.bgColor} transition-colors`}>
              <IconComponent className={`h-5 w-5 ${config.color}`} />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{segment.count.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{segment.percentage}% donatur</p>
            </div>
          </div>

          {/* Title + Status Badge (a11y) + Description */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold ${config.color}`}>{segment.label}</h3>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${status.badgeClass}`}>
                {status.text}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed mt-1 line-clamp-2">
              {config.description}
            </p>
          </div>

          {/* Mini Stats */}
          <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hari Terakhir</p>
              <p className="text-xs font-bold text-slate-700">{segment.avg_recency}h</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Jumlah Donasi</p>
              <p className="text-xs font-bold text-slate-700">{segment.avg_frequency}x</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rata-rata</p>
              <p className="text-xs font-bold text-slate-700">{formatRupiah(segment.avg_monetary)}</p>
            </div>
          </div>

          {/* Hover Arrow */}
          <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <ArrowRight className={`h-4 w-4 ${config.color}`} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

