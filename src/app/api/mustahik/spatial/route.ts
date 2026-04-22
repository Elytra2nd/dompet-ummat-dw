import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  let conn

  try {
    conn = await db.getConnection()

    const searchParams = request.nextUrl.searchParams
    const level = searchParams.get('level') || 'kabupaten'
    const kabupaten = searchParams.get('kabupaten')
    const kecamatan = searchParams.get('kecamatan')

    let labelField = 'dl.kabupaten_kota'
    let groupBy = 'dl.kabupaten_kota'
    let where = `WHERE dl.provinsi = 'Kalimantan Barat'`
    const params: string[] = []

    if (level === 'kecamatan') {
      labelField = 'dl.kecamatan'
      groupBy = 'dl.kecamatan'
      if (kabupaten) {
        where += ' AND dl.kabupaten_kota = ?'
        params.push(kabupaten)
      }
    }

    if (level === 'desa') {
      labelField = 'dl.desa_kelurahan'
      groupBy = 'dl.desa_kelurahan'
      if (kabupaten) {
        where += ' AND dl.kabupaten_kota = ?'
        params.push(kabupaten)
      }
      if (kecamatan) {
        where += ' AND dl.kecamatan = ?'
        params.push(kecamatan)
      }
    }

    const rows = await conn.query(
      `
      SELECT
        COALESCE(${labelField}, 'Tidak Diketahui') AS wilayah,
        COUNT(dm.sk_mustahik) AS jumlahMustahik
      FROM dim_mustahik dm
      LEFT JOIN dim_lokasi dl
        ON dm.sk_lokasi = dl.sk_lokasi
      ${where}
      GROUP BY ${groupBy}
      ORDER BY jumlahMustahik DESC
      `
      ,
      params
    )

    return NextResponse.json({
      level,
      kabupaten: kabupaten || null,
      kecamatan: kecamatan || null,
      data: (rows || []).map((row: any) => ({
        wilayah: row.wilayah,
        jumlahMustahik: Number(row.jumlahMustahik) || 0,
      })),
    })
  } catch (error: any) {
    console.error('API /api/mustahik/spatial error:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil agregasi spasial mustahik', detail: error.message },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}