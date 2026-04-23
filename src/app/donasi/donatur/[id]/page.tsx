'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, Building2, History, Wallet, MapPin, User, Search
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
        <div className="h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-black text-slate-400 uppercase text-xs tracking-widest">Sinkronisasi Warehouse...</p>
      </div>
    </div>
  )
  
  if (!data) return <div className="p-10 text-center font-bold">Data tidak ditemukan</div>

  const { donatur, history } = data

  return (
    <div className="p-4 md:p-8 space-y-6 bg-slate-50 min-h-screen font-sans">
      <Button variant="ghost" onClick={() => router.back()} className="font-bold gap-2 hover:bg-white">
        <ArrowLeft size={16} /> Kembali ke Daftar
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* KIRI: PROFIL UTAMA */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-4 border-slate-900 rounded-none shadow-[8px_8px_0px_0px_rgba(16,185,129,1)] bg-white">
            <CardContent className="pt-8 flex flex-col items-center text-center">
              <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4 border-2 border-emerald-500">
                <User size={48} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black uppercase text-slate-900 leading-tight">{donatur.nama}</h2>
              <Badge className="mt-2 bg-slate-900 text-white font-black px-4 py-1 rounded-none uppercase tracking-tighter">
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
                    <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Domisili Warehouse</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{donatur.alamat || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* INSIGHT SCD TYPE 2 */}
          <Card className="border-2 border-slate-900 bg-emerald-50 rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2 text-emerald-800">
                <History size={14} className="text-emerald-600" /> SCD Type 2 Integrity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[11px] font-bold text-emerald-900 leading-relaxed">
                Terdapat <span className="text-lg font-black">{history.length} data arsip</span> yang terekam secara historis untuk donatur ini. Menjamin audit trail data master tetap terjaga.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* KANAN: HISTORI TRANSAKSI */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-4 border-slate-900 rounded-none shadow-none overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Wallet size={16} className="text-emerald-400" /> Riwayat Transaksi (Fact Donasi)
              </CardTitle>
              <Search size={16} className="text-slate-500" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b-2 border-slate-900">
                    <tr className="text-[10px] font-black uppercase text-slate-900">
                      <th className="p-4 border-r">Tgl. Transaksi</th>
                      <th className="p-4 border-r">Program Penyaluran</th>
                      <th className="p-4 border-r">ID Ref / Transaksi</th>
                      <th className="p-4 text-right">Nominal Valid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donatur.fact_donasi?.length > 0 ? (
                      donatur.fact_donasi.map((txn: any, i: number) => (
                        <tr key={i} className="border-b hover:bg-emerald-50 transition-colors">
                          <td className="p-4 font-bold text-slate-700">
                            {formatTanggalDW(txn.sk_tgl_bersih)}
                          </td>
                          <td className="p-4">
                            <p className="font-black uppercase text-xs text-slate-800 leading-tight">
                              {txn.dim_program_donasi?.nama_program || 'PROGRAM UMUM'}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                              {txn.id_transaksi_donasi}
                            </p>
                          </td>
                          <td className="p-4">
                             <Badge variant="outline" className="text-[9px] font-black border-2 border-slate-200 bg-white uppercase">
                               {txn.no_ref || 'TRX-INTERNAL'}
                             </Badge>
                          </td>
                          <td className="p-4 text-right font-black text-slate-900 bg-slate-50/50">
                            Rp {Number(txn.nominal_valid).toLocaleString('id-ID')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="p-16 text-center font-black text-slate-300 uppercase tracking-widest">Zero Historical Transaction</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* HISTORI SCD TRACKING */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <History size={14} /> Arsip Perubahan (Historical Dimension Records)
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
                    <p className="text-[9px] font-black text-slate-400 uppercase leading-none mb-1">Data Valid From - To</p>
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