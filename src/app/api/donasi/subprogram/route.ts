import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

interface RawSubProgramRow {
  sub_program?: string | null
  jumlahTransaksi: number | bigint
  totalDonasi: number | bigint | string
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

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const parentKey = searchParams.get('parent') as ParentKey | null
    const filterType = searchParams.get('filterType') || 'none'
    
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

    // --- 1. MEMBANGUN QUERY STRING ---
    let query = `
      SELECT
        COALESCE(dp.sub_program, 'Tidak Diketahui') AS sub_program,
        COUNT(*) AS jumlahTransaksi,
        COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
      FROM fact_donasi fd
      LEFT JOIN dim_program_donasi dp
        ON fd.sk_program_donasi = dp.sk_program_donasi
      WHERE dp.program_induk = ?
    `
    const params: any[] = [parent]

    // --- 2. MENAMBAHKAN FILTER SECARA DINAMIS ---
    if (filterType === 'year' && startYear && endYear) {
      query += ` AND SUBSTRING(CAST(fd.sk_tgl_bersih AS CHAR), 1, 4) BETWEEN ? AND ?`
      params.push(startYear, endYear)
    } 
    else if (filterType === 'month' && startMonth && endMonth) {
      const sMonth = startMonth.replace('-', '')
      const eMonth = endMonth.replace('-', '')
      query += ` AND SUBSTRING(CAST(fd.sk_tgl_bersih AS CHAR), 1, 6) BETWEEN ? AND ?`
      params.push(sMonth, eMonth)
    } 
    else if (filterType === 'day' && startDate && endDate) {
      const sDate = startDate.replaceAll('-', '')
      const eDate = endDate.replaceAll('-', '')
      query += ` AND CAST(fd.sk_tgl_bersih AS CHAR) BETWEEN ? AND ?`
      params.push(sDate, eDate)
    }

    query += ` GROUP BY dp.sub_program ORDER BY totalDonasi DESC`

    // --- 3. EKSEKUSI QUERY ---
    // Menggunakan $queryRawUnsafe agar tidak perlu import { Prisma }
    const rows = await prisma.$queryRawUnsafe<RawSubProgramRow[]>(query, ...params)

    // --- 4. MAPPING DATA ---
    const data: FormattedSubProgramData[] = rows.map((row) => ({
      sub_program: row.sub_program ?? 'Tidak Diketahui',
      jumlahTransaksi: Number(row.jumlahTransaksi),
      totalDonasi: Number(row.totalDonasi),
    }))

    return NextResponse.json({
      success: true,
      parentKey,
      parent,
      filterType,
      total: data.length,
      data,
    })
  } catch (error: unknown) {
    console.error('API /api/donasi/subprogram error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal mengambil distribusi sub program donasi',
        detail: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}