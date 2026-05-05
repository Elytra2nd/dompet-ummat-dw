'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileDown, FileUp, Loader2 } from 'lucide-react'
import ImportErrorDialog from './ImportErrorDialog'
import type { ImportValidationResult, ImportModul } from '@/lib/import-validation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

export type { ImportModul }

interface ImportButtonProps {
  modul: ImportModul
  onImportSuccess?: () => void
  className?: string
  fullWidth?: boolean
}

export default function ImportButton({ modul, onImportSuccess, className = '', fullWidth = false }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [report, setReport] = useState<ImportValidationResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // STATE UNTUK DRAG AND DROP POPUP
  const [dragDialogOpen, setDragDialogOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // ── Download Template ────────────────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    try {
      const res = await fetch(`/api/import/template?modul=${modul}`)
      if (!res.ok) throw new Error('Gagal mengunduh template')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `template_${modul}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Template berhasil diunduh')
    } catch {
      toast.error('Gagal mengunduh template')
    }
  }

  // ── Fungsi Proses File (Reusable) ─────────────────────────────────────────────
  const processFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Hanya file Excel (.xlsx / .xls) yang diterima')
      return
    }

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)

      const res = await fetch(`/api/import/${modul}`, { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        // Error kritis (header salah, sheet tidak ada, dll.)
        toast.error(data.error ?? 'Gagal memproses file')
        return
      }

      if (data.status === 'validation_failed') {
        setDragDialogOpen(false) // Tutup popup drag-drop
        setReport(data as ImportValidationResult)
        setDialogOpen(true)
        return
      }

      // Sukses
      const skippedMsg = data.skipped > 0 ? ` (${data.skipped} baris duplikat dilewati)` : ''
      toast.success(`✅ ${data.imported} data berhasil diimport${skippedMsg}`)
      setDragDialogOpen(false) // Tutup popup drag-drop
      onImportSuccess?.()
    } catch {
      toast.error('Terjadi kesalahan koneksi saat upload')
    } finally {
      setUploading(false)
    }
  }

  // ── Event Handlers ────────────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // Reset input agar file yang sama bisa dipilih lagi
    await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const labelMap: Record<ImportModul, string> = {
    donasi: 'Donasi',
    donatur: 'Donatur',
    penyaluran: 'Penyaluran',
    mustahik: 'Mustahik',
    ambulan_layanan: 'Layanan Ambulan',
    ambulan_aktivitas: 'Aktivitas Ambulan',
  }

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
        id={`import-file-${modul}`}
      />

      <div className={`flex flex-wrap items-center gap-2 ${fullWidth ? 'w-full' : ''} ${className}`}>
        {/* Tombol Download Template */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className={`gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 font-semibold text-xs whitespace-nowrap ${fullWidth ? 'flex-1 sm:flex-none h-10' : ''}`}
          id={`btn-download-template-${modul}`}
        >
          <FileDown className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">Template</span>
          <span className="sm:hidden">Excel</span>
        </Button>

        {/* Tombol Buka Popup Import */}
        <Button
          type="button"
          size="sm"
          onClick={() => setDragDialogOpen(true)}
          className={`gap-2 bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs shadow-md whitespace-nowrap ${fullWidth ? 'flex-1 sm:flex-none h-10' : ''}`}
          id={`btn-open-import-${modul}`}
        >
          <FileUp className="h-4 w-4 shrink-0" />
          <span className="hidden md:inline">Import {labelMap[modul]}</span>
          <span className="md:hidden">Import</span>
        </Button>
      </div>

      {/* Popup Dialog Drag and Drop */}
      <Dialog open={dragDialogOpen} onOpenChange={(open) => !uploading && setDragDialogOpen(open)}>
        <DialogContent className="sm:max-w-md font-sans">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">
              Import Data {labelMap[modul]}
            </DialogTitle>
            <DialogDescription className="font-medium text-slate-500">
              Unggah file Excel Anda dengan menyeretnya ke area di bawah atau klik untuk memilih file.
            </DialogDescription>
          </DialogHeader>

          <div
            className={`mt-4 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all duration-300 cursor-pointer outline-none select-none
              ${isDragging 
                ? 'border-emerald-500 bg-emerald-50 scale-[0.98]' 
                : 'border-slate-200 hover:bg-slate-50 hover:border-emerald-300'
              }
              ${uploading ? 'pointer-events-none opacity-80' : ''}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-emerald-200' : 'bg-emerald-100/50'}`}>
              {uploading ? (
                 <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
              ) : (
                 <FileUp className={`h-10 w-10 transition-colors duration-300 ${isDragging ? 'text-emerald-700' : 'text-emerald-600'}`} />
              )}
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-slate-700 text-sm">
                {uploading ? 'Sedang memproses file...' : 'Klik atau seret file ke area ini'}
              </p>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Format didukung: .XLSX, .XLS
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Report Dialog */}
      <ImportErrorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        report={report}
        modul={modul}
      />
    </>
  )
}
