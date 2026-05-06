'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  ArrowUpRight, Search, Plus, Loader2, Pencil, Trash2, X, Save, ChevronLeft, ChevronRight, Eye, Receipt
} from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import Link from 'next/link'
import ImportButton from '@/components/import/ImportButton'
import {
  DOMAIN_PROGRAM, KATEGORI_PROGRAM, JENIS_BANTUAN, STATUS_PENGAJUAN, KATEGORI_PENYAKIT,
} from '@/lib/constants-penyaluran'

// ─── Types ───────────────────────────────────────────────────────────────────

interface PenyaluranZiswaf {
  sk_fakta_penyaluran: number
  id_transaksi: string
  dana_tersalur: number | string
  domain_program: string
  kategori_program: string
  jenis_bantuan: string
  status_pengajuan: string
  kategori_penyakit?: string
  dim_mustahik?: { nama: string; kategori_pm: string }
  dim_date_fact_penyaluran_sk_tgl_disalurkanTodim_date?: { tanggal_lengkap?: string }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatIDR = (val: number | string) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(val))

const toDisplay = (raw: string) => raw?.replace(/_/g, ' ').replace(/\s+/g, ' ').trim() ?? '-'

const STATUS_COLOR: Record<string, string> = {
  Disetujui: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Proses:    'bg-blue-50 text-blue-700 border-blue-200',
  Ditolak:   'bg-red-50 text-red-700 border-red-200',
  Batal:     'bg-slate-100 text-slate-500 border-slate-200',
}

const PAGE_SIZE = 15

// ─── Component ───────────────────────────────────────────────────────────────

export default function DonasiKeluarPage() {
  const [data, setData] = useState<PenyaluranZiswaf[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Edit state
  const [editItem, setEditItem] = useState<PenyaluranZiswaf | null>(null)
  const [editForm, setEditForm] = useState({
    dana_tersalur: '',
    domain_program: '',
    kategori_program: '',
    jenis_bantuan: '',
    status_pengajuan: '',
    kategori_penyakit: '',
  })
  const [saving, setSaving] = useState(false)

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<PenyaluranZiswaf | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Detail state
  const [detailItem, setDetailItem] = useState<PenyaluranZiswaf | null>(null)

  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/donasi/keluar')
      const json = await res.json()
      setData(Array.isArray(json) ? json : [])
    } catch {
      toast.error('Gagal memuat data penyaluran')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [fetchData])

  // ─── Filter & Pagination ─────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return data.filter(
      (d) =>
        d.id_transaksi?.toLowerCase().includes(q) ||
        d.dim_mustahik?.nama?.toLowerCase().includes(q) ||
        toDisplay(d.domain_program).toLowerCase().includes(q),
    )
  }, [data, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalDana = filtered.reduce((acc, d) => acc + Number(d.dana_tersalur ?? 0), 0)

  // ─── Edit ────────────────────────────────────────────────────────────────

  const openEdit = (item: PenyaluranZiswaf) => {
    setEditItem(item)
    setEditForm({
      dana_tersalur: String(Number(item.dana_tersalur)),
      domain_program: toDisplay(item.domain_program),
      kategori_program: toDisplay(item.kategori_program),
      jenis_bantuan: toDisplay(item.jenis_bantuan),
      status_pengajuan: toDisplay(item.status_pengajuan),
      kategori_penyakit: toDisplay(item.kategori_penyakit ?? ''),
    })
  }

  const handleSave = async () => {
    if (!editItem) return
    setSaving(true)
    try {
      const domainMap: Record<string, string> = {
        'Pendidikan': 'Pendidikan', 'Kesehatan': 'Kesehatan', 'Ekonomi': 'Ekonomi',
        'Sosial Kemanusiaan': 'Sosial_Kemanusiaan', 'Dakwah & Advokasi': 'Dakwah___Advokasi',
        'Operasional': 'Operasional',
      }
      const kategoriMap: Record<string, string> = {
        'Beasiswa': 'Beasiswa', 'Bantuan Biaya Pengobatan': 'Bantuan_Biaya_Pengobatan',
        'Modal Usaha': 'Modal_Usaha', 'Sembako': 'Sembako',
        'Santunan Tunai': 'Santunan_Tunai', 'Lainnya': 'Lainnya',
      }
      const jenisMap: Record<string, string> = {
        'Tunai': 'Tunai', 'Barang/Logistik': 'Barang_Logistik',
        'Jasa/Layanan': 'Jasa_Layanan', 'Lainnya': 'Lainnya',
      }
      const statusMap: Record<string, string> = {
        'Proses': 'Proses', 'Disetujui': 'Disetujui', 'Ditolak': 'Ditolak', 'Batal': 'Batal',
      }
      const penyakitMap: Record<string, string> = {
        'Penyakit Kronis': 'Penyakit_Kronis', 'Penyakit Menular': 'Penyakit_Menular',
        'Penyakit Ringan': 'Penyakit_Ringan', 'Gawat Darurat/Kecelakaan': 'Gawat_Darurat_Kecelakaan',
        'Tidak Ada/Not Applicable': 'Tidak_Ada_Not_Applicable', '-': 'Tidak_Ada_Not_Applicable',
      }

      const res = await fetch('/api/donasi/keluar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sk_fakta_penyaluran: editItem.sk_fakta_penyaluran,
          dana_tersalur: editForm.dana_tersalur,
          domain_program: domainMap[editForm.domain_program] ?? editForm.domain_program,
          kategori_program: kategoriMap[editForm.kategori_program] ?? editForm.kategori_program,
          jenis_bantuan: jenisMap[editForm.jenis_bantuan] ?? editForm.jenis_bantuan,
          status_pengajuan: statusMap[editForm.status_pengajuan] ?? editForm.status_pengajuan,
          kategori_penyakit: penyakitMap[editForm.kategori_penyakit] ?? 'Tidak_Ada_Not_Applicable',
        }),
      })
      if (!res.ok) throw new Error('Gagal menyimpan')
      toast.success('Data penyaluran berhasil diperbarui')
      setEditItem(null)
      fetchData()
    } catch {
      toast.error('Gagal menyimpan perubahan')
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ──────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/donasi/keluar?sk=${deleteTarget.sk_fakta_penyaluran}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Gagal menghapus')
      toast.success(`Transaksi ${deleteTarget.id_transaksi} berhasil dihapus`)
      setDeleteTarget(null)
      fetchData()
    } catch {
      toast.error('Gagal menghapus data')
    } finally {
      setDeleting(false)
    }
  }

  if (!mounted) return null

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans pb-12">
      {/* Header */}
      <div className="border-b bg-white shadow-sm mb-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-2xl md:text-3xl font-black text-slate-900">
                <ArrowUpRight className="h-7 w-7 text-amber-500 shrink-0" />
                Penyaluran <span className="text-amber-600">ZISWAF</span>
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mt-1">
                Data Warehouse • Fact Penyaluran
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ImportButton modul="penyaluran" onImportSuccess={fetchData} />
              <Button asChild className="bg-amber-600 hover:bg-amber-700 font-bold w-full sm:w-auto">
                <Link href="/donasi/keluar/baru">
                  <Plus className="mr-2 h-4 w-4" /> Input Penyaluran
                </Link>
              </Button>
            </div>
          </div>

          {/* Summary strip */}
          {!loading && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <span className="font-semibold text-slate-500">
                Total Transaksi: <span className="text-slate-900 font-black">{filtered.length}</span>
              </span>
              <span className="font-semibold text-slate-500">
                Total Tersalur: <span className="text-amber-600 font-black">{formatIDR(totalDana)}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Toolbar */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="py-4 border-b">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Cari transaksi, mustahik, atau domain..."
                className="pl-10 w-full"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              />
            </div>
          </CardHeader>

          {/* ─── Tabel Desktop ─── */}
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-[10px] uppercase px-6 w-48">ID & Domain</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Mustahik</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase hidden md:table-cell">Kategori</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase hidden md:table-cell">Jenis</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Status</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase">Dana Tersalur</TableHead>
                  <TableHead className="font-bold text-[10px] uppercase text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-20 text-center">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-500" />
                      <p className="mt-2 text-xs text-slate-400 font-bold uppercase">Memuat data warehouse...</p>
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-20 text-center text-slate-400 text-sm font-bold">
                      Tidak ada data ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((item) => (
                    <TableRow key={item.sk_fakta_penyaluran} className="hover:bg-amber-50/30 transition-colors">
                      <TableCell className="px-6 py-4">
                        <p className="font-black text-xs text-slate-900">{toDisplay(item.domain_program)}</p>
                        <p className="text-[10px] font-mono text-slate-400">{item.id_transaksi}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-bold text-sm text-slate-800">{item.dim_mustahik?.nama ?? 'UMUM'}</p>
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider">
                          {toDisplay(item.dim_mustahik?.kategori_pm ?? '')}
                        </p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 font-bold text-[9px] uppercase">
                          {toDisplay(item.kategori_program)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-600 hidden md:table-cell">
                        {toDisplay(item.jenis_bantuan)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-bold text-[9px] uppercase ${STATUS_COLOR[toDisplay(item.status_pengajuan)] ?? 'bg-slate-50 text-slate-500'}`}>
                          {toDisplay(item.status_pengajuan)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-sm text-slate-900">
                        {formatIDR(item.dana_tersalur)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => setDetailItem(item)}
                            title="Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                            onClick={() => openEdit(item)}
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                            onClick={() => setDeleteTarget(item)}
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* ─── Card Mobile ─── */}
          <div className="sm:hidden divide-y">
            {loading ? (
              <div className="py-16 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : paginated.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm font-bold">Tidak ada data</div>
            ) : (
              paginated.map((item) => (
                <div key={item.sk_fakta_penyaluran} className="p-4 hover:bg-amber-50/20 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm text-slate-900 truncate">{item.dim_mustahik?.nama ?? 'UMUM'}</p>
                      <p className="text-[10px] font-mono text-slate-400">{item.id_transaksi}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-500" onClick={() => setDetailItem(item)} aria-label="Detail">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-500" onClick={() => openEdit(item)} aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400" onClick={() => setDeleteTarget(item)} aria-label="Hapus">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 items-center">
                    <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 font-bold text-[9px]">
                      {toDisplay(item.domain_program)}
                    </Badge>
                    <Badge variant="outline" className={`font-bold text-[9px] ${STATUS_COLOR[toDisplay(item.status_pengajuan)] ?? ''}`}>
                      {toDisplay(item.status_pengajuan)}
                    </Badge>
                    <span className="font-black text-sm text-slate-900 ml-auto">{formatIDR(item.dana_tersalur)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ─── Pagination ─── */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-t bg-slate-50/50">
              <p className="text-xs text-slate-500 font-semibold">
                Hal {page} dari {totalPages} ({filtered.length} data)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ─── Modal Edit ─── */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null) }}>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black text-slate-900">
              <Pencil className="h-4 w-4 text-amber-500" />
              Edit Penyaluran
              <span className="ml-auto text-[10px] font-mono text-slate-400">{editItem?.id_transaksi}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Mustahik (read-only) */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Mustahik</p>
              <p className="font-bold text-slate-800">{editItem?.dim_mustahik?.nama ?? 'UMUM'}</p>
            </div>

            {/* Dana */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase">Dana Tersalur (Rp)</Label>
              <Input
                type="number"
                value={editForm.dana_tersalur}
                onChange={(e) => setEditForm({ ...editForm, dana_tersalur: e.target.value })}
                className="font-bold text-lg"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Domain */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase">Domain Program</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                  value={editForm.domain_program}
                  onChange={(e) => setEditForm({ ...editForm, domain_program: e.target.value })}
                >
                  {DOMAIN_PROGRAM.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Kategori */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase">Kategori Program</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                  value={editForm.kategori_program}
                  onChange={(e) => setEditForm({ ...editForm, kategori_program: e.target.value })}
                >
                  {KATEGORI_PROGRAM.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              {/* Jenis */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase">Jenis Bantuan</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                  value={editForm.jenis_bantuan}
                  onChange={(e) => setEditForm({ ...editForm, jenis_bantuan: e.target.value })}
                >
                  {JENIS_BANTUAN.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-500 uppercase">Status Pengajuan</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                  value={editForm.status_pengajuan}
                  onChange={(e) => setEditForm({ ...editForm, status_pengajuan: e.target.value })}
                >
                  {STATUS_PENGAJUAN.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Kategori Penyakit */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-500 uppercase">Kategori Penyakit</Label>
              <select
                className="flex h-10 w-full rounded-md border bg-white px-3 text-sm font-medium"
                value={editForm.kategori_penyakit}
                onChange={(e) => setEditForm({ ...editForm, kategori_penyakit: e.target.value })}
              >
                <option value="-">Tidak Ada / Not Applicable</option>
                {KATEGORI_PENYAKIT.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditItem(null)} disabled={saving}>
              <X className="mr-2 h-4 w-4" /> Batal
            </Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700 font-bold">
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Konfirmasi Hapus ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" /> Konfirmasi Hapus
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Transaksi <span className="font-black text-slate-900">{deleteTarget?.id_transaksi}</span> akan dihapus
              secara permanen dari data warehouse. Tindakan ini <span className="font-bold text-red-600">tidak dapat dibatalkan</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 font-bold"
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Modal Detail ─── */}
      <Dialog open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null) }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-black uppercase text-amber-900 tracking-tight">
              <Receipt className="h-5 w-5 text-amber-600" /> Detail Transaksi Keluar
            </DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div className="space-y-6 py-4">
              <div className="flex justify-between items-center bg-amber-50 p-4 rounded-xl border border-amber-100">
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">ID Transaksi</p>
                  <p className="font-mono text-sm font-bold text-amber-900 mt-1">{detailItem.id_transaksi}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Dana Tersalur</p>
                  <p className="font-black text-xl text-amber-700 mt-1">{formatIDR(detailItem.dana_tersalur)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-4 gap-x-6 px-2">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Mustahik</p>
                  <p className="font-semibold text-slate-800 mt-1">{detailItem.dim_mustahik?.nama || 'UMUM'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Kategori Mustahik</p>
                  <p className="font-semibold text-amber-600 mt-1 uppercase">{toDisplay(detailItem.dim_mustahik?.kategori_pm || '-')}</p>
                </div>

                <div className="col-span-2 pt-4 border-t border-slate-100"></div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Domain Program</p>
                  <p className="font-semibold text-slate-800 mt-1">{toDisplay(detailItem.domain_program)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Kategori Program</p>
                  <p className="font-semibold text-slate-800 mt-1">{toDisplay(detailItem.kategori_program)}</p>
                </div>

                <div className="col-span-2 pt-4 border-t border-slate-100"></div>

                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Jenis Bantuan</p>
                  <p className="font-semibold text-slate-800 mt-1">{toDisplay(detailItem.jenis_bantuan)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase">Status Pengajuan</p>
                  <p className="mt-1"><Badge variant="outline" className={`font-bold text-[9px] uppercase ${STATUS_COLOR[toDisplay(detailItem.status_pengajuan)] ?? 'bg-slate-50 text-slate-500'}`}>{toDisplay(detailItem.status_pengajuan)}</Badge></p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setDetailItem(null)} className="bg-amber-600 hover:bg-amber-700 font-bold w-full sm:w-auto">
              Tutup Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}