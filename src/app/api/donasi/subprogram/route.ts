import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

interface RawSubProgramRow {
  sub_program?: string | null
  program?: string | null
  jumlahTransaksi?: string | number | null
  totalDonasi?: string | number | null
}

interface FormattedSubProgramData {
  sub_program: string
  jumlahTransaksi: number
  totalDonasi: number
}

const PARENT_MAP = {
  sosial: 'Sosial Kemanusiaan',
  dakwah: 'Dakwah & Advokasi',
  pendidikan: 'Pendidikan',
} as const

type ParentKey = keyof typeof PARENT_MAP

function normalizeRows(result: any): RawSubProgramRow[] {
  if (Array.isArray(result?.[0])) return result[0] as RawSubProgramRow[]
  if (Array.isArray(result)) return result as RawSubProgramRow[]
  if (Array.isArray(result?.rows)) return result.rows as RawSubProgramRow[]
  return []
}

export async function GET(request: NextRequest) {
  let conn: any

  try {
    const searchParams = request.nextUrl.searchParams

    const parentKey = searchParams.get('parent') as ParentKey | null
    const filterType = searchParams.get('filterType') || 'none'
    const grain = searchParams.get('grain') || 'year'

    const startYear = searchParams.get('startYear')
    const endYear = searchParams.get('endYear')
    const startMonth = searchParams.get('startMonth')
    const endMonth = searchParams.get('endMonth')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!parentKey || !(parentKey in PARENT_MAP)) {
      return NextResponse.json(
        {
          error: 'Nilai parent tidak valid',
          detail: `Gunakan salah satu dari: ${Object.keys(PARENT_MAP).join(', ')}`,
        },
        { status: 400 }
      )
    }

    const parent = PARENT_MAP[parentKey]

    const whereClauses: string[] = ['dp.program_induk = ?']
    const queryParams: any[] = [parent]

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
        COALESCE(dp.sub_program, 'Tidak Diketahui') AS sub_program,
        COUNT(*) AS jumlahTransaksi,
        COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
      FROM fact_donasi fd
      LEFT JOIN dim_program_donasi dp
        ON fd.sk_program_donasi = dp.sk_program_donasi
      WHERE ${whereClauses.join(' AND ')}
      GROUP BY dp.sub_program
      ORDER BY totalDonasi DESC
    `

    const result = await conn.query(sql, queryParams)
    const rows = normalizeRows(result)

    const data: FormattedSubProgramData[] = rows.map((row) => ({
      sub_program: row.sub_program ?? row.program ?? 'Tidak Diketahui',
      jumlahTransaksi: Number(row.jumlahTransaksi) || 0,
      totalDonasi: Number(row.totalDonasi) || 0,
    }))

    return NextResponse.json({
      success: true,
      parentKey,
      parent,
      filterType,
      grain,
      total: data.length,
      data,
    })
  } catch (error: unknown) {
    console.error('API /api/donasi/subprogram error:', error)

    const detail =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil distribusi sub program donasi',
        detail,
      },
      { status: 500 }
    )
  } finally {
    if (conn) {
      try {
        conn.release()
      } catch {}
    }
  }
}