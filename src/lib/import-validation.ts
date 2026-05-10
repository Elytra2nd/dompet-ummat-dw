/**
 * Import Validation Library
 * =========================
 * Tipe data, helper, dan validator per-baris untuk modul Import Excel.
 * Tidak menggunakan library eksternal — validasi murni TypeScript.
 */

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface RowError {
  rowNumber: number
  idField?: string  // nilai ID transaksi/mustahik jika tersedia
  field: string
  value: unknown
  rule: string
  message: string
  severity: 'error' | 'warning'
}

/** Modul yang mendukung fitur import Excel */
export type ImportModul = 'donasi' | 'donatur' | 'penyaluran' | 'mustahik' | 'ambulan_layanan' | 'ambulan_aktivitas'

export interface ImportValidationResult {
  status: 'validation_failed' | 'success'
  totalRows: number
  validRows: number
  errorRows: number
  errors: RowError[]
  imported?: number
}

// Parsed row types
export interface DonasiRowParsed {
  tanggal: string
  nama_donatur: string
  tipe_donatur: string
  nominal_valid: number
  metode_bayar: string
  program_induk: string
  sub_program?: string
  nama_petugas: string
  no_ref?: string
}

export interface PenyaluranRowParsed {
  tanggal_berkas: string
  tanggal_disalurkan: string
  id_mustahik: string
  domain_program: string
  kategori_program: string
  jenis_bantuan: string
  dana_tersalur: number
  status_pengajuan: string
  kategori_penyakit?: string
}

export interface MustahikRowParsed {
  nama: string
  nik: string
  gender: string
  no_hp?: string
  alamat: string
  desa?: string
  kelurahan_kecamatan?: string
  kabupaten_kota: string
  kategori_pm: string
  jumlah_jiwa: number
  latitude?: number
  longitude?: number
}

export interface AmbulanLayananRowParsed {
  tanggal_layanan: string
  nama_pasien: string
  no_hp?: string
  gender: string
  status_ekonomi: string
  jam: string
  armada: string
  kategori_layanan: string
  alamat_jemput: string
  desa?: string
  kecamatan?: string
  kabupaten_kota: string
  latitude?: number
  longitude?: number
}

export interface AmbulanAktivitasRowParsed {
  tanggal_aktivitas: string
  jam: string
  armada: string
  kategori_aktivitas: string
  biaya_operasional: number
}

export interface DonaturRowParsed {
  nama_lengkap: string
  kontak_utama: string
  tipe: string
  alamat?: string
  perusahaan?: string
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Stopwords yang tidak dikapitalisasi dalam Proper Case */
const STOP_WORDS = new Set(['bin', 'binti', 'van', 'de', 'al', 'el', 'dan', 'atau'])

export function isProperCase(str: string): boolean {
  if (!str || str.trim().length === 0) return false
  return str.split(' ').every((word, i) => {
    if (!word) return true
    if (i > 0 && STOP_WORDS.has(word.toLowerCase())) return true
    return word.charAt(0) === word.charAt(0).toUpperCase() && word.charAt(0) !== word.charAt(0).toLowerCase()
  })
}

/** Parse string DD/MM/YYYY → Date object, null jika format salah */
export function parseDate(str: string): Date | null {
  if (typeof str !== 'string') return null
  const match = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const date = new Date(`${yyyy}-${mm}-${dd}`)
  if (isNaN(date.getTime())) return null
  return date
}

export function isFutureDate(date: Date): boolean {
  return date > new Date()
}

/** Helper error builder */
function err(
  rowNumber: number,
  idField: string | undefined,
  field: string,
  value: unknown,
  rule: string,
  message: string,
  severity: 'error' | 'warning' = 'error',
): RowError {
  return { rowNumber, idField, field, value, rule, message, severity }
}

/** Chunk array untuk batch processing */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
  return result
}

// ─── VALIDATOR: DONASI ────────────────────────────────────────────────────────

const ENUM_TIPE_DONATUR = ['Individu', 'Lembaga/Korporasi', 'Komunitas']
const ENUM_METODE_BAYAR = ['Transfer Bank', 'Tunai', 'QRIS', 'E-Wallet', 'Virtual Account', 'Jemput Donasi', 'Lainnya']
const ENUM_PROGRAM_INDUK = ['Pendidikan', 'Kesehatan', 'Ekonomi', 'Sosial Kemanusiaan', 'Dakwah & Advokasi', 'Operasional']

export function validateDonasiRow(
  raw: Record<string, unknown>,
  rowNumber: number,
): { errors: RowError[]; parsed: DonasiRowParsed | null } {
  const errors: RowError[] = []
  const id = undefined

  // tanggal
  const tgl = parseDate(String(raw['tanggal'] ?? ''))
  if (!tgl) {
    errors.push(err(rowNumber, id, 'tanggal', raw['tanggal'], 'date_format', `Format tanggal harus DD/MM/YYYY. Nilai: "${raw['tanggal']}"` ))
  } else if (isFutureDate(tgl)) {
    errors.push(err(rowNumber, id, 'tanggal', raw['tanggal'], 'date_future', 'Tanggal tidak boleh di masa depan'))
  }

  // nama_donatur
  const nama = String(raw['nama_donatur'] ?? '').trim()
  if (nama.length < 3) {
    errors.push(err(rowNumber, id, 'nama_donatur', raw['nama_donatur'], 'min_length', 'Nama donatur minimal 3 karakter'))
  } else if (!isProperCase(nama)) {
    errors.push(err(rowNumber, id, 'nama_donatur', raw['nama_donatur'], 'proper_case', `Nama harus Proper Case. Contoh: "Ahmad Fauzi", bukan "${nama}"`))
  }

  // tipe_donatur
  if (!ENUM_TIPE_DONATUR.includes(String(raw['tipe_donatur'] ?? ''))) {
    errors.push(err(rowNumber, id, 'tipe_donatur', raw['tipe_donatur'], 'enum', `Tipe donatur harus salah satu: ${ENUM_TIPE_DONATUR.join(', ')}`))
  }

  // nominal_valid — HARUS number, bukan string
  const nominal = raw['nominal_valid']
  if (typeof nominal !== 'number' || isNaN(nominal)) {
    errors.push(err(rowNumber, id, 'nominal_valid', nominal, 'type_number', 'Nominal harus berupa angka (Number), bukan teks. Hapus titik pemisah ribuan di Excel.'))
  } else if (!Number.isInteger(nominal)) {
    errors.push(err(rowNumber, id, 'nominal_valid', nominal, 'must_integer', 'Nominal harus bilangan bulat tanpa desimal'))
  } else if (nominal < 1000) {
    errors.push(err(rowNumber, id, 'nominal_valid', nominal, 'min_value', 'Nominal minimal Rp 1.000'))
  }

  // metode_bayar
  if (!ENUM_METODE_BAYAR.includes(String(raw['metode_bayar'] ?? ''))) {
    errors.push(err(rowNumber, id, 'metode_bayar', raw['metode_bayar'], 'enum', `Metode bayar tidak valid. Pilih dari: ${ENUM_METODE_BAYAR.join(', ')}`))
  }

  // program_induk
  if (!ENUM_PROGRAM_INDUK.includes(String(raw['program_induk'] ?? ''))) {
    errors.push(err(rowNumber, id, 'program_induk', raw['program_induk'], 'enum', `Program induk tidak valid. Pilih dari: ${ENUM_PROGRAM_INDUK.join(', ')}`))
  }

  // nama_petugas
  if (!raw['nama_petugas'] || String(raw['nama_petugas']).trim() === '') {
    errors.push(err(rowNumber, id, 'nama_petugas', raw['nama_petugas'], 'required', 'Nama petugas wajib diisi'))
  }

  if (errors.length > 0) return { errors, parsed: null }

  return {
    errors: [],
    parsed: {
      tanggal: String(raw['tanggal']),
      nama_donatur: nama,
      tipe_donatur: String(raw['tipe_donatur']),
      nominal_valid: nominal as number,
      metode_bayar: String(raw['metode_bayar']),
      program_induk: String(raw['program_induk']),
      sub_program: raw['sub_program'] ? String(raw['sub_program']).trim() : undefined,
      nama_petugas: String(raw['nama_petugas']).trim(),
      no_ref: raw['no_ref'] ? String(raw['no_ref']).trim() : undefined,
    },
  }
}

// ─── VALIDATOR: PENYALURAN ────────────────────────────────────────────────────

const ENUM_DOMAIN_PROGRAM = ['Pendidikan', 'Kesehatan', 'Ekonomi', 'Sosial Kemanusiaan', 'Dakwah & Advokasi', 'Operasional']
const ENUM_KATEGORI_PROGRAM = ['Beasiswa', 'Bantuan Biaya Pengobatan', 'Modal Usaha', 'Sembako', 'Santunan Tunai', 'Lainnya']
const ENUM_JENIS_BANTUAN = ['Tunai', 'Barang/Logistik', 'Jasa/Layanan', 'Lainnya']
const ENUM_STATUS_PENGAJUAN = ['Proses', 'Disetujui', 'Ditolak', 'Batal']
const ENUM_KATEGORI_PENYAKIT = ['Penyakit Kronis', 'Penyakit Menular', 'Penyakit Ringan', 'Gawat Darurat/Kecelakaan', 'Tidak Ada/Not Applicable']

export function validatePenyaluranRow(
  raw: Record<string, unknown>,
  rowNumber: number,
): { errors: RowError[]; parsed: PenyaluranRowParsed | null } {
  const errors: RowError[] = []
  const id = undefined

  const tglBerkas = parseDate(String(raw['tanggal_berkas'] ?? ''))
  if (!tglBerkas) {
    errors.push(err(rowNumber, id, 'tanggal_berkas', raw['tanggal_berkas'], 'date_format', `Format tanggal berkas harus DD/MM/YYYY. Nilai: "${raw['tanggal_berkas']}"`))
  }

  const tglDisalurkan = parseDate(String(raw['tanggal_disalurkan'] ?? ''))
  if (!tglDisalurkan) {
    errors.push(err(rowNumber, id, 'tanggal_disalurkan', raw['tanggal_disalurkan'], 'date_format', `Format tanggal disalurkan harus DD/MM/YYYY. Nilai: "${raw['tanggal_disalurkan']}"`))
  }

  if (!raw['id_mustahik'] || String(raw['id_mustahik']).trim() === '') {
    errors.push(err(rowNumber, id, 'id_mustahik', raw['id_mustahik'], 'required', 'ID Mustahik wajib diisi'))
  }

  if (!ENUM_DOMAIN_PROGRAM.includes(String(raw['domain_program'] ?? ''))) {
    errors.push(err(rowNumber, id, 'domain_program', raw['domain_program'], 'enum', `Domain program tidak valid. Pilih: ${ENUM_DOMAIN_PROGRAM.join(', ')}`))
  }

  if (!ENUM_KATEGORI_PROGRAM.includes(String(raw['kategori_program'] ?? ''))) {
    errors.push(err(rowNumber, id, 'kategori_program', raw['kategori_program'], 'enum', `Kategori program tidak valid. Pilih: ${ENUM_KATEGORI_PROGRAM.join(', ')}`))
  }

  if (!ENUM_JENIS_BANTUAN.includes(String(raw['jenis_bantuan'] ?? ''))) {
    errors.push(err(rowNumber, id, 'jenis_bantuan', raw['jenis_bantuan'], 'enum', `Jenis bantuan tidak valid. Pilih: ${ENUM_JENIS_BANTUAN.join(', ')}`))
  }

  const dana = raw['dana_tersalur']
  if (typeof dana !== 'number' || isNaN(dana)) {
    errors.push(err(rowNumber, id, 'dana_tersalur', dana, 'type_number', 'Dana tersalur harus berupa angka. Hapus titik pemisah ribuan.'))
  } else if (dana < 0) {
    errors.push(err(rowNumber, id, 'dana_tersalur', dana, 'min_value', 'Dana tersalur tidak boleh negatif'))
  }

  if (!ENUM_STATUS_PENGAJUAN.includes(String(raw['status_pengajuan'] ?? ''))) {
    errors.push(err(rowNumber, id, 'status_pengajuan', raw['status_pengajuan'], 'enum', `Status pengajuan tidak valid. Pilih: ${ENUM_STATUS_PENGAJUAN.join(', ')}`))
  }

  const katPenyakit = raw['kategori_penyakit']
  if (katPenyakit && !ENUM_KATEGORI_PENYAKIT.includes(String(katPenyakit))) {
    errors.push(err(rowNumber, id, 'kategori_penyakit', katPenyakit, 'enum', `Kategori penyakit tidak valid. Pilih: ${ENUM_KATEGORI_PENYAKIT.join(', ')}`, 'warning'))
  }

  if (errors.length > 0) return { errors, parsed: null }

  return {
    errors: [],
    parsed: {
      tanggal_berkas: String(raw['tanggal_berkas']),
      tanggal_disalurkan: String(raw['tanggal_disalurkan']),
      id_mustahik: String(raw['id_mustahik']).trim(),
      domain_program: String(raw['domain_program']),
      kategori_program: String(raw['kategori_program']),
      jenis_bantuan: String(raw['jenis_bantuan']),
      dana_tersalur: dana as number,
      status_pengajuan: String(raw['status_pengajuan']),
      kategori_penyakit: katPenyakit ? String(katPenyakit) : undefined,
    },
  }
}

// ─── VALIDATOR: MUSTAHIK ─────────────────────────────────────────────────────

const ENUM_GENDER = ['L', 'P']
const ENUM_KATEGORI_PM = ['Fakir', 'Miskin', 'Amil', 'Muallaf', 'Riqab', 'Gharimin', 'Fisabilillah', 'Ibnu Sabil']

export function validateMustahikRow(
  raw: Record<string, unknown>,
  rowNumber: number,
): { errors: RowError[]; parsed: MustahikRowParsed | null } {
  const errors: RowError[] = []

  const nama = String(raw['nama'] ?? '').trim()
  if (nama.length < 3) {
    errors.push(err(rowNumber, undefined, 'nama', raw['nama'], 'min_length', 'Nama mustahik minimal 3 karakter'))
  } else if (!isProperCase(nama)) {
    errors.push(err(rowNumber, undefined, 'nama', raw['nama'], 'proper_case', `Nama harus Proper Case. Contoh: "Siti Aminah", bukan "${nama}"`))
  }

  const nik = String(raw['nik'] ?? '').trim()
  if (nik.length !== 16 || !/^\d+$/.test(nik)) {
    errors.push(err(rowNumber, undefined, 'nik', raw['nik'], 'nik_format', 'NIK harus 16 digit angka'))
  }

  if (!ENUM_GENDER.includes(String(raw['gender'] ?? ''))) {
    errors.push(err(rowNumber, undefined, 'gender', raw['gender'], 'enum', 'Gender harus "L" atau "P"'))
  }

  if (!raw['alamat'] || String(raw['alamat']).trim() === '') {
    errors.push(err(rowNumber, undefined, 'alamat', raw['alamat'], 'required', 'Alamat wajib diisi'))
  }

  if (!raw['kabupaten_kota'] || String(raw['kabupaten_kota']).trim() === '') {
    errors.push(err(rowNumber, undefined, 'kabupaten_kota', raw['kabupaten_kota'], 'required', 'Kabupaten/Kota wajib diisi'))
  }

  if (!ENUM_KATEGORI_PM.includes(String(raw['kategori_pm'] ?? ''))) {
    errors.push(err(rowNumber, undefined, 'kategori_pm', raw['kategori_pm'], 'enum', `Kategori PM tidak valid. Pilih: ${ENUM_KATEGORI_PM.join(', ')}`))
  }

  const jiwa = raw['jumlah_jiwa']
  if (typeof jiwa !== 'number' || !Number.isInteger(jiwa) || jiwa < 1) {
    errors.push(err(rowNumber, undefined, 'jumlah_jiwa', jiwa, 'type_number', 'Jumlah jiwa harus bilangan bulat minimal 1'))
  }

  // lat/long: opsional tapi jika diisi harus valid
  const lat = raw['latitude']
  const lng = raw['longitude']
  if (lat !== undefined && lat !== null && lat !== '') {
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      errors.push(err(rowNumber, undefined, 'latitude', lat, 'coord_range', 'Latitude harus angka antara -90 dan 90', 'warning'))
    }
  }
  if (lng !== undefined && lng !== null && lng !== '') {
    if (typeof lng !== 'number' || lng < -180 || lng > 180) {
      errors.push(err(rowNumber, undefined, 'longitude', lng, 'coord_range', 'Longitude harus angka antara -180 dan 180', 'warning'))
    }
  }

  if (errors.filter(e => e.severity === 'error').length > 0) return { errors, parsed: null }

  return {
    errors, // mungkin ada warnings
    parsed: {
      nama,
      nik,
      gender: String(raw['gender']),
      no_hp: raw['no_hp'] ? String(raw['no_hp']).trim() : undefined,
      alamat: String(raw['alamat']).trim(),
      desa: raw['desa'] ? String(raw['desa']).trim() : undefined,
      kelurahan_kecamatan: raw['kelurahan_kecamatan'] ? String(raw['kelurahan_kecamatan']).trim() : undefined,
      kabupaten_kota: String(raw['kabupaten_kota']).trim(),
      kategori_pm: String(raw['kategori_pm']),
      jumlah_jiwa: jiwa as number,
      latitude: (lat !== undefined && lat !== null && lat !== '') ? lat as number : undefined,
      longitude: (lng !== undefined && lng !== null && lng !== '') ? lng as number : undefined,
    },
  }
}

// ─── VALIDATOR: AMBULAN LAYANAN ──────────────────────────────────────────────

const ENUM_AMBULAN_SHIFT = ['Pagi (06:00-12:00)', 'Siang (12:00-15:00)', 'Sore (15:00-18:00)', 'Malam (18:00-06:00)']
const ENUM_AMBULAN_ARMADA = ['Ambulan 1 (KB 1234 XX)', 'Ambulan 2 (KB 5678 YY)', 'Lainnya']
const ENUM_AMBULAN_KAT_LAYANAN = ['Antar Pasien', 'Jemput Pasien', 'Layanan Jenazah', 'Gawat Darurat', 'Lainnya']
const ENUM_AMBULAN_STATUS_EKO = ['Dhuafa', 'Menengah', 'Mampu']

export function validateAmbulanLayananRow(
  raw: Record<string, unknown>,
  rowNumber: number,
): { errors: RowError[]; parsed: AmbulanLayananRowParsed | null } {
  const errors: RowError[] = []
  const id = undefined

  const tgl = parseDate(String(raw['tanggal_layanan'] ?? ''))
  if (!tgl) {
    errors.push(err(rowNumber, id, 'tanggal_layanan', raw['tanggal_layanan'], 'date_format', 'Format tanggal harus DD/MM/YYYY'))
  }

  if (!raw['nama_pasien'] || String(raw['nama_pasien']).trim() === '') {
    errors.push(err(rowNumber, id, 'nama_pasien', raw['nama_pasien'], 'required', 'Nama pasien wajib diisi'))
  }

  if (!ENUM_GENDER.includes(String(raw['gender'] ?? ''))) {
    errors.push(err(rowNumber, id, 'gender', raw['gender'], 'enum', 'Gender harus L atau P'))
  }

  if (!ENUM_AMBULAN_STATUS_EKO.includes(String(raw['status_ekonomi'] ?? ''))) {
    errors.push(err(rowNumber, id, 'status_ekonomi', raw['status_ekonomi'], 'enum', `Status Ekonomi tidak valid. Pilih: ${ENUM_AMBULAN_STATUS_EKO.join(', ')}`))
  }

  if (!ENUM_AMBULAN_SHIFT.includes(String(raw['jam'] ?? ''))) {
    errors.push(err(rowNumber, id, 'jam', raw['jam'], 'enum', `Shift tidak valid. Pilih: ${ENUM_AMBULAN_SHIFT.join(', ')}`))
  }

  if (!ENUM_AMBULAN_ARMADA.includes(String(raw['armada'] ?? ''))) {
    errors.push(err(rowNumber, id, 'armada', raw['armada'], 'enum', `Armada tidak valid. Pilih: ${ENUM_AMBULAN_ARMADA.join(', ')}`))
  }

  if (!ENUM_AMBULAN_KAT_LAYANAN.includes(String(raw['kategori_layanan'] ?? ''))) {
    errors.push(err(rowNumber, id, 'kategori_layanan', raw['kategori_layanan'], 'enum', `Kategori layanan tidak valid. Pilih: ${ENUM_AMBULAN_KAT_LAYANAN.join(', ')}`))
  }

  if (!raw['alamat_jemput'] || String(raw['alamat_jemput']).trim() === '') {
    errors.push(err(rowNumber, id, 'alamat_jemput', raw['alamat_jemput'], 'required', 'Alamat penjemputan wajib diisi'))
  }
  
  if (!raw['kabupaten_kota'] || String(raw['kabupaten_kota']).trim() === '') {
    errors.push(err(rowNumber, id, 'kabupaten_kota', raw['kabupaten_kota'], 'required', 'Kabupaten/Kota wajib diisi'))
  }

  const lat = raw['latitude']
  const lng = raw['longitude']
  if (lat !== undefined && lat !== null && lat !== '') {
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      errors.push(err(rowNumber, id, 'latitude', lat, 'coord_range', 'Latitude harus angka antara -90 dan 90', 'warning'))
    }
  }
  if (lng !== undefined && lng !== null && lng !== '') {
    if (typeof lng !== 'number' || lng < -180 || lng > 180) {
      errors.push(err(rowNumber, id, 'longitude', lng, 'coord_range', 'Longitude harus angka antara -180 dan 180', 'warning'))
    }
  }

  if (errors.filter(e => e.severity === 'error').length > 0) return { errors, parsed: null }

  return {
    errors,
    parsed: {
      tanggal_layanan: String(raw['tanggal_layanan']),
      nama_pasien: String(raw['nama_pasien']).trim(),
      no_hp: raw['no_hp'] ? String(raw['no_hp']).trim() : undefined,
      gender: String(raw['gender']),
      status_ekonomi: String(raw['status_ekonomi']),
      jam: String(raw['jam']),
      armada: String(raw['armada']),
      kategori_layanan: String(raw['kategori_layanan']),
      alamat_jemput: String(raw['alamat_jemput']).trim(),
      desa: raw['desa'] ? String(raw['desa']).trim() : undefined,
      kecamatan: raw['kecamatan'] ? String(raw['kecamatan']).trim() : undefined,
      kabupaten_kota: String(raw['kabupaten_kota']).trim(),
      latitude: (lat !== undefined && lat !== null && lat !== '') ? lat as number : undefined,
      longitude: (lng !== undefined && lng !== null && lng !== '') ? lng as number : undefined,
    }
  }
}

// ─── VALIDATOR: AMBULAN AKTIVITAS ─────────────────────────────────────────────

const ENUM_AMBULAN_KAT_AKTIVITAS = ['Isi Bensin', 'Servis Rutin', 'Ganti Suku Cadang', 'Pajak/Administrasi', 'Lainnya']

export function validateAmbulanAktivitasRow(
  raw: Record<string, unknown>,
  rowNumber: number,
): { errors: RowError[]; parsed: AmbulanAktivitasRowParsed | null } {
  const errors: RowError[] = []
  const id = undefined

  const tgl = parseDate(String(raw['tanggal_aktivitas'] ?? ''))
  if (!tgl) {
    errors.push(err(rowNumber, id, 'tanggal_aktivitas', raw['tanggal_aktivitas'], 'date_format', 'Format tanggal harus DD/MM/YYYY'))
  }

  if (!ENUM_AMBULAN_SHIFT.includes(String(raw['jam'] ?? ''))) {
    errors.push(err(rowNumber, id, 'jam', raw['jam'], 'enum', `Shift tidak valid. Pilih: ${ENUM_AMBULAN_SHIFT.join(', ')}`))
  }

  if (!ENUM_AMBULAN_ARMADA.includes(String(raw['armada'] ?? ''))) {
    errors.push(err(rowNumber, id, 'armada', raw['armada'], 'enum', `Armada tidak valid. Pilih: ${ENUM_AMBULAN_ARMADA.join(', ')}`))
  }

  if (!ENUM_AMBULAN_KAT_AKTIVITAS.includes(String(raw['kategori_aktivitas'] ?? ''))) {
    errors.push(err(rowNumber, id, 'kategori_aktivitas', raw['kategori_aktivitas'], 'enum', `Kategori aktivitas tidak valid. Pilih: ${ENUM_AMBULAN_KAT_AKTIVITAS.join(', ')}`))
  }

  const biaya = raw['biaya_operasional']
  if (typeof biaya !== 'number' || isNaN(biaya)) {
    errors.push(err(rowNumber, id, 'biaya_operasional', biaya, 'type_number', 'Biaya operasional harus berupa angka. Hapus titik pemisah ribuan.'))
  } else if (biaya < 0) {
    errors.push(err(rowNumber, id, 'biaya_operasional', biaya, 'min_value', 'Biaya operasional tidak boleh negatif'))
  }

  if (errors.length > 0) return { errors, parsed: null }

  return {
    errors: [],
    parsed: {
      tanggal_aktivitas: String(raw['tanggal_aktivitas']),
      jam: String(raw['jam']),
      armada: String(raw['armada']),
      kategori_aktivitas: String(raw['kategori_aktivitas']),
      biaya_operasional: biaya as number,
    }
  }
}

// ─── VALIDATOR: DONATUR ───────────────────────────────────────────────────────

const ENUM_TIPE_DONATUR_DIM = ['Individu', 'Lembaga/Korporasi', 'Komunitas']

export function validateDonaturRow(
  raw: Record<string, unknown>,
  rowNumber: number,
): { errors: RowError[]; parsed: DonaturRowParsed | null } {
  const errors: RowError[] = []
  const id = undefined // donatur tidak punya ID unik dari file

  // nama_lengkap
  const nama = raw['nama_lengkap']
  if (!nama || String(nama).trim().length < 2) {
    errors.push(err(rowNumber, id, 'nama_lengkap', nama, 'required', 'Nama Lengkap wajib diisi dan minimal 2 karakter'))
  }

  // kontak_utama
  const kontak = raw['kontak_utama']
  if (!kontak || String(kontak).trim().length < 7) {
    errors.push(err(rowNumber, id, 'kontak_utama', kontak, 'required', 'No. HP / Kontak wajib diisi dan minimal 7 karakter'))
  } else {
    const hp = String(kontak).trim().replace(/\D/g, '')
    if (hp.length < 7 || hp.length > 15) {
      errors.push(err(rowNumber, id, 'kontak_utama', kontak, 'format', 'Format No. HP tidak valid (7-15 digit angka)', 'warning'))
    }
  }

  // tipe
  const tipe = raw['tipe']
  if (!tipe || !ENUM_TIPE_DONATUR_DIM.includes(String(tipe).trim())) {
    errors.push(err(rowNumber, id, 'tipe', tipe, 'enum', `Tipe Donatur harus salah satu: ${ENUM_TIPE_DONATUR_DIM.join(', ')}`))
  }

  if (errors.length > 0) return { errors, parsed: null }

  return {
    errors: [],
    parsed: {
      nama_lengkap: String(nama).trim(),
      kontak_utama: String(kontak).trim(),
      tipe: String(tipe).trim(),
      alamat: raw['alamat'] ? String(raw['alamat']).trim() : undefined,
      perusahaan: raw['perusahaan'] ? String(raw['perusahaan']).trim() : undefined,
    },
  }
}
