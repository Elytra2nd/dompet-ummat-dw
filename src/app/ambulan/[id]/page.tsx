'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ArrowLeft, Truck, User, MapPin, Clock,
  Calendar, ShieldCheck, CheckCircle2, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function DetailLayananAmbulanPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const formatTanggal = (sk: number) => {
    const s = sk.toString()
    if (s.length !== 8) return s
    return `${s.substring(6, 8)}/${s.substring(4, 6)}/${s.substring(0, 4)}`
  }

  useEffect(() => {
    fetch(`/api/ambulan/${id}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) toast.error(d.error)
        else setData(d)
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Memuat data layanan...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700">Data layanan tidak ditemukan</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-4">
          <ArrowLeft size={14} className="mr-1.5" /> Kembali
        </Button>
      </div>
    </div>
  )

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
                  <Link href="/ambulan">Layanan Ambulan</Link>
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
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                      {data.id_transaksi}
                    </h1>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                      ID Layanan Ambulan
                    </p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 whitespace-nowrap">
                    <CheckCircle2 size={12} className="mr-1" /> Finalized
                  </Badge>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Catatan Data Warehouse: Data ini bersifat persisten. Perubahan pada dimensi master tidak akan mengubah ID Transaksi ini guna menjaga akurasi laporan historis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QUICK STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Tanggal Layanan</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900">{formatTanggal(data.sk_tanggal_layanan)}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Waktu / Shift</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 uppercase">{data.jam?.replace(/__/g, ' ')}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kategori</p>
              <p className="text-lg sm:text-xl font-bold text-slate-900 uppercase">{data.kategori_layanan?.replace(/_/g, ' ')}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Status</p>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Aktif
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* INFO CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD PASIEN */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
                <div className="p-1.5 bg-blue-50 rounded-lg"><User size={14} className="text-blue-600" /></div>
                Dimensi Pasien
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nama Pasien</p>
                <p className="text-base font-bold text-slate-900">{data.dim_pasien_ambulan?.nama_pasien || 'UMUM'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kondisi Ekonomi</p>
                <Badge size="sm" variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {data.dim_pasien_ambulan?.status_ekonomi || 'NON-SUBSIDI'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* CARD LOKASI */}
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardHeader className="border-b border-slate-200 bg-slate-50/50 py-4 px-6">
              <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
                <div className="p-1.5 bg-rose-50 rounded-lg"><MapPin size={14} className="text-rose-600" /></div>
                Dimensi Lokasi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Wilayah Tujuan</p>
                <p className="text-base font-bold text-slate-900">{data.dim_lokasi?.kabupaten_kota || 'PONTIANAK'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Area Spesifik</p>
                <p className="text-sm font-semibold text-slate-700">{data.dim_lokasi?.kecamatan || 'Kecamatan Terkait'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CARD LOGISTIK UNIT */}
        <Card className="border border-slate-200 shadow-sm bg-white">
          <CardHeader className="bg-slate-50 border-b border-slate-200 py-4 px-6">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
              <div className="p-1.5 bg-rose-50 rounded-lg"><Truck size={14} className="text-rose-600" /></div>
              Logistik & Operasional Armada
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <div className="p-6 hover:bg-slate-50 transition-colors">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Unit Armada</p>
                <p className="text-base font-bold text-slate-900 mt-2 uppercase">{data.armada?.split('__')[0].replace(/_/g, ' ')}</p>
              </div>
              <div className="p-6 hover:bg-slate-50 transition-colors">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kategori Layanan</p>
                <p className="text-base font-bold text-slate-900 mt-2 uppercase">{data.kategori_layanan?.replace(/_/g, ' ')}</p>
              </div>
              <div className="p-6 hover:bg-slate-50 transition-colors">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nomor Plat (Metadata)</p>
                <p className="text-base font-semibold text-slate-700 mt-2 font-mono bg-slate-100 w-max px-2 py-1 rounded-md">{data.armada?.split('__')[1] || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}