import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface RawProgramRow {
  program?: string | null
  jumlahTransaksi: number | bigint
  totalDonasi: number | bigint | string
}

interface FormattedProgramData {
  program: string
  jumlahTransaksi: number
  totalDonasi: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const filterType = searchParams.get('filterType') || 'none'
    const startYear = searchParams.get('startYear')
    const endYear = searchParams.get('endYear')
    const startMonth = searchParams.get('startMonth')
    const endMonth = searchParams.get('endMonth')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const whereClauses: string[] = []
    const queryParams: any[] = []

    // --- LOGIK FILTER (Menyesuaikan sk_tgl_bersih YYYYMMDD) ---
    
    if (filterType === 'year') {
      if (!startYear || !endYear) {
        return NextResponse.json({ error: 'Parameter tahun tidak lengkap' }, { status: 400 })
      }
      whereClauses.push('SUBSTRING(CAST(fd.sk_tgl_bersih AS CHAR), 1, 4) BETWEEN ? AND ?')
      queryParams.push(startYear, endYear)
    }

    if (filterType === 'month') {
      if (!startMonth || !endMonth) {
        return NextResponse.json({ error: 'Parameter bulan tidak lengkap' }, { status: 400 })
      }
      const sMonth = startMonth.replace('-', '')
      const eMonth = endMonth.replace('-', '')
      whereClauses.push('SUBSTRING(CAST(fd.sk_tgl_bersih AS CHAR), 1, 6) BETWEEN ? AND ?')
      queryParams.push(sMonth, eMonth)
    }

    if (filterType === 'day') {
      if (!startDate || !endDate) {
        return NextResponse.json({ error: 'Parameter tanggal tidak lengkap' }, { status: 400 })
      }
      const sDate = startDate.replaceAll('-', '')
      const eDate = endDate.replaceAll('-', '')
      whereClauses.push('CAST(fd.sk_tgl_bersih AS CHAR) BETWEEN ? AND ?')
      queryParams.push(sDate, eDate)
    }

    // --- CONSTRUCT QUERY ---
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''
    
    const sql = `
      SELECT
        COALESCE(dp.program_induk, 'Tidak Diketahui') AS program,
        COUNT(fd.sk_fakta_donasi) AS jumlahTransaksi,
        COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
      FROM fact_donasi fd
      LEFT JOIN dim_program_donasi dp
        ON fd.sk_program_donasi = dp.sk_program_donasi
      ${whereSql}
      GROUP BY dp.program_induk
      ORDER BY totalDonasi DESC
    `

    // --- EXECUTE ---
    const rows = await prisma.$queryRawUnsafe<RawProgramRow[]>(sql, ...queryParams)

    // --- MAPPING ---
    const data: FormattedProgramData[] = rows.map((row) => ({
      program: row.program ?? 'Tidak Diketahui',
      jumlahTransaksi: Number(row.jumlahTransaksi) || 0,
      totalDonasi: Number(row.totalDonasi) || 0,
    }))

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('API /api/donasi/program error:', error)
    return NextResponse.json(
      {
        error: 'Gagal mengambil distribusi program donasi',
        detail: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}