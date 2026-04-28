'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { AlertTriangle, CheckCircle2, Download, Search, XCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import type { ImportValidationResult, RowError, ImportModul } from '@/lib/import-validation'

interface ImportErrorDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  report: ImportValidationResult | null
  modul: ImportModul
}

const PAGE_SIZE = 100

export default function ImportErrorDialog({
  open,
  onOpenChange,
  report,
  modul,
}: ImportErrorDialogProps) {
  const [search, setSearch] = useState('')
  const [filterField, setFilterField] = useState('all')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'error' | 'warning'>('all')
  const [page, setPage] = useState(1)

  const errors = report?.errors ?? []

  // ── Filter ────────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return errors.filter(e => {
      const matchSearch = !search || 
        String(e.rowNumber).includes(search) ||
        (e.idField ?? '').toLowerCase().includes(search.toLowerCase()) ||
        e.message.toLowerCase().includes(search.toLowerCase()) ||
        e.field.toLowerCase().includes(search.toLowerCase())
      const matchField = filterField === 'all' || e.field === filterField
      const matchSev = filterSeverity === 'all' || e.severity === filterSeverity
      return matchSearch && matchField && matchSev
    })
  }, [errors, search, filterField, filterSeverity])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Unique field names untuk filter dropdown
  const uniqueFields = [...new Set(errors.map(e => e.field))]

  // ── Export Laporan ────────────────────────────────────────────────────────────
  const handleExportErrors = () => {
    // Export as CSV (tidak perlu library, langsung Blob)
    const headers = ['Nomor Baris', 'ID', 'Kolom', 'Nilai', 'Aturan', 'Pesan Error', 'Severity']
    const rows = errors.map(e => [
      e.rowNumber,
      e.idField ?? '-',
      e.field,
      String(e.value ?? '-'),
      e.rule,
      e.message,
      e.severity,
    ])

    const csv = [
      headers.join(';'),
      ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan_error_import_${modul}_${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Laporan error berhasil diunduh')
  }

  if (!report) return null

  const errorCount = errors.filter(e => e.severity === 'error').length
  const warningCount = errors.filter(e => e.severity === 'warning').length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-rose-50/60 shrink-0">
          <DialogTitle className="flex items-center gap-2 text-rose-700 font-black text-lg">
            <XCircle className="h-5 w-5" />
            File Belum Bisa Diimport
          </DialogTitle>
          <DialogDescription className="text-slate-600 mt-1">
            Perbaiki semua error di bawah ini, lalu upload ulang file yang sudah diperbaiki.
          </DialogDescription>
        </DialogHeader>

        {/* ── Summary Bar ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b bg-slate-50 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-black text-slate-900">{report.totalRows}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Baris</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-emerald-600">{report.validRows}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Baris Valid</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-rose-600">{errorCount}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Error</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-amber-500">{warningCount}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Warning</p>
          </div>
        </div>

        {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b bg-white shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              placeholder="Cari baris, ID, atau pesan error..."
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              id="import-error-search"
            />
          </div>

          <select
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium"
            value={filterField}
            onChange={e => { setFilterField(e.target.value); setPage(1) }}
          >
            <option value="all">Semua Kolom</option>
            {uniqueFields.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          <select
            className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs font-medium"
            value={filterSeverity}
            onChange={e => { setFilterSeverity(e.target.value as any); setPage(1) }}
          >
            <option value="all">Semua Tipe</option>
            <option value="error">Error saja</option>
            <option value="warning">Warning saja</option>
          </select>

          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} hasil
          </span>
        </div>

        {/* ── Error Table ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-100 z-10">
              <TableRow>
                <TableHead className="w-16 text-[10px] font-black uppercase text-slate-500">Baris</TableHead>
                <TableHead className="w-36 text-[10px] font-black uppercase text-slate-500">ID</TableHead>
                <TableHead className="w-36 text-[10px] font-black uppercase text-slate-500">Kolom</TableHead>
                <TableHead className="w-40 text-[10px] font-black uppercase text-slate-500">Nilai</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-500">Pesan Error</TableHead>
                <TableHead className="w-24 text-[10px] font-black uppercase text-slate-500 text-center">Tipe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-sm text-slate-400">
                    Tidak ada error yang cocok dengan filter
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((e, idx) => (
                  <TableRow
                    key={idx}
                    className={e.severity === 'error' ? 'bg-rose-50/40 hover:bg-rose-50' : 'bg-amber-50/40 hover:bg-amber-50'}
                  >
                    <TableCell className="font-mono text-xs font-bold text-slate-600">{e.rowNumber}</TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-500 truncate max-w-[130px]">{e.idField ?? '-'}</TableCell>
                    <TableCell>
                      <code className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-700">
                        {e.field}
                      </code>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-slate-600 truncate max-w-[150px]" title={String(e.value ?? '')}>
                      {String(e.value ?? '-')}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">{e.message}</TableCell>
                    <TableCell className="text-center">
                      {e.severity === 'error' ? (
                        <Badge variant="destructive" className="text-[9px] h-5">Error</Badge>
                      ) : (
                        <Badge className="text-[9px] h-5 bg-amber-100 text-amber-700 hover:bg-amber-100">Warning</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Paginasi ─────────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-2 border-t bg-slate-50 text-xs shrink-0">
            <span className="text-slate-500">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Sebelumnya</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Berikutnya →</Button>
            </div>
          </div>
        )}

        {/* ── Footer Aksi ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-white shrink-0 gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportErrors}
            className="gap-2 text-slate-600 font-semibold"
            id="btn-export-errors"
          >
            <Download className="h-4 w-4" />
            Export Laporan Error (.csv)
          </Button>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-2 rounded-lg">
            <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            Perbaiki semua <span className="font-bold text-rose-600 mx-1">{errorCount} error</span> di file Excel, lalu upload ulang.
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="font-semibold text-slate-500"
          >
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
