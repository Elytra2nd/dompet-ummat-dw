import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const dateFilter = (from || to) ? {
      valid_from: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + 'T23:59:59') } : {}),
      }
    } : {}

    const [sebaranKategori, sebaranGender, sebaranWilayah, agregatSkor, total] = await Promise.all([
      prisma.dim_mustahik.groupBy({
        by: ['kategori_pm'],
        _count: { id_mustahik: true },
        where: { is_active: true, ...dateFilter },
      }),
      prisma.dim_mustahik.groupBy({
        by: ['gender'],
        _count: { id_mustahik: true },
        where: { is_active: true, ...dateFilter },
      }),
      prisma.dim_mustahik.groupBy({
        by: ['kabupaten_kota'],
        _count: { id_mustahik: true },
        where: { is_active: true, ...dateFilter },
        orderBy: { _count: { id_mustahik: 'desc' } },
        take: 5,
      }),
      prisma.dim_mustahik.aggregate({
        _avg: { skoring: true },
        _max: { skoring: true },
        where: { is_active: true, ...dateFilter },
      }),
      prisma.dim_mustahik.count({ where: { is_active: true, ...dateFilter } }),
    ])

    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    const mustahikBaru = await prisma.dim_mustahik.count({
      where: { valid_from: { gte: threeMonthsAgo }, is_active: true, ...dateFilter },
    })

    return NextResponse.json({
      total,
      period: { from: from || null, to: to || null },
      sebaranKategori,
      insights: {
        gender_stats: sebaranGender,
        top_locations: sebaranWilayah,
        avg_score: agregatSkor._avg.skoring ? Number(agregatSkor._avg.skoring).toFixed(2) : 0,
        max_score: agregatSkor._max.skoring ? Number(agregatSkor._max.skoring).toFixed(2) : 0,
        new_registrations_3m: mustahikBaru,
      },
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}