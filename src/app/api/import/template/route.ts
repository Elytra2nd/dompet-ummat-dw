import ExcelJS from 'exceljs'
import {
  DONASI_IMPORT_HEADERS,
  DONATUR_IMPORT_HEADERS,
  IMPORT_ENUM_TIPE_DONATUR,
  IMPORT_ENUM_METODE_BAYAR,
  IMPORT_ENUM_PROGRAM_INDUK,
} from '@/lib/constants-donasi'
import {
  PENYALURAN_IMPORT_HEADERS,
  DOMAIN_PROGRAM,
  KATEGORI_PROGRAM,
  JENIS_BANTUAN,
  STATUS_PENGAJUAN,
  KATEGORI_PENYAKIT,
} from '@/lib/constants-penyaluran'
import {
  MUSTAHIK_IMPORT_HEADERS,
  IMPORT_ENUM_GENDER,
  IMPORT_ENUM_KATEGORI_PM,
} from '@/lib/constants-mustahik'
import {
  AMBULAN_LAYANAN_IMPORT_HEADERS,
  AMBULAN_AKTIVITAS_IMPORT_HEADERS,
  SHIFT_JAM,
  LIST_ARMADA,
  KATEGORI_LAYANAN,
  KATEGORI_AKTIVITAS,
  STATUS_EKONOMI,
} from '@/lib/constants-ambulan'

export const dynamic = 'force-dynamic'

// ─── Warna ────────────────────────────────────────────────────────────────────
const COLOR_HEADER_REQUIRED  = { argb: 'FFFDE8E8' } // merah muda
const COLOR_HEADER_OPTIONAL  = { argb: 'FFFEF9C3' } // kuning muda
const COLOR_HEADER_TEXT_REQ  = { argb: 'FF991B1B' } // merah tua
const COLOR_HEADER_TEXT_OPT  = { argb: 'FF854D0E' } // coklat
const COLOR_EXAMPLE_BG       = { argb: 'FFE0F2FE' } // biru muda
const COLOR_BORDER            = { argb: 'FFCBD5E1' } // abu

function applyHeaderStyle(
  cell: ExcelJS.Cell,
  required: boolean,
) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: required ? COLOR_HEADER_REQUIRED : COLOR_HEADER_OPTIONAL }
  cell.font = { bold: true, size: 10, color: { argb: required ? COLOR_HEADER_TEXT_REQ.argb : COLOR_HEADER_TEXT_OPT.argb } }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  cell.border = {
    top: { style: 'thin', color: COLOR_BORDER },
    left: { style: 'thin', color: COLOR_BORDER },
    bottom: { style: 'thin', color: COLOR_BORDER },
    right: { style: 'thin', color: COLOR_BORDER },
  }
}

function applyExampleStyle(cell: ExcelJS.Cell) {
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: COLOR_EXAMPLE_BG }
  cell.font = { italic: true, size: 9, color: { argb: 'FF0369A1' } }
  cell.alignment = { vertical: 'middle' }
}

// ─── Builder: Donasi ─────────────────────────────────────────────────────────
function buildDonasiWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Dompet Ummat Kalbar'
  wb.created = new Date()

  // Sheet Referensi (hidden — sumber dropdown)
  const ref = wb.addWorksheet('Referensi')
  ref.state = 'veryHidden'
  IMPORT_ENUM_TIPE_DONATUR.forEach((v, i) => ref.getCell(`A${i + 1}`).value = v)
  IMPORT_ENUM_METODE_BAYAR.forEach((v, i) => ref.getCell(`B${i + 1}`).value = v)
  IMPORT_ENUM_PROGRAM_INDUK.forEach((v, i) => ref.getCell(`C${i + 1}`).value = v)

  // Sheet Data
  const data = wb.addWorksheet('Data')
  data.views = [{ state: 'frozen', ySplit: 1 }]

  // Header
  const headers = DONASI_IMPORT_HEADERS
  headers.forEach((h, i) => {
    const col = i + 1
    const cell = data.getCell(1, col)
    cell.value = h.label
    applyHeaderStyle(cell, h.required)
    data.getColumn(col).width = 22
  })
  data.getRow(1).height = 40

  // Contoh baris 2
  const examples: Record<string, unknown> = {
    id_transaksi_donasi: 'DON-20240001',
    tanggal: '15/01/2024',
    nama_donatur: 'Ahmad Fauzi',
    tipe_donatur: 'Individu',
    nominal_valid: 500000,
    metode_bayar: 'Transfer Bank',
    program_induk: 'Kesehatan',
    sub_program: '',
    nama_petugas: 'Budi Santoso',
    no_ref: 'REF-001',
  }
  headers.forEach((h, i) => {
    const cell = data.getCell(2, i + 1)
    cell.value = examples[h.key] as ExcelJS.CellValue
    if (h.isNumber) cell.numFmt = '#,##0'
    applyExampleStyle(cell)
  })

  // Format kolom nominal
  const nominalColIdx = headers.findIndex(h => h.key === 'nominal_valid') + 1
  for (let row = 3; row <= 5000; row++) {
    data.getCell(row, nominalColIdx).numFmt = '#,##0'
  }

  // Dropdown validasi
  const tipeColIdx    = headers.findIndex(h => h.key === 'tipe_donatur') + 1
  const metodeColIdx  = headers.findIndex(h => h.key === 'metode_bayar') + 1
  const programColIdx = headers.findIndex(h => h.key === 'program_induk') + 1

  const toExcelCol = (n: number) => String.fromCharCode(64 + n)

  for (let row = 3; row <= 5000; row++) {
    data.getCell(row, tipeColIdx).dataValidation = {
      type: 'list', allowBlank: false,
      formulae: [`Referensi!$A$1:$A${IMPORT_ENUM_TIPE_DONATUR.length}`],
      showErrorMessage: true, errorTitle: 'Nilai Tidak Valid',
      error: `Pilih dari dropdown: ${IMPORT_ENUM_TIPE_DONATUR.join(', ')}`,
    }
    data.getCell(row, metodeColIdx).dataValidation = {
      type: 'list', allowBlank: false,
      formulae: [`Referensi!$B$1:$B${IMPORT_ENUM_METODE_BAYAR.length}`],
      showErrorMessage: true, errorTitle: 'Nilai Tidak Valid',
      error: `Pilih dari dropdown`,
    }
    data.getCell(row, programColIdx).dataValidation = {
      type: 'list', allowBlank: false,
      formulae: [`Referensi!$C$1:$C${IMPORT_ENUM_PROGRAM_INDUK.length}`],
      showErrorMessage: true, errorTitle: 'Nilai Tidak Valid',
      error: `Pilih dari dropdown`,
    }
  }

  // Sheet Petunjuk
  const guide = wb.addWorksheet('Petunjuk')
  guide.getColumn(1).width = 80
  const instructions = [
    ['PETUNJUK PENGISIAN TEMPLATE IMPORT DONASI MASUK'],
    [''],
    ['1. Isi data mulai dari baris ke-3 (baris ke-2 adalah contoh, bisa dihapus)'],
    ['2. Kolom berlatar MERAH MUDA adalah WAJIB diisi'],
    ['3. Kolom berlatar KUNING adalah opsional'],
    ['4. Kolom NOMINAL: isi angka saja tanpa titik pemisah (contoh: 500000, bukan 1.500.000)'],
    ['5. Tanggal harus format DD/MM/YYYY (contoh: 15/01/2024)'],
    ['6. Nama Donatur dan Nama Petugas harus Proper Case (huruf besar di awal kata)'],
    ['7. Gunakan dropdown untuk kolom Tipe Donatur, Metode Bayar, dan Program Induk'],
    [''],
    ['NILAI YANG DIIZINKAN:'],
    [`Tipe Donatur:  ${IMPORT_ENUM_TIPE_DONATUR.join(' | ')}`],
    [`Metode Bayar:  ${IMPORT_ENUM_METODE_BAYAR.join(' | ')}`],
    [`Program Induk: ${IMPORT_ENUM_PROGRAM_INDUK.join(' | ')}`],
  ]
  instructions.forEach((row, i) => {
    const cell = guide.getCell(i + 1, 1)
    cell.value = row[0]
    if (i === 0) cell.font = { bold: true, size: 12, color: { argb: 'FF1E3A5F' } }
  })

  return wb
}

// ─── Builder: Donatur ───────────────────────────────────────────────────────────────
function buildDonaturWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Dompet Ummat Kalbar'
  wb.created = new Date()

  // Sheet Referensi tersembunyi (sumber dropdown)
  const ref = wb.addWorksheet('Referensi')
  ref.state = 'veryHidden'
  IMPORT_ENUM_TIPE_DONATUR.forEach((v, i) => ref.getCell(`A${i + 1}`).value = v)

  // Sheet Data
  const data = wb.addWorksheet('Data')
  data.views = [{ state: 'frozen', ySplit: 1 }]

  const headers = DONATUR_IMPORT_HEADERS
  headers.forEach((h, i) => {
    const col = i + 1
    const cell = data.getCell(1, col)
    cell.value = h.label
    applyHeaderStyle(cell, h.required)
    data.getColumn(col).width = 28
  })
  data.getRow(1).height = 40

  // Contoh baris 2
  const examples: Record<string, unknown> = {
    nama_lengkap:  'Ahmad Fauzi Rahmat',
    kontak_utama:  '081234567890',
    tipe:          'Individu',
    alamat:        'Jl. Melati No. 5, RT 03, Pontianak',
    perusahaan:    '-',
  }
  headers.forEach((h, i) => {
    const cell = data.getCell(2, i + 1)
    cell.value = examples[h.key] as ExcelJS.CellValue
    applyExampleStyle(cell)
  })

  // Dropdown Tipe Donatur (baris 3–5000)
  const tipeColIdx = headers.findIndex(h => h.key === 'tipe') + 1
  for (let row = 3; row <= 5000; row++) {
    data.getCell(row, tipeColIdx).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`Referensi!$A$1:$A${IMPORT_ENUM_TIPE_DONATUR.length}`],
      showErrorMessage: true,
      errorTitle: 'Nilai Tidak Valid',
      error: `Pilih dari dropdown: ${IMPORT_ENUM_TIPE_DONATUR.join(', ')}`,
    }
  }

  // Sheet Petunjuk
  const guide = wb.addWorksheet('Petunjuk')
  guide.getColumn(1).width = 80
  const instructions = [
    ['PETUNJUK PENGISIAN TEMPLATE IMPORT DATABASE DONATUR'],
    [''],
    ['1. Isi data mulai dari baris ke-3 (baris ke-2 adalah contoh, bisa dihapus)'],
    ['2. Kolom berlatar MERAH MUDA adalah WAJIB diisi'],
    ['3. Kolom berlatar KUNING adalah opsional'],
    ['4. Gunakan dropdown untuk kolom Tipe Donatur'],
    ['5. Donatur yang sudah terdaftar (berdasarkan No. HP) akan dilewati otomatis'],
    [''],
    ['NILAI YANG DIIZINKAN:'],
    [`Tipe Donatur: ${IMPORT_ENUM_TIPE_DONATUR.join(' | ')}`],
  ]
  instructions.forEach((row, i) => {
    const cell = guide.getCell(i + 1, 1)
    cell.value = row[0]
    if (i === 0) cell.font = { bold: true, size: 12, color: { argb: 'FF1E3A5F' } }
  })

  return wb
}

// ─── Builder: Penyaluran ──────────────────────────────────────────────────────
function buildPenyaluranWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Dompet Ummat Kalbar'

  const ref = wb.addWorksheet('Referensi')
  ref.state = 'veryHidden'
  DOMAIN_PROGRAM.forEach((v, i)     => ref.getCell(`A${i + 1}`).value = v)
  KATEGORI_PROGRAM.forEach((v, i)   => ref.getCell(`B${i + 1}`).value = v)
  JENIS_BANTUAN.forEach((v, i)      => ref.getCell(`C${i + 1}`).value = v)
  STATUS_PENGAJUAN.forEach((v, i)   => ref.getCell(`D${i + 1}`).value = v)
  KATEGORI_PENYAKIT.forEach((v, i)  => ref.getCell(`E${i + 1}`).value = v)

  const data = wb.addWorksheet('Data')
  data.views = [{ state: 'frozen', ySplit: 1 }]

  const headers = PENYALURAN_IMPORT_HEADERS
  headers.forEach((h, i) => {
    const cell = data.getCell(1, i + 1)
    cell.value = h.label
    applyHeaderStyle(cell, h.required)
    data.getColumn(i + 1).width = 24
  })
  data.getRow(1).height = 40

  const examples: Record<string, unknown> = {
    id_transaksi: 'TRX-OUT-20240001',
    tanggal_berkas: '10/01/2024',
    tanggal_disalurkan: '15/01/2024',
    id_mustahik: 'MST-KES-0001',
    domain_program: 'Kesehatan',
    kategori_program: 'Bantuan Biaya Pengobatan',
    jenis_bantuan: 'Tunai',
    dana_tersalur: 1500000,
    status_pengajuan: 'Disetujui',
    kategori_penyakit: 'Penyakit Kronis',
  }
  headers.forEach((h, i) => {
    const cell = data.getCell(2, i + 1)
    cell.value = examples[h.key] as ExcelJS.CellValue
    if (h.isNumber) cell.numFmt = '#,##0'
    applyExampleStyle(cell)
  })

  const danaIdx    = headers.findIndex(h => h.key === 'dana_tersalur') + 1
  const domainIdx  = headers.findIndex(h => h.key === 'domain_program') + 1
  const katIdx     = headers.findIndex(h => h.key === 'kategori_program') + 1
  const jenisIdx   = headers.findIndex(h => h.key === 'jenis_bantuan') + 1
  const statusIdx  = headers.findIndex(h => h.key === 'status_pengajuan') + 1
  const penyakitIdx = headers.findIndex(h => h.key === 'kategori_penyakit') + 1

  for (let row = 3; row <= 5000; row++) {
    data.getCell(row, danaIdx).numFmt = '#,##0'
    data.getCell(row, domainIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$A$1:$A${DOMAIN_PROGRAM.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, katIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$B$1:$B${KATEGORI_PROGRAM.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, jenisIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$C$1:$C${JENIS_BANTUAN.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, statusIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$D$1:$D${STATUS_PENGAJUAN.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, penyakitIdx).dataValidation = { type: 'list', allowBlank: true, formulae: [`Referensi!$E$1:$E${KATEGORI_PENYAKIT.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
  }

  return wb
}

// ─── Builder: Mustahik ────────────────────────────────────────────────────────
function buildMustahikWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Dompet Ummat Kalbar'

  const ref = wb.addWorksheet('Referensi')
  ref.state = 'veryHidden'
  IMPORT_ENUM_GENDER.forEach((v, i)      => ref.getCell(`A${i + 1}`).value = v)
  IMPORT_ENUM_KATEGORI_PM.forEach((v, i) => ref.getCell(`B${i + 1}`).value = v)

  const data = wb.addWorksheet('Data')
  data.views = [{ state: 'frozen', ySplit: 1 }]

  const headers = MUSTAHIK_IMPORT_HEADERS
  headers.forEach((h, i) => {
    const cell = data.getCell(1, i + 1)
    cell.value = h.label
    applyHeaderStyle(cell, h.required)
    data.getColumn(i + 1).width = 22
  })
  data.getRow(1).height = 40

  const examples: Record<string, unknown> = {
    nama: 'Siti Aminah',
    nik: '6105012505900001',
    gender: 'P',
    no_hp: '081234567890',
    alamat: 'Jl. Melati No. 10, RT 03',
    desa: 'Nanga Pinoh',
    kelurahan_kecamatan: 'Nanga Pinoh',
    kabupaten_kota: 'Melawi',
    kategori_pm: 'Miskin',
    jumlah_jiwa: 4,
    latitude: -0.3500,
    longitude: 111.7400,
  }
  headers.forEach((h, i) => {
    const cell = data.getCell(2, i + 1)
    cell.value = examples[h.key] as ExcelJS.CellValue
    if (h.key === 'jumlah_jiwa') cell.numFmt = '0'
    if (h.key === 'latitude' || h.key === 'longitude') cell.numFmt = '0.00000000'
    applyExampleStyle(cell)
  })

  const genderIdx  = headers.findIndex(h => h.key === 'gender') + 1
  const katPMIdx   = headers.findIndex(h => h.key === 'kategori_pm') + 1
  const jiwaIdx    = headers.findIndex(h => h.key === 'jumlah_jiwa') + 1

  for (let row = 3; row <= 5000; row++) {
    data.getCell(row, genderIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$A$1:$A${IMPORT_ENUM_GENDER.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Isi L atau P' }
    data.getCell(row, katPMIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$B$1:$B${IMPORT_ENUM_KATEGORI_PM.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, jiwaIdx).numFmt = '0'
  }

  return wb
}

// ─── Builder: Ambulan Layanan ──────────────────────────────────────────────────
function buildAmbulanLayananWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Dompet Ummat Kalbar'

  const ref = wb.addWorksheet('Referensi')
  ref.state = 'veryHidden'
  IMPORT_ENUM_GENDER.forEach((v, i) => ref.getCell(`A${i + 1}`).value = v)
  STATUS_EKONOMI.forEach((v, i) => ref.getCell(`B${i + 1}`).value = v.label)
  SHIFT_JAM.forEach((v, i) => ref.getCell(`C${i + 1}`).value = v.label)
  LIST_ARMADA.forEach((v, i) => ref.getCell(`D${i + 1}`).value = v.label)
  KATEGORI_LAYANAN.forEach((v, i) => ref.getCell(`E${i + 1}`).value = v.label)

  const data = wb.addWorksheet('Data')
  data.views = [{ state: 'frozen', ySplit: 1 }]

  const headers = AMBULAN_LAYANAN_IMPORT_HEADERS
  headers.forEach((h, i) => {
    const cell = data.getCell(1, i + 1)
    cell.value = h.label
    applyHeaderStyle(cell, h.required)
    data.getColumn(i + 1).width = 22
  })
  data.getRow(1).height = 40

  const examples: Record<string, unknown> = {
    tanggal_layanan: '15/01/2024',
    nama_pasien: 'Budi Santoso',
    no_hp: '081234567890',
    gender: 'L',
    status_ekonomi: 'Dhuafa',
    jam: 'Pagi (06:00-12:00)',
    armada: 'Ambulan 1 (KB 1234 XX)',
    kategori_layanan: 'Antar Pasien',
    alamat_jemput: 'RSUD Melawi',
    desa: 'Nanga Pinoh',
    kecamatan: 'Nanga Pinoh',
    kabupaten_kota: 'Melawi',
    latitude: -0.3456,
    longitude: 111.7501,
  }
  headers.forEach((h, i) => {
    const cell = data.getCell(2, i + 1)
    cell.value = examples[h.key] as ExcelJS.CellValue
    if (h.key === 'latitude' || h.key === 'longitude') cell.numFmt = '0.00000000'
    applyExampleStyle(cell)
  })

  const genderIdx = headers.findIndex(h => h.key === 'gender') + 1
  const ekoIdx = headers.findIndex(h => h.key === 'status_ekonomi') + 1
  const jamIdx = headers.findIndex(h => h.key === 'jam') + 1
  const armadaIdx = headers.findIndex(h => h.key === 'armada') + 1
  const katIdx = headers.findIndex(h => h.key === 'kategori_layanan') + 1

  for (let row = 3; row <= 5000; row++) {
    data.getCell(row, genderIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$A$1:$A${IMPORT_ENUM_GENDER.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Isi L atau P' }
    data.getCell(row, ekoIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$B$1:$B${STATUS_EKONOMI.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, jamIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$C$1:$C${SHIFT_JAM.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, armadaIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$D$1:$D${LIST_ARMADA.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, katIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$E$1:$E${KATEGORI_LAYANAN.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
  }

  return wb
}

// ─── Builder: Ambulan Aktivitas ────────────────────────────────────────────────
function buildAmbulanAktivitasWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Dompet Ummat Kalbar'

  const ref = wb.addWorksheet('Referensi')
  ref.state = 'veryHidden'
  SHIFT_JAM.forEach((v, i) => ref.getCell(`A${i + 1}`).value = v.label)
  LIST_ARMADA.forEach((v, i) => ref.getCell(`B${i + 1}`).value = v.label)
  KATEGORI_AKTIVITAS.forEach((v, i) => ref.getCell(`C${i + 1}`).value = v.label)

  const data = wb.addWorksheet('Data')
  data.views = [{ state: 'frozen', ySplit: 1 }]

  const headers = AMBULAN_AKTIVITAS_IMPORT_HEADERS
  headers.forEach((h, i) => {
    const cell = data.getCell(1, i + 1)
    cell.value = h.label
    applyHeaderStyle(cell, h.required)
    data.getColumn(i + 1).width = 22
  })
  data.getRow(1).height = 40

  const examples: Record<string, unknown> = {
    tanggal_aktivitas: '16/01/2024',
    jam: 'Siang (12:00-15:00)',
    armada: 'Ambulan 1 (KB 1234 XX)',
    kategori_aktivitas: 'Isi Bensin',
    biaya_operasional: 250000,
  }
  headers.forEach((h, i) => {
    const cell = data.getCell(2, i + 1)
    cell.value = examples[h.key] as ExcelJS.CellValue
    if (h.isNumber) cell.numFmt = '#,##0'
    applyExampleStyle(cell)
  })

  const jamIdx = headers.findIndex(h => h.key === 'jam') + 1
  const armadaIdx = headers.findIndex(h => h.key === 'armada') + 1
  const katIdx = headers.findIndex(h => h.key === 'kategori_aktivitas') + 1
  const biayaIdx = headers.findIndex(h => h.key === 'biaya_operasional') + 1

  for (let row = 3; row <= 5000; row++) {
    data.getCell(row, jamIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$A$1:$A${SHIFT_JAM.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, armadaIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$B$1:$B${LIST_ARMADA.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, katIdx).dataValidation = { type: 'list', allowBlank: false, formulae: [`Referensi!$C$1:$C${KATEGORI_AKTIVITAS.length}`], showErrorMessage: true, errorTitle: 'Nilai Tidak Valid', error: 'Pilih dari dropdown' }
    data.getCell(row, biayaIdx).numFmt = '#,##0'
  }

  return wb
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const modul = searchParams.get('modul') ?? 'donasi'

  let workbook: ExcelJS.Workbook
  let filename: string

  switch (modul) {
    case 'donatur':
      workbook = buildDonaturWorkbook()
      filename = 'template_donatur.xlsx'
      break
    case 'penyaluran':
      workbook = buildPenyaluranWorkbook()
      filename = 'template_penyaluran.xlsx'
      break
    case 'mustahik':
      workbook = buildMustahikWorkbook()
      filename = 'template_mustahik.xlsx'
      break
    case 'ambulan_layanan':
      workbook = buildAmbulanLayananWorkbook()
      filename = 'template_ambulan_layanan.xlsx'
      break
    case 'ambulan_aktivitas':
      workbook = buildAmbulanAktivitasWorkbook()
      filename = 'template_ambulan_aktivitas.xlsx'
      break
    default:
      workbook = buildDonasiWorkbook()
      filename = 'template_donasi_masuk.xlsx'
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()

  return new Response(arrayBuffer as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
