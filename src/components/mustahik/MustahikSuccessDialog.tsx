'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  MapPin,
  User,
  Home,
  Banknote,
  ClipboardList,
  ExternalLink,
  Plus,
} from 'lucide-react'

export interface MustahikSuccessData {
  id_generated: string
  nama: string
  kategori_pm: string
  program_induk: string
  sub_program: string
  kabupaten_kota: string
  provinsi: string
  latitude: number
  longitude: number
  dana_tersalur: number
  isEdit?: boolean
}

interface MustahikSuccessDialogProps {
  open: boolean
  data: MustahikSuccessData | null
  onAddAnother: () => void
  onClose: () => void
}

export default function MustahikSuccessDialog({
  open,
  data,
  onAddAnother,
  onClose,
}: MustahikSuccessDialogProps) {
  if (!data) return null

  const hasSpatial = data.latitude !== 0 && data.longitude !== 0
  const hasDana = data.dana_tersalur > 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden gap-0">
        {/* ── Header sukses ───────────────────────────────────────────── */}
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-8 py-7 text-white">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white leading-none">
                {data.isEdit ? 'Data Berhasil Diperbarui' : 'Mustahik Terdaftar'}
              </DialogTitle>
              <p className="text-emerald-200 text-xs font-medium mt-0.5">
                {data.isEdit ? 'SCD Type 2 — Versi baru tersimpan' : 'Data berhasil di-push ke Warehouse'}
              </p>
            </div>
          </div>

          {/* ID Badge */}
          <div className="flex items-center gap-2 mt-4">
            <code className="bg-white/15 border border-white/20 px-3 py-1.5 rounded-md font-mono text-sm font-bold text-white tracking-wider">
              {data.id_generated || '—'}
            </code>
            {hasSpatial && (
              <Badge className="bg-white/20 border-white/30 text-white text-[10px] font-black uppercase tracking-wider hover:bg-white/20">
                <MapPin className="h-2.5 w-2.5 mr-1" />
                SPATIAL READY
              </Badge>
            )}
          </div>
        </div>

        {/* ── Ringkasan data ───────────────────────────────────────────── */}
        <div className="px-6 py-5 space-y-3 bg-white">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Ringkasan Data Tersimpan
          </p>

          <div className="grid grid-cols-2 gap-3">
            {/* Identitas */}
            <div className="col-span-2 flex items-start gap-3 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
              <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div>
                <p className="font-black text-slate-900 text-sm leading-tight">{data.nama}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {data.kategori_pm}
                </p>
              </div>
            </div>

            {/* Program */}
            <div className="flex items-start gap-3 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3">
              <ClipboardList className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Program</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5 leading-snug">
                  {data.program_induk}
                </p>
                <p className="text-[10px] text-slate-500">{data.sub_program}</p>
              </div>
            </div>

            {/* Wilayah */}
            <div className="flex items-start gap-3 rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
              <Home className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Wilayah</p>
                <p className="font-bold text-slate-800 text-xs mt-0.5 leading-snug">{data.kabupaten_kota}</p>
                <p className="text-[10px] text-slate-500">{data.provinsi}</p>
              </div>
            </div>

            {/* Koordinat */}
            {hasSpatial && (
              <div className="flex items-start gap-3 rounded-lg bg-rose-50 border border-rose-100 px-4 py-3">
                <MapPin className="h-4 w-4 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-wider">Koordinat</p>
                  <p className="font-mono font-bold text-slate-800 text-[11px] mt-0.5">
                    {data.latitude.toFixed(6)}
                  </p>
                  <p className="font-mono text-[10px] text-slate-500">
                    {data.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            )}

            {/* Dana */}
            {hasDana && (
              <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-100 px-4 py-3">
                <Banknote className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider">Dana Tersalur</p>
                  <p className="font-black text-slate-900 text-sm mt-0.5">
                    Rp {data.dana_tersalur.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-400">→ fact_penyaluran</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer aksi ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-6 py-4 border-t bg-slate-50">
          {!data.isEdit && (
            <Button
              variant="outline"
              className="flex-1 gap-2 font-bold border-2"
              onClick={onAddAnother}
            >
              <Plus className="h-4 w-4" />
              Daftar Lagi
            </Button>
          )}
          <Button
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 font-bold"
            onClick={onClose}
          >
            <CheckCircle2 className="h-4 w-4" />
            Selesai
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
