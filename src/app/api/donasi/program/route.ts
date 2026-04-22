import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  let conn

  try {
    conn = await db.getConnection()

    const programRows = await conn.query(`
      SELECT
        COALESCE(dp.program_induk, 'Tidak Diketahui') AS program,
        COUNT(fd.sk_fakta_donasi) AS jumlahTransaksi,
        COALESCE(SUM(fd.nominal_valid), 0) AS totalDonasi
      FROM fact_donasi fd
      LEFT JOIN dim_program_donasi dp
        ON fd.sk_program_donasi = dp.sk_program_donasi
      GROUP BY dp.program_induk
      ORDER BY totalDonasi DESC
    `)

    const data = (programRows || []).map((row: any) => ({
      program: row.program,
      jumlahTransaksi: Number(row.jumlahTransaksi) || 0,
      totalDonasi: Number(row.totalDonasi) || 0,
    }))

    return NextResponse.json(data)
  } catch (error) {
    console.error('API /api/donasi/program error:', error)

    return NextResponse.json(
      {
        error: 'Gagal mengambil distribusi program donasi',
        detail: (error as any).message,
      },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}