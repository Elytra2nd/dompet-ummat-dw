'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  Fuel,
  Settings,
  CreditCard,
  Wrench,
  Car,
  Clock,
  ReceiptPoundSterling,
  Loader2,
} from 'lucide-react'
import {
  SHIFT_JAM,
  LIST_ARMADA,
  KATEGORI_AKTIVITAS,
} from '@/lib/constants-ambulan'

export default function AddAktivitasForm() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    jam: SHIFT_JAM[0],
    armada: LIST_ARMADA[0],
    kategori_aktivitas: KATEGORI_AKTIVITAS[0],
    biaya_operasional: '',
    keterangan: '', // Opsional
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !formData.biaya_operasional ||
      parseFloat(formData.biaya_operasional) <= 0
    ) {
      return toast.error('Masukkan biaya operasional yang valid')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/ambulan/aktivitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success('Aktivitas operasional berhasil dicatat')
        setFormData({ ...formData, biaya_operasional: '', keterangan: '' })
      }
    } catch (e) {
      toast.error('Gagal menyimpan data aktivitas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mx-auto max-w-2xl border-slate-200 shadow-sm">
      <CardHeader className="border-b bg-slate-50/50 py-4 text-center">
        <div className="mb-2 flex justify-center">
          <div className="rounded-full bg-blue-100 p-3">
            <Settings className="h-6 w-6 text-blue-600" />
          </div>
        </div>
        <CardTitle className="text-xl font-bold text-slate-800">
          Biaya Operasional & Pemeliharaan
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Car className="h-4 w-4" /> Pilih Armada
              </Label>
              <select
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={formData.armada}
                onChange={(e) =>
                  setFormData({ ...formData, armada: e.target.value })
                }
              >
                {LIST_ARMADA.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> Waktu/Shift
              </Label>
              <select
                className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                value={formData.jam}
                onChange={(e) =>
                  setFormData({ ...formData, jam: e.target.value })
                }
              >
                {SHIFT_JAM.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Wrench className="h-4 w-4" /> Kategori Aktivitas
            </Label>
            <select
              className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm font-medium"
              value={formData.kategori_aktivitas}
              onChange={(e) =>
                setFormData({ ...formData, kategori_aktivitas: e.target.value })
              }
            >
              {KATEGORI_AKTIVITAS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ReceiptPoundSterling className="h-4 w-4" /> Nominal Biaya (Rp)
            </Label>
            <Input
              type="number"
              placeholder="Contoh: 200000"
              required
              value={formData.biaya_operasional}
              onChange={(e) =>
                setFormData({ ...formData, biaya_operasional: e.target.value })
              }
              className="text-lg font-bold text-blue-700"
            />
          </div>

          <div className="space-y-2">
            <Label>Keterangan Tambahan (Opsional)</Label>
            <Input
              placeholder="Misal: Ganti Oli di Bengkel A"
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full bg-blue-600 font-bold hover:bg-blue-700"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Fuel className="mr-2 h-4 w-4" />
            )}
            Catat Pengeluaran
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
