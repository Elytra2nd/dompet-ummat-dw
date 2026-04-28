// ─── IMPORT EXCEL CONSTANTS — MUSTAHIK ───────────────────────────────────────

export const IMPORT_ENUM_GENDER = ['L', 'P'] as const

export const IMPORT_ENUM_KATEGORI_PM = [
  'Fakir', 'Miskin', 'Amil', 'Muallaf',
  'Riqab', 'Gharimin', 'Fisabilillah', 'Ibnu Sabil',
] as const

export const MUSTAHIK_IMPORT_HEADERS = [
  { key: 'nama',                 label: 'Nama Lengkap *',            required: true,  isNumber: false },
  { key: 'nik',                  label: 'NIK (16 digit) *',          required: true,  isNumber: false },
  { key: 'gender',               label: 'Gender (L/P) *',            required: true,  isNumber: false },
  { key: 'no_hp',                label: 'No. HP',                    required: false, isNumber: false },
  { key: 'alamat',               label: 'Alamat Lengkap *',          required: true,  isNumber: false },
  { key: 'desa',                 label: 'Desa',                      required: false, isNumber: false },
  { key: 'kelurahan_kecamatan',  label: 'Kelurahan / Kecamatan',     required: false, isNumber: false },
  { key: 'kabupaten_kota',       label: 'Kabupaten / Kota *',        required: true,  isNumber: false },
  { key: 'kategori_pm',          label: 'Kategori PM *',             required: true,  isNumber: false },
  { key: 'jumlah_jiwa',          label: 'Jumlah Jiwa *',             required: true,  isNumber: true  },
  { key: 'latitude',             label: 'Latitude (opsional)',        required: false, isNumber: true  },
  { key: 'longitude',            label: 'Longitude (opsional)',       required: false, isNumber: true  },
] as const
