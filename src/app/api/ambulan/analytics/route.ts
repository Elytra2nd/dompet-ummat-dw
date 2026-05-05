import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * SOLAP/OLAP Analytics API for Ambulance Dashboard
 * Provides multi-dimensional aggregated data for:
 * 1. Trend layanan per bulan (Time dimension)
 * 2. Distribusi kategori layanan (Service dimension)
 * 3. Biaya per armada (Unit dimension)
 * 4. Spatial distribution by location
 */
export async function GET() {
  try {
    // 1. Monthly trend of services
    const trendRaw = await prisma.$queryRaw<any[]>`
      SELECT
        SUBSTRING(CAST(sk_tanggal_layanan AS CHAR), 1, 4) AS tahun,
        SUBSTRING(CAST(sk_tanggal_layanan AS CHAR), 5, 2) AS bulan,
        COUNT(*) AS jumlah_layanan
      FROM fact_layanan_ambulan
      GROUP BY 1, 2
      ORDER BY tahun ASC, bulan ASC
    `

    const MONTH_LABELS: Record<string, string> = {
      '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
      '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu',
      '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
    }

    const trendData = trendRaw.map(row => ({
      label: `${MONTH_LABELS[String(row.bulan)] ?? row.bulan} ${row.tahun}`,
      count: Number(row.jumlah_layanan),
    }))

    // 2. Distribution by kategori_layanan
    const kategoriRaw = await prisma.$queryRaw<any[]>`
      SELECT
        kategori_layanan,
        COUNT(*) AS jumlah
      FROM fact_layanan_ambulan
      GROUP BY kategori_layanan
      ORDER BY jumlah DESC
    `

    const kategoriData = kategoriRaw.map(row => ({
      name: String(row.kategori_layanan ?? 'Lainnya').replace(/_/g, ' '),
      value: Number(row.jumlah),
    }))

    // 3. Cost by armada (from fact_aktivitas)
    const armadaRaw = await prisma.$queryRaw<any[]>`
      SELECT
        armada,
        kategori_aktivitas,
        SUM(biaya_operasional) AS total_biaya,
        COUNT(*) AS jumlah_aktivitas
      FROM fact_aktivitas_ambulan
      GROUP BY armada, kategori_aktivitas
      ORDER BY total_biaya DESC
    `

    const armadaData = armadaRaw.map(row => ({
      armada: String(row.armada ?? '-').replace(/__/g, ' | ').replace(/_/g, ' '),
      kategori: String(row.kategori_aktivitas ?? '-').replace(/_/g, ' '),
      totalBiaya: Number(row.total_biaya),
      jumlahAktivitas: Number(row.jumlah_aktivitas),
    }))

    // 4. Spatial distribution (location aggregation for SOLAP)
    const spatialRaw = await prisma.$queryRaw<any[]>`
      SELECT
        dl.kabupaten_kota,
        dl.kecamatan,
        COUNT(*) AS jumlah_layanan
      FROM fact_layanan_ambulan fla
      JOIN dim_lokasi dl ON fla.sk_lokasi = dl.sk_lokasi
      GROUP BY dl.kabupaten_kota, dl.kecamatan
      ORDER BY jumlah_layanan DESC
    `

    const spatialData = spatialRaw.map(row => ({
      kabupaten: String(row.kabupaten_kota ?? '-'),
      kecamatan: String(row.kecamatan ?? '-'),
      jumlah: Number(row.jumlah_layanan),
    }))

    // 5. OLAP Cube data: Time x Armada x Kategori
    const cubeRaw = await prisma.$queryRaw<any[]>`
      SELECT
        SUBSTRING(CAST(sk_tanggal_layanan AS CHAR), 1, 4) AS tahun,
        armada,
        kategori_layanan,
        COUNT(*) AS jumlah
      FROM fact_layanan_ambulan
      GROUP BY 1, 2, 3
      ORDER BY tahun ASC
    `

    const cubeData = cubeRaw.map(row => ({
      tahun: String(row.tahun),
      armada: String(row.armada ?? '-').replace(/__/g, ' | ').replace(/_/g, ' '),
      kategori: String(row.kategori_layanan ?? '-').replace(/_/g, ' '),
      jumlah: Number(row.jumlah),
    }))

    return NextResponse.json({
      trend: trendData,
      kategori: kategoriData,
      armadaCost: armadaData,
      spatial: spatialData,
      cube: cubeData,
    })
  } catch (error: any) {
    console.error('AMBULAN_ANALYTICS_ERROR:', error)
    return NextResponse.json(
      { error: 'Gagal memuat analytics ambulan', details: error?.message },
      { status: 500 }
    )
  }
}
