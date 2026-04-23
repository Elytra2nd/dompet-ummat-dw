'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, User, MapPin, ShieldAlert, 
  History, Calendar, Info, LineChart
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
      <div className="text-center space-y-4">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Profiling Mustahik...</p>
      </div>
    </div>
  )

  if (!data) return <div className="p-10 text-center font-bold">Data Kosong</div>

  const { mustahik, history } = data

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen font-sans">
      <Button variant="ghost" onClick={() => router.back()} className="font-bold gap-2 hover:bg-white">
        <ArrowLeft size={16} /> Kembali
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KIRI: BIODATA & SKORING */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-4 border-slate-900 rounded-none shadow-[8px_8px_0px_0px_rgba(37,99,235,1)] bg-white">
            <CardContent className="pt-8 flex flex-col items-center">
              <div className="h-24 w-24 bg-blue-100 rounded-none border-2 border-blue-600 flex items-center justify-center mb-4 rotate-3">
                <User size={48} className="text-blue-600 -rotate-3" />
              </div>
              <h2 className="text-2xl font-black uppercase text-slate-900 text-center leading-tight">{mustahik.nama}</h2>
              <Badge className="mt-2 bg-slate-900 text-white rounded-none">{mustahik.id_mustahik}</Badge>

              <div className="w-full mt-8 space-y-4">
                <div className="p-4 bg-slate-900 text-white rounded-none flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-yellow-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Vulnerability Score</span>
                  </div>
                  <span className="text-2xl font-black">{mustahik.skoring}</span>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">Wilayah Sebaran</p>
                      <p className="text-xs font-bold uppercase">{mustahik.kecamatan}, {mustahik.kabupaten_kota}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Info size={16} className="text-slate-400 mt-1" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-slate-400">Kategori PM</p>
                      <p className="text-xs font-bold uppercase">{mustahik.kategori_pm || 'Umum'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ASPEK SCD TYPE 2 */}
          <Card className="border-2 border-slate-900 bg-blue-50 rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 text-blue-800">
                <History size={14} /> Data Lineage Detail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] font-bold text-blue-900 leading-relaxed italic">
                Sistem merekam {history.length} versi riwayat kondisi ekonomi untuk mustahik ini guna analisis efektivitas penyaluran zakat.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KANAN: TRACKING & HISTORY */}
        <div className="lg:col-span-2 space-y-6">
          {/* ANALISIS KONDISI SAAT INI */}
          <Card className="border-4 border-slate-900 rounded-none bg-white">
            <CardHeader className="border-b-2 border-slate-900 bg-slate-50">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <LineChart size={16} /> Parameter Kelayakan Terkini
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status Pernikahan</p>
                 <p className="font-bold text-slate-800 uppercase">{mustahik.status_pernikahan || '-'}</p>
               </div>
               <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Jenis Kelamin</p>
                 <p className="font-bold text-slate-800 uppercase">{mustahik.gender || '-'}</p>
               </div>
               <div className="md:col-span-2 p-4 bg-slate-50 border-2 border-dashed border-slate-200">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Alamat Lengkap Records</p>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">{mustahik.alamat || 'Alamat tidak tersedia dalam metadata.'}</p>
               </div>
            </CardContent>
          </Card>

          {/* HISTORI SCD (SAMA SEPERTI DONATUR) */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 pl-2">
                <History size={14} /> Historical Changes (SCD Type 2)
              </h4>
              {history.map((h: any, i: number) => (
                <div key={i} className="bg-white border-2 border-slate-900 p-4 flex justify-between items-center group hover:bg-slate-50 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-black text-slate-800 uppercase">{h.nama}</p>
                      <Badge className="h-4 text-[8px] bg-slate-200 text-slate-600 rounded-none">ARSIP</Badge>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                      Skor: {h.skoring} • {h.kecamatan}
                    </p>
                  </div>
                  <div className="text-right border-l-2 border-slate-100 pl-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Valid Period</p>
                    <p className="text-[10px] font-black text-blue-600 font-mono">
                      {new Date(h.valid_from).toLocaleDateString('id-ID')} - {new Date(h.valid_to).toLocaleDateString('id-ID')}
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