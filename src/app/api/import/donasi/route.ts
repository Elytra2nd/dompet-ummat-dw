import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSkDate } from '@/lib/utils-ambulan'
import {
  validateDonasiRow,
  parseDate,
  chunk,
  type RowError,
  type DonasiRowParsed,
} from '@/lib/import-validation'
import { DONASI_IMPORT_HEADERS } from '@/lib/constants-donasi'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })

    // ── 1. Parse Excel ────────────────────────────────────────────────────────
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())

    const sheet = workbook.getWorksheet('Data')
    if (!sheet) {
      return NextResponse.json({ error: 'Sheet "Data" tidak ditemukan. Pastikan menggunakan template yang disediakan.' }, { status: 400 })
    }

    // ── 2. Validasi Header ────────────────────────────────────────────────────
    const requiredKeys = DONASI_IMPORT_HEADERS.filter(h => h.required).map(h => h.label)
    const headerRow = sheet.getRow(1)
    const headerValues = headerRow.values as (string | undefined)[]
    for (const label of requiredKeys) {
      if (!headerValues.some(v => v?.includes(label.replace(' *', '')))) {
        return NextResponse.json({
          error: `Kolom wajib tidak ditemukan: "${label}". Pastikan menggunakan template resmi.`
        }, { status: 400 })
      }
    }

    // ── 3. Baca semua baris data (mulai baris 3, baris 2 adalah contoh) ──────
    const HEADER_KEYS = DONASI_IMPORT_HEADERS.map(h => h.key)
    const errors: RowError[] = []
    const candidates: { rowNumber: number; data: DonasiRowParsed }[] = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return // skip header + contoh
      const values = row.values as ExcelJS.CellValue[]

      // Cek apakah baris kosong
      const rawValues = HEADER_KEYS.map((_, i) => values[i + 1])
      if (rawValues.every(v => v === null || v === undefined || v === '')) return

      const rawObj: Record<string, unknown> = {}
      HEADER_KEYS.forEach((key, i) => {
        const val = values[i + 1]
        // ExcelJS mengembalikan RichText, Date, number, string, dll.
        if (val instanceof Date) {
          // Format kembali ke DD/MM/YYYY
          const dd = String(val.getDate()).padStart(2, '0')
          const mm = String(val.getMonth() + 1).padStart(2, '0')
          rawObj[key] = `${dd}/${mm}/${val.getFullYear()}`
        } else if (val !== null && typeof val === 'object' && 'text' in val) {
          rawObj[key] = (val as ExcelJS.RichText).text
        } else {
          rawObj[key] = val
        }
      })

      const { errors: rowErrors, parsed } = validateDonasiRow(rawObj, rowNumber)
      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      } else if (parsed) {
        candidates.push({ rowNumber, data: parsed })
      }
    })

    // ── 4. Cek duplikasi ID dalam file sendiri ────────────────────────────────
    const idCounts = new Map<string, number>()
    candidates.forEach(c => {
      const id = c.data.id_transaksi_donasi
      idCounts.set(id, (idCounts.get(id) ?? 0) + 1)
    })
    const dupInFile = candidates.filter(c => (idCounts.get(c.data.id_transaksi_donasi) ?? 0) > 1)
    dupInFile.forEach(c => {
      errors.push({
        rowNumber: c.rowNumber,
        idField: c.data.id_transaksi_donasi,
        field: 'id_transaksi_donasi',
        value: c.data.id_transaksi_donasi,
        rule: 'duplicate_in_file',
        message: `ID transaksi "${c.data.id_transaksi_donasi}" muncul lebih dari sekali dalam file`,
        severity: 'error',
      })
    })

    // ── 5. Validasi referensial ke DB (batch) ─────────────────────────────────
    const validCandidates = candidates.filter(
      c => (idCounts.get(c.data.id_transaksi_donasi) ?? 0) === 1
    )

    if (validCandidates.length > 0) {
      // a. Cek nama_petugas
      const uniquePetugas = [...new Set(validCandidates.map(c => c.data.nama_petugas))]
      const petugasValid = await prisma.dim_petugas.findMany({
        where: { nama_petugas: { in: uniquePetugas }, is_active: true },
        select: { nama_petugas: true, sk_petugas: true },
      })
      const petugasMap = new Map(petugasValid.map(p => [p.nama_petugas!, p.sk_petugas]))

      validCandidates.forEach(c => {
        if (!petugasMap.has(c.data.nama_petugas)) {
          errors.push({
            rowNumber: c.rowNumber,
            idField: c.data.id_transaksi_donasi,
            field: 'nama_petugas',
            value: c.data.nama_petugas,
            rule: 'ref_not_found',
            message: `Petugas "${c.data.nama_petugas}" tidak ditemukan di database atau sudah nonaktif`,
            severity: 'error',
          })
        }
      })

      // b. Cek duplikasi ID di DB — idempotent: skip saja (tidak dianggap error)
      const allIds = validCandidates.map(c => c.data.id_transaksi_donasi)
      const existingIds = await prisma.fact_donasi.findMany({
        where: { id_transaksi_donasi: { in: allIds } },
        select: { id_transaksi_donasi: true },
      })
      const existingSet = new Set(existingIds.map(e => e.id_transaksi_donasi))
    }

    // ── 6. Jika ada error → return report (Q2: semua harus valid) ─────────────
    const totalRows = candidates.length + errors.filter(e => e.rule !== 'duplicate_in_file').length
    if (errors.length > 0) {
      return NextResponse.json({
        status: 'validation_failed',
        totalRows,
        validRows: validCandidates.length,
        errorRows: errors.length,
        errors,
      })
    }

    // ── 7. Commit ke DB via $transaction ──────────────────────────────────────
    // Filter baris yang ID-nya sudah ada di DB (skip/idempotent)
    const allIds = validCandidates.map(c => c.data.id_transaksi_donasi)
    const existingIds = await prisma.fact_donasi.findMany({
      where: { id_transaksi_donasi: { in: allIds } },
      select: { id_transaksi_donasi: true },
    })
    const existingSet = new Set(existingIds.map(e => e.id_transaksi_donasi))
    const rowsToImport = validCandidates.filter(c => !existingSet.has(c.data.id_transaksi_donasi))

    let imported = 0

    await prisma.$transaction(async (tx) => {
      // Kumpulkan nama donatur unik → lookup atau create di dim_donatur
      const uniqueDonatur = [...new Map(rowsToImport.map(c => [c.data.nama_donatur, c.data])).values()]
      for (const d of uniqueDonatur) {
        await tx.dim_donatur.upsert({
          where: { id_donatur: `IMP-${d.nama_donatur.replace(/\s+/g, '-').toUpperCase()}` },
          update: {},
          create: {
            id_donatur: `IMP-${d.nama_donatur.replace(/\s+/g, '-').toUpperCase()}`,
            nama_lengkap: d.nama_donatur,
            tipe: d.tipe_donatur as any,
            is_active: true,
            valid_from: new Date(),
            valid_to: new Date('9999-12-31'),
          },
        })
      }

      // Ambil map donatur → sk_donatur
      const donaturNames = uniqueDonatur.map(d => `IMP-${d.nama_donatur.replace(/\s+/g, '-').toUpperCase()}`)
      const donaturRecords = await tx.dim_donatur.findMany({
        where: { id_donatur: { in: donaturNames }, is_active: true },
        select: { id_donatur: true, sk_donatur: true },
      })
      const donaturMap = new Map(donaturRecords.map(d => [d.id_donatur, d.sk_donatur]))

      // Ambil map petugas (sudah divalidasi)
      const uniquePetugas = [...new Set(rowsToImport.map(c => c.data.nama_petugas))]
      const petugasRecords = await tx.dim_petugas.findMany({
        where: { nama_petugas: { in: uniquePetugas }, is_active: true },
        select: { nama_petugas: true, sk_petugas: true },
      })
      const petugasMap = new Map(petugasRecords.map(p => [p.nama_petugas!, p.sk_petugas]))

      // Insert fact_donasi per batch 100
      for (const batch of chunk(rowsToImport, 100)) {
        await tx.fact_donasi.createMany({
          data: batch.map(c => {
            const tgl = parseDate(c.data.tanggal)!
            const donaturId = `IMP-${c.data.nama_donatur.replace(/\s+/g, '-').toUpperCase()}`
            return {
              id_transaksi_donasi: c.data.id_transaksi_donasi,
              sk_donatur: donaturMap.get(donaturId) ?? null,
              sk_petugas: petugasMap.get(c.data.nama_petugas) ?? null,
              sk_tgl_bersih: generateSkDate(tgl),
              nominal_valid: c.data.nominal_valid,
              no_ref: c.data.no_ref ?? null,
            }
          }),
          skipDuplicates: true,
        })
        imported += batch.length
      }
    }, { timeout: 60000 })

    return NextResponse.json({
      status: 'success',
      imported,
      skipped: existingSet.size,
    })
  } catch (error: any) {
    console.error('IMPORT_DONASI_ERROR:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat memproses import' },
      { status: 500 },
    )
  }
}
