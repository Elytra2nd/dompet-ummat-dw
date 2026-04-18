import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan',
  '02': 'Feb',
  '03': 'Mar',
  '04': 'Apr',
  '05': 'Mei',
  '06': 'Jun',
  '07': 'Jul',
  '08': 'Agu',
  '09': 'Sep',
  '10': 'Okt',
  '11': 'Nov',
  '12': 'Des',
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') || new Date().getFullYear().toString()

  try {
    const rows = await prisma.$queryRaw<
      { periode: string; total: number | bigint | null }[]
    >`
      SELECT
        LEFT(CAST(sk_tgl_bersih AS CHAR), 6) AS periode,
        SUM(nominal_valid) AS total
      FROM fact_donasi
      WHERE LEFT(CAST(sk_tgl_bersih AS CHAR), 4) = ${year}
      GROUP BY LEFT(CAST(sk_tgl_bersih AS CHAR), 6)
      ORDER BY periode ASC
    `

    const data = rows.map((row) => {
      const monthNumber = row.periode.slice(4, 6)
      return {
        month: MONTH_LABELS[monthNumber] ?? monthNumber,
        year,
        total: Number(row.total ?? 0),
      }
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('TREN_DONASI_ERROR:', error)
    return NextResponse.json(
      {
        error: 'Gagal memuat tren donasi',
        details: error.message,
      },
      { status: 500 }
    )
  }
}