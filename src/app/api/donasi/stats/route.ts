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
    
    // Tambahan: Query untuk jumlah mustahik dan dana tersalurkan
    const totalMustahik = await prisma.dim_mustahik.count()
    
    const aggregatePenyaluran = await prisma.fact_penyaluran.aggregate({
      _sum: {
        dana_tersalur: true,
      },
    })

    const totalUang = aggregateDonasi?._sum?.nominal_valid
      ? Number(aggregateDonasi._sum.nominal_valid)
      : 0
      
    const totalTersalur = aggregatePenyaluran?._sum?.dana_tersalur
      ? Number(aggregatePenyaluran._sum.dana_tersalur)
      : 0

    return NextResponse.json({
      totalDonasi: totalUang,
      jumlahDonatur: totalDonatur,
      jumlahMustahik: totalMustahik,
      danaTersalur: totalTersalur,
      targetBulanan: 100000000,
      pertumbuhan: 15.4, // Bisa dihitung dinamis nanti
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