/**
 * Segmentasi Constants
 * ====================
 * Label, warna, ikon, dan rekomendasi strategi per segmen donatur.
 * Digunakan oleh UI — semua dalam bahasa Indonesia yang mudah dipahami.
 */

export interface SegmentConfig {
  key: string
  label: string
  description: string
  color: string           // Tailwind color class (text)
  bgColor: string         // Tailwind bg class
  borderColor: string     // Tailwind border class
  iconName: string        // Lucide icon name
  recommendation: {
    title: string
    description: string
    channels: string[]
  }
}

export const SEGMENT_CONFIGS: Record<string, SegmentConfig> = {
  champions: {
    key: 'champions',
    label: 'Donatur Utama',
    description: 'Baru berdonasi, sering, dan nominal besar. Aset terpenting organisasi.',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconName: 'Trophy',
    recommendation: {
      title: 'Apresiasi dan Pertahankan',
      description: 'Berikan penghargaan khusus, undang ke acara eksklusif, dan libatkan dalam program unggulan.',
      channels: ['Kunjungan langsung', 'Surat penghargaan', 'WhatsApp personal'],
    },
  },
  loyal: {
    key: 'loyal',
    label: 'Donatur Setia',
    description: 'Rutin berdonasi dengan frekuensi tinggi. Konsisten mendukung program.',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconName: 'Heart',
    recommendation: {
      title: 'Jaga Konsistensi',
      description: 'Kirim laporan dampak donasi secara rutin. Tawarkan program donasi otomatis (auto-debit).',
      channels: ['Email laporan bulanan', 'WhatsApp grup', 'Newsletter'],
    },
  },
  potential: {
    key: 'potential',
    label: 'Calon Setia',
    description: 'Potensi tinggi untuk menjadi donatur loyal jika dikelola dengan baik.',
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    iconName: 'Sparkles',
    recommendation: {
      title: 'Tingkatkan Engagement',
      description: 'Ajak bergabung di program rutin. Perkenalkan berbagai program donasi yang tersedia.',
      channels: ['WhatsApp', 'Undangan acara', 'Media sosial'],
    },
  },
  new_donors: {
    key: 'new_donors',
    label: 'Donatur Baru',
    description: 'Baru bergabung dan mulai berdonasi. Perlu disambut dengan baik.',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    iconName: 'UserPlus',
    recommendation: {
      title: 'Sambutan Hangat',
      description: 'Kirim ucapan terima kasih dan paket informasi tentang program. Buat kesan pertama yang positif.',
      channels: ['WhatsApp sambutan', 'Email onboarding', 'Brosur program'],
    },
  },
  promising: {
    key: 'promising',
    label: 'Menjanjikan',
    description: 'Mulai aktif berdonasi. Dengan pendekatan yang tepat, bisa naik kelas.',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    iconName: 'TrendingUp',
    recommendation: {
      title: 'Edukasi dan Ajak',
      description: 'Edukasi tentang dampak donasi. Ajak berpartisipasi dalam program spesifik yang sesuai minat.',
      channels: ['Konten edukasi', 'WhatsApp', 'Undangan kegiatan'],
    },
  },
  need_attention: {
    key: 'need_attention',
    label: 'Perlu Perhatian',
    description: 'Masih aktif namun menunjukkan tanda penurunan aktivitas donasi.',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconName: 'AlertTriangle',
    recommendation: {
      title: 'Tindak Lanjut Segera',
      description: 'Hubungi secara personal untuk menanyakan kabar. Tawarkan kemudahan berdonasi.',
      channels: ['Telepon personal', 'WhatsApp', 'Kunjungan'],
    },
  },
  at_risk: {
    key: 'at_risk',
    label: 'Berisiko',
    description: 'Dahulu aktif berdonasi, namun sudah lama tidak berdonasi lagi.',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    iconName: 'ShieldAlert',
    recommendation: {
      title: 'Kampanye Re-aktivasi',
      description: 'Kirim pesan personal yang mengingatkan dampak kontribusi mereka dulu. Tawarkan program baru.',
      channels: ['WhatsApp personal', 'Email re-engagement', 'Telepon'],
    },
  },
  hibernating: {
    key: 'hibernating',
    label: 'Tidak Aktif',
    description: 'Sudah cukup lama tidak berdonasi. Perlu upaya ekstra untuk mengaktifkan kembali.',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200',
    iconName: 'Moon',
    recommendation: {
      title: 'Pendekatan Lembut',
      description: 'Kirim update kabar organisasi tanpa tekanan untuk berdonasi. Bangun kembali hubungan.',
      channels: ['Newsletter', 'Media sosial', 'WhatsApp broadcast'],
    },
  },
  lost: {
    key: 'lost',
    label: 'Hilang',
    description: 'Tidak ada aktivitas donasi dalam waktu yang sangat lama.',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconName: 'UserX',
    recommendation: {
      title: 'Evaluasi Data',
      description: 'Verifikasi kontak masih valid. Jika masih valid, masukkan ke kampanye re-aktivasi sesekali.',
      channels: ['Verifikasi data', 'Email sesekali'],
    },
  },
}

/**
 * Urutan segmen dari terbaik ke terburuk (untuk sorting)
 */
export const SEGMENT_ORDER = [
  'champions',
  'loyal',
  'potential',
  'new_donors',
  'promising',
  'need_attention',
  'at_risk',
  'hibernating',
  'lost',
]

/**
 * Ambil config segmen berdasarkan key, fallback ke 'lost' jika tidak ditemukan
 */
export function getSegmentConfig(key: string): SegmentConfig {
  return SEGMENT_CONFIGS[key] || SEGMENT_CONFIGS['lost']
}
