import dynamic from 'next/dynamic'
import { prisma } from '@/lib/prisma'
import { StatCard } from '@/components/ui/StatCard'

// Load map secara dinamis (tanpa SSR)
const MainMap = dynamic(() => import('@/components/map/MapContainer'), { 
  ssr: false,
  loading: () => <div className="h-[500px] w-full animate-pulse bg-gray-200 rounded-xl" />
})

export default async function DashboardPage() {
  // Ambil data statistik langsung dari Prisma (Server Side)
  const totalMustahik = await prisma.dim_mustahik.count()
  const mapData = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/mustahik/locations`).then(res => res.json())

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">DW Dompet Ummat Dashboard</h1>
          <p className="text-gray-500">Monitoring Data Spasial & Kelayakan</p>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard title="Total Mustahik" value={totalMustahik} icon="👥" color="bg-blue-600" />
          <StatCard title="Titik Lokasi" value={mapData.length} icon="📍" color="bg-emerald-600" />
          <StatCard title="Update Terbaru" value="15 April 2026" icon="📅" color="bg-amber-600" />
        </div>

        <div className="overflow-hidden rounded-xl bg-white shadow-lg">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Sebaran Mustahik Melawi</h2>
          </div>
          <MainMap data={mapData} />
        </div>
      </div>
    </main>
  )
}