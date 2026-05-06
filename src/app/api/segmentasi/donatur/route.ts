import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchRFMData } from '@/lib/segmentasi-query'
import { calculateRFM } from '@/lib/ml/rfm'
import { getSegmentConfig } from '@/lib/constants-segmentasi'
import { CACHE_TTL, isCacheValid } from '@/lib/constants-cache'

// ---- Types ----
interface EnrichedDonatur {
  sk_donatur: number
  id_donatur: string
  nama_lengkap: string
  tipe: string
  kontak: string
  recency: number
  frequency: number
  monetary: number
  r_score: number
  f_score: number
  m_score: number
  rfm_score: number
  segment_key: string
  segment_label: string
}

// ---- Server-side RFM Cache (TTL 5 menit) ----
let rfmCache: { data: EnrichedDonatur[]; timestamp: number } | null = null

type SortKey = 'recency' | 'frequency' | 'monetary' | 'rfm_score' | 'nama_lengkap'

/**
 * GET /api/segmentasi/donatur
 * ===========================
 * Query params:
 *   - segment      : filter segmen (e.g. "champions")
 *   - page         : halaman (default 1)
 *   - limit        : per halaman (default 20, max 10000)
 *   - search       : cari nama donatur
 *   - sort         : recency|frequency|monetary|rfm_score|nama_lengkap
 *   - order        : asc | desc
 *   - min_monetary : filter donasi minimum (Rp)
 *   - max_monetary : filter donasi maksimum (Rp)
 *   - max_recency  : filter max hari sejak donasi terakhir
 */
export async function GET(request: NextRequest) {
  let conn
  try {
    const { searchParams } = new URL(request.url)
    const segmentFilter = searchParams.get('segment') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const search = (searchParams.get('search') || '').trim().toLowerCase()
    const sortKey = (searchParams.get('sort') || '') as SortKey
    const sortOrder = searchParams.get('order') === 'asc' ? 'asc' : 'desc'
    const minMonetary = searchParams.get('min_monetary') ? parseFloat(searchParams.get('min_monetary')!) : null
    const maxMonetary = searchParams.get('max_monetary') ? parseFloat(searchParams.get('max_monetary')!) : null
    const maxRecency = searchParams.get('max_recency') ? parseInt(searchParams.get('max_recency')!) : null

    // Gunakan cache jika masih valid
    let enriched: EnrichedDonatur[]
    const now = Date.now()

    if (rfmCache && isCacheValid(rfmCache.timestamp, CACHE_TTL.SEGMENTASI_DONATUR)) {
      enriched = rfmCache.data
    } else {
      conn = await db.getConnection()

      // Query data RFM (shared query — includeProfile for tipe & kontak)
      const { rows, rfmInput } = await fetchRFMData(conn, { includeProfile: true })

      if (rfmInput.length === 0) {
        return NextResponse.json({ donatur: [], total: 0, page, limit, total_pages: 0 })
      }

      // Hitung RFM
      const { results } = calculateRFM(rfmInput)

      // Enrich dengan segment labels + extra data
      enriched = results.map((r, i) => {
        const config = getSegmentConfig(r.segment_key)
        return {
          sk_donatur: r.sk_donatur,
          id_donatur: r.id_donatur,
          nama_lengkap: r.nama_lengkap,
          tipe: rows[i]?.tipe || 'Individu',
          kontak: rows[i]?.kontak_utama || '-',
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

      // Simpan ke cache
      rfmCache = { data: enriched, timestamp: now }
    }

    // Filter by segment
    let filtered = segmentFilter
      ? enriched.filter(d => d.segment_key === segmentFilter)
      : enriched

    // Server-side search
    if (search) {
      filtered = filtered.filter(d =>
        d.nama_lengkap.toLowerCase().includes(search) ||
        d.id_donatur.toLowerCase().includes(search) ||
        (d.tipe && d.tipe.toLowerCase().includes(search))
      )
    }

    // Advanced filters
    if (minMonetary !== null) filtered = filtered.filter(d => d.monetary >= minMonetary)
    if (maxMonetary !== null) filtered = filtered.filter(d => d.monetary <= maxMonetary)
    if (maxRecency !== null) filtered = filtered.filter(d => d.recency <= maxRecency)

    // Server-side sort
    if (sortKey && ['recency', 'frequency', 'monetary', 'rfm_score', 'nama_lengkap'].includes(sortKey)) {
      filtered = [...filtered].sort((a, b) => {
        if (sortKey === 'nama_lengkap') {
          const cmp = a.nama_lengkap.localeCompare(b.nama_lengkap, 'id')
          return sortOrder === 'asc' ? cmp : -cmp
        }
        const diff = a[sortKey] - b[sortKey]
        return sortOrder === 'asc' ? diff : -diff
      })
    }

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
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('SEGMENTASI_DONATUR_ERROR:', msg)
    return NextResponse.json(
      { error: 'Gagal memuat daftar donatur' },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}

