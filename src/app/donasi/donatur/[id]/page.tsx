'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
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
  ArrowLeft, Building2, History, Wallet, MapPin, User, Search, Loader2
} from 'lucide-react'
import { toast } from 'sonner'

export default function DetailDonaturPage() {
  const { id } = useParams()
  const router = useRouter()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Helper format tanggal YYYYMMDD -> DD/MM/YYYY
  const formatTanggalDW = (sk: number | string) => {
    if (!sk) return '-';
    const s = sk.toString();
    if (s.length !== 8) return s;
    return `${s.substring(6, 8)}/${s.substring(4, 6)}/${s.substring(0, 4)}`;
  };

  useEffect(() => {
    fetch(`/api/donatur/${id}`)
      .then(res => res.json())
      .then(d => {
        if (d.error) toast.error(d.error)
        else setData(d)
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Memuat data...</p>
      </div>
    </div>
  )
  
  if (!data) return <div className="p-10 text-center font-bold">Data tidak ditemukan</div>

  const { donatur, history } = data

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen font-sans">
      <div className="space-y-3">
        <Button variant="ghost" onClick={() => router.back()} className="font-bold gap-2 hover:bg-white">
          <ArrowLeft size={16} /> Kembali ke Daftar
        </Button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/donasi/donatur">Donatur</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{donatur.nama}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KIRI: PROFIL UTAMA */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-200 rounded-2xl shadow-lg bg-white">
            <CardContent className="pt-8 flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500">
                <User size={48} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black uppercase text-slate-900 leading-tight">{donatur.nama}</h2>
              <Badge className="mt-2 bg-slate-800 text-white font-black px-4 py-1 rounded-lg uppercase tracking-tighter">
                {donatur.id_donatur}
              </Badge>
              
              <div className="w-full border-t-2 border-dashed border-slate-200 mt-6 pt-6 space-y-4 text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><Building2 size={16} className="text-slate-600" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Perusahaan / Afiliasi</p>
                    <p className="text-sm font-bold text-slate-800">{donatur.perusahaan || 'Pribadi / Umum'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg"><MapPin size={16} className="text-slate-600" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Alamat</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{donatur.alamat || '-'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* INSIGHT SCD TYPE 2 */}
          <Card className="border border-emerald-200 bg-emerald-50 rounded-2xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 text-emerald-800">
                <History size={14} className="text-emerald-600" /> Riwayat Profil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] font-bold text-emerald-900 leading-relaxed">
                Terdapat <span className="text-lg font-black">{history.length} data arsip</span> yang terekam secara historis untuk donatur ini. Setiap perubahan profil tersimpan otomatis.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KANAN: HISTORI TRANSAKSI */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 rounded-2xl shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-slate-800 text-white flex flex-row items-center justify-between rounded-t-2xl">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Wallet size={16} className="text-emerald-400" /> Riwayat Donasi
              </CardTitle>
              <Search size={16} className="text-slate-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow className="hover:bg-slate-50">
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Tgl. Transaksi</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">Program Penyaluran</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500">No. Referensi</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-500 text-right">Jumlah Donasi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <>
                        {[...Array(5)].map((_, i) => (
                          <TableRow key={i} className="hover:bg-slate-50">
                            <TableCell className="p-4"><Skeleton className="h-4 w-20" /></TableCell>
                            <TableCell className="p-4"><Skeleton className="h-4 w-32" /></TableCell>
                            <TableCell className="p-4"><Skeleton className="h-4 w-24" /></TableCell>
                            <TableCell className="p-4 text-right"><Skeleton className="h-4 w-28 ml-auto" /></TableCell>
                          </TableRow>
                        ))}
                      </>
                    ) : donatur.fact_donasi?.length > 0 ? (
                      donatur.fact_donasi.map((txn: any, i: number) => (
                        <TableRow key={i} className="hover:bg-emerald-50">
                          <TableCell className="font-bold text-slate-700">
                            {formatTanggalDW(txn.sk_tgl_bersih)}
                          </TableCell>
                          <TableCell>
                            <p className="font-black uppercase text-xs text-slate-800 leading-tight">
                              {txn.dim_program_donasi?.nama_program || 'PROGRAM UMUM'}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {txn.id_transaksi_donasi}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge size="sm" variant="outline" className="bg-white border-slate-200">
                              {txn.no_ref || '-'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-black text-slate-900 bg-slate-50/50">
                            Rp {Number(txn.nominal_valid).toLocaleString('id-ID')}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <EmptyState
                            asTableRow={false}
                            title="Belum ada riwayat donasi"
                            description="Data donasi akan tampil setelah melakukan transaksi."
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* HISTORI SCD TRACKING */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History size={14} /> Riwayat Perubahan Data
              </h4>
              {history.map((h: any, i: number) => (
                <div key={i} className="bg-white border-2 border-slate-200 border-l-blue-600 p-4 shadow-sm flex justify-between items-center group hover:border-blue-200 transition-all">
                  <div>
                    <p className="text-xs font-black text-slate-800 uppercase">{h.nama}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                      {h.perusahaan} • {h.alamat}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Periode Berlaku</p>
                    <p className="text-[11px] font-black text-blue-700 font-mono">
                      {new Date(h.valid_from).toLocaleDateString('id-ID')} → {new Date(h.valid_to).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}