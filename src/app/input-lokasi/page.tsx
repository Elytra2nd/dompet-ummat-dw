import { prisma } from '@/lib/prisma'
// Import wrapper baru
import LocationPickerWrapper from '@/components/map/LocationPickerWrapper'

export default async function InputLokasiPage() {
  // Ambil data mustahik yang sk_lokasi-nya masih -1 (Server Side)
  const mustahikTanpaLokasi = await prisma.dim_mustahik.findMany({
    where: { 
      sk_lokasi: -1,
      is_active: true 
    },
    select: { 
      sk_mustahik: true, 
      nama: true 
    },
    take: 100, // Kita ambil 100 data
    orderBy: { nama: 'asc' }
  })

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Input Geospasial <span className="text-emerald-600">Dompet Ummat</span>
        </h1>
        <p className="text-muted-foreground text-sm">
          Pilih nama mustahik dan tentukan titik rumahnya pada peta untuk memperbaiki data warehouse.
        </p>
      </header>

      <hr className="border-slate-200" />

      {/* Panggil Wrapper di sini */}
      <LocationPickerWrapper mustahikList={mustahikTanpaLokasi} />
    </div>
  )
}