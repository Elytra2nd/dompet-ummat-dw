import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import ExcelJS from 'exceljs'
import JSZip from 'jszip'
import { getToken } from 'next-auth/jwt'
import { logActivity } from '@/lib/audit'

export const dynamic = 'force-dynamic'

// Helper for CSV conversion
function jsonToCSV(data: any[]): string {
  if (!data || data.length === 0) return ''
  const keys = Object.keys(data[0])
  const header = keys.map(k => `"${k}"`).join(',')
  const rows = data.map(row => 
    keys.map(k => {
      let val = row[k]
      if (val === null || val === undefined) return ''
      if (typeof val === 'bigint') val = Number(val)
      if (typeof val === 'object' && !(val instanceof Date)) val = JSON.stringify(val)
      if (typeof val === 'string') return `"${val.replace(/"/g, '""')}"`
      return val
    }).join(',')
  )
  return [header, ...rows].join('\n')
}

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const userId = token?.sub || 'SYSTEM'

    const { searchParams } = new URL(req.url)
    const modules = searchParams.get('modules') || 'all' // 'all', 'dimensi', 'fakta'
    const format = searchParams.get('format') || 'xlsx' // 'xlsx', 'zip'
    const startDateRaw = searchParams.get('startDate')
    const endDateRaw = searchParams.get('endDate')

    // Parse date filters to Integer SK format (YYYYMMDD)
    const skStart = startDateRaw ? parseInt(startDateRaw.replace(/-/g, '')) : undefined
    const skEnd = endDateRaw ? parseInt(endDateRaw.replace(/-/g, '')) : undefined

    const dateFilter = skStart && skEnd ? { gte: skStart, lte: skEnd } :
                       skStart ? { gte: skStart } :
                       skEnd ? { lte: skEnd } : undefined

    const includeDimensi = modules === 'all' || modules === 'dimensi'
    const includeFakta = modules === 'all' || modules === 'fakta'

    // ── 1. FETCH DATA DINAMIS ────────────────────────────────
    const [
      dimDate, dimDonatur, dimJalurPembayaran, dimLokasi, dimMustahik,
      dimPasienAmbulan, dimPenyalurMaster, dimPertanyaanSurvey, dimPetugas, dimProgramDonasi,
      factAktivitasAmbulan, factDonasi, factLayananAmbulan, factPenyaluran, factSkorKelayakan, factSurvey, factSurveyDetail
    ] = await Promise.all([
      includeDimensi ? prisma.dim_date.findMany({ orderBy: { sk_date: 'asc' } }) : Promise.resolve([]),
      includeDimensi ? prisma.dim_donatur.findMany({ orderBy: { sk_donatur: 'asc' } }) : Promise.resolve([]),
      includeDimensi ? prisma.dim_jalur_pembayaran.findMany({ orderBy: { sk_jalur_pembayaran: 'asc' } }) : Promise.resolve([]),
      includeDimensi ? prisma.dim_lokasi.findMany({ orderBy: { sk_lokasi: 'asc' } }) : Promise.resolve([]),
      includeDimensi ? prisma.dim_mustahik.findMany({ orderBy: { sk_mustahik: 'asc' } }) : Promise.resolve([]),
      includeDimensi ? prisma.dim_pasien_ambulan.findMany({ orderBy: { sk_pasien: 'asc' } }) : Promise.resolve([]),
      includeDimensi ? prisma.dim_penyalur_master.findMany({ orderBy: { sk_penyalur: 'asc' } }) : Promise.resolve([]),
      includeDimensi ? prisma.dim_pertanyaan_survey.findMany({ orderBy: { sk_pertanyaan: 'asc' } }) : Promise.resolve([]),
      includeDimensi ? prisma.dim_petugas.findMany({ orderBy: { sk_petugas: 'asc' } }) : Promise.resolve([]),
      includeDimensi ? prisma.dim_program_donasi.findMany({ orderBy: { sk_program_donasi: 'asc' } }) : Promise.resolve([]),
      
      includeFakta ? prisma.fact_aktivitas_ambulan.findMany({ 
        where: dateFilter ? { sk_tanggal_aktivitas: dateFilter } : undefined,
        orderBy: { sk_fakta_aktivitas_ambulan: 'asc' } 
      }) : Promise.resolve([]),
      includeFakta ? prisma.fact_donasi.findMany({ 
        where: dateFilter ? { sk_tgl_bersih: dateFilter } : undefined,
        orderBy: { sk_fakta_donasi: 'asc' } 
      }) : Promise.resolve([]),
      includeFakta ? prisma.fact_layanan_ambulan.findMany({ 
        where: dateFilter ? { sk_tanggal_layanan: dateFilter } : undefined,
        orderBy: { sk_fakta_layanan_ambulan: 'asc' } 
      }) : Promise.resolve([]),
      includeFakta ? prisma.fact_penyaluran.findMany({ 
        where: dateFilter ? { sk_tgl_berkas: dateFilter } : undefined,
        orderBy: { sk_fakta_penyaluran: 'asc' } 
      }) : Promise.resolve([]),
      includeFakta ? prisma.fact_skor_kelayakan.findMany({ 
        where: dateFilter ? { sk_tgl_survey: dateFilter } : undefined,
        orderBy: { sk_fakta_skor_kelayakan: 'asc' } 
      }) : Promise.resolve([]),
      includeFakta ? prisma.fact_survey.findMany({ 
        where: dateFilter ? { sk_tgl_survey: dateFilter } : undefined,
        orderBy: { sk_survey: 'asc' } 
      }) : Promise.resolve([]),
      includeFakta ? prisma.fact_survey_detail.findMany({ orderBy: { sk_detail: 'asc' } }) : Promise.resolve([]), // no specific date field, bound to fact_survey
    ])

    const allTables = [
      { name: 'dim_date', data: dimDate, color: '4F46E5', isDim: true },
      { name: 'dim_donatur', data: dimDonatur, color: '059669', isDim: true },
      { name: 'dim_jalur_pembayaran', data: dimJalurPembayaran, color: '059669', isDim: true },
      { name: 'dim_lokasi', data: dimLokasi, color: '0891B2', isDim: true },
      { name: 'dim_mustahik', data: dimMustahik, color: 'D97706', isDim: true },
      { name: 'dim_pasien_ambulan', data: dimPasienAmbulan, color: 'DC2626', isDim: true },
      { name: 'dim_penyalur_master', data: dimPenyalurMaster, color: '7C3AED', isDim: true },
      { name: 'dim_pertanyaan_survey', data: dimPertanyaanSurvey, color: '2563EB', isDim: true },
      { name: 'dim_petugas', data: dimPetugas, color: '4338CA', isDim: true },
      { name: 'dim_program_donasi', data: dimProgramDonasi, color: '059669', isDim: true },
      { name: 'fact_aktivitas_ambulan', data: factAktivitasAmbulan, color: 'BE123C', isDim: false },
      { name: 'fact_donasi', data: factDonasi, color: '16A34A', isDim: false },
      { name: 'fact_layanan_ambulan', data: factLayananAmbulan, color: 'EA580C', isDim: false },
      { name: 'fact_penyaluran', data: factPenyaluran, color: '9333EA', isDim: false },
      { name: 'fact_skor_kelayakan', data: factSkorKelayakan, color: '0D9488', isDim: false },
      { name: 'fact_survey', data: factSurvey, color: '2563EB', isDim: false },
      { name: 'fact_survey_detail', data: factSurveyDetail, color: '6366F1', isDim: false },
    ]

    const activeTables = allTables.filter(t => (includeDimensi && t.isDim) || (includeFakta && !t.isDim))
    const now = new Date()
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

    // ── 2A. EXPORT ZIP (CSV) ────────────────────────────────────────────────
    if (format === 'zip') {
      const zip = new JSZip()
      
      for (const table of activeTables) {
        if (table.data.length > 0) {
          const csvString = jsonToCSV(table.data)
          zip.file(`${table.name}.csv`, csvString)
        } else {
          zip.file(`${table.name}.csv`, '(Tidak ada data)\n')
        }
      }

      // Add Summary TXT
      let summaryTxt = `DOMPET UMMAT - BACKUP SUMMARY\nDate: ${now.toLocaleString('id-ID')}\nFilter: ${modules.toUpperCase()}\n\n`
      summaryTxt += activeTables.map(t => `${t.name.padEnd(25)}: ${t.data.length} rows`).join('\n')
      zip.file('SUMMARY.txt', summaryTxt)

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' })
      const filename = `backup_dompet_ummat_${timestamp}.zip`

      // Log the activity
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      if (userId !== 'SYSTEM') {
        await logActivity(userId, 'EXPORT_BACKUP', 'backup', { modules, format, recordCount: activeTables.reduce((sum, t) => sum + t.data.length, 0) }, ip)
      }

      return new NextResponse(zipBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // ── 2B. EXPORT EXCEL (.XLSX) ───────────────────────────────────────────
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Dompet Ummat DW — Backup System'
    workbook.created = now

    for (const table of activeTables) {
      const sheet = workbook.addWorksheet(table.name, {
        properties: { tabColor: { argb: table.color } },
      })

      if (table.data.length === 0) {
        sheet.addRow(['(Tidak ada data)'])
        continue
      }

      const columns = Object.keys(table.data[0])
      sheet.columns = columns.map(col => ({
        header: col,
        key: col,
        width: Math.max(col.length + 4, 15),
      }))

      const headerRow = sheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: table.color } }
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
      headerRow.height = 28

      for (const row of table.data) {
        const rowData: Record<string, any> = {}
        for (const col of columns) {
          let val = (row as any)[col]
          if (val !== null && val !== undefined) {
            if (typeof val === 'bigint') val = Number(val)
            if (typeof val === 'object' && !(val instanceof Date)) val = String(val)
          }
          rowData[col] = val
        }
        sheet.addRow(rowData)
      }

      sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } }
      sheet.views = [{ state: 'frozen', ySplit: 1 }]
    }

    // Sheet Ringkasan
    const summarySheet = workbook.addWorksheet('_RINGKASAN', { properties: { tabColor: { argb: '111827' } } })
    summarySheet.columns = [
      { header: 'Tabel', key: 'name', width: 30 },
      { header: 'Jumlah Baris', key: 'count', width: 15 },
      { header: 'Kategori', key: 'category', width: 20 },
    ]
    const summaryHeader = summarySheet.getRow(1)
    summaryHeader.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 }
    summaryHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '111827' } }
    summaryHeader.height = 28

    for (const t of activeTables) {
      summarySheet.addRow({ name: t.name, count: t.data.length, category: t.isDim ? 'Dimensi' : 'Fakta' })
    }
    summarySheet.addRow({})
    summarySheet.addRow({ name: 'TOTAL RECORD', count: activeTables.reduce((sum, t) => sum + t.data.length, 0), category: '-' })

    const buffer = await workbook.xlsx.writeBuffer()
    const filename = `backup_dompet_ummat_${timestamp}.xlsx`

    // Log the activity
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    if (userId !== 'SYSTEM') {
      await logActivity(userId, 'EXPORT_BACKUP', 'backup', { modules, format, recordCount: activeTables.reduce((sum, t) => sum + t.data.length, 0) }, ip)
    }

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('BACKUP_ERROR:', error)
    return NextResponse.json({ error: 'Gagal membuat backup' }, { status: 500 })
  }
}
