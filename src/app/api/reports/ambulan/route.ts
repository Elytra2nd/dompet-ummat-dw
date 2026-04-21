import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Grouping Berdasarkan Armada (Existing)
    const layananPerArmada = await prisma.fact_layanan_ambulan.groupBy({
      by: ['armada'],
      _count: { id_transaksi: true },
    })

    // 2. Grouping Berdasarkan Kategori (Existing)
    const kategoriLayanan = await prisma.fact_layanan_ambulan.groupBy({
      by: ['kategori_layanan'],
      _count: { id_transaksi: true },
    })

    // 3. INSIGHT BARU: Grouping Berdasarkan Waktu (Jam)
    // Ini penting untuk melihat beban operasional (Shift mana yang paling sibuk?)
    const layananPerWaktu = await prisma.fact_layanan_ambulan.groupBy({
      by: ['jam'],
      _count: { id_transaksi: true },
    })

    // 4. INSIGHT BARU: Trend Bulanan (Menggunakan Raw Query untuk ekstraksi Bulan dari SK_Tanggal)
    // Format SK_Tanggal kamu adalah YYYYMMDD (Int)
    // Kita ambil 6 digit pertama (YYYYMM) untuk melihat trend bulanan
    const trendBulanan = await prisma.$queryRaw`
      SELECT 
        LEFT(CAST(sk_tanggal_layanan AS CHAR), 6) as bulan_layanan,
        COUNT(id_transaksi) as jumlah_trip
      FROM fact_layanan_ambulan
      GROUP BY bulan_layanan
      ORDER BY bulan_layanan ASC
      LIMIT 12
    `

    // 5. INSIGHT BARU: Top 5 Lokasi Tujuan (Hotspots)
    const sebaranLokasi = await prisma.fact_layanan_ambulan.findMany({
      take: 1000,
      include: {
        dim_lokasi: {
          select: { kabupaten_kota: true, kecamatan: true }
        }
      }
    })

    const totalLayanan = await prisma.fact_layanan_ambulan.count()

    return NextResponse.json({ 
      total: totalLayanan, 
      perArmada: layananPerArmada,
      perKategori: kategoriLayanan,
      perWaktu: layananPerWaktu,
      trend: trendBulanan,
      // Metadata tambahan untuk mempermudah frontend
      insight_summary: {
        most_busy_armada: layananPerArmada.sort((a, b) => b._count.id_transaksi - a._count.id_transaksi)[0],
        peak_time: layananPerWaktu.sort((a, b) => b._count.id_transaksi - a._count.id_transaksi)[0]
      }
    })
  } catch (error: any) {
    console.error("REPORT ERROR:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}