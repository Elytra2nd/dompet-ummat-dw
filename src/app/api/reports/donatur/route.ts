import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Grouping Berdasarkan Tipe (Existing)
    const statsPerTipe = await prisma.dim_donatur.groupBy({
      by: ['tipe'],
      _count: { id_donatur: true },
      where: { is_active: true }
    })

    // 2. INSIGHT BARU: Tracking Perubahan Data (SCD Type 2 Insight)
    // Menghitung berapa banyak donatur yang datanya pernah berubah (histori)
    const totalRecords = await prisma.dim_donatur.count()
    const activeDonors = await prisma.dim_donatur.count({ where: { is_active: true } })
    const historyCount = totalRecords - activeDonors

    // 3. INSIGHT BARU: Analisis Donatur Baru (Acquisition Trend)
    // Melihat donatur yang bergabung dalam 6 bulan terakhir berdasarkan valid_from
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const donaturBaru = await prisma.dim_donatur.count({
      where: {
        valid_from: { gte: sixMonthsAgo },
        is_active: true
      }
    })

    // 4. INSIGHT BARU: Segmentasi Berdasarkan Perusahaan (Korporat vs Individu)
    const korporatCount = await prisma.dim_donatur.count({
      where: {
        perusahaan: { not: '-' },
        is_active: true
      }
    })

    return NextResponse.json({
      total: activeDonors,
      stats: statsPerTipe,
      insights: {
        total_historical_changes: historyCount, // Menunjukkan efektivitas SCD Type 2
        new_donors_6_months: donaturBaru,
        corporate_donors: korporatCount,
        individual_donors: activeDonors - korporatCount
      },
      // Komparasi Persentase untuk Dashboard
      segmentasi_persen: statsPerTipe.map(item => ({
        tipe: item.tipe || 'Individu',
        persentase: ((item._count.id_donatur / activeDonors) * 100).toFixed(1)
      }))
    })
  } catch (error: any) {
    console.error("DONOR REPORT ERROR:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}