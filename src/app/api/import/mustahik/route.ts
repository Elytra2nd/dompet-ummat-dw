import ExcelJS from 'exceljs'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  validateMustahikRow,
  chunk,
  type RowError,
  type MustahikRowParsed,
} from '@/lib/import-validation'
import { MUSTAHIK_IMPORT_HEADERS } from '@/lib/constants-mustahik'

export const dynamic = 'force-dynamic'

/** Generate prefix ID Mustahik berdasarkan kategori_pm */
function getPrefixByKategori(kategori: string): string {
  const map: Record<string, string> = {
    Fakir: 'MST-FAK', Miskin: 'MST-MSK', Amil: 'MST-AML',
    Muallaf: 'MST-MUL', Riqab: 'MST-RQB', Gharimin: 'MST-GHR',
    Fisabilillah: 'MST-FSB', 'Ibnu Sabil': 'MST-IBS',
  }
  return map[kategori] ?? 'MST-GEN'
}

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

    const HEADER_KEYS = MUSTAHIK_IMPORT_HEADERS.map(h => h.key)
    const errors: RowError[] = []
    const candidates: { rowNumber: number; data: MustahikRowParsed }[] = []

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= 2) return
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

      const { errors: rowErrors, parsed } = validateMustahikRow(rawObj, rowNumber)
      if (rowErrors.filter(e => e.severity === 'error').length > 0) {
        errors.push(...rowErrors)
      } else if (parsed) {
        errors.push(...rowErrors.filter(e => e.severity === 'warning'))
        candidates.push({ rowNumber, data: parsed })
      }
    })

    // Cek duplikasi NIK dalam file
    const nikCounts = new Map<string, number>()
    candidates.forEach(c => nikCounts.set(c.data.nik, (nikCounts.get(c.data.nik) ?? 0) + 1))
    candidates.filter(c => (nikCounts.get(c.data.nik) ?? 0) > 1).forEach(c => {
      errors.push({ rowNumber: c.rowNumber, field: 'nik', value: c.data.nik, rule: 'duplicate_in_file', message: `NIK "${c.data.nik}" muncul lebih dari sekali dalam file`, severity: 'error' })
    })

    const validCandidates = candidates.filter(c => (nikCounts.get(c.data.nik) ?? 0) === 1)

    // Validasi referensial: NIK sudah ada di DB? → skip (idempotent)
    // Tidak dianggap error, hanya di-skip saat commit

    if (errors.filter(e => e.severity === 'error').length > 0) {
      return NextResponse.json({ status: 'validation_failed', totalRows: candidates.length, validRows: validCandidates.length, errorRows: errors.filter(e => e.severity === 'error').length, errors })
    }

    // Commit
    const allNiks = validCandidates.map(c => c.data.nik)
    const existingNiks = await prisma.dim_mustahik.findMany({
      where: { nik: { in: allNiks }, is_active: true },
      select: { nik: true },
    })
    const existingNikSet = new Set(existingNiks.map(e => e.nik).filter(Boolean) as string[])
    const rowsToImport = validCandidates.filter(c => !existingNikSet.has(c.data.nik))

    let imported = 0
    await prisma.$transaction(async (tx) => {
      // Ambil counter per prefix untuk auto-ID
      const prefixCounters = new Map<string, number>()

      for (const item of rowsToImport) {
        const prefix = getPrefixByKategori(item.data.kategori_pm)

        if (!prefixCounters.has(prefix)) {
          const last = await tx.dim_mustahik.findFirst({
            where: { id_mustahik: { startsWith: prefix } },
            orderBy: { id_mustahik: 'desc' },
            select: { id_mustahik: true },
          })
          const lastNum = last ? parseInt(last.id_mustahik.split('-').pop() ?? '0') : 0
          prefixCounters.set(prefix, lastNum)
        }

        const next = (prefixCounters.get(prefix) ?? 0) + 1
        prefixCounters.set(prefix, next)
        const autoId = `${prefix}-${String(next).padStart(4, '0')}`

        // Upsert lokasi jika ada koordinat
        let sk_lokasi: number | undefined
        if (item.data.latitude !== undefined && item.data.longitude !== undefined) {
          const lokasi = await tx.dim_lokasi.create({
            data: {
              latitude: item.data.latitude,
              longitude: item.data.longitude,
              desa_kelurahan: item.data.desa ?? null,
              kecamatan: item.data.kelurahan_kecamatan ?? null,
              kabupaten_kota: item.data.kabupaten_kota,
              provinsi: 'Kalimantan Barat',
            },
          })
          sk_lokasi = lokasi.sk_lokasi
        }

        await tx.dim_mustahik.create({
          data: {
            id_mustahik: autoId,
            nama: item.data.nama,
            nik: item.data.nik,
            gender: item.data.gender as any,
            no_hp: item.data.no_hp ?? null,
            alamat: item.data.alamat,
            desa: item.data.desa ?? null,
            kelurahan_kecamatan: item.data.kelurahan_kecamatan ?? null,
            kabupaten_kota: item.data.kabupaten_kota,
            kategori_pm: item.data.kategori_pm as any,
            jumlah_jiwa: item.data.jumlah_jiwa,
            sk_lokasi: sk_lokasi ?? -1,
            is_active: true,
            valid_from: new Date(),
            valid_to: new Date('9999-12-31'),
          },
        })
        imported++
      }
    }, { timeout: 60000 })

    return NextResponse.json({ status: 'success', imported, skipped: existingNikSet.size })
  } catch (error: any) {
    console.error('IMPORT_MUSTAHIK_ERROR:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
