import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateRFM } from '@/lib/ml/rfm'
import { getSegmentConfig } from '@/lib/constants-segmentasi'
import type { RFMInput } from '@/lib/ml/rfm'

/**
 * GET /api/segmentasi/donatur?segment=champions&page=1&limit=20
 * =============================================================
 * Ambil daftar donatur untuk segmen tertentu.
 * Jika segment tidak diberikan, return semua donatur dengan segment-nya.
 */
export async function GET(request: NextRequest) {
  let conn
  try {
    const { searchParams } = new URL(request.url)
    const segmentFilter = searchParams.get('segment') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    conn = await db.getConnection()

    // Query data RFM
    const rows = await conn.query(`
      SELECT
        d.sk_donatur,
        d.id_donatur,
        d.nama_lengkap,
        d.tipe,
        d.kontak_utama,
        MAX(dd.tanggal) AS last_donation_date,
        COUNT(f.sk_fakta_donasi) AS total_transactions,
        COALESCE(SUM(f.nominal_valid), 0) AS total_amount
      FROM fact_donasi f
      JOIN dim_donatur d ON f.sk_donatur = d.sk_donatur
      JOIN dim_date dd ON f.sk_tgl_bersih = dd.sk_date
      WHERE d.sk_donatur > 0
        AND d.is_active = 1
        AND f.nominal_valid > 0
      GROUP BY d.sk_donatur, d.id_donatur, d.nama_lengkap, d.tipe, d.kontak_utama
      HAVING total_transactions >= 1
      ORDER BY total_amount DESC
    `)

    if (!rows || rows.length === 0) {
      return NextResponse.json({ donatur: [], total: 0, page, limit })
    }

    // Transform + hitung RFM
    const rfmInput: RFMInput[] = rows.map((row: any) => ({
      sk_donatur: Number(row.sk_donatur),
      id_donatur: String(row.id_donatur),
      nama_lengkap: String(row.nama_lengkap || 'Tanpa Nama'),
      last_donation_date: row.last_donation_date
        ? new Date(row.last_donation_date).toISOString()
        : new Date().toISOString(),
      total_transactions: Number(row.total_transactions),
      total_amount: Number(row.total_amount),
    }))

    const { results } = calculateRFM(rfmInput)

    // Enrich dengan segment labels + extra data
    const enriched = results.map((r, i) => {
      const config = getSegmentConfig(r.segment_key)
      return {
        sk_donatur: r.sk_donatur,
        id_donatur: r.id_donatur,
        nama_lengkap: r.nama_lengkap,
        tipe: rows[i].tipe || 'Individu',
        kontak: rows[i].kontak_utama || '-',
        recency: r.recency,
        frequency: r.frequency,
        monetary: r.monetary,
        r_score: r.r_score,
        f_score: r.f_score,
        m_score: r.m_score,
        rfm_score: r.rfm_score,
        segment_key: r.segment_key,
        segment_label: config.label,
      }
    })

    // Filter by segment if provided
    const filtered = segmentFilter
      ? enriched.filter(d => d.segment_key === segmentFilter)
      : enriched

    // Paginate
    const total = filtered.length
    const start = (page - 1) * limit
    const paginated = filtered.slice(start, start + limit)

    return NextResponse.json({
      donatur: paginated,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    })
  } catch (error: any) {
    console.error('SEGMENTASI_DONATUR_ERROR:', error)
    return NextResponse.json(
      { error: 'Gagal memuat daftar donatur', details: error.message },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}
