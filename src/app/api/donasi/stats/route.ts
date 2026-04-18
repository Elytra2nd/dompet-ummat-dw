import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const aggregateDonasi = await prisma.fact_donasi.aggregate({
      _sum: {
        nominal_valid: true,
      },
    })

    const totalDonatur = await prisma.dim_donatur.count()

    const totalUang = aggregateDonasi?._sum?.nominal_valid
      ? Number(aggregateDonasi._sum.nominal_valid)
      : 0

    return NextResponse.json({
      totalDonasi: totalUang,
      jumlahDonatur: totalDonatur,
      targetBulanan: 100000000,
      pertumbuhan: 15.4,
    })
  } catch (error: any) {
    console.error('STATS_ERROR:', error)
    return NextResponse.json(
      {
        error: 'Gagal memuat statistik',
        details: error.message,
      },
      { status: 500 },
    )
  }
}