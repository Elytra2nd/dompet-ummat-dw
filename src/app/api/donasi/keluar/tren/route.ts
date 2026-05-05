import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Feb', '03': 'Mar', '04': 'Apr',
  '05': 'Mei', '06': 'Jun', '07': 'Jul', '08': 'Agu',
  '09': 'Sep', '10': 'Okt', '11': 'Nov', '12': 'Des',
}

type FilterType = 'none' | 'year' | 'month' | 'day'

interface RawTrendRow {
  tahun: string
  bulan?: string | null
  hari?: string | null
  total: number | string | bigint
}

function normalizeMonthKey(value: string) {
  return value.replace('-', '')
}

function normalizeDateKey(value: string) {
  return value.replaceAll('-', '')
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const filterType = (searchParams.get('filterType') || 'none') as FilterType
  const startYear = searchParams.get('startYear')
  const endYear = searchParams.get('endYear')
  const startMonth = searchParams.get('startMonth')
  const endMonth = searchParams.get('endMonth')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const currentYear = String(new Date().getFullYear())

  try {
    let rows: RawTrendRow[] = []

    if (filterType === 'none' || filterType === 'year') {
      const yearStart = filterType === 'none' ? '2011' : startYear
      const yearEnd = filterType === 'none' ? currentYear : endYear

      if (!yearStart || !yearEnd) {
        return NextResponse.json({ error: 'Range tahun tidak lengkap' }, { status: 400 })
      }

      rows = await prisma.$queryRaw<RawTrendRow[]>`
        SELECT
          SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 1, 4) AS tahun,
          SUM(dana_tersalur) AS total
        FROM fact_penyaluran
        WHERE SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 1, 4) BETWEEN ${yearStart} AND ${yearEnd}
        GROUP BY SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 1, 4)
        ORDER BY tahun ASC
      `
    }

    if (filterType === 'month') {
      const startMonthKey = startMonth ? normalizeMonthKey(startMonth) : null
      const endMonthKey = endMonth ? normalizeMonthKey(endMonth) : null

      if (!startMonthKey || !endMonthKey) {
        return NextResponse.json({ error: 'Range bulan tidak lengkap' }, { status: 400 })
      }

      rows = await prisma.$queryRaw<RawTrendRow[]>`
        SELECT
          SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 1, 4) AS tahun,
          SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 5, 2) AS bulan,
          SUM(dana_tersalur) AS total
        FROM fact_penyaluran
        WHERE SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 1, 6) BETWEEN ${startMonthKey} AND ${endMonthKey}
        GROUP BY 1, 2
        ORDER BY tahun ASC, bulan ASC
      `
    }

    if (filterType === 'day') {
      const startDateKey = startDate ? normalizeDateKey(startDate) : null
      const endDateKey = endDate ? normalizeDateKey(endDate) : null

      if (!startDateKey || !endDateKey) {
        return NextResponse.json({ error: 'Range hari tidak lengkap' }, { status: 400 })
      }

      rows = await prisma.$queryRaw<RawTrendRow[]>`
        SELECT
          SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 1, 4) AS tahun,
          SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 5, 2) AS bulan,
          SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 7, 2) AS hari,
          SUM(dana_tersalur) AS total
        FROM fact_penyaluran
        WHERE SUBSTRING(CAST(sk_tgl_disalurkan AS CHAR), 1, 8) BETWEEN ${startDateKey} AND ${endDateKey}
        GROUP BY 1, 2, 3
        ORDER BY tahun ASC, bulan ASC, hari ASC
      `
    }

    const data = rows.map((row) => {
      const tahun = String(row.tahun)
      const bulan = row.bulan ? String(row.bulan) : null
      const hari = row.hari ? String(row.hari) : null

      let label = tahun

      if (filterType === 'month' && bulan) {
        label = `${MONTH_LABELS[bulan] ?? bulan} ${tahun}`
      }

      if (filterType === 'day' && bulan && hari) {
        label = `${hari} ${MONTH_LABELS[bulan] ?? bulan} ${tahun}`
      }

      return {
        label,
        year: tahun,
        month: bulan ? (MONTH_LABELS[bulan] ?? bulan) : null,
        monthValue: bulan,
        day: hari,
        date: bulan && hari ? `${tahun}-${bulan}-${hari}` : null,
        total: Number(row.total ?? 0),
      }
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('TREN_PENYALURAN_ERROR:', error)
    return NextResponse.json(
      { error: 'Gagal memuat tren penyaluran', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}
