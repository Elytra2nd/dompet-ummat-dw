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

    // --- FIX: Use $queryRaw tagged templates (safe from SQL injection) ---
    let rows: RawProgramRow[]

    if (filterType === 'year' && startYear && endYear) {
      rows = await prisma.$queryRaw<RawProgramRow[]>`
        SELECT
          COALESCE(dp.program_induk, 'Tidak Diketahui') AS program,
          COUNT(fd.sk_fakta_donasi) AS jumlahTransaksi,
          COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
        FROM fact_donasi fd
        LEFT JOIN dim_program_donasi dp ON fd.sk_program_donasi = dp.sk_program_donasi
        WHERE SUBSTRING(CAST(fd.sk_tgl_bersih AS CHAR), 1, 4) BETWEEN ${startYear} AND ${endYear}
        GROUP BY dp.program_induk ORDER BY totalDonasi DESC
      `
    } else if (filterType === 'month' && startMonth && endMonth) {
      const sMonth = startMonth.replace('-', '')
      const eMonth = endMonth.replace('-', '')
      rows = await prisma.$queryRaw<RawProgramRow[]>`
        SELECT
          COALESCE(dp.program_induk, 'Tidak Diketahui') AS program,
          COUNT(fd.sk_fakta_donasi) AS jumlahTransaksi,
          COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
        FROM fact_donasi fd
        LEFT JOIN dim_program_donasi dp ON fd.sk_program_donasi = dp.sk_program_donasi
        WHERE SUBSTRING(CAST(fd.sk_tgl_bersih AS CHAR), 1, 6) BETWEEN ${sMonth} AND ${eMonth}
        GROUP BY dp.program_induk ORDER BY totalDonasi DESC
      `
    } else if (filterType === 'day' && startDate && endDate) {
      const sDate = startDate.replaceAll('-', '')
      const eDate = endDate.replaceAll('-', '')
      rows = await prisma.$queryRaw<RawProgramRow[]>`
        SELECT
          COALESCE(dp.program_induk, 'Tidak Diketahui') AS program,
          COUNT(fd.sk_fakta_donasi) AS jumlahTransaksi,
          COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
        FROM fact_donasi fd
        LEFT JOIN dim_program_donasi dp ON fd.sk_program_donasi = dp.sk_program_donasi
        WHERE CAST(fd.sk_tgl_bersih AS CHAR) BETWEEN ${sDate} AND ${eDate}
        GROUP BY dp.program_induk ORDER BY totalDonasi DESC
      `
    } else {
      rows = await prisma.$queryRaw<RawProgramRow[]>`
        SELECT
          COALESCE(dp.program_induk, 'Tidak Diketahui') AS program,
          COUNT(fd.sk_fakta_donasi) AS jumlahTransaksi,
          COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
        FROM fact_donasi fd
        LEFT JOIN dim_program_donasi dp ON fd.sk_program_donasi = dp.sk_program_donasi
        GROUP BY dp.program_induk ORDER BY totalDonasi DESC
      `
    }

    // --- MAPPING ---
    const data: FormattedProgramData[] = rows.map((row) => ({
      program: row.program ?? 'Tidak Diketahui',
      jumlahTransaksi: Number(row.jumlahTransaksi) || 0,
      totalDonasi: Number(row.totalDonasi) || 0,
    }))

    return NextResponse.json(data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('API /api/donasi/program error:', msg)
    return NextResponse.json(
      { error: 'Gagal mengambil distribusi program donasi' },
      { status: 500 }
    )
  }
}