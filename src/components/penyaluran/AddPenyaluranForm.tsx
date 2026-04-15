'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  HandCoins, UserCheck, Stethoscope, 
  Loader2, Save 
} from 'lucide-react'

// IMPORT KOMPONEN PENDUKUNG BARU
import MustahikSelector from './MustahikSelector'
import PenyaluranSummary from './PenyaluranSummary'

import { 
  DOMAIN_PROGRAM, KATEGORI_PROGRAM, JENIS_BANTUAN, 
  STATUS_PENGAJUAN, KATEGORI_PENYAKIT 
} from '@/lib/constants-penyaluran'

export default function AddPenyaluranForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    id_mustahik: '', 
    sk_penyalur: 1, 
    domain_program: DOMAIN_PROGRAM[0],
    kategori_program: KATEGORI_PROGRAM[0],
    jenis_bantuan: JENIS_BANTUAN[0],
    dana_tersalur: '',
    status_pengajuan: STATUS_PENGAJUAN[0],
    kategori_penyakit: KATEGORI_PENYAKIT[4], 
    no_referensi_lama: '',
    keterangan: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id_mustahik) return toast.error("Pilih Mustahik terlebih dahulu")
    if (!formData.dana_tersalur || parseFloat(formData.dana_tersalur) <= 0) {
      return toast.error("Nominal dana tidak valid")
    }

    setLoading(true)
    try {
      const res = await fetch('/api/penyaluran', { // Sesuaikan dengan route API kamu
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        toast.success("Transaksi penyaluran berhasil dicatat!")
        setFormData({ ...formData, id_mustahik: '', dana_tersalur: '', no_referensi_lama: '' })
      } else {
        const error = await res.json()
        toast.error(error.details || "Gagal menyimpan")
      }
    } catch (e) {
      toast.error("Terjadi kesalahan koneksi")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2 max-w-7xl mx-auto pb-10">
      
      {/* SEKSI 1: SUBJEK & PROGRAM */}
      <div className="space-y-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="bg-emerald-50/50 border-b py-4">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-800">
              <UserCheck className="h-4 w-4" /> Identitas Penerima & Program
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Pencarian Mustahik</Label>
              {/* MENGGUNAKAN SELECTOR BARU */}
              <MustahikSelector 
                selectedId={formData.id_mustahik}
                onSelect={(id) => setFormData({...formData, id_mustahik: id})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Domain Program</Label>
                <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium" 
                  value={formData.domain_program} onChange={e => setFormData({...formData, domain_program: e.target.value})}>
                  {DOMAIN_PROGRAM.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase text-slate-500">Kategori</Label>
                <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                  value={formData.kategori_program} onChange={e => setFormData({...formData, kategori_program: e.target.value})}>
                  {KATEGORI_PROGRAM.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <Stethoscope className="h-3 w-3" /> Kategori Medis (Opsional)
              </Label>
              <select 
                className="flex h-10 w-full rounded-md border bg-white px-3 text-sm"
                disabled={formData.domain_program !== "Kesehatan"}
                value={formData.kategori_penyakit}
                onChange={e => setFormData({...formData, kategori_penyakit: e.target.value})}
              >
                {KATEGORI_PENYAKIT.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* MENGGUNAKAN SUMMARY PREVIEW BARU */}
        <PenyaluranSummary 
          nominal={formData.dana_tersalur}
          domain={formData.domain_program}
          kategori={formData.kategori_program}
          jenis={formData.jenis_bantuan}
        />
      </div>

      {/* SEKSI 2: DETAIL TRANSAKSI */}
      <Card className="border-slate-200 shadow-sm h-fit">
        <CardHeader className="bg-emerald-50/50 border-b py-4">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-800">
            <HandCoins className="h-4 w-4" /> Detail Transaksi Penyaluran
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Jenis Bantuan</Label>
              <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                value={formData.jenis_bantuan} onChange={e => setFormData({...formData, jenis_bantuan: e.target.value})}>
                {JENIS_BANTUAN.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-slate-500">Status</Label>
              <select className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-bold text-emerald-600"
                value={formData.status_pengajuan} onChange={e => setFormData({...formData, status_pengajuan: e.target.value})}>
                {STATUS_PENGAJUAN.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-lg text-slate-700">Nominal Dana Tersalur (Rp)</Label>
            <Input 
              type="number" 
              placeholder="0" 
              className="h-14 text-2xl font-black text-emerald-700 border-2 focus:border-emerald-500 transition-all"
              value={formData.dana_tersalur}
              onChange={e => setFormData({...formData, dana_tersalur: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-slate-500">Nomor Referensi (Arsip Berkas)</Label>
            <Input 
              placeholder="Misal: NO-REF-2026-001" 
              value={formData.no_referensi_lama}
              onChange={e => setFormData({...formData, no_referensi_lama: e.target.value})}
            />
          </div>

          <div className="pt-6">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-16 bg-emerald-600 hover:bg-emerald-700 text-xl font-black shadow-lg shadow-emerald-100 transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
              ) : (
                <Save className="h-6 w-6 mr-2" />
              )}
              SIMPAN TRANSAKSI
            </Button>
            <p className="text-[10px] text-center text-slate-400 mt-3 italic">
              Data akan otomatis masuk ke tabel fakta penyaluran (OLAP Ready)
            </p>
          </div>
        </CardContent>
      </Card>
    </form>
  )
}