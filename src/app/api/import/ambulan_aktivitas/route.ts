import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateAmbulanAktivitasRow,
  parseDate,
  chunk,
  type RowError,
  type AmbulanAktivitasRowParsed,
} from '@/lib/import-validation'
import { AMBULAN_AKTIVITAS_IMPORT_HEADERS } from '@/lib/constants-ambulan'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())

    const sheet = workbook.getWorksheet('Data')
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet "Data" tidak ditemukan. Pastikan menggunakan template resmi.' }, { status: 400 })
    }

    const requiredKeys = AMBULAN_AKTIVITAS_IMPORT_HEADERS.filter(h => h.required).map(h => h.label)
    const headerRow = sheet.getRow(1)
    const headerValues = headerRow.values as (string | undefined)[]
    for (const label of requiredKeys) {
      if (!headerValues.some(v => v?.includes(label.replace(' *', '')))) {
        return NextResponse.json({
          error: `Kolom wajib tidak ditemukan: "${label}". Pastikan menggunakan template resmi.`
        }, { status: 400 })
      }
    }

    const HEADER_KEYS = AMBULAN_AKTIVITAS_IMPORT_HEADERS.map(h => h.key)
    const errors: RowError[] = []
    const candidates: { rowNumber: number; data: AmbulanAktivitasRowParsed }[] = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return
      const values = row.values as ExcelJS.CellValue[]

      const rawValues = HEADER_KEYS.map((_, i) => values[i + 1])
      if (rawValues.every(v => v === null || v === undefined || v === '')) return

      const rawObj: Record<string, unknown> = {}
      HEADER_KEYS.forEach((key, i) => {
        const val = values[i + 1]
        if (val instanceof Date) {
          const dd = String(val.getDate()).padStart(2, '0')
          const mm = String(val.getMonth() + 1).padStart(2, '0')
          rawObj[key] = `${dd}/${mm}/${val.getFullYear()}`
        } else if (val !== null && typeof val === 'object' && 'text' in val) {
          rawObj[key] = (val as ExcelJS.RichText).text
        } else {
          rawObj[key] = val
        }
      })

      const { errors: rowErrors, parsed } = validateAmbulanAktivitasRow(rawObj, rowNumber)
      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      } else if (parsed) {
        candidates.push({ rowNumber, data: parsed })
      }
    })

    const totalRows = candidates.length + errors.length
    if (errors.length > 0) {
      return NextResponse.json({
        status: 'validation_failed',
        totalRows,
        validRows: candidates.length - errors.filter(e => e.severity === 'error').length,
        errorRows: errors.filter(e => e.severity === 'error').length,
        errors,
      })
    }

    // All candidates are valid — IDs are auto-generated
    const rowsToImport = candidates



    let imported = 0

    await prisma.$transaction(async (tx) => {
      for (const batch of chunk(rowsToImport, 100)) {
        for (const c of batch) {
          const tglObj = parseDate(c.data.tanggal_aktivitas)!
          const sk_tanggal = parseInt(
            tglObj.getFullYear().toString() +
            (tglObj.getMonth() + 1).toString().padStart(2, '0') +
            tglObj.getDate().toString().padStart(2, '0')
          )

          const shiftMap: any = {
            'Pagi (06:00-12:00)': 'Pagi__06_00_12_00_',
            'Siang (12:00-15:00)': 'Siang__12_00_15_00_',
            'Sore (15:00-18:00)': 'Sore__15_00_18_00_',
            'Malam (18:00-06:00)': 'Malam__18_00_06_00_'
          }

          const armadaMap: any = {
            'Ambulan 1 (KB 1234 XX)': 'Ambulan_1__KB_1234_XX_',
            'Ambulan 2 (KB 5678 YY)': 'Ambulan_2__KB_5678_YY_',
            'Lainnya': 'Lainnya'
          }

          const katAktivitasMap: any = {
            'Isi Bensin': 'Isi_Bensin',
            'Servis Rutin': 'Servis_Rutin',
            'Ganti Suku Cadang': 'Ganti_Suku_Cadang',
            'Pajak/Administrasi': 'Pajak_Administrasi',
            'Lainnya': 'Lainnya'
          }

          const generatedId = `EXP-AMB-${Date.now()}-${imported + batch.indexOf(c)}`

          await tx.fact_aktivitas_ambulan.create({
            data: {
              id_transaksi: generatedId,
              sk_tanggal_aktivitas: sk_tanggal,
              jam: shiftMap[c.data.jam] || 'To_Be_Determined',
              armada: armadaMap[c.data.armada] || 'Lainnya',
              kategori_aktivitas: katAktivitasMap[c.data.kategori_aktivitas] || 'Lainnya',
              biaya_operasional: c.data.biaya_operasional,
              jumlah_aktivitas: 1,
              sk_lokasi: -1,
            },
          })
        }
        imported += batch.length
      }
    }, { timeout: 120000 })

    return NextResponse.json({
      status: 'success',
      imported,
    })
  } catch (error: any) {
    console.error('IMPORT_AMBULAN_AKTIVITAS_ERROR:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat memproses import' },
      { status: 500 },
    )
  }
}
