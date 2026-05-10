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
  Printer, 
  AlertCircle,
  FileText,
  Activity
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Activity className="h-10 w-10 animate-pulse text-rose-500" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Memuat Dokumen Finansial...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-10 text-center min-h-screen font-bold text-slate-500">
        <p>Data Transaksi Tidak Ditemukan.</p>
        <Button asChild variant="outline" className="mt-6 rounded-xl"><Link href="/ambulan/riwayat">Kembali ke Riwayat</Link></Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-screen font-sans text-slate-900 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER NAV */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" aria-label="Kembali" onClick={() => router.back()} className="rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-slate-100 transition-all">
            <ArrowLeft size={18} className="text-slate-700" />
          </Button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              Detail Transaksi <span className="text-rose-600">Aktivitas</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              ID: {data.id_transaksi}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={() => window.print()} className="flex-1 md:flex-initial bg-white/80 backdrop-blur-sm uppercase text-[10px] font-bold tracking-widest h-10 px-6 hover:shadow-md transition-all">
            <Printer size={16} className="mr-2" /> Cetak Log
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KOLOM UTAMA */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl rounded-3xl bg-white overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
            <CardHeader className="bg-gradient-to-br from-slate-900 to-black text-white p-8 relative overflow-hidden">
              <DollarSign className="absolute -bottom-10 -right-10 w-48 h-48 text-white opacity-[0.03] transform -rotate-12 group-hover:scale-110 transition-transform duration-500" />
              <div className="flex justify-between items-center relative z-10">
                <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Ringkasan Pengeluaran
                </CardTitle>
                <Badge className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 font-black uppercase text-[9px] backdrop-blur-md rounded-lg">
                  {data.kategori_aktivitas?.replace(/_/g, ' ')}
                </Badge>
              </div>
              <h2 className="text-4xl md:text-5xl font-black mt-6 tracking-tighter italic text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] relative z-10">
                {formatIDR(data.biaya_operasional || 0)}
              </h2>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0"><Truck size={20}/></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Armada Penanggungjawab</p>
                      <p className="font-black text-slate-900 uppercase text-sm">{data.armada?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="p-3 bg-rose-50 rounded-xl text-rose-600 shrink-0"><Calendar size={20}/></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tanggal Aktivitas</p>
                      <p className="font-black text-slate-900 text-sm">{data.sk_tanggal_aktivitas}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600 shrink-0"><Clock size={20}/></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu Operasional</p>
                      <p className="font-black text-slate-900 uppercase text-sm">{data.jam?.replace(/__/g, ' ').replace(/_/g, ':')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600 shrink-0"><AlertCircle size={20}/></div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Data</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <p className="font-black text-slate-900 uppercase text-xs">Verified in Warehouse</p>
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
          <Card className="border-none shadow-md rounded-3xl bg-white relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-rose-500 to-indigo-600"></div>
            <CardContent className="p-6">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <FileText size={14} className="text-indigo-500" /> Audit Trail
              </h4>
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-2.5 before:w-0.5 before:bg-slate-200 before:rounded-full">
                <div className="relative">
                   <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-indigo-500 bg-white shadow-sm z-10"></div>
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                     <p className="text-[10px] font-black text-slate-900 uppercase">Data Created</p>
                     <p className="text-[9px] font-medium text-slate-500 mt-0.5">System generated via Input Form</p>
                   </div>
                </div>
                
                <div className="relative">
                   <div className="absolute -left-6 top-1 h-3 w-3 rounded-full border-2 border-emerald-500 bg-white shadow-sm z-10"></div>
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                     <p className="text-[10px] font-black text-slate-900 uppercase">SK Metadata</p>
                     <p className="text-[9px] font-mono font-bold text-slate-500 mt-0.5 tracking-tighter break-all">FACT_AKTIVITAS_ID_{data.sk_fakta_aktivitas_ambulan}</p>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md rounded-3xl bg-gradient-to-br from-rose-50 to-white relative overflow-hidden group hover:shadow-rose-100 transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-5 transition-opacity">
              <AlertCircle className="w-32 h-32 text-rose-500" />
            </div>
            <CardContent className="p-6 relative z-10">
              <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="animate-pulse" /> Peringatan Keamanan
              </h4>
              <p className="text-xs text-rose-700/80 font-medium leading-relaxed">
                Data ini merupakan bagian dari tabel fakta keuangan. Perubahan data akan dicatat ke dalam audit log sistem analitik secara otomatis.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}