export const SHIFT_JAM = [
  { label: 'Pagi (06:00-12:00)', value: 'Pagi__06_00_12_00_' },
  { label: 'Siang (12:00-15:00)', value: 'Siang__12_00_15_00_' },
  { label: 'Sore (15:00-18:00)', value: 'Sore__15_00_18_00_' },
  { label: 'Malam (18:00-06:00)', value: 'Malam__18_00_06_00_' },
]

export const LIST_ARMADA = [
  { label: 'Ambulan 1 (KB 1234 XX)', value: 'Ambulan_1__KB_1234_XX_' },
  { label: 'Ambulan 2 (KB 5678 YY)', value: 'Ambulan_2__KB_5678_YY_' },
  { label: 'Lainnya', value: 'Lainnya' },
]

export const KATEGORI_LAYANAN = [
  { label: 'Antar Pasien', value: 'Antar_Pasien' },
  { label: 'Jemput Pasien', value: 'Jemput_Pasien' },
  { label: 'Layanan Jenazah', value: 'Layanan_Jenazah' },
  { label: 'Gawat Darurat', value: 'Gawat_Darurat' },
  { label: 'Lainnya', value: 'Lainnya' },
]

export const KATEGORI_AKTIVITAS = [
  { label: 'Isi Bensin', value: 'Isi_Bensin' },
  { label: 'Servis Rutin', value: 'Servis_Rutin' },
  { label: 'Ganti Suku Cadang', value: 'Ganti_Suku_Cadang' },
  { label: 'Pajak/Administrasi', value: 'Pajak_Administrasi' },
  { label: 'Lainnya', value: 'Lainnya' },
]

export const STATUS_EKONOMI = [
  { label: 'Dhuafa', value: 'Dhuafa' },
  { label: 'Menengah', value: 'Menengah' },
  { label: 'Mampu', value: 'Mampu' },
]

export const AMBULAN_LAYANAN_IMPORT_HEADERS = [
  { key: 'id_transaksi',        label: 'ID Transaksi *',         required: true,  isNumber: false },
  { key: 'tanggal_layanan',     label: 'Tanggal (DD/MM/YYYY) *', required: true,  isNumber: false },
  { key: 'nama_pasien',         label: 'Nama Pasien *',          required: true,  isNumber: false },
  { key: 'no_hp',               label: 'No HP Pasien',           required: false, isNumber: false },
  { key: 'gender',              label: 'Gender (L/P) *',         required: true,  isNumber: false },
  { key: 'status_ekonomi',      label: 'Status Ekonomi *',       required: true,  isNumber: false },
  { key: 'jam',                 label: 'Shift Waktu *',          required: true,  isNumber: false },
  { key: 'armada',              label: 'Armada *',               required: true,  isNumber: false },
  { key: 'kategori_layanan',    label: 'Kategori Layanan *',     required: true,  isNumber: false },
  { key: 'alamat_jemput',       label: 'Alamat Penjemputan *',   required: true,  isNumber: false },
  { key: 'desa',                label: 'Desa/Kelurahan',         required: false, isNumber: false },
  { key: 'kecamatan',           label: 'Kecamatan',              required: false, isNumber: false },
  { key: 'kabupaten_kota',      label: 'Kabupaten/Kota *',       required: true,  isNumber: false },
  { key: 'latitude',            label: 'Latitude',               required: false, isNumber: true  },
  { key: 'longitude',           label: 'Longitude',              required: false, isNumber: true  },
] as const

export const AMBULAN_AKTIVITAS_IMPORT_HEADERS = [
  { key: 'id_transaksi',        label: 'ID Transaksi *',         required: true,  isNumber: false },
  { key: 'tanggal_aktivitas',   label: 'Tanggal (DD/MM/YYYY) *', required: true,  isNumber: false },
  { key: 'jam',                 label: 'Shift Waktu *',          required: true,  isNumber: false },
  { key: 'armada',              label: 'Armada *',               required: true,  isNumber: false },
  { key: 'kategori_aktivitas',  label: 'Kategori Aktivitas *',   required: true,  isNumber: false },
  { key: 'biaya_operasional',   label: 'Biaya (Rp) *',           required: true,  isNumber: true  },
] as const
