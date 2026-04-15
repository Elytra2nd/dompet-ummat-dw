'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  TrendingUp, 
  Wallet, 
  Tag, 
  CalendarCheck,
  Info
} from 'lucide-react'
import { formatRupiah } from '@/lib/utils-ambulan'

interface PenyaluranSummaryProps {
  nominal: string | number;
  domain: string;
  kategori: string;
  jenis: string;
}

export default function PenyaluranSummary({ 
  nominal, 
  domain, 
  kategori, 
  jenis 
}: PenyaluranSummaryProps) {
  
  const numericNominal = typeof nominal === 'string' ? parseFloat(nominal) || 0 : nominal;

  return (
    <Card className="overflow-hidden border-2 border-emerald-100 bg-emerald-50/30">
      <CardContent className="p-5">
        <div className="flex flex-col space-y-4">
          {/* Header Ringkasan */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Preview Transaksi
              </span>
            </div>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none">
              Data Warehouse Ready
            </Badge>
          </div>

          {/* Display Nominal Besar */}
          <div className="py-2 border-y border-emerald-100/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Dana Disalurkan</p>
            <h2 className="text-3xl font-black text-emerald-700 tracking-tight">
              {formatRupiah(numericNominal)}
            </h2>
          </div>

          {/* Meta Data Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2">
              <Wallet className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Domain</p>
                <p className="text-xs font-semibold text-slate-700">{domain}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Tag className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Kategori</p>
                <p className="text-xs font-semibold text-slate-700">{kategori}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarCheck className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Tipe Bantuan</p>
                <p className="text-xs font-semibold text-slate-700">{jenis}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Status</p>
                <p className="text-xs font-bold text-emerald-600 italic">Siap Salur</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="bg-white/50 p-2 rounded border border-emerald-100">
             <p className="text-[9px] text-emerald-800 leading-tight">
               Pastikan nominal dan kategori sudah sesuai dengan berkas fisik sebelum menyimpan data ke dalam tabel fakta.
             </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}