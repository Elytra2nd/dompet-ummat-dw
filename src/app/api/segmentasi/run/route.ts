import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateRFM, minMaxNormalize } from '@/lib/ml/rfm'
import { runKMeans } from '@/lib/ml/kmeans'
import { silhouetteScore, silhouetteToRating, daviesBouldinIndex, calinskiHarabaszIndex } from '@/lib/ml/evaluation'
import { SEGMENT_CONFIGS, getSegmentConfig } from '@/lib/constants-segmentasi'
import type { RFMInput } from '@/lib/ml/rfm'

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
  let conn
  const startTime = Date.now()
  try {
    conn = await db.getConnection()

    // Step 1: Query data RFM dari Data Warehouse
    const rows = await conn.query(`
      SELECT
        d.sk_donatur,
        d.id_donatur,
        d.nama_lengkap,
        MAX(dd.tanggal) AS last_donation_date,
        COUNT(f.sk_fakta_donasi) AS total_transactions,
        COALESCE(SUM(f.nominal_valid), 0) AS total_amount
      FROM fact_donasi f
      JOIN dim_donatur d ON f.sk_donatur = d.sk_donatur
      JOIN dim_date dd ON f.sk_tgl_bersih = dd.sk_date
      WHERE d.sk_donatur > 0
        AND d.is_active = 1
        AND f.nominal_valid > 0
      GROUP BY d.sk_donatur, d.id_donatur, d.nama_lengkap
      HAVING total_transactions >= 1
      ORDER BY total_amount DESC
    `)

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data donatur yang memenuhi syarat' },
        { status: 404 }
      )
    }

    // Step 2: Transform ke RFMInput
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

    // Step 3: Hitung RFM
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

      return {
        key,
        label: config.label,
        description: config.description,
        color: config.color,
        bgColor: config.bgColor,
        borderColor: config.borderColor,
        iconName: config.iconName,
        count: members.length,
        percentage: Math.round((members.length / enrichedResults.length) * 10000) / 100,
        avg_recency: members.length > 0
          ? Math.round(members.reduce((s, m) => s + m.recency, 0) / members.length)
          : 0,
        avg_frequency: members.length > 0
          ? Math.round((members.reduce((s, m) => s + m.frequency, 0) / members.length) * 100) / 100
          : 0,
        avg_monetary: members.length > 0
          ? Math.round(totalMonetary / members.length)
          : 0,
        total_monetary: totalMonetary,
        recommendation: config.recommendation,
      }
    }).filter(s => s.count > 0)

    const elapsedMs = Date.now() - startTime

    return NextResponse.json({
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
    })
  } catch (error: any) {
    console.error('SEGMENTASI_RUN_ERROR:', error)
    return NextResponse.json(
      { error: 'Gagal menjalankan analisis segmentasi', details: error.message },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}
