import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RawProgramRow {
  program?: string | null
  jumlahTransaksi?: string | number | null
  totalDonasi?: string | number | null
}

interface FormattedProgramData {
  program: string
  jumlahTransaksi: number
  totalDonasi: number
}

function normalizeRows(result: any): RawProgramRow[] {
  if (Array.isArray(result?.[0])) return result[0] as RawProgramRow[]
  if (Array.isArray(result)) return result as RawProgramRow[]
  if (Array.isArray(result?.rows)) return result.rows as RawProgramRow[]
  return []
}

export async function GET(request: NextRequest) {
  let conn: any

  try {
    const searchParams = request.nextUrl.searchParams

    const filterType = searchParams.get('filterType') || 'none'
    const grain = searchParams.get('grain') || 'year'

    const startYear = searchParams.get('startYear')
    const endYear = searchParams.get('endYear')
    const startMonth = searchParams.get('startMonth')
    const endMonth = searchParams.get('endMonth')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClauses: string[] = []
    const queryParams: any[] = []

    if (filterType === 'year') {
      if (!startYear || !endYear) {
        return NextResponse.json(
          {
            error: 'Parameter tahun tidak lengkap',
            detail: 'startYear dan endYear wajib diisi untuk filterType=year',
          },
          { status: 400 }
        )
      }

      whereClauses.push('YEAR(sk_tgl_bersih) BETWEEN ? AND ?')
      queryParams.push(startYear, endYear)
    }

    if (filterType === 'month') {
      if (!startMonth || !endMonth) {
        return NextResponse.json(
          {
            error: 'Parameter bulan tidak lengkap',
            detail: 'startMonth dan endMonth wajib diisi untuk filterType=month',
          },
          { status: 400 }
        )
      }

      whereClauses.push("DATE_FORMAT(sk_tgl_bersih, '%Y-%m') BETWEEN ? AND ?")
      queryParams.push(startMonth, endMonth)
    }

    if (filterType === 'day') {
      if (!startDate || !endDate) {
        return NextResponse.json(
          {
            error: 'Parameter tanggal tidak lengkap',
            detail: 'startDate dan endDate wajib diisi untuk filterType=day',
          },
          { status: 400 }
        )
      }

      whereClauses.push('DATE(sk_tgl_bersih) BETWEEN ? AND ?')
      queryParams.push(startDate, endDate)
    }

    conn = await db.getConnection()

    const sql = `
      SELECT
        COALESCE(dp.program_induk, 'Tidak Diketahui') AS program,
        COUNT(fd.sk_fakta_donasi) AS jumlahTransaksi,
        COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
      FROM fact_donasi fd
      LEFT JOIN dim_program_donasi dp
        ON fd.sk_program_donasi = dp.sk_program_donasi
      ${whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''}
      GROUP BY dp.program_induk
      ORDER BY totalDonasi DESC
    `

    const result = await conn.query(sql, queryParams)
    const rows = normalizeRows(result)

    const data: FormattedProgramData[] = rows.map((row) => ({
      program: row.program ?? 'Tidak Diketahui',
      jumlahTransaksi: Number(row.jumlahTransaksi) || 0,
      totalDonasi: Number(row.totalDonasi) || 0,
    }))

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('API /api/donasi/program error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        error: 'Gagal mengambil distribusi program donasi',
        detail: message,
      },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}