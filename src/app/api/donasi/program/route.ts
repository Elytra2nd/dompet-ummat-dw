import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Interface untuk struktur mentah dari database
interface RawProgramRow {
  program: string;
  jumlahTransaksi: string | number;
  totalDonasi: string | number;
}

// Interface untuk hasil akhir (setelah di-map) agar lebih akurat
interface FormattedProgramData {
  program: string;
  jumlahTransaksi: number;
  totalDonasi: number;
}

export async function GET() {
  let conn

  try {
    conn = await db.getConnection()

    // Ambil data dengan type assertion agar TypeScript tidak komplain di .map
    const [programRows] = await conn.query(`
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

    // Kita asumsikan programRows adalah array dari RawProgramRow
    const data: FormattedProgramData[] = (programRows as RawProgramRow[] || []).map((row) => ({
      program: row.program,
      jumlahTransaksi: Number(row.jumlahTransaksi) || 0,
      totalDonasi: Number(row.totalDonasi) || 0,
    }))

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('API /api/donasi/program error:', error)
    
    // Penanganan pesan error yang aman
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