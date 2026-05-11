'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  ArrowLeft, User, MapPin, ShieldCheck,
  History, Info, LineChart, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function DetailMustahikPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/mustahik/${id}`)
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
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Memuat data mustahik...</p>
      </div>
    </div>
  )

  if (!data) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700">Data mustahik tidak ditemukan</p>
        <Button variant="outline" size="sm" onClick={() => router.back()} className="mt-4">
          <ArrowLeft size={14} className="mr-1.5" /> Kembali
        </Button>
      </div>
    </div>
  )

  const { mustahik, history } = data

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
                  <Link href="/mustahik">Mustahik</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-semibold text-slate-700">{mustahik.nama}</BreadcrumbPage>
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
              {/* Avatar */}
              <div className="flex flex-col items-center sm:items-start gap-3">
                <div className="h-24 w-24 bg-blue-100 rounded-2xl border border-blue-200 flex items-center justify-center shrink-0">
                  <User size={48} className="text-blue-600" />
                </div>
                <div className="text-center sm:text-left">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    {mustahik.nama}
                  </h1>
                  <Badge variant="outline" className="mt-2 bg-slate-50 text-slate-700 border-slate-200">
                    {mustahik.id_mustahik}
                  </Badge>
                </div>
              </div>
              {/* Quick Info */}
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Vulnerability Score</p>
                  <p className="text-2xl font-bold text-emerald-700">{mustahik.skoring}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Kategori PM</p>
                  <p className="text-sm font-bold text-slate-700">{mustahik.kategori_pm || 'Umum'}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QUICK STATS GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Wilayah</p>
              <p className="text-sm sm:text-base font-bold text-slate-900">{mustahik.kecamatan}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Kabupaten</p>
              <p className="text-sm sm:text-base font-bold text-slate-900">{mustahik.kabupaten_kota}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Status Pernikahan</p>
              <p className="text-sm sm:text-base font-bold text-slate-900">{mustahik.status_pernikahan || '-'}</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-200 shadow-sm bg-white">
            <CardContent className="p-4 sm:p-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Jenis Kelamin</p>
              <p className="text-sm sm:text-base font-bold text-slate-900">{mustahik.gender || '-'}</p>
            </CardContent>
          </Card>
        </div>

        {/* INFO CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 space-y-6">
            {/* ALAMAT SECTION */}
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-4 px-6">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
                  <MapPin size={14} className="text-slate-500" /> Alamat Lengkap
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-slate-700 leading-relaxed">{mustahik.alamat || '-'}</p>
              </CardContent>
            </Card>

            {/* HISTORY SECTION */}
            {history.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <History size={16} className="text-slate-500" /> Riwayat Perubahan Data
                </h3>
                <div className="space-y-3">
                  {history.map((h: any, i: number) => (
                    <Card key={i} className="border border-slate-200 shadow-sm bg-white">
                      <CardContent className="p-6">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-sm font-bold text-slate-900">{h.nama}</p>
                              <Badge size="sm" variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                                ARSIP
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 font-semibold">
                              Skor: {h.skoring} • {h.kecamatan}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Periode Berlaku</p>
                            <p className="text-sm font-semibold text-slate-700 font-mono">
                              {new Date(h.valid_from).toLocaleDateString('id-ID')} → {new Date(h.valid_to).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardHeader className="bg-slate-50 border-b border-slate-200 py-4 px-6">
                <CardTitle className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 text-slate-600">
                  <History size={14} className="text-slate-500" /> Data Warehouse
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistem merekam {history.length} versi riwayat kondisi ekonomi untuk mustahik ini guna analisis efektivitas penyaluran zakat.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="p-6">
                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-600" /> Integritas Data
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Data ini bersifat persisten dan merupakan bagian dari tabel dimensi master. Setiap perubahan dicatat dengan SCD Type 2 untuk audit trail lengkap.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}