import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchRFMData } from '@/lib/segmentasi-query'
import { calculateRFM, minMaxNormalize } from '@/lib/ml/rfm'
import { runKMeans } from '@/lib/ml/kmeans'
import { silhouetteScore, silhouetteToRating, daviesBouldinIndex, calinskiHarabaszIndex } from '@/lib/ml/evaluation'
import { SEGMENT_CONFIGS, getSegmentConfig } from '@/lib/constants-segmentasi'
import { CACHE_TTL, isCacheValid } from '@/lib/constants-cache'

// ---- Server-side Run Cache ----
let runCache: { result: unknown; timestamp: number } | null = null

/**
 * POST /api/segmentasi/run
 * ========================
 * Trigger analisis segmentasi:
 * 1. Query data donatur + donasi dari TiDB
 * 2. Hitung RFM
 * 3. Normalisasi Min-Max
 * 4. Auto-select K terbaik (Silhouette)
 * 5. Run K-Means
 * 6. Return hasil dalam format user-friendly
 */
export async function POST() {
  // Return dari cache jika masih valid
  if (runCache && isCacheValid(runCache.timestamp, CACHE_TTL.SEGMENTASI_RUN)) {
    return NextResponse.json({ ...(runCache.result as object), from_cache: true })
  }

  let conn
  const startTime = Date.now()
  try {
    conn = await db.getConnection()

    // Step 1: Query data RFM dari Data Warehouse (shared query)
    const { rfmInput } = await fetchRFMData(conn)

    if (rfmInput.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data donatur yang memenuhi syarat' },
        { status: 404 }
      )
    }

    // Step 2: Hitung RFM (sebelumnya Step 3)
    const { results: rfmResults, stats } = calculateRFM(rfmInput)

    // Step 4: Normalisasi untuk clustering
    const rNorm = minMaxNormalize(rfmResults.map(r => r.recency))
    const fNorm = minMaxNormalize(rfmResults.map(r => r.frequency))
    const mNorm = minMaxNormalize(rfmResults.map(r => r.monetary))

    const normalizedData = rfmResults.map((_, i) => [
      rNorm[i], fNorm[i], mNorm[i],
    ])

    // Step 5: Auto-select K terbaik (K=2 sampai K=8)
    let bestK = 3
    let bestSilhouette = -1
    const maxK = Math.min(8, Math.floor(rfmResults.length / 2))

    for (let k = 2; k <= maxK; k++) {
      const clusterResult = runKMeans(normalizedData, k, 300, 5, 42)
      const score = silhouetteScore(normalizedData, clusterResult.labels)
      if (score > bestSilhouette) {
        bestSilhouette = score
        bestK = k
      }
    }

    // Step 6: Run final clustering dengan K terbaik
    const finalCluster = runKMeans(normalizedData, bestK, 300, 10, 42)
    const finalSilhouette = silhouetteScore(normalizedData, finalCluster.labels)
    const finalDBI = daviesBouldinIndex(normalizedData, finalCluster.labels, finalCluster.centroids)
    const finalCHI = calinskiHarabaszIndex(normalizedData, finalCluster.labels, finalCluster.centroids)
    const rating = silhouetteToRating(finalSilhouette)

    // Step 7: Assign segment labels dan merge
    const enrichedResults = rfmResults.map((r, i) => {
      const segConfig = getSegmentConfig(r.segment_key)
      return {
        ...r,
        segment_label: segConfig.label,
        cluster_id: finalCluster.labels[i],
      }
    })

    // Step 8: Build segment summary
    const segmentSummary = Object.keys(SEGMENT_CONFIGS).map(key => {
      const config = SEGMENT_CONFIGS[key]
      const members = enrichedResults.filter(r => r.segment_key === key)
      const totalMonetary = members.reduce((sum, m) => sum + m.monetary, 0)

      const n = members.length
      return {
        key,
        label: config.label,
        count: n,
        percentage: Math.round((n / enrichedResults.length) * 10000) / 100,
        avg_recency: n > 0 ? Math.round(members.reduce((s, m) => s + m.recency, 0) / n) : 0,
        avg_frequency: n > 0 ? Math.round((members.reduce((s, m) => s + m.frequency, 0) / n) * 100) / 100 : 0,
        avg_monetary: n > 0 ? Math.round(totalMonetary / n) : 0,
        total_monetary: totalMonetary,
        // RFM scores (1–5 scale) — untuk radar chart yang akurat
        avg_r_score: n > 0 ? Math.round((members.reduce((s, m) => s + m.r_score, 0) / n) * 100) / 100 : 0,
        avg_f_score: n > 0 ? Math.round((members.reduce((s, m) => s + m.f_score, 0) / n) * 100) / 100 : 0,
        avg_m_score: n > 0 ? Math.round((members.reduce((s, m) => s + m.m_score, 0) / n) * 100) / 100 : 0,
      }
    }).filter(s => s.count > 0)

    const elapsedMs = Date.now() - startTime

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsedMs,
      stats,
      clustering: {
        optimal_k: bestK,
        silhouette: finalSilhouette,
        davies_bouldin: finalDBI,
        calinski_harabasz: finalCHI,
        rating,
        iterations: finalCluster.iterations,
        converged: finalCluster.converged,
      },
      segments: segmentSummary,
      total_donatur: enrichedResults.length,
    }

    // Simpan ke cache server
    runCache = { result, timestamp: Date.now() }

    return NextResponse.json(result)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('SEGMENTASI_RUN_ERROR:', msg)
    return NextResponse.json(
      { error: 'Gagal menjalankan analisis segmentasi' },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}
