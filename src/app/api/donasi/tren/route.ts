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

type FilterType = 'none' | 'year' | 'month' | 'day'
type Grain = 'year' | 'month' | 'day'

interface RawTrendRow {
  tahun: string
  bulan?: string | null
  hari?: string | null
  total: unknown
}

function normalizeMonthKey(value: string) {
  return value.replace('-', '') // 2024-01 -> 202401
}

function normalizeDateKey(value: string) {
  return value.replaceAll('-', '') // 2024-01-15 -> 20240115
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const filterType = (searchParams.get('filterType') || 'none') as FilterType
  const grain = (searchParams.get('grain') || 'year') as Grain

  const startYear = searchParams.get('startYear')
  const endYear = searchParams.get('endYear')

  const startMonth = searchParams.get('startMonth')
  const endMonth = searchParams.get('endMonth')

  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const currentYear = String(new Date().getFullYear())

  try {
    let query = ''
    let params: (string | number)[] = []

    if (filterType === 'none' || filterType === 'year') {
      const yearStart = filterType === 'none' ? '2011' : startYear
      const yearEnd = filterType === 'none' ? currentYear : endYear

      if (!yearStart || !yearEnd) {
        return NextResponse.json(
          { error: 'Range tahun tidak lengkap' },
          { status: 400 }
        )
      }

      if (grain === 'year') {
        query = `
          SELECT
            SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 4) AS tahun,
            SUM(nominal_valid) AS total
          FROM fact_donasi
          WHERE SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 4) BETWEEN ? AND ?
          GROUP BY SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 4)
          ORDER BY tahun ASC
        `
        params = [yearStart, yearEnd]
      } else {
        return NextResponse.json(
          { error: 'Filter year/none hanya mendukung grain year' },
          { status: 400 }
        )
      }
    }

    if (filterType === 'month') {
      const startMonthKey = startMonth ? normalizeMonthKey(startMonth) : null
      const endMonthKey = endMonth ? normalizeMonthKey(endMonth) : null

      if (!startMonthKey || !endMonthKey) {
        return NextResponse.json(
          { error: 'Range bulan tidak lengkap' },
          { status: 400 }
        )
      }

      query = `
        SELECT
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 4) AS tahun,
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 5, 2) AS bulan,
          SUM(nominal_valid) AS total
        FROM fact_donasi
        WHERE SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 6) BETWEEN ? AND ?
        GROUP BY
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 4),
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 5, 2)
        ORDER BY tahun ASC, bulan ASC
      `
      params = [startMonthKey, endMonthKey]
    }

    if (filterType === 'day') {
      const startDateKey = startDate ? normalizeDateKey(startDate) : null
      const endDateKey = endDate ? normalizeDateKey(endDate) : null

      if (!startDateKey || !endDateKey) {
        return NextResponse.json(
          { error: 'Range hari tidak lengkap' },
          { status: 400 }
        )
      }

      query = `
        SELECT
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 4) AS tahun,
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 5, 2) AS bulan,
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 7, 2) AS hari,
          SUM(nominal_valid) AS total
        FROM fact_donasi
        WHERE SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 8) BETWEEN ? AND ?
        GROUP BY
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 1, 4),
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 5, 2),
          SUBSTRING(CAST(sk_tgl_bersih AS CHAR), 7, 2)
        ORDER BY tahun ASC, bulan ASC, hari ASC
      `
      params = [startDateKey, endDateKey]
    }

    const rows = await prisma.$queryRawUnsafe<RawTrendRow[]>(query, ...params)

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
    console.error('TREN_DONASI_ERROR:', error)
    return NextResponse.json(
      {
        error: 'Gagal memuat tren donasi',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}