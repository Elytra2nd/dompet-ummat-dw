export const dynamic = 'force-dynamic';

import { prisma } from '@/lib/prisma'
import LocationPickerWrapper from '@/components/map/LocationPickerWrapper'
export default async function InputLokasiPage() {
  // Ambil data mustahik yang sk_lokasi-nya masih -1 (Server Side)
  // Query ini hanya akan dieksekusi saat halaman diakses oleh user (Runtime),
  const mustahikTanpaLokasi = await prisma.dim_mustahik.findMany({
    where: {
      sk_lokasi: -1,
      is_active: true,
    },
    select: {
      sk_mustahik: true,
      nama: true,
    },
    take: 100, // Membatasi beban query untuk performa dashboard
    orderBy: { nama: 'asc' },
  })

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-8 font-sans">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Input Geospasial{' '}
          <span className="text-emerald-600">Dompet Ummat</span>
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          Pilih nama mustahik dan tentukan titik rumahnya pada peta untuk
          memperbaiki akurasi data warehouse BIDA.
        </p>
      </header>

      <hr className="border-slate-200" />

      {/* Wrapper ini menghandle library Leaflet yang butuh akses objek 'window'.
          mustahikList dikirim sebagai props dari Server Component ke Client Component.
      */}
      <div className="rounded-xl border bg-white shadow-sm p-2">
         <LocationPickerWrapper mustahikList={mustahikTanpaLokasi} />
      </div>
      
      <footer className="pt-4 text-center text-xs text-slate-400">
        Sistem Informasi Geospasial - Data Warehouse Dompet Ummat © 2026
      </footer>
    </div>
  )
}