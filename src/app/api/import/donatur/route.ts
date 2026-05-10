import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateDonaturRow,
  chunk,
  type RowError,
  type DonaturRowParsed,
} from '@/lib/import-validation'
import { DONATUR_IMPORT_HEADERS } from '@/lib/constants-donasi'

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
      return NextResponse.json(
        { error: 'Sheet "Data" tidak ditemukan. Pastikan menggunakan template resmi.' },
        { status: 400 },
      )
    }

    // Validasi header wajib
    const requiredKeys = DONATUR_IMPORT_HEADERS.filter(h => h.required).map(h => h.label)
    const headerRow = sheet.getRow(1)
    const headerValues = headerRow.values as (string | undefined)[]
    for (const label of requiredKeys) {
      if (!headerValues.some(v => v?.includes(label.replace(' *', '')))) {
        return NextResponse.json({
          error: `Kolom wajib tidak ditemukan: "${label}". Pastikan menggunakan template resmi.`,
        }, { status: 400 })
      }
    }

    const HEADER_KEYS = DONATUR_IMPORT_HEADERS.map(h => h.key)
    const errors: RowError[] = []
    const candidates: { rowNumber: number; data: DonaturRowParsed }[] = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return // Baris 1: header, Baris 2: contoh
      const values = row.values as ExcelJS.CellValue[]

      const rawValues = HEADER_KEYS.map((_, i) => values[i + 1])
      if (rawValues.every(v => v === null || v === undefined || v === '')) return

      const rawObj: Record<string, unknown> = {}
      HEADER_KEYS.forEach((key, i) => {
        const val = values[i + 1]
        if (val !== null && typeof val === 'object' && 'text' in val) {
          rawObj[key] = (val as ExcelJS.RichText).text
        } else {
          rawObj[key] = val
        }
      })

      const { errors: rowErrors, parsed } = validateDonaturRow(rawObj, rowNumber)
      if (rowErrors.length > 0) {
        errors.push(...rowErrors)
      } else if (parsed) {
        candidates.push({ rowNumber, data: parsed })
      }
    })

    if (errors.length > 0) {
      return NextResponse.json({
        status: 'validation_failed',
        totalRows: candidates.length + errors.length,
        validRows: candidates.length,
        errorRows: errors.length,
        errors,
      })
    }

    // Cek duplikat kontak dalam file
    const kontakCounts = new Map<string, number>()
    candidates.forEach(c => {
      const key = c.data.kontak_utama
      kontakCounts.set(key, (kontakCounts.get(key) ?? 0) + 1)
    })
    const dupInFile = candidates.filter(c => (kontakCounts.get(c.data.kontak_utama) ?? 0) > 1)
    dupInFile.forEach(c => {
      errors.push({
        rowNumber: c.rowNumber,
        idField: c.data.nama_lengkap,
        field: 'kontak_utama',
        value: c.data.kontak_utama,
        rule: 'duplicate_in_file',
        message: `Kontak "${c.data.kontak_utama}" muncul lebih dari sekali dalam file`,
        severity: 'error',
      })
    })

    const validCandidates = candidates.filter(
      c => (kontakCounts.get(c.data.kontak_utama) ?? 0) === 1,
    )

    if (errors.length > 0) {
      return NextResponse.json({
        status: 'validation_failed',
        totalRows: candidates.length,
        validRows: validCandidates.length,
        errorRows: errors.length,
        errors,
      })
    }

    // Cek duplikat dengan database (berdasarkan kontak_utama)
    const allKontaks = validCandidates.map(c => c.data.kontak_utama)
    const existingKontaks = await prisma.dim_donatur.findMany({
      where: { kontak_utama: { in: allKontaks }, is_active: true },
      select: { kontak_utama: true },
    })
    const existingSet = new Set(existingKontaks.map(e => e.kontak_utama))
    const rowsToImport = validCandidates.filter(c => !existingSet.has(c.data.kontak_utama))

    // Map human-readable tipe ke Prisma enum name
    const TIPE_MAP: Record<string, string> = {
      'Individu': 'Individu',
      'Lembaga/Korporasi': 'Lembaga_Korporasi',
      'Komunitas': 'Komunitas',
    }

    let imported = 0
    const now = new Date()
    const year = now.getFullYear().toString().substring(2)

    await prisma.$transaction(async (tx) => {
      for (const batch of chunk(rowsToImport, 100)) {
        for (const c of batch) {
          const uniqueHash = Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1000).toString().padStart(3, '0')
          const id_donatur = `DU-${year}01.${uniqueHash}`

          await tx.dim_donatur.create({
            data: {
              id_donatur,
              nama_lengkap: c.data.nama_lengkap,
              kontak_utama: c.data.kontak_utama,
              tipe: (TIPE_MAP[c.data.tipe] || 'To_Be_Determined') as any,
              alamat: c.data.alamat || '-',
              perusahaan: c.data.perusahaan || '-',
              is_active: true,
              valid_from: now,
              valid_to: new Date('9999-12-31'),
            },
          })
        }
        imported += batch.length
      }
    }, { timeout: 120000 })

    return NextResponse.json({
      status: 'success',
      imported,
      skipped: existingSet.size,
    })
  } catch (error: any) {
    console.error('IMPORT_DONATUR_ERROR:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server saat memproses import' },
      { status: 500 },
    )
  }
}
