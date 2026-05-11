import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  let conn

  try {
    conn = await db.getConnection()

    const [mustahikBaruRows, domainProgramRows, kategoriPmRows] = await Promise.all([

      // Mustahik baru dalam 30 hari terakhir
      conn.query(`
        SELECT COUNT(*) AS jumlah
        FROM dim_mustahik
        WHERE is_active = 1
          AND valid_from >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      `),

      // Top 3 domain program dari fact_penyaluran
      conn.query(`
        SELECT
          domain_program AS nama,
          COUNT(*) AS jumlah
        FROM fact_penyaluran
        WHERE domain_program IS NOT NULL
        GROUP BY domain_program
        ORDER BY jumlah DESC
        LIMIT 3
      `),

      // Top 3 kategori PM dari dim_mustahik
      conn.query(`
        SELECT
          kategori_pm AS nama,
          COUNT(*) AS jumlah
        FROM dim_mustahik
        WHERE is_active = 1
          AND kategori_pm IS NOT NULL
        GROUP BY kategori_pm
        ORDER BY jumlah DESC
        LIMIT 3
      `),
    ])

    const mustahikBaru = Number((mustahikBaruRows as any[])[0]?.jumlah ?? 0)

    const domainList = (domainProgramRows as any[]).map((r, i) => ({
      label: String(r.nama).replace(/_/g, ' '),
      jumlah: Number(r.jumlah) || 0,
      rank: i + 1,
    }))

    const kategoriList = (kategoriPmRows as any[]).map((r, i) => ({
      label: String(r.nama).replace(/_/g, ' '),
      jumlah: Number(r.jumlah) || 0,
      rank: i + 1,
    }))

    return NextResponse.json({
      mustahikBaru,
      programTerbanyak: domainList.length > 0
        ? { nama: domainList[0].label, jumlah: domainList[0].jumlah, ranking: domainList }
        : null,
      golonganTerbanyak: kategoriList.length > 0
        ? { nama: kategoriList[0].label, jumlah: kategoriList[0].jumlah, ranking: kategoriList }
        : null,
    })
  } catch (error: any) {
    console.error('[spasial-stats] Error:', error)
    return NextResponse.json(
      { error: 'Gagal memuat statistik spasial', detail: error?.message },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}