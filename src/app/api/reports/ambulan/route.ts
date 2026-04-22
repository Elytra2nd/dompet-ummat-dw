import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Ambil data dasar menggunakan Prisma Client (Paling Aman)
    const [layananPerArmada, kategoriLayanan, layananPerWaktu, totalLayanan] = await Promise.all([
      prisma.fact_layanan_ambulan.groupBy({
        by: ['armada'],
        _count: { id_transaksi: true },
      }),
      prisma.fact_layanan_ambulan.groupBy({
        by: ['kategori_layanan'],
        _count: { id_transaksi: true },
      }),
      prisma.fact_layanan_ambulan.groupBy({
        by: ['jam'],
        _count: { id_transaksi: true },
      }),
      prisma.fact_layanan_ambulan.count()
    ])

    // 2. Perbaikan Raw Query untuk Trend Bulanan
    // Gunakan format yang lebih standar untuk MySQL di Vercel/TiDB
    const trendBulanan: any[] = await prisma.$queryRaw`
      SELECT 
        SUBSTRING(CAST(sk_tanggal_layanan AS CHAR), 1, 6) as bulan_layanan,
        COUNT(id_transaksi) as jumlah_trip
      FROM fact_layanan_ambulan
      GROUP BY bulan_layanan
      ORDER BY bulan_layanan ASC
      LIMIT 12
    `

    // Mapping hasil untuk memastikan format data konsisten
    const formattedTrend = trendBulanan.map(t => ({
      bulan: t.bulan_layanan,
      total: Number(t.jumlah_trip)
    }))

    // Sortir untuk mencari Peak Performance agar tidak error jika data kosong
    const mostBusyArmada = [...layananPerArmada].sort((a, b) => b._count.id_transaksi - a._count.id_transaksi)[0] || { armada: 'N/A', _count: { id_transaksi: 0 } }
    const peakTime = [...layananPerWaktu].sort((a, b) => b._count.id_transaksi - a._count.id_transaksi)[0] || { jam: 'N/A', _count: { id_transaksi: 0 } }

    return NextResponse.json({ 
      total: totalLayanan, 
      perArmada: layananPerArmada,
      perKategori: kategoriLayanan,
      perWaktu: layananPerWaktu,
      trend: formattedTrend,
      insight_summary: {
        most_busy_armada: mostBusyArmada,
        peak_time: peakTime
      }
    })
  } catch (error: any) {
    // Log error ke konsol Vercel agar mudah di-debug
    console.error("AMBULAN_REPORT_ERROR:", error.message)
    return NextResponse.json(
      { error: "Gagal memproses insight operasional", details: error.message }, 
      { status: 500 }
    )
  }
}