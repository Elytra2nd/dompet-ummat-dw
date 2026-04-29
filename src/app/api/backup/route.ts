import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

/**
 * GET /api/backup
 * ================
 * Mengekspor SELURUH data warehouse ke file Excel (.xlsx).
 * Setiap tabel menjadi 1 sheet terpisah.
 * Berbeda dari Laporan: ini dump raw data mentah tanpa agregasi/filter.
 */
export async function GET() {
  try {
    // ── 1. FETCH SEMUA TABEL SECARA PARALEL ────────────────────────────────
    const [
      dimDate,
      dimDonatur,
      dimJalurPembayaran,
      dimLokasi,
      dimMustahik,
      dimPasienAmbulan,
      dimPenyalurMaster,
      dimPertanyaanSurvey,
      dimPetugas,
      dimProgramDonasi,
      factAktivitasAmbulan,
      factDonasi,
      factLayananAmbulan,
      factPenyaluran,
      factSkorKelayakan,
      factSurvey,
      factSurveyDetail,
    ] = await Promise.all([
      prisma.dim_date.findMany({ orderBy: { sk_date: 'asc' } }),
      prisma.dim_donatur.findMany({ orderBy: { sk_donatur: 'asc' } }),
      prisma.dim_jalur_pembayaran.findMany({ orderBy: { sk_jalur_pembayaran: 'asc' } }),
      prisma.dim_lokasi.findMany({ orderBy: { sk_lokasi: 'asc' } }),
      prisma.dim_mustahik.findMany({ orderBy: { sk_mustahik: 'asc' } }),
      prisma.dim_pasien_ambulan.findMany({ orderBy: { sk_pasien: 'asc' } }),
      prisma.dim_penyalur_master.findMany({ orderBy: { sk_penyalur: 'asc' } }),
      prisma.dim_pertanyaan_survey.findMany({ orderBy: { sk_pertanyaan: 'asc' } }),
      prisma.dim_petugas.findMany({ orderBy: { sk_petugas: 'asc' } }),
      prisma.dim_program_donasi.findMany({ orderBy: { sk_program_donasi: 'asc' } }),
      prisma.fact_aktivitas_ambulan.findMany({ orderBy: { sk_fakta_aktivitas_ambulan: 'asc' } }),
      prisma.fact_donasi.findMany({ orderBy: { sk_fakta_donasi: 'asc' } }),
      prisma.fact_layanan_ambulan.findMany({ orderBy: { sk_fakta_layanan_ambulan: 'asc' } }),
      prisma.fact_penyaluran.findMany({ orderBy: { sk_fakta_penyaluran: 'asc' } }),
      prisma.fact_skor_kelayakan.findMany({ orderBy: { sk_fakta_skor_kelayakan: 'asc' } }),
      prisma.fact_survey.findMany({ orderBy: { sk_survey: 'asc' } }),
      prisma.fact_survey_detail.findMany({ orderBy: { sk_detail: 'asc' } }),
    ])

    // ── 2. BUAT WORKBOOK EXCEL ─────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Dompet Ummat DW — Backup System'
    workbook.created = new Date()

    const tables: { name: string; data: any[]; color: string }[] = [
      { name: 'dim_date', data: dimDate, color: '4F46E5' },
      { name: 'dim_donatur', data: dimDonatur, color: '059669' },
      { name: 'dim_jalur_pembayaran', data: dimJalurPembayaran, color: '059669' },
      { name: 'dim_lokasi', data: dimLokasi, color: '0891B2' },
      { name: 'dim_mustahik', data: dimMustahik, color: 'D97706' },
      { name: 'dim_pasien_ambulan', data: dimPasienAmbulan, color: 'DC2626' },
      { name: 'dim_penyalur_master', data: dimPenyalurMaster, color: '7C3AED' },
      { name: 'dim_pertanyaan_survey', data: dimPertanyaanSurvey, color: '2563EB' },
      { name: 'dim_petugas', data: dimPetugas, color: '4338CA' },
      { name: 'dim_program_donasi', data: dimProgramDonasi, color: '059669' },
      { name: 'fact_aktivitas_ambulan', data: factAktivitasAmbulan, color: 'BE123C' },
      { name: 'fact_donasi', data: factDonasi, color: '16A34A' },
      { name: 'fact_layanan_ambulan', data: factLayananAmbulan, color: 'EA580C' },
      { name: 'fact_penyaluran', data: factPenyaluran, color: '9333EA' },
      { name: 'fact_skor_kelayakan', data: factSkorKelayakan, color: '0D9488' },
      { name: 'fact_survey', data: factSurvey, color: '2563EB' },
      { name: 'fact_survey_detail', data: factSurveyDetail, color: '6366F1' },
    ]

    // ── 3. POPULATE SHEETS ─────────────────────────────────────────────────
    for (const table of tables) {
      const sheet = workbook.addWorksheet(table.name, {
        properties: { tabColor: { argb: table.color } },
      })

      if (table.data.length === 0) {
        sheet.addRow(['(Tidak ada data)'])
        continue
      }

      // Header dari keys baris pertama
      const columns = Object.keys(table.data[0])
      sheet.columns = columns.map(col => ({
        header: col,
        key: col,
        width: Math.max(col.length + 4, 15),
      }))

      // Style header row
      const headerRow = sheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: table.color },
      }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
      headerRow.height = 28

      // Data rows
      for (const row of table.data) {
        const rowData: Record<string, any> = {}
        for (const col of columns) {
          let val = (row as any)[col]
          // Convert Decimal/BigInt to number for Excel compatibility
          if (val !== null && val !== undefined) {
            if (typeof val === 'bigint') val = Number(val)
            if (typeof val === 'object' && !(val instanceof Date)) val = String(val)
          }
          rowData[col] = val
        }
        sheet.addRow(rowData)
      }

      // Auto-filter
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: columns.length },
      }

      // Freeze header
      sheet.views = [{ state: 'frozen', ySplit: 1 }]
    }

    // ── 4. SHEET RINGKASAN (Summary) ───────────────────────────────────────
    const summarySheet = workbook.addWorksheet('_RINGKASAN', {
      properties: { tabColor: { argb: '111827' } },
    })
    summarySheet.columns = [
      { header: 'Tabel', key: 'name', width: 30 },
      { header: 'Jumlah Baris', key: 'count', width: 15 },
      { header: 'Kategori', key: 'category', width: 20 },
    ]
    const summaryHeader = summarySheet.getRow(1)
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '111827' } }
    summaryHeader.height = 28

    for (const t of tables) {
      summarySheet.addRow({
        name: t.name,
        count: t.data.length,
        category: t.name.startsWith('dim_') ? 'Dimensi' : 'Fakta',
      })
    }
    summarySheet.addRow({})
    summarySheet.addRow({
      name: 'TOTAL RECORD',
      count: tables.reduce((sum, t) => sum + t.data.length, 0),
      category: '-',
    })

    // ── 5. KIRIM RESPONSE ──────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer()
    const now = new Date()
    const filename = `backup_dompet_ummat_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.xlsx`

    return new NextResponse(buffer as ArrayBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('BACKUP_ERROR:', error)
    return NextResponse.json({ error: 'Gagal membuat backup', details: error.message }, { status: 500 })
  }
}
