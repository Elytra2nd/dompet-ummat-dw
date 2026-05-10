'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, Truck, User, MapPin, Clock, 
  Calendar, ShieldCheck, Printer, Activity, CheckCircle2
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
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Activity className="h-10 w-10 animate-pulse text-rose-500" />
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">Memuat Data Warehouse...</p>
    </div>
  )

  if (!data) return <div className="p-10 text-center font-bold text-slate-500">Data Transaksi Tidak Ditemukan</div>

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50/50 min-h-screen font-sans animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* HEADER NAV */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" aria-label="Kembali" onClick={() => router.back()} className="rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-slate-100 transition-all">
            <ArrowLeft size={18} className="text-slate-700" />
          </Button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              Detail Transaksi <span className="text-rose-600">Layanan</span>
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
        {/* KOLOM KIRI: STATUS & INFO UTAMA */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none rounded-3xl shadow-xl overflow-hidden group hover:-translate-y-1 transition-all duration-300">
            <div className="bg-gradient-to-br from-rose-500 to-rose-700 p-8 text-center relative">
              {/* Decorative Background Icon */}
              <Activity className="absolute -bottom-4 -right-4 w-32 h-32 text-white opacity-10 transform -rotate-12 group-hover:scale-110 transition-transform duration-500" />
              
              <p className="text-[10px] font-black text-rose-100 uppercase tracking-[0.2em] relative z-10">
                ID Layanan
              </p>
              <h2 className="text-3xl font-black text-white tracking-tighter mt-2 relative z-10">
                {data.id_transaksi}
              </h2>
              <div className="mt-4 relative z-10 flex justify-center">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none uppercase font-black text-[9px] backdrop-blur-md px-3 py-1 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Finalized
                </Badge>
              </div>
            </div>
            
            <CardContent className="pt-6 space-y-6 bg-white">
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="h-12 w-12 bg-rose-50 flex items-center justify-center rounded-xl shrink-0">
                    <Calendar size={20} className="text-rose-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tanggal Layanan</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{formatTanggal(data.sk_tanggal_layanan)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="h-12 w-12 bg-indigo-50 flex items-center justify-center rounded-xl shrink-0">
                    <Clock size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu / Shift</p>
                    <p className="text-sm font-bold text-slate-800 uppercase mt-0.5">{data.jam?.replace(/__/g, ' ')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none rounded-3xl bg-slate-900 text-white shadow-xl overflow-hidden relative group hover:shadow-indigo-500/10 transition-shadow">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck className="w-24 h-24" />
            </div>
            <CardContent className="p-6 relative z-10">
               <div className="flex items-start gap-4">
                  <div className="p-2 bg-emerald-500/20 rounded-xl shrink-0">
                    <ShieldCheck className="text-emerald-400 w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                      Warehouse Integrity
                    </p>
                    <p className="text-[11px] font-medium text-slate-300 leading-relaxed mt-2 italic border-l-2 border-slate-700 pl-3">
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
            <Card className="border-none rounded-3xl bg-white shadow-sm overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative">
              <User className="absolute -bottom-4 -right-4 w-32 h-32 text-blue-50 opacity-[0.03] transform group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500" />
              <CardHeader className="border-b border-slate-50 py-4 bg-slate-50/50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                  <div className="p-1.5 bg-blue-100 rounded-lg"><User size={14} className="text-blue-600" /></div>
                  Dimensi Pasien
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 relative z-10">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Nama Pasien</p>
                  <p className="font-black text-slate-800 uppercase text-lg">{data.dim_pasien_ambulan?.nama_pasien || 'UMUM'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Kondisi Ekonomi</p>
                  <Badge className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-none rounded-lg font-black text-[10px] uppercase px-3 py-1 shadow-sm">
                    {data.dim_pasien_ambulan?.status_ekonomi || 'NON-SUBSIDI'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* CARD LOKASI */}
            <Card className="border-none rounded-3xl bg-white shadow-sm overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300 relative">
              <MapPin className="absolute -bottom-4 -right-4 w-32 h-32 text-rose-50 opacity-[0.03] transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
              <CardHeader className="border-b border-slate-50 py-4 bg-slate-50/50">
                <CardTitle className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-slate-500">
                  <div className="p-1.5 bg-rose-100 rounded-lg"><MapPin size={14} className="text-rose-600" /></div>
                  Dimensi Lokasi
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 relative z-10">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Wilayah Tujuan</p>
                  <p className="font-black text-slate-800 uppercase text-lg">{data.dim_lokasi?.kabupaten_kota || 'PONTIANAK'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Area Spesifik</p>
                  <p className="text-sm font-bold text-slate-600 uppercase">{data.dim_lokasi?.kecamatan || 'Kecamatan Terkait'}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CARD LOGISTIK UNIT */}
          <Card className="border-none rounded-3xl bg-white shadow-sm overflow-hidden group hover:shadow-md transition-shadow duration-300">
            <CardHeader className="bg-slate-900 text-white py-5 px-6 relative overflow-hidden">
               <Truck className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 text-white opacity-5" />
               <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 relative z-10 text-slate-300">
                  <div className="p-1.5 bg-slate-800 rounded-lg"><Truck size={14} className="text-rose-400" /></div>
                  Logistik & Operasional Armada
               </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
               <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-6 hover:bg-slate-50 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Unit Armada</p>
                    <p className="text-base font-black text-slate-800 mt-2 uppercase">{data.armada?.split('__')[0].replace(/_/g, ' ')}</p>
                  </div>
                  <div className="p-6 hover:bg-slate-50 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kategori Layanan</p>
                    <p className="text-base font-black text-rose-600 mt-2 uppercase">{data.kategori_layanan?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="p-6 hover:bg-slate-50 transition-colors">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nomor Plat (Metadata)</p>
                    <p className="text-base font-bold text-slate-700 mt-2 font-mono bg-slate-100 w-max px-2 py-1 rounded-md">{data.armada?.split('__')[1] || '-'}</p>
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}