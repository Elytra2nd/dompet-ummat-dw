import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

interface RawYearRow {
  tahun: string
}

export async function GET() {
  try {
    const rows = await prisma.$queryRawUnsafe<RawYearRow[]>(`
      SELECT DISTINCT
        SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 4) AS tahun
      FROM fact_donasi
      WHERE sk_tgl_bersih IS NOT NULL
      ORDER BY tahun ASC
    `)

    const years = rows
      .map((row) => String(row.tahun))
      .filter((year) => /^\d{4}$/.test(year))

    return NextResponse.json({
      years,
      minYear: years[0] ?? null,
      maxYear: years[years.length - 1] ?? null,
    })
  } catch (error: any) {
    console.error('TAHUN_DONASI_ERROR:', error)

    return NextResponse.json(
      {
        error: 'Gagal memuat daftar tahun donasi',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}