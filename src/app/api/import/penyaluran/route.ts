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

    // Validasi referensial: id_mustahik harus ada di dim_mustahik
    if (candidates.length > 0) {
      const uniqueIds = [...new Set(candidates.map(c => c.data.id_mustahik))]
      const mustahikValid = await prisma.dim_mustahik.findMany({
        where: { id_mustahik: { in: uniqueIds }, is_active: true },
        select: { id_mustahik: true, sk_mustahik: true },
      })
      const mustahikMap = new Map(mustahikValid.map(m => [m.id_mustahik, m.sk_mustahik]))

      candidates.forEach(c => {
        if (!mustahikMap.has(c.data.id_mustahik)) {
          errors.push({ rowNumber: c.rowNumber, field: 'id_mustahik', value: c.data.id_mustahik, rule: 'ref_not_found', message: `ID Mustahik "${c.data.id_mustahik}" tidak ditemukan di database atau sudah nonaktif`, severity: 'error' })
        }
      })
    }

    const totalRows = candidates.length + errors.length
    if (errors.length > 0) {
      return NextResponse.json({ status: 'validation_failed', totalRows, validRows: candidates.length - errors.filter(e => e.severity === 'error').length, errorRows: errors.filter(e => e.severity === 'error').length, errors })
    }

    // Commit — IDs are auto-generated
    const rowsToImport = candidates

    let imported = 0
    await prisma.$transaction(async (tx) => {
      const uniqueMIds = [...new Set(rowsToImport.map(c => c.data.id_mustahik))]
      const mustahikRecords = await tx.dim_mustahik.findMany({
        where: { id_mustahik: { in: uniqueMIds }, is_active: true },
        select: { id_mustahik: true, sk_mustahik: true },
      })
      const mustahikMap = new Map(mustahikRecords.map(m => [m.id_mustahik, m.sk_mustahik]))

      const DOMAIN_MAP: Record<string, any> = {
        'Pendidikan': 'Pendidikan',
        'Kesehatan': 'Kesehatan',
        'Ekonomi': 'Ekonomi',
        'Sosial Kemanusiaan': 'Sosial_Kemanusiaan',
        'Dakwah & Advokasi': 'Dakwah___Advokasi',
        'Operasional': 'Operasional',
      }
      const KATEGORI_MAP: Record<string, any> = {
        'Beasiswa': 'Beasiswa',
        'Bantuan Biaya Pengobatan': 'Bantuan_Biaya_Pengobatan',
        'Modal Usaha': 'Modal_Usaha',
        'Sembako': 'Sembako',
        'Santunan Tunai': 'Santunan_Tunai',
        'Lainnya': 'Lainnya',
      }
      const JENIS_MAP: Record<string, any> = {
        'Tunai': 'Tunai',
        'Barang/Logistik': 'Barang_Logistik',
        'Jasa/Layanan': 'Jasa_Layanan',
        'Lainnya': 'Lainnya',
      }
      const STATUS_MAP: Record<string, any> = {
        'Proses': 'Proses',
        'Disetujui': 'Disetujui',
        'Ditolak': 'Ditolak',
        'Batal': 'Batal',
      }
      const PENYAKIT_MAP: Record<string, any> = {
        'Penyakit Kronis': 'Penyakit_Kronis',
        'Penyakit Menular': 'Penyakit_Menular',
        'Penyakit Ringan': 'Penyakit_Ringan',
        'Gawat Darurat/Kecelakaan': 'Gawat_Darurat_Kecelakaan',
        'Tidak Ada/Not Applicable': 'Tidak_Ada_Not_Applicable',
      }

      for (const batch of chunk(rowsToImport, 100)) {
        await tx.fact_penyaluran.createMany({
          data: batch.map((c, idx) => {
            const tglBerkas = parseDate(c.data.tanggal_berkas)!
            const tglDisalurkan = parseDate(c.data.tanggal_disalurkan)!
            const generatedId = `TRX-OUT-${Date.now()}-${imported + idx}`
            return {
              id_transaksi: generatedId,
              sk_mustahik: mustahikMap.get(c.data.id_mustahik) ?? null,
              domain_program: DOMAIN_MAP[c.data.domain_program] || 'To_Be_Determined',
              kategori_program: KATEGORI_MAP[c.data.kategori_program] || 'To_Be_Determined',
              jenis_bantuan: JENIS_MAP[c.data.jenis_bantuan] || 'To_Be_Determined',
              dana_tersalur: c.data.dana_tersalur,
              status_pengajuan: STATUS_MAP[c.data.status_pengajuan] || 'To_Be_Determined',
              kategori_penyakit: PENYAKIT_MAP[c.data.kategori_penyakit ?? ''] || 'Tidak_Ada_Not_Applicable',
              sk_tgl_berkas: generateSkDate(tglBerkas),
              sk_tgl_disalurkan: generateSkDate(tglDisalurkan),
            }
          }),
          skipDuplicates: true,
        })
        imported += batch.length
      }
    }, { timeout: 60000 })

    return NextResponse.json({ status: 'success', imported })
  } catch (error: any) {
    console.error('IMPORT_PENYALURAN_ERROR:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
