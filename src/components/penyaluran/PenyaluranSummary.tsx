'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Wallet, Tag, CalendarCheck, Info } from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

interface PenyaluranSummaryProps {
  nominal: string | number
  domain: string
  kategori: string
  jenis: string
}

export default function PenyaluranSummary({
  nominal,
  domain,
  kategori,
  jenis,
}: PenyaluranSummaryProps) {
  const numericNominal =
    typeof nominal === 'string' ? parseFloat(nominal) || 0 : nominal

  return (
    <Card className="overflow-hidden border-2 border-emerald-100 bg-emerald-50/30">
      <CardContent className="p-5">
        <div className="flex flex-col space-y-4">
          {/* Header Ringkasan */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-xs font-bold tracking-wider text-emerald-800 uppercase">
                Preview Transaksi
              </span>
            </div>
            <Badge
              variant="secondary"
              className="border-none bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
            >
              Data Warehouse Ready
            </Badge>
          </div>

          {/* Display Nominal Besar */}
          <div className="border-y border-emerald-100/50 py-2">
            <p className="mb-1 text-[10px] font-bold text-slate-400 uppercase">
              Total Dana Disalurkan
            </p>
            <h2 className="text-3xl font-black tracking-tight text-emerald-700">
              {formatRupiah(numericNominal)}
            </h2>
          </div>

          {/* Meta Data Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Wallet className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  Domain
                </p>
                <p className="text-xs font-semibold text-slate-700">{domain}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  Kategori
                </p>
                <p className="text-xs font-semibold text-slate-700">
                  {kategori}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarCheck className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  Tipe Bantuan
                </p>
                <p className="text-xs font-semibold text-slate-700">{jenis}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">
                  Status
                </p>
                <p className="text-xs font-bold text-emerald-600 italic">
                  Siap Salur
                </p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="rounded border border-emerald-100 bg-white/50 p-2">
            <p className="text-[9px] leading-tight text-emerald-800">
              Pastikan nominal dan kategori sudah sesuai dengan berkas fisik
              sebelum menyimpan data ke dalam tabel fakta.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
