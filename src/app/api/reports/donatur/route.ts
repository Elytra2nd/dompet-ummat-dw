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

    // 1. Grouping Berdasarkan Tipe
    const statsPerTipe = await prisma.dim_donatur.groupBy({
      by: ['tipe'],
      _count: { id_donatur: true },
      where: { is_active: true, ...dateFilter }
    })

    const totalRecords = await prisma.dim_donatur.count()
    const activeDonors = await prisma.dim_donatur.count({ where: { is_active: true, ...dateFilter } })
    const historyCount = totalRecords - await prisma.dim_donatur.count({ where: { is_active: true } })

    const korporatCount = await prisma.dim_donatur.count({
      where: { perusahaan: { not: '-' }, is_active: true, ...dateFilter }
    })

    return NextResponse.json({
      total: activeDonors,
      stats: statsPerTipe,
      period: { from: from || null, to: to || null },
      insights: {
        total_historical_changes: historyCount,
        corporate_donors: korporatCount,
        individual_donors: activeDonors - korporatCount,
      },
      segmentasi_persen: activeDonors > 0
        ? statsPerTipe.map(item => ({
            tipe: item.tipe || 'Individu',
            persentase: ((item._count.id_donatur / activeDonors) * 100).toFixed(1)
          }))
        : [],
    })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('DONOR REPORT ERROR:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}