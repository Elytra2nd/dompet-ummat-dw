'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ArrowLeft,
  Truck,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  FileText,
  Loader2
} from 'lucide-react'
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
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Memuat data aktivitas...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <p className="text-sm font-bold text-slate-700">Data aktivitas tidak ditemukan</p>
          <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-4">
            <ArrowLeft size={14} className="mr-1.5" /> Kembali
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans">
      {/* TOP NAV BAR */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 space-y-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="-ml-2 text-slate-500 font-semibold hover:bg-slate-50 hover:text-slate-900"
          >
            <ArrowLeft size={14} className="mr-1.5" /> Kembali ke Daftar
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/ambulan/riwayat">Riwayat Aktivitas</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-slate-700">{data.id_transaksi}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* PROFILE HEADER */}
        <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 justify-between items-start">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {formatIDR(data.biaya_operasional || 0)}
                </h1>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                  Ringkasan Pengeluaran
                </p>
              </div>
              <Badge className="bg-rose-50 text-rose-700 border-rose-200">
                {data.kategori_aktivitas?.replace(/_/g, ' ')}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* QUICK STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Aktivitas</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900">{data.sk_tanggal_aktivitas}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Waktu Operasional</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 uppercase">{data.jam?.replace(/__/g, ' ').replace(/_/g, ':')}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Armada</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 uppercase">{data.armada?.replace(/_/g, ' ')}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Status</p>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Verified
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* INFO CARDS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* KOLOM UTAMA */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-4 px-6">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
                  <div className="p-1.5 bg-rose-50 rounded-lg"><DollarSign size={14} className="text-rose-600" /></div>
                  Detail Operasional
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Armada Penanggungjawab</p>
                    <p className="text-base font-bold text-slate-900">{data.armada?.replace(/_/g, ' ')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Aktivitas</p>
                    <p className="text-base font-bold text-slate-900">{data.sk_tanggal_aktivitas}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Waktu Operasional</p>
                    <p className="text-base font-bold text-slate-900">{data.jam?.replace(/__/g, ' ').replace(/_/g, ':')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori</p>
                    <p className="text-base font-bold text-slate-900">{data.kategori_aktivitas?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KOLOM SAMPING (SIDEBAR INFO) */}
          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileText size={14} className="text-slate-500" /> Metadata
                </h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">SK Fakta</p>
                    <p className="text-sm font-mono font-semibold text-slate-700 break-all">FACT_AKTIVITAS_{data.sk_fakta_aktivitas_ambulan}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Verifikasi</p>
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                      </span>
                      <p className="text-sm font-semibold text-slate-700">Verified in Warehouse</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle size={14} className="text-rose-500" /> Catatan Audit
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Data ini merupakan bagian dari tabel fakta keuangan. Perubahan data akan dicatat ke dalam audit log sistem analitik secara otomatis.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}