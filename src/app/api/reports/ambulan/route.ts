import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** Convert "YYYY-MM-DD" → integer YYYYMMDD untuk filter sk_tanggal_layanan */
function dateToKey(dateStr: string): number {
  return parseInt(dateStr.replace(/-/g, ''), 10)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const skFilter = (from || to) ? {
      sk_tanggal_layanan: {
        ...(from ? { gte: dateToKey(from) } : {}),
        ...(to ? { lte: dateToKey(to) } : {}),
      }
    } : {}

    const [layananPerArmada, kategoriLayanan, layananPerWaktu, totalLayanan] = await Promise.all([
      prisma.fact_layanan_ambulan.groupBy({
        by: ['armada'],
        _count: { id_transaksi: true },
        where: skFilter,
      }),
      prisma.fact_layanan_ambulan.groupBy({
        by: ['kategori_layanan'],
        _count: { id_transaksi: true },
        where: skFilter,
      }),
      prisma.fact_layanan_ambulan.groupBy({
        by: ['jam'],
        _count: { id_transaksi: true },
        where: skFilter,
      }),
      prisma.fact_layanan_ambulan.count({ where: skFilter }),
    ])

    const trendBulanan: { bulan_layanan: string; jumlah_trip: number }[] = await prisma.$queryRaw`
      SELECT
        SUBSTRING(CAST(sk_tanggal_layanan AS CHAR), 1, 6) as bulan_layanan,
        COUNT(id_transaksi) as jumlah_trip
      FROM fact_layanan_ambulan
      ${from ? prisma.$queryRaw`WHERE sk_tanggal_layanan >= ${dateToKey(from)}` : prisma.$queryRaw``}
      GROUP BY bulan_layanan
      ORDER BY bulan_layanan ASC
      LIMIT 12
    `

    const mostBusyArmada = [...layananPerArmada].sort((a, b) => b._count.id_transaksi - a._count.id_transaksi)[0]
      ?? { armada: 'N/A', _count: { id_transaksi: 0 } }
    const peakTime = [...layananPerWaktu].sort((a, b) => b._count.id_transaksi - a._count.id_transaksi)[0]
      ?? { jam: 'N/A', _count: { id_transaksi: 0 } }

    return NextResponse.json({
      total: totalLayanan,
      period: { from: from || null, to: to || null },
      perArmada: layananPerArmada,
      perKategori: kategoriLayanan,
      perWaktu: layananPerWaktu,
      trend: trendBulanan.map(t => ({ bulan: t.bulan_layanan, total: Number(t.jumlah_trip) })),
      insight_summary: { most_busy_armada: mostBusyArmada, peak_time: peakTime },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('AMBULAN_REPORT_ERROR:', msg)
    return NextResponse.json({ error: 'Gagal memproses insight operasional', details: msg }, { status: 500 })
  }
}
