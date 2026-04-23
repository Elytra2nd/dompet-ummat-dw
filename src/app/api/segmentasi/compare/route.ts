import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { calculateRFM, minMaxNormalize } from '@/lib/ml/rfm'
import { runKMeans } from '@/lib/ml/kmeans'
import { runKMedoids } from '@/lib/ml/kmedoids'
import { runDBSCAN, autoTuneEps } from '@/lib/ml/dbscan'
import { silhouetteScore, daviesBouldinIndex, calinskiHarabaszIndex } from '@/lib/ml/evaluation'
import type { RFMInput } from '@/lib/ml/rfm'

/**
 * POST /api/segmentasi/compare
 * ============================
 * Jalankan 3 algoritma clustering dan bandingkan hasilnya:
 * 1. K-Means (K-Means++ init, Lloyd's algorithm)
 * 2. K-Medoids (PAM algorithm)
 * 3. DBSCAN (density-based, auto-tune eps)
 *
 * Return metrics perbandingan untuk BAB IV laporan.
 */
export async function POST() {
  let conn
  const startTime = Date.now()
  try {
    conn = await db.getConnection()

    // Query data (sama seperti /run)
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
        { error: 'Tidak ada data donatur' },
        { status: 404 }
      )
    }

    // RFM
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

    const { results: rfmResults, stats } = calculateRFM(rfmInput)

    // Normalisasi
    const rNorm = minMaxNormalize(rfmResults.map(r => r.recency))
    const fNorm = minMaxNormalize(rfmResults.map(r => r.frequency))
    const mNorm = minMaxNormalize(rfmResults.map(r => r.monetary))
    const normalizedData = rfmResults.map((_, i) => [rNorm[i], fNorm[i], mNorm[i]])

    // Auto-select K terbaik untuk K-Means
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

    // ========================================
    // ALGORITMA 1: K-Means
    // ========================================
    const t1 = Date.now()
    const kmeansResult = runKMeans(normalizedData, bestK, 300, 10, 42)
    const kmeansTime = Date.now() - t1

    const kmeansSilhouette = silhouetteScore(normalizedData, kmeansResult.labels)
    const kmeansDBI = daviesBouldinIndex(normalizedData, kmeansResult.labels, kmeansResult.centroids)
    const kmeansCHI = calinskiHarabaszIndex(normalizedData, kmeansResult.labels, kmeansResult.centroids)

    // Hitung distribusi cluster
    const kmeansDistribution: Record<number, number> = {}
    kmeansResult.labels.forEach(l => { kmeansDistribution[l] = (kmeansDistribution[l] || 0) + 1 })

    // ========================================
    // ALGORITMA 2: K-Medoids (PAM)
    // ========================================
    const t2 = Date.now()
    const kmedoidsResult = runKMedoids(normalizedData, bestK, 300, 42)
    const kmedoidsTime = Date.now() - t2

    const kmedoidsSilhouette = silhouetteScore(normalizedData, kmedoidsResult.labels)
    const kmedoidsDBI = daviesBouldinIndex(normalizedData, kmedoidsResult.labels, kmedoidsResult.medoids)
    const kmedoidsCHI = calinskiHarabaszIndex(normalizedData, kmedoidsResult.labels, kmedoidsResult.medoids)

    const kmedoidsDistribution: Record<number, number> = {}
    kmedoidsResult.labels.forEach(l => { kmedoidsDistribution[l] = (kmedoidsDistribution[l] || 0) + 1 })

    // ========================================
    // ALGORITMA 3: DBSCAN
    // ========================================
    const t3 = Date.now()
    const eps = autoTuneEps(normalizedData, 5)
    const dbscanResult = runDBSCAN(normalizedData, eps, 5)
    const dbscanTime = Date.now() - t3

    // DBSCAN metrics (hanya jika ada cluster, bukan semua noise)
    let dbscanSilhouette = 0
    let dbscanDBI = 0
    let dbscanCHI = 0

    if (dbscanResult.n_clusters >= 2) {
      // Filter noise points untuk evaluasi
      const validIndices = dbscanResult.labels.map((l, i) => ({ l, i })).filter(x => x.l >= 0)
      const validData = validIndices.map(x => normalizedData[x.i])
      const validLabels = validIndices.map(x => x.l)

      if (validData.length > 0 && new Set(validLabels).size >= 2) {
        dbscanSilhouette = silhouetteScore(validData, validLabels)

        // Hitung centroids untuk DBI & CHI
        const nClusters = dbscanResult.n_clusters
        const dim = normalizedData[0].length
        const centroids: number[][] = []
        for (let c = 0; c < nClusters; c++) {
          const members = validIndices.filter(x => x.l === c).map(x => normalizedData[x.i])
          if (members.length > 0) {
            const centroid = new Array(dim).fill(0)
            for (const m of members) {
              for (let d = 0; d < dim; d++) centroid[d] += m[d]
            }
            for (let d = 0; d < dim; d++) centroid[d] /= members.length
            centroids.push(centroid)
          }
        }

        if (centroids.length >= 2) {
          // Re-map labels untuk evaluasi DBI/CHI
          const remappedLabels = validLabels.map(l => Math.min(l, centroids.length - 1))
          dbscanDBI = daviesBouldinIndex(validData, remappedLabels, centroids)
          dbscanCHI = calinskiHarabaszIndex(validData, remappedLabels, centroids)
        }
      }
    }

    const dbscanDistribution: Record<string, number> = {}
    dbscanResult.labels.forEach(l => {
      const key = l === -1 ? 'noise' : String(l)
      dbscanDistribution[key] = (dbscanDistribution[key] || 0) + 1
    })

    // ========================================
    // Tentukan pemenang
    // ========================================
    const algorithms = [
      { name: 'K-Means', silhouette: kmeansSilhouette, dbi: kmeansDBI, chi: kmeansCHI },
      { name: 'K-Medoids', silhouette: kmedoidsSilhouette, dbi: kmedoidsDBI, chi: kmedoidsCHI },
      { name: 'DBSCAN', silhouette: dbscanSilhouette, dbi: dbscanDBI, chi: dbscanCHI },
    ]

    // Score: Silhouette tertinggi = terbaik, DBI terendah = terbaik, CHI tertinggi = terbaik
    const ranked = algorithms.map(a => ({
      ...a,
      score: a.silhouette * 40 + (1 / (a.dbi + 0.01)) * 30 + (a.chi / 1000) * 30,
    })).sort((a, b) => b.score - a.score)

    const winner = ranked[0].name
    const elapsedMs = Date.now() - startTime

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      elapsed_ms: elapsedMs,
      data_info: {
        total_donatur: rfmResults.length,
        optimal_k: bestK,
        features: ['Recency', 'Frequency', 'Monetary'],
        normalization: 'Min-Max',
      },
      comparison: {
        kmeans: {
          algorithm: 'K-Means (K-Means++ init, Lloyd\'s)',
          params: { k: bestK, max_iter: 300, n_init: 10, random_state: 42 },
          metrics: {
            silhouette_score: kmeansSilhouette,
            davies_bouldin_index: kmeansDBI,
            calinski_harabasz_index: kmeansCHI,
          },
          details: {
            iterations: kmeansResult.iterations,
            converged: kmeansResult.converged,
            inertia: Math.round(kmeansResult.inertia * 10000) / 10000,
            execution_ms: kmeansTime,
          },
          cluster_distribution: kmeansDistribution,
        },
        kmedoids: {
          algorithm: 'K-Medoids (PAM)',
          params: { k: bestK, max_iter: 300, random_state: 42 },
          metrics: {
            silhouette_score: kmedoidsSilhouette,
            davies_bouldin_index: kmedoidsDBI,
            calinski_harabasz_index: kmedoidsCHI,
          },
          details: {
            iterations: kmedoidsResult.iterations,
            converged: kmedoidsResult.converged,
            cost: Math.round(kmedoidsResult.cost * 10000) / 10000,
            execution_ms: kmedoidsTime,
          },
          cluster_distribution: kmedoidsDistribution,
        },
        dbscan: {
          algorithm: 'DBSCAN (auto-tune eps)',
          params: { eps: Math.round(eps * 10000) / 10000, min_pts: 5 },
          metrics: {
            silhouette_score: dbscanSilhouette,
            davies_bouldin_index: dbscanDBI,
            calinski_harabasz_index: dbscanCHI,
          },
          details: {
            n_clusters: dbscanResult.n_clusters,
            n_noise: dbscanResult.n_noise,
            noise_percentage: Math.round((dbscanResult.n_noise / rfmResults.length) * 10000) / 100,
            execution_ms: dbscanTime,
          },
          cluster_distribution: dbscanDistribution,
        },
      },
      conclusion: {
        winner,
        reasoning: `${winner} dipilih karena memiliki kombinasi metrik evaluasi terbaik secara keseluruhan.`,
        ranking: ranked.map((r, i) => ({
          rank: i + 1,
          algorithm: r.name,
          silhouette: r.silhouette,
          dbi: r.dbi,
          chi: r.chi,
          composite_score: Math.round(r.score * 10000) / 10000,
        })),
      },
    })
  } catch (error: any) {
    console.error('SEGMENTASI_COMPARE_ERROR:', error)
    return NextResponse.json(
      { error: 'Gagal menjalankan perbandingan algoritma', details: error.message },
      { status: 500 }
    )
  } finally {
    if (conn) conn.release()
  }
}
