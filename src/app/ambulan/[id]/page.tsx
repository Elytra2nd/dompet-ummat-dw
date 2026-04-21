'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, Truck, User, MapPin, Clock, 
  Calendar, ShieldCheck, Printer, Activity 
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
    <div className="flex items-center justify-center min-h-screen font-black text-slate-400 animate-pulse uppercase tracking-widest">
      Parsing Fact Record...
    </div>
  )

  if (!data) return <div className="p-10 text-center font-bold">Data Not Found</div>

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen font-sans">
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => router.back()} className="font-bold gap-2 hover:bg-white border-2 border-transparent hover:border-slate-200">
          <ArrowLeft size={16} /> Kembali ke Monitoring
        </Button>
        <Button onClick={() => window.print()} className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest rounded-none px-6">
          <Printer size={14} className="mr-2" /> Print Audit Log
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KOLOM KIRI: STATUS & INFO UTAMA */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-4 border-slate-900 rounded-none shadow-[8px_8px_0px_0px_rgba(225,29,72,1)] bg-white">
            <CardHeader className="bg-rose-600 text-white border-b-4 border-slate-900">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} /> Detail Transaksi
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="text-center pb-4 border-b-2 border-dashed border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase">ID Layanan</p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">{data.id_transaksi}</h2>
                <Badge className="mt-2 bg-emerald-100 text-emerald-700 border-none uppercase font-black text-[9px]">Status: Finalized</Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 flex items-center justify-center border-2 border-slate-900">
                    <Calendar size={18} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Tanggal Layanan</p>
                    <p className="text-sm font-bold text-slate-800">{formatTanggal(data.sk_tanggal_layanan)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-100 flex items-center justify-center border-2 border-slate-900">
                    <Clock size={18} className="text-slate-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase">Waktu / Shift</p>
                    <p className="text-sm font-bold text-slate-800 uppercase">{data.jam?.replace(/__/g, ' ')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-slate-900 rounded-none bg-slate-900 text-white">
            <CardContent className="pt-6">
               <div className="flex items-start gap-3">
                  <ShieldCheck className="text-emerald-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-black uppercase text-emerald-500">Warehouse Integrity</p>
                    <p className="text-[11px] font-medium text-slate-300 leading-relaxed mt-1 italic">
                      Data ini bersifat persisten. Perubahan pada dimensi master tidak akan mengubah ID Transaksi ini guna menjaga akurasi laporan historis.
                    </p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: RINCIAN DIMENSI */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD PASIEN */}
            <Card className="border-2 border-slate-900 rounded-none bg-white shadow-none">
              <CardHeader className="border-b-2 border-slate-900 py-3 bg-slate-50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-blue-600" /> Dimensi Pasien
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Nama Pasien</p>
                  <p className="font-black text-slate-800 uppercase">{data.dim_pasien_ambulan?.nama_pasien || 'UMUM'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Kondisi Ekonomi</p>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-200 rounded-none font-black text-[9px] uppercase">
                    {data.dim_pasien_ambulan?.status_ekonomi || 'NON-SUBSIDI'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* CARD LOKASI */}
            <Card className="border-2 border-slate-900 rounded-none bg-white shadow-none">
              <CardHeader className="border-b-2 border-slate-900 py-3 bg-slate-50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <MapPin size={14} className="text-rose-600" /> Dimensi Lokasi
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Wilayah Tujuan</p>
                  <p className="font-black text-slate-800 uppercase">{data.dim_lokasi?.kabupaten_kota || 'PONTIANAK'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase">Area Spesifik</p>
                  <p className="text-xs font-bold text-slate-600 uppercase">{data.dim_lokasi?.kecamatan || 'Kecamatan Terkait'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD LOGISTIK UNIT */}
          <Card className="border-2 border-slate-900 rounded-none bg-white shadow-none overflow-hidden">
            <CardHeader className="bg-slate-900 text-white">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <Truck size={14} className="text-rose-400" /> Logistik & Operasional Armada
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="grid grid-cols-1 md:grid-cols-3">
                  <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Unit Armada</p>
                    <p className="text-sm font-black text-slate-800 mt-1 uppercase">{data.armada?.split('__')[0].replace(/_/g, ' ')}</p>
                  </div>
                  <div className="p-6 border-b md:border-b-0 md:border-r border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Kategori Layanan</p>
                    <p className="text-sm font-black text-rose-600 mt-1 uppercase">{data.kategori_layanan?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="p-6">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Nomor Plat (Metadata)</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{data.armada?.split('__')[1] || '-'}</p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}