export const JENIS_DONASI = [
  'Zakat Profesi',
  'Zakat Maal',
  'Infaq/Sedekah',
  'Wakaf',
  'Fidyah',
  'Dana Sosial Keagamaan Lainnya (DSKL)',
]

export const METODE_PEMBAYARAN = [
  'Transfer Bank',
  'Tunai/Cash',
  'QRIS',
  'Payroll Check-off',
  'Lainnya',
]

export const BANK_TUJUAN = [
  'BSI (Bank Syariah Indonesia)',
  'Bank Kalbar Syariah',
  'Mandiri',
  'BNI',
  'Lainnya/Tunai',
]

// ─── IMPORT EXCEL CONSTANTS ───────────────────────────────────────────────────

export const IMPORT_ENUM_TIPE_DONATUR = ['Individu', 'Lembaga/Korporasi', 'Komunitas'] as const

export const IMPORT_ENUM_METODE_BAYAR = [
  'Transfer Bank', 'Tunai', 'QRIS', 'E-Wallet',
  'Virtual Account', 'Jemput Donasi', 'Lainnya',
] as const

export const IMPORT_ENUM_PROGRAM_INDUK = [
  'Pendidikan', 'Kesehatan', 'Ekonomi',
  'Sosial Kemanusiaan', 'Dakwah & Advokasi', 'Operasional',
] as const

export const DONASI_IMPORT_HEADERS = [
  { key: 'tanggal',             label: 'Tanggal (DD/MM/YYYY) *',  required: true,  isNumber: false },
  { key: 'nama_donatur',        label: 'Nama Donatur *',          required: true,  isNumber: false },
  { key: 'tipe_donatur',        label: 'Tipe Donatur *',          required: true,  isNumber: false },
  { key: 'nominal_valid',       label: 'Nominal (Rp) *',          required: true,  isNumber: true  },
  { key: 'metode_bayar',        label: 'Metode Bayar *',          required: true,  isNumber: false },
  { key: 'program_induk',       label: 'Program Induk *',         required: true,  isNumber: false },
  { key: 'sub_program',         label: 'Sub Program',             required: false, isNumber: false },
  { key: 'nama_petugas',        label: 'Nama Petugas *',          required: true,  isNumber: false },
  { key: 'no_ref',              label: 'No. Referensi',           required: false, isNumber: false },
] as const

// ─── IMPORT DONATUR CONSTANTS ─────────────────────────────────────────────────

export const DONATUR_IMPORT_HEADERS = [
  { key: 'nama_lengkap',   label: 'Nama Lengkap *',           required: true,  isNumber: false },
  { key: 'kontak_utama',   label: 'No. HP / Kontak *',        required: true,  isNumber: false },
  { key: 'tipe',           label: 'Tipe Donatur *',           required: true,  isNumber: false },
  { key: 'alamat',         label: 'Alamat',                   required: false, isNumber: false },
  { key: 'perusahaan',     label: 'Nama Perusahaan',          required: false, isNumber: false },
] as const
