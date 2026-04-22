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
    const parentKey = request.nextUrl.searchParams.get('parent') as ParentKey | null

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

    conn = await db.getConnection()

    const result = await conn.query(
      `
      SELECT
        COALESCE(dp.sub_program, 'Tidak Diketahui') AS sub_program,
        COUNT(*) AS jumlahTransaksi,
        COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
      FROM fact_donasi fd
      LEFT JOIN dim_program_donasi dp
        ON fd.sk_program_donasi = dp.sk_program_donasi
      WHERE dp.program_induk = ?
      GROUP BY dp.sub_program
      ORDER BY totalDonasi DESC
      `,
      [parent]
    )

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
      total: data.length,
      data,
    })
  } catch (error: unknown) {
    console.error('API /api/donasi/sub-program error:', error)

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
