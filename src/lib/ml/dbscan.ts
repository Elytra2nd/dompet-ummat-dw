/**
 * DBSCAN Clustering
 * =================
 * Density-Based Spatial Clustering of Applications with Noise.
 * Tidak perlu menentukan K di awal — otomatis menemukan cluster
 * berdasarkan kepadatan titik. Bisa mendeteksi noise/outlier.
 */

import { euclideanDistance } from './kmeans'

export interface DBSCANResult {
  labels: number[]          // -1 = noise
  n_clusters: number        // jumlah cluster (tanpa noise)
  n_noise: number           // jumlah noise points
  core_points: number[]     // indices of core points
}

/**
 * DBSCAN Algorithm
 * 
 * @param data - Normalized data matrix (n x d)
 * @param eps - Radius pencarian tetangga (default: 0.3)
 * @param minPts - Minimum titik untuk membentuk cluster (default: 5)
 */
export function runDBSCAN(
  data: number[][],
  eps: number = 0.3,
  minPts: number = 5
): DBSCANResult {
  const n = data.length
  if (n === 0) {
    return { labels: [], n_clusters: 0, n_noise: 0, core_points: [] }
  }

  const labels = new Array(n).fill(-2)  // -2 = unvisited, -1 = noise
  const corePoints: number[] = []
  let clusterId = 0

  // Pre-compute neighbors untuk setiap titik
  const neighborhoods: number[][] = new Array(n)
  for (let i = 0; i < n; i++) {
    neighborhoods[i] = regionQuery(data, i, eps)
    if (neighborhoods[i].length >= minPts) {
      corePoints.push(i)
    }
  }

  // Main loop
  for (let i = 0; i < n; i++) {
    if (labels[i] !== -2) continue  // already visited

    const neighbors = neighborhoods[i]

    if (neighbors.length < minPts) {
      labels[i] = -1  // noise
      continue
    }

    // Start new cluster
    labels[i] = clusterId
    const seedSet = [...neighbors.filter(j => j !== i)]

    for (let s = 0; s < seedSet.length; s++) {
      const q = seedSet[s]

      if (labels[q] === -1) {
        labels[q] = clusterId  // noise becomes border point
      }

      if (labels[q] !== -2) continue  // already processed
      labels[q] = clusterId

      const qNeighbors = neighborhoods[q]
      if (qNeighbors.length >= minPts) {
        // Add new neighbors to seed set
        for (const neighbor of qNeighbors) {
          if (!seedSet.includes(neighbor)) {
            seedSet.push(neighbor)
          }
        }
      }
    }

    clusterId++
  }

  // Count noise
  const nNoise = labels.filter(l => l === -1).length

  return {
    labels,
    n_clusters: clusterId,
    n_noise: nNoise,
    core_points: corePoints,
  }
}

/**
 * Cari semua titik dalam radius eps
 */
function regionQuery(data: number[][], pointIdx: number, eps: number): number[] {
  const neighbors: number[] = []
  for (let i = 0; i < data.length; i++) {
    if (euclideanDistance(data[pointIdx], data[i]) <= eps) {
      neighbors.push(i)
    }
  }
  return neighbors
}

/**
 * Auto-tune DBSCAN eps menggunakan K-Distance Graph heuristic
 * Cari "knee point" dari sorted k-distance
 */
export function autoTuneEps(data: number[][], minPts: number = 5): number {
  const n = data.length
  if (n <= minPts) return 0.5

  // Hitung k-th nearest neighbor distance untuk setiap titik
  const kDistances: number[] = []

  for (let i = 0; i < n; i++) {
    const distances: number[] = []
    for (let j = 0; j < n; j++) {
      if (i !== j) {
        distances.push(euclideanDistance(data[i], data[j]))
      }
    }
    distances.sort((a, b) => a - b)
    kDistances.push(distances[Math.min(minPts - 1, distances.length - 1)])
  }

  // Sort ascending
  kDistances.sort((a, b) => a - b)

  // Cari knee point — titik dengan perubahan slope terbesar
  let maxCurvature = 0
  let kneeIdx = Math.floor(n * 0.9)  // default: 90th percentile

  for (let i = 1; i < kDistances.length - 1; i++) {
    const curvature = Math.abs(
      kDistances[i + 1] - 2 * kDistances[i] + kDistances[i - 1]
    )
    if (curvature > maxCurvature) {
      maxCurvature = curvature
      kneeIdx = i
    }
  }

  return kDistances[kneeIdx]
}
