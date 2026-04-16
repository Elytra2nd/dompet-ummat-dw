'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  HeartHandshake,
  CreditCard,
  Landmark,
  Calendar,
  Loader2,
  Save,
  BadgeCheck,
} from 'lucide-react'

// Import pendukung
import DonaturSelector from './DonaturSelector'
import {
  JENIS_DONASI,
  METODE_PEMBAYARAN,
  BANK_TUJUAN,
} from '@/lib/constants-donasi'
import { formatRupiah } from '@/lib/utils-ambulan'

export default function AddDonasiForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    id_donatur: '',
    sk_petugas: 1, // Sementara hardcoded
    jenis_donasi: JENIS_DONASI[2], // Default: Infaq/Sedekah
    nominal_donasi: '',
    metode_pembayaran: METODE_PEMBAYARAN[0],
    bank_tujuan: BANK_TUJUAN[0],
    keterangan: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.id_donatur)
      return toast.error('Pilih donatur terlebih dahulu')
    if (!formData.nominal_donasi || parseFloat(formData.nominal_donasi) <= 0) {
      return toast.error('Nominal donasi tidak valid')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/donasi/masuk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success('Data donasi berhasil dicatat!')
        setFormData({
          ...formData,
          id_donatur: '',
          nominal_donasi: '',
          keterangan: '',
        })
      } else {
        const err = await res.json()
        toast.error(err.error || 'Gagal menyimpan data')
      }
    } catch (e) {
      toast.error('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3"
    >
      {/* KOLOM KIRI: DONATUR & SUMBER */}
      <div className="space-y-6 md:col-span-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b bg-indigo-50/50 py-4">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-indigo-800">
              <HeartHandshake className="h-4 w-4" /> Informasi Donatur & Sumber
              Dana
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase">
                Cari Donatur
              </Label>
              <DonaturSelector
                selectedId={formData.id_donatur}
                onSelect={(id) => setFormData({ ...formData, id_donatur: id })}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">
                  Jenis Donasi
                </Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                  value={formData.jenis_donasi}
                  onChange={(e) =>
                    setFormData({ ...formData, jenis_donasi: e.target.value })
                  }
                >
                  {JENIS_DONASI.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-500 uppercase">
                  Metode Pembayaran
                </Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                  value={formData.metode_pembayaran}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metode_pembayaran: e.target.value,
                    })
                  }
                >
                  {METODE_PEMBAYARAN.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase">
                <Landmark className="h-3 w-3" /> Bank Tujuan / Kas Penerimaan
              </Label>
              <select
                className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                value={formData.bank_tujuan}
                onChange={(e) =>
                  setFormData({ ...formData, bank_tujuan: e.target.value })
                }
              >
                {BANK_TUJUAN.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-6">
            <Label className="text-xs font-bold text-slate-500 uppercase">
              Keterangan / Doa Donatur (Opsional)
            </Label>
            <Textarea
              placeholder="Contoh: Titipan sedekah untuk anak yatim atau doa dari donatur..."
              className="mt-2 min-h-[100px]"
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
            />
          </CardContent>
        </Card>
      </div>

      {/* KOLOM KANAN: NOMINAL & SIMPAN */}
      <div className="space-y-6 md:col-span-1">
        <Card className="border-indigo-200 bg-indigo-50/30 shadow-md">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="flex items-center gap-2 text-sm font-black text-indigo-900">
              <CreditCard className="h-4 w-4" /> NOMINAL TRANSAKSI
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label className="font-bold text-indigo-900">
                Masukkan Jumlah Donasi
              </Label>
              <Input
                type="number"
                placeholder="Rp 0"
                className="h-16 border-2 text-2xl font-black text-indigo-700 shadow-inner transition-all focus:border-indigo-500"
                value={formData.nominal_donasi}
                onChange={(e) =>
                  setFormData({ ...formData, nominal_donasi: e.target.value })
                }
              />
              <p className="mt-2 text-xs font-bold text-indigo-600">
                Terbilang:{' '}
                <span className="font-normal text-slate-500 italic">
                  {formatRupiah(Number(formData.nominal_donasi) || 0)}
                </span>
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="h-16 w-full bg-indigo-600 text-lg font-black shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                ) : (
                  <Save className="mr-2 h-6 w-6" />
                )}
                CATAT DONASI
              </Button>
              <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                <BadgeCheck className="h-3 w-3 text-emerald-500" /> Secure OLAP
                Transaction
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-slate-200 bg-slate-50/50">
          <CardContent className="flex items-start gap-3 p-4">
            <Calendar className="mt-1 h-5 w-5 text-slate-400" />
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">
                Periode Laporan
              </p>
              <p className="text-xs font-bold text-slate-600">
                April 2026 (Kuartal II)
              </p>
              <p className="mt-1 text-[10px] text-slate-500 italic">
                Data akan otomatis dikelompokkan berdasarkan dimensi waktu.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
