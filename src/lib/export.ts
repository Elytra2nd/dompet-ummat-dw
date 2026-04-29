/**
 * Export Utilities — Dompet Ummat
 * =================================
 * Shared helper untuk ekspor data ke Excel (exceljs) dan PDF (jspdf).
 * Mendukung per-domain schema, branding, audit watermark, dan filter periode.
 */

import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface ExportPeriod {
  from?: string // YYYY-MM-DD
  to?: string   // YYYY-MM-DD
}

export interface ExportColumn {
  header: string
  key: string
  width?: number
  format?: 'rupiah' | 'number' | 'date' | 'text'
}

export interface ExportOptions {
  title: string
  subtitle?: string
  columns: ExportColumn[]
  rows: Record<string, unknown>[]
  period?: ExportPeriod
  exportedBy?: string
  landscape?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Schema per domain (kolom tetap sesuai konteks, bukan generic fallback)
// ─────────────────────────────────────────────────────────────────────────────

export const DONATUR_SCHEMA: ExportColumn[] = [
  { header: 'Tipe Donatur', key: 'tipe', width: 18 },
  { header: 'Jumlah Donatur', key: '_count.id_donatur', width: 18, format: 'number' },
  { header: 'Persentase (%)', key: 'persentase', width: 16, format: 'number' },
]

export const AMBULAN_SCHEMA: ExportColumn[] = [
  { header: 'Waktu (Jam)', key: 'jam', width: 20 },
  { header: 'Jumlah Layanan', key: '_count.id_transaksi', width: 18, format: 'number' },
]

export const MUSTAHIK_SCHEMA: ExportColumn[] = [
  { header: 'Kabupaten/Kota', key: 'kabupaten_kota', width: 24 },
  { header: 'Jumlah Mustahik', key: '_count.id_mustahik', width: 20, format: 'number' },
]

export const SEGMEN_DONATUR_SCHEMA: ExportColumn[] = [
  { header: 'ID Donatur', key: 'id_donatur', width: 16 },
  { header: 'Nama Lengkap', key: 'nama_lengkap', width: 26 },
  { header: 'Tipe', key: 'tipe', width: 14 },
  { header: 'Kontak', key: 'kontak', width: 20 },
  { header: 'Recency (hari)', key: 'recency', width: 16, format: 'number' },
  { header: 'Frekuensi', key: 'frequency', width: 14, format: 'number' },
  { header: 'Total Donasi (Rp)', key: 'monetary', width: 22, format: 'rupiah' },
  { header: 'Skor RFM', key: 'rfm_score', width: 12, format: 'number' },
  { header: 'Segmen', key: 'segment_label', width: 18 },
]

// ─────────────────────────────────────────────────────────────────────────────
// Helper: resolve nested key (e.g. "_count.id_donatur")
// ─────────────────────────────────────────────────────────────────────────────

function resolveKey(obj: Record<string, unknown>, key: string): unknown {
  return key.split('.').reduce((acc, k) => {
    if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[k]
    return undefined
  }, obj as unknown)
}

function formatValue(value: unknown, format?: ExportColumn['format']): string | number {
  if (value === null || value === undefined) return '-'
  const num = Number(value)
  if (format === 'rupiah') {
    return isNaN(num) ? String(value) : num
  }
  if (format === 'number') {
    return isNaN(num) ? String(value) : num
  }
  return String(value)
}

function formatRupiahText(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

function periodLabel(period?: ExportPeriod): string {
  if (!period?.from && !period?.to) return 'Seluruh Periode'
  if (period.from && period.to) return `${period.from} s/d ${period.to}`
  if (period.from) return `Mulai ${period.from}`
  return `s/d ${period.to}`
}

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL — exceljs styled
// ─────────────────────────────────────────────────────────────────────────────

export async function exportExcel(opts: ExportOptions): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'BIDA Analytics — Dompet Ummat'
  wb.created = new Date()

  const ws = wb.addWorksheet('Data', {
    pageSetup: {
      paperSize: opts.landscape ? 9 : 9,
      orientation: opts.landscape ? 'landscape' : 'portrait',
      fitToPage: true,
    },
  })

  const dateNow = new Date().toLocaleString('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  // ── Header block ──────────────────────────────────────
  const colCount = opts.columns.length || 3
  const headerRows = [
    ['LAPORAN RESMI — DOMPET UMMAT KALIMANTAN BARAT'],
    [opts.title],
    [`Periode: ${periodLabel(opts.period)}`],
    [`Dicetak: ${dateNow}${opts.exportedBy ? ` | Oleh: ${opts.exportedBy}` : ''}`],
    ['Status: Official Data Warehouse Record'],
    [],
  ]

  headerRows.forEach((rowData, idx) => {
    const row = ws.addRow(rowData)
    if (idx === 0) {
      row.getCell(1).font = { bold: true, size: 14, color: { argb: 'FF065F46' } }
    } else if (idx === 1) {
      row.getCell(1).font = { bold: true, size: 11 }
    } else {
      row.getCell(1).font = { size: 9, color: { argb: 'FF64748B' } }
    }
    if (colCount > 1) ws.mergeCells(row.number, 1, row.number, colCount)
  })

  // ── Column headers ────────────────────────────────────
  const headerRow = ws.addRow(opts.columns.map(c => c.header))
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } }
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 9 }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FF059669' } },
    }
  })
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: headerRow.number }]

  // ── Column widths ─────────────────────────────────────
  opts.columns.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width ?? 16
  })

  // ── Data rows ─────────────────────────────────────────
  opts.rows.forEach((rowObj, rowIdx) => {
    const values = opts.columns.map(col => {
      const raw = resolveKey(rowObj, col.key)
      return formatValue(raw, col.format)
    })
    const row = ws.addRow(values)

    row.eachCell((cell, colNum) => {
      const col = opts.columns[colNum - 1]
      if (col.format === 'rupiah' && typeof cell.value === 'number') {
        cell.numFmt = '#,##0'
      }
      cell.font = { size: 9 }
      cell.alignment = { vertical: 'middle' }
      if (rowIdx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      }
      cell.border = {
        bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
      }
    })
  })

  // ── Auto filter ───────────────────────────────────────
  ws.autoFilter = {
    from: { row: headerRow.number, column: 1 },
    to: { row: headerRow.number, column: colCount },
  }

  // ── Footer row ────────────────────────────────────────
  ws.addRow([])
  const footerRow = ws.addRow([`Dokumen ini digenerate secara otomatis oleh BIDA Analytics Platform. Tidak sah tanpa tanda tangan pejabat berwenang.`])
  footerRow.getCell(1).font = { italic: true, size: 8, color: { argb: 'FF94A3B8' } }
  if (colCount > 1) ws.mergeCells(footerRow.number, 1, footerRow.number, colCount)

  const buf = await wb.xlsx.writeBuffer()
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

// ─────────────────────────────────────────────────────────────────────────────
// PDF — jspdf + autotable branded
// ─────────────────────────────────────────────────────────────────────────────

export function exportPDF(opts: ExportOptions): Blob {
  const doc = new jsPDF({ orientation: opts.landscape ? 'landscape' : 'portrait' })
  const dateNow = new Date().toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })
  const W = opts.landscape ? 297 : 210
  const margin = 15

  // ── Kop surat ─────────────────────────────────────────
  doc.setFontSize(16).setFont('helvetica', 'bold').setTextColor(6, 95, 70)
  doc.text('DOMPET UMMAT KALIMANTAN BARAT', W / 2, 16, { align: 'center' })
  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(100, 116, 139)
  doc.text('Jl. Danau Sentarum No. 99, Pontianak, Kalimantan Barat', W / 2, 22, { align: 'center' })
  doc.text('BIDA Analytics Platform — Official Report', W / 2, 27, { align: 'center' })

  doc.setDrawColor(6, 95, 70)
  doc.setLineWidth(1)
  doc.line(margin, 30, W - margin, 30)
  doc.setLineWidth(0.3)
  doc.line(margin, 31.5, W - margin, 31.5)

  // ── Metadata ──────────────────────────────────────────
  doc.setFontSize(12).setFont('helvetica', 'bold').setTextColor(0)
  doc.text(`LAPORAN: ${opts.title.toUpperCase()}`, margin, 41)
  if (opts.subtitle) {
    doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(100, 116, 139)
    doc.text(opts.subtitle, margin, 47)
  }

  doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(71, 85, 105)
  const metaY = opts.subtitle ? 53 : 47
  doc.text(`Periode    : ${periodLabel(opts.period)}`, margin, metaY)
  doc.text(`Dicetak    : ${dateNow}`, margin, metaY + 5)
  if (opts.exportedBy) doc.text(`Oleh       : ${opts.exportedBy}`, margin, metaY + 10)

  // ── Tabel ─────────────────────────────────────────────
  const tableStartY = metaY + (opts.exportedBy ? 17 : 12)
  const tableHead = [opts.columns.map(c => c.header)]
  const tableBody = opts.rows.map(rowObj =>
    opts.columns.map(col => {
      const raw = resolveKey(rowObj, col.key)
      const val = formatValue(raw, col.format)
      if (col.format === 'rupiah' && typeof val === 'number') return formatRupiahText(val)
      return String(val === '' ? '-' : val)
    })
  )

  autoTable(doc, {
    startY: tableStartY,
    head: tableHead,
    body: tableBody,
    theme: 'grid',
    headStyles: { fillColor: [6, 95, 70], fontStyle: 'bold', fontSize: 8, cellPadding: 3 },
    bodyStyles: { fontSize: 8, cellPadding: 2.5 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: opts.columns.reduce((acc, col, i) => {
      if (col.format === 'rupiah' || col.format === 'number') {
        acc[i] = { halign: 'right' }
      }
      return acc
    }, {} as Record<number, { halign: 'right' }>),
    margin: { left: margin, right: margin },
    didDrawPage: (data) => {
      // Footer tiap halaman
      const pageCount = doc.getNumberOfPages()
      doc.setFontSize(7).setFont('helvetica', 'normal').setTextColor(148, 163, 184)
      doc.text(
        `Dicetak dari BIDA Analytics — ${dateNow}${opts.exportedBy ? ` | ${opts.exportedBy}` : ''}`,
        margin,
        doc.internal.pageSize.height - 8
      )
      doc.text(
        `Hal. ${data.pageNumber} dari ${pageCount}`,
        W - margin,
        doc.internal.pageSize.height - 8,
        { align: 'right' }
      )
    },
  })

  // ── Tanda tangan ─────────────────────────────────────
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? tableStartY
  if (finalY + 40 < doc.internal.pageSize.height - 20) {
    doc.setFontSize(9).setFont('helvetica', 'normal').setTextColor(71, 85, 105)
    doc.text('Mengetahui,', W - margin - 50, finalY + 15)
    doc.line(W - margin - 55, finalY + 35, W - margin, finalY + 35)
    doc.setFontSize(8)
    doc.text('Kepala Divisi BIDA Platform', W - margin - 50, finalY + 40)
  }

  const bytes = doc.output('arraybuffer')
  return new Blob([bytes], { type: 'application/pdf' })
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: download Blob di browser
// ─────────────────────────────────────────────────────────────────────────────

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function buildFilename(title: string, ext: 'xlsx' | 'pdf' | 'csv', period?: ExportPeriod): string {
  const base = title.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const periodStr = period?.from ? `_${period.from.replace(/-/g, '')}_${(period.to ?? 'now').replace(/-/g, '')}` : ''
  return `DU_${base}${periodStr}_${dateStr}.${ext}`
}
