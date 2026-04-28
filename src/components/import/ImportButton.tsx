'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { FileDown, FileUp, Loader2 } from 'lucide-react'
import ImportErrorDialog from './ImportErrorDialog'
import type { ImportValidationResult, ImportModul } from '@/lib/import-validation'

export type { ImportModul }

interface ImportButtonProps {
  modul: ImportModul
  onImportSuccess?: () => void
}

export default function ImportButton({ modul, onImportSuccess }: ImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [report, setReport] = useState<ImportValidationResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

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

  // ── Upload & Proses File ─────────────────────────────────────────────────────
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input agar file yang sama bisa dipilih lagi
    e.target.value = ''

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
        setReport(data as ImportValidationResult)
        setDialogOpen(true)
        return
      }

      // Sukses
      const skippedMsg = data.skipped > 0 ? ` (${data.skipped} baris duplikat dilewati)` : ''
      toast.success(`✅ ${data.imported} data berhasil diimport${skippedMsg}`)
      onImportSuccess?.()
    } catch {
      toast.error('Terjadi kesalahan koneksi saat upload')
    } finally {
      setUploading(false)
    }
  }

  const labelMap: Record<ImportModul, string> = {
    donasi: 'Donasi',
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

      <div className="flex items-center gap-2">
        {/* Tombol Download Template */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownloadTemplate}
          className="gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 font-semibold text-xs"
          id={`btn-download-template-${modul}`}
        >
          <FileDown className="h-4 w-4" />
          Template Excel
        </Button>

        {/* Tombol Import */}
        <Button
          type="button"
          size="sm"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700 font-semibold text-xs shadow-md"
          id={`btn-import-${modul}`}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <FileUp className="h-4 w-4" />
              Import {labelMap[modul]}
            </>
          )}
        </Button>
      </div>

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

