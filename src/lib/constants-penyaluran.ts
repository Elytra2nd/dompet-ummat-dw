export const DOMAIN_PROGRAM = [
  'Pendidikan',
  'Kesehatan',
  'Ekonomi',
  'Sosial Kemanusiaan',
  'Dakwah & Advokasi',
  'Operasional',
]

export const KATEGORI_PROGRAM = [
  'Beasiswa',
  'Bantuan Biaya Pengobatan',
  'Modal Usaha',
  'Sembako',
  'Santunan Tunai',
  'Lainnya',
]

export const JENIS_BANTUAN = [
  'Tunai',
  'Barang/Logistik',
  'Jasa/Layanan',
  'Lainnya',
]

export const STATUS_PENGAJUAN = ['Proses', 'Disetujui', 'Ditolak', 'Batal']

export const KATEGORI_PENYAKIT = [
  'Penyakit Kronis',
  'Penyakit Menular',
  'Penyakit Ringan',
  'Gawat Darurat/Kecelakaan',
  'Tidak Ada/Not Applicable',
]

// ─── IMPORT EXCEL CONSTANTS ───────────────────────────────────────────────────

export const PENYALURAN_IMPORT_HEADERS = [
  { key: 'id_transaksi',        label: 'ID Transaksi *',                required: true,  isNumber: false },
  { key: 'tanggal_berkas',      label: 'Tgl Berkas (DD/MM/YYYY) *',    required: true,  isNumber: false },
  { key: 'tanggal_disalurkan',  label: 'Tgl Disalurkan (DD/MM/YYYY) *',required: true,  isNumber: false },
  { key: 'id_mustahik',         label: 'ID Mustahik *',                required: true,  isNumber: false },
  { key: 'domain_program',      label: 'Domain Program *',             required: true,  isNumber: false },
  { key: 'kategori_program',    label: 'Kategori Program *',           required: true,  isNumber: false },
  { key: 'jenis_bantuan',       label: 'Jenis Bantuan *',              required: true,  isNumber: false },
  { key: 'dana_tersalur',       label: 'Dana Tersalur (Rp) *',        required: true,  isNumber: true  },
  { key: 'status_pengajuan',    label: 'Status Pengajuan *',           required: true,  isNumber: false },
  { key: 'kategori_penyakit',   label: 'Kategori Penyakit',           required: false, isNumber: false },
] as const
