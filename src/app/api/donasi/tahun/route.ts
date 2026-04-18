import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const currentYear = new Date().getFullYear()

    const rows = await prisma.$queryRaw<{ tahun: unknown }[]>`
      SELECT DISTINCT SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 4) AS tahun
      FROM fact_donasi
      WHERE sk_tgl_bersih IS NOT NULL
      HAVING CAST(tahun AS SIGNED) BETWEEN 2011 AND ${currentYear}
      ORDER BY tahun DESC
    `

    const data = rows.map((row) => String(row.tahun))

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('TAHUN_DONASI_ERROR:', error)

    return NextResponse.json(
      {
        error: 'Gagal memuat daftar tahun',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}