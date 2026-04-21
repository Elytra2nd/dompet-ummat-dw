/**
 * Cluster Evaluation Module
 * =========================
 * Silhouette Score untuk auto-select K terbaik.
 * DBI dan CHI juga tersedia (untuk laporan BAB IV).
 */

/** Inline euclidean distance — avoids cross-module import issues in Vercel builds */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

/**
 * Silhouette Score
 * ================
 * Mengukur seberapa mirip sebuah titik dengan cluster-nya sendiri
 * dibandingkan dengan cluster terdekat lainnya.
 *
 * s(i) = (b(i) - a(i)) / max(a(i), b(i))
 *
 * Diketahui:
 * - a(i) = rata-rata jarak titik i ke semua titik dalam cluster yang sama
 * - b(i) = rata-rata jarak titik i ke semua titik di cluster terdekat yang berbeda
 *
 * Range: [-1, 1], semakin tinggi semakin baik
 */
export function silhouetteScore(data: number[][], labels: number[]): number {
  const n = data.length
  if (n <= 1) return 0

  const uniqueLabels = [...new Set(labels)]
  if (uniqueLabels.length <= 1) return 0

  let totalScore = 0

  for (let i = 0; i < n; i++) {
    const ownCluster = labels[i]

    // a(i): rata-rata jarak ke anggota cluster sendiri
    let aSum = 0
    let aCount = 0
    for (let j = 0; j < n; j++) {
      if (i !== j && labels[j] === ownCluster) {
        aSum += euclideanDistance(data[i], data[j])
        aCount++
      }
    }
    const a = aCount > 0 ? aSum / aCount : 0

    // b(i): rata-rata jarak terkecil ke cluster lain
    let minB = Infinity
    for (const cluster of uniqueLabels) {
      if (cluster === ownCluster) continue

      let bSum = 0
      let bCount = 0
      for (let j = 0; j < n; j++) {
        if (labels[j] === cluster) {
          bSum += euclideanDistance(data[i], data[j])
          bCount++
        }
      }

      if (bCount > 0) {
        const avgDist = bSum / bCount
        minB = Math.min(minB, avgDist)
      }
    }
    const b = minB === Infinity ? 0 : minB

    // s(i)
    const maxAB = Math.max(a, b)
    const si = maxAB > 0 ? (b - a) / maxAB : 0
    totalScore += si
  }

  return Math.round((totalScore / n) * 10000) / 10000
}

/**
 * Davies-Bouldin Index
 * ====================
 * DBI = (1/K) * sum(max(R_ij))
 *
 * Diketahui:
 * - K = jumlah cluster
 * - R_ij = (S_i + S_j) / d(c_i, c_j)
 * - S_i = rata-rata jarak anggota cluster i ke centroid-nya
 * - d(c_i, c_j) = jarak antar centroid
 *
 * Range: >= 0, semakin kecil semakin baik
 */
export function daviesBouldinIndex(
  data: number[][],
  labels: number[],
  centroids: number[][]
): number {
  const k = centroids.length
  if (k <= 1) return 0

  // Hitung S_i (rata-rata jarak intra-cluster) per cluster
  const scatters: number[] = new Array(k).fill(0)
  const counts: number[] = new Array(k).fill(0)

  for (let i = 0; i < data.length; i++) {
    const cluster = labels[i]
    scatters[cluster] += euclideanDistance(data[i], centroids[cluster])
    counts[cluster]++
  }

  for (let c = 0; c < k; c++) {
    scatters[c] = counts[c] > 0 ? scatters[c] / counts[c] : 0
  }

  // Hitung DBI
  let totalDB = 0
  for (let i = 0; i < k; i++) {
    let maxR = -Infinity

    for (let j = 0; j < k; j++) {
      if (i === j) continue
      const dij = euclideanDistance(centroids[i], centroids[j])
      if (dij === 0) continue
      const rij = (scatters[i] + scatters[j]) / dij
      maxR = Math.max(maxR, rij)
    }

    if (maxR > -Infinity) {
      totalDB += maxR
    }
  }

  return Math.round((totalDB / k) * 10000) / 10000
}

/**
 * Calinski-Harabasz Index
 * =======================
 * CHI = [B_k / (K-1)] / [W_k / (n-K)]
 *
 * Diketahui:
 * - B_k = between-cluster dispersion
 * - W_k = within-cluster dispersion
 * - K = jumlah cluster
 * - n = jumlah data
 *
 * Range: >= 0, semakin tinggi semakin baik
 */
export function calinskiHarabaszIndex(
  data: number[][],
  labels: number[],
  centroids: number[][]
): number {
  const n = data.length
  const k = centroids.length
  if (k <= 1 || n <= k) return 0

  const dim = data[0].length

  // Hitung overall centroid
  const overallCentroid = new Array(dim).fill(0)
  for (const point of data) {
    for (let d = 0; d < dim; d++) {
      overallCentroid[d] += point[d]
    }
  }
  for (let d = 0; d < dim; d++) {
    overallCentroid[d] /= n
  }

  // Hitung cluster sizes
  const clusterSizes = new Array(k).fill(0)
  for (const label of labels) {
    clusterSizes[label]++
  }

  // B_k: between-cluster dispersion
  let bk = 0
  for (let c = 0; c < k; c++) {
    const dist = euclideanDistance(centroids[c], overallCentroid)
    bk += clusterSizes[c] * dist * dist
  }

  // W_k: within-cluster dispersion
  let wk = 0
  for (let i = 0; i < n; i++) {
    const dist = euclideanDistance(data[i], centroids[labels[i]])
    wk += dist * dist
  }

  if (wk === 0) return 0

  const chi = (bk / (k - 1)) / (wk / (n - k))
  return Math.round(chi * 100) / 100
}

/**
 * Convert Silhouette Score ke rating bintang (untuk UI)
 */
export function silhouetteToRating(score: number): {
  stars: number
  label: string
} {
  if (score >= 0.7) return { stars: 5, label: 'Sangat Baik' }
  if (score >= 0.5) return { stars: 4, label: 'Baik' }
  if (score >= 0.3) return { stars: 3, label: 'Cukup' }
  if (score >= 0.1) return { stars: 2, label: 'Kurang' }
  return { stars: 1, label: 'Buruk' }
}
