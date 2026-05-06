import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSkDate } from '@/lib/utils-ambulan'
import {
  validatePenyaluranRow,
  parseDate,
  chunk,
  type RowError,
  type PenyaluranRowParsed,
} from '@/lib/import-validation'
import { PENYALURAN_IMPORT_HEADERS } from '@/lib/constants-penyaluran'

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
      return NextResponse.json({ error: 'Sheet "Data" tidak ditemukan. Gunakan template resmi.' }, { status: 400 })
    }

    const HEADER_KEYS = PENYALURAN_IMPORT_HEADERS.map(h => h.key)
    const errors: RowError[] = []
    const candidates: { rowNumber: number; data: PenyaluranRowParsed }[] = []

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

      const { errors: rowErrors, parsed } = validatePenyaluranRow(rawObj, rowNumber)
      if (rowErrors.length > 0) errors.push(...rowErrors)
      else if (parsed) candidates.push({ rowNumber, data: parsed })
    })

    // Cek duplikasi ID dalam file
    const idCounts = new Map<string, number>()
    candidates.forEach(c => idCounts.set(c.data.id_transaksi, (idCounts.get(c.data.id_transaksi) ?? 0) + 1))
    candidates.filter(c => (idCounts.get(c.data.id_transaksi) ?? 0) > 1).forEach(c => {
      errors.push({ rowNumber: c.rowNumber, idField: c.data.id_transaksi, field: 'id_transaksi', value: c.data.id_transaksi, rule: 'duplicate_in_file', message: `ID transaksi "${c.data.id_transaksi}" muncul lebih dari sekali dalam file`, severity: 'error' })
    })

    const validCandidates = candidates.filter(c => (idCounts.get(c.data.id_transaksi) ?? 0) === 1)

    // Validasi referensial: id_mustahik harus ada di dim_mustahik
    if (validCandidates.length > 0) {
      const uniqueIds = [...new Set(validCandidates.map(c => c.data.id_mustahik))]
      const mustahikValid = await prisma.dim_mustahik.findMany({
        where: { id_mustahik: { in: uniqueIds }, is_active: true },
        select: { id_mustahik: true, sk_mustahik: true },
      })
      const mustahikMap = new Map(mustahikValid.map(m => [m.id_mustahik, m.sk_mustahik]))

      validCandidates.forEach(c => {
        if (!mustahikMap.has(c.data.id_mustahik)) {
          errors.push({ rowNumber: c.rowNumber, idField: c.data.id_transaksi, field: 'id_mustahik', value: c.data.id_mustahik, rule: 'ref_not_found', message: `ID Mustahik "${c.data.id_mustahik}" tidak ditemukan di database atau sudah nonaktif`, severity: 'error' })
        }
      })
    }

    if (errors.length > 0) {
      return NextResponse.json({ status: 'validation_failed', totalRows: candidates.length, validRows: validCandidates.length, errorRows: errors.length, errors })
    }

    // Commit
    const allIds = validCandidates.map(c => c.data.id_transaksi)
    const existingIds = await prisma.fact_penyaluran.findMany({
      where: { id_transaksi: { in: allIds } },
      select: { id_transaksi: true },
    })
    const existingSet = new Set(existingIds.map(e => e.id_transaksi))
    const rowsToImport = validCandidates.filter(c => !existingSet.has(c.data.id_transaksi))

    let imported = 0
    await prisma.$transaction(async (tx) => {
      const uniqueMIds = [...new Set(rowsToImport.map(c => c.data.id_mustahik))]
      const mustahikRecords = await tx.dim_mustahik.findMany({
        where: { id_mustahik: { in: uniqueMIds }, is_active: true },
        select: { id_mustahik: true, sk_mustahik: true },
      })
      const mustahikMap = new Map(mustahikRecords.map(m => [m.id_mustahik, m.sk_mustahik]))

      for (const batch of chunk(rowsToImport, 100)) {
        await tx.fact_penyaluran.createMany({
          data: batch.map(c => {
            const tglBerkas = parseDate(c.data.tanggal_berkas)!
            const tglDisalurkan = parseDate(c.data.tanggal_disalurkan)!
            return {
              id_transaksi: c.data.id_transaksi,
              sk_mustahik: mustahikMap.get(c.data.id_mustahik) ?? null,
              domain_program: c.data.domain_program as any,
              kategori_program: c.data.kategori_program as any,
              jenis_bantuan: c.data.jenis_bantuan as any,
              dana_tersalur: c.data.dana_tersalur,
              status_pengajuan: c.data.status_pengajuan as any,
              kategori_penyakit: (c.data.kategori_penyakit as any) ?? 'Tidak Ada/Not Applicable',
              sk_tgl_berkas: generateSkDate(tglBerkas),
              sk_tgl_disalurkan: generateSkDate(tglDisalurkan),
            }
          }),
          skipDuplicates: true,
        })
        imported += batch.length
      }
    }, { timeout: 60000 })

    return NextResponse.json({ status: 'success', imported, skipped: existingSet.size })
  } catch (error: any) {
    console.error('IMPORT_PENYALURAN_ERROR:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
