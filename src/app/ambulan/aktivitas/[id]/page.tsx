'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Truck, 
  Calendar, 
  Clock, 
  DollarSign, 
  Tag, 
  Printer, 
  Trash2,
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function DetailAktivitasPage() {
  const params = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val)
  }

  useEffect(() => {
    setMounted(true)
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/ambulan/aktivitas?sk=${params.id}`)
        const allData = await res.json()
        // API aktivitas kita mengembalikan recentLogs, cari yang cocok dengan ID
        const detail = allData.recentLogs?.find(
          (item: any) => item.sk_fakta_aktivitas_ambulan.toString() === params.id
        )
        
        if (detail) {
          setData(detail)
        } else {
          toast.error("Data tidak ditemukan")
        }
      } catch (error) {
        toast.error("Gagal memuat detail data")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) fetchDetail()
  }, [params.id])

  if (!mounted) return null

  if (loading) {
    return (
      <div className="p-8 flex flex-col justify-center items-center min-h-screen gap-4">
        <Loader2 className="animate-spin h-10 w-10 text-rose-500" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memuat Dokumen...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8 text-center min-h-screen">
        <p>Data tidak ditemukan.</p>
        <Button asChild className="mt-4"><Link href="/ambulan/riwayat">Kembali</Link></Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-screen font-sans text-slate-900">
      {/* HEADER NAV */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm">
            <ArrowLeft size={18} />
          </Button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">Detail Transaksi <span className="text-rose-600">Aktivitas</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {data.id_transaksi}</p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={() => window.print()} className="flex-1 md:flex-initial bg-white uppercase text-[10px] font-bold tracking-widest h-10 px-6">
            <Printer size={16} className="mr-2" /> Cetak Log
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM UTAMA */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-slate-900 text-white p-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Ringkasan Pengeluaran</CardTitle>
                <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none px-3 font-bold uppercase text-[9px]">
                  {data.kategori_aktivitas?.replace(/_/g, ' ')}
                </Badge>
              </div>
              <h2 className="text-4xl font-black mt-4 tracking-tighter italic">
                {formatIDR(data.biaya_operasional || 0)}
              </h2>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Truck size={20}/></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Armada Penanggungjawab</p>
                      <p className="font-bold text-slate-900 uppercase mt-1">{data.armada?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Calendar size={20}/></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Aktivitas</p>
                      <p className="font-bold text-slate-900 mt-1">{data.sk_tanggal_aktivitas}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Clock size={20}/></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Waktu Operasional</p>
                      <p className="font-bold text-slate-900 uppercase mt-1">{data.jam?.replace(/__/g, ' ').replace(/_/g, ':')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><AlertCircle size={20}/></div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Data</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <p className="font-bold text-slate-900 uppercase text-xs">Verified in Warehouse</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM SAMPING (SIDEBAR INFO) */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl bg-white border-l-4 border-rose-500">
            <CardContent className="p-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={14} /> Audit Trail
              </h4>
              <div className="space-y-4">
                <div className="relative pl-4 border-l border-slate-100 py-1">
                   <p className="text-[11px] font-bold text-slate-900">Data Created</p>
                   <p className="text-[10px] text-slate-500">System generated via Input Form</p>
                </div>
                <div className="relative pl-4 border-l border-slate-100 py-1">
                   <p className="text-[11px] font-bold text-slate-900">SK Metadata</p>
                   <p className="text-[10px] text-slate-500 font-mono tracking-tighter">FACT_AKTIVITAS_ID_{data.sk_fakta_aktivitas_ambulan}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-rose-50/50 border border-rose-100">
            <CardContent className="p-6">
              <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                Peringatan Keamanan
              </h4>
              <p className="text-xs text-rose-500 font-medium leading-relaxed">
                Data ini merupakan bagian dari tabel fakta keuangan. Perubahan data akan dicatat ke dalam audit log sistem analitik.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}