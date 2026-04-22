import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  let conn

  try {
    conn = await db.getConnection()

    const searchParams = request.nextUrl.searchParams
    const kabupaten = searchParams.get('kabupaten')
    const kecamatan = searchParams.get('kecamatan')

    let where = `WHERE dl.latitude IS NOT NULL AND dl.longitude IS NOT NULL`
    const params: string[] = []

    if (kabupaten) {
      where += ` AND dl.kabupaten_kota = ?`
      params.push(kabupaten)
    }

    if (kecamatan) {
      where += ` AND dl.kecamatan = ?`
      params.push(kecamatan)
    }

    const rows = await conn.query(
      `
      SELECT
        dm.sk_mustahik,
        dl.kabupaten_kota,
        dl.kecamatan,
        dl.desa_kelurahan,
        dl.latitude,
        dl.longitude
      FROM dim_mustahik dm
      LEFT JOIN dim_lokasi dl
        ON dm.sk_lokasi = dl.sk_lokasi
      ${where}
      LIMIT 3000
      `,
      params
    )

    return NextResponse.json(
      (rows || []).map((row: any) => ({
        id: row.sk_mustahik,
        kabupaten: row.kabupaten_kota,
        kecamatan: row.kecamatan,
        desaKelurahan: row.desa_kelurahan,
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
      }))
    )
  } catch (error: any) {
    console.error('API /api/mustahik/points error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil titik mustahik', detail: error.message },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}