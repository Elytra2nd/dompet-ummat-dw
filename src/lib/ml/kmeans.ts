/**
 * K-Means Clustering Module
 * =========================
 * Implementasi K-Means++ initialization + Lloyd's algorithm
 * Murni TypeScript, tanpa dependency Python.
 */

// ---- Types ----

export interface ClusterResult {
  labels: number[]
  centroids: number[][]
  iterations: number
  inertia: number       // Within-Cluster Sum of Squares (WCSS)
  converged: boolean
}

export interface OptimalKResult {
  k: number
  silhouette: number
  inertia: number
}

// ---- Distance Functions ----

/**
 * Euclidean Distance antara dua titik
 */
export function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i]
    sum += diff * diff
  }
  return Math.sqrt(sum)
}

// ---- K-Means++ Initialization ----

/**
 * K-Means++ initialization: pilih centroid awal secara cerdas
 * Centroid pertama random, sisanya dipilih proporsional terhadap jarak terbesar
 */
function initializeCentroidsPlusPlus(
  data: number[][],
  k: number,
  rng: () => number
): number[][] {
  const n = data.length
  const dim = data[0].length
  const centroids: number[][] = []

  // Pilih centroid pertama secara random
  const firstIdx = Math.floor(rng() * n)
  centroids.push([...data[firstIdx]])

  // Pilih centroid sisanya
  for (let c = 1; c < k; c++) {
    // Hitung jarak terdekat setiap titik ke centroid yang sudah ada
    const distances = new Array(n).fill(0)
    let totalDist = 0

    for (let i = 0; i < n; i++) {
      let minDist = Infinity
      for (const centroid of centroids) {
        const dist = euclideanDistance(data[i], centroid)
        minDist = Math.min(minDist, dist)
      }
      distances[i] = minDist * minDist  // squared distance
      totalDist += distances[i]
    }

    // Pilih centroid baru proporsional terhadap jarak
    let target = rng() * totalDist
    let cumulative = 0
    let selectedIdx = 0

    for (let i = 0; i < n; i++) {
      cumulative += distances[i]
      if (cumulative >= target) {
        selectedIdx = i
        break
      }
    }

    centroids.push([...data[selectedIdx]])
  }

  return centroids
}

// ---- Core K-Means Algorithm ----

/**
 * Assign setiap data point ke centroid terdekat
 */
function assignClusters(data: number[][], centroids: number[][]): number[] {
  return data.map(point => {
    let minDist = Infinity
    let bestCluster = 0

    for (let c = 0; c < centroids.length; c++) {
      const dist = euclideanDistance(point, centroids[c])
      if (dist < minDist) {
        minDist = dist
        bestCluster = c
      }
    }

    return bestCluster
  })
}

/**
 * Update centroid berdasarkan rata-rata anggota cluster
 */
function updateCentroids(
  data: number[][],
  labels: number[],
  k: number
): number[][] {
  const dim = data[0].length
  const sums: number[][] = Array.from({ length: k }, () => new Array(dim).fill(0))
  const counts = new Array(k).fill(0)

  for (let i = 0; i < data.length; i++) {
    const cluster = labels[i]
    counts[cluster]++
    for (let d = 0; d < dim; d++) {
      sums[cluster][d] += data[i][d]
    }
  }

  return sums.map((sum, c) =>
    sum.map(s => (counts[c] > 0 ? s / counts[c] : 0))
  )
}

/**
 * Hitung Within-Cluster Sum of Squares (WCSS / Inertia)
 */
function calculateInertia(
  data: number[][],
  labels: number[],
  centroids: number[][]
): number {
  let inertia = 0
  for (let i = 0; i < data.length; i++) {
    const dist = euclideanDistance(data[i], centroids[labels[i]])
    inertia += dist * dist
  }
  return inertia
}

/**
 * Seeded random number generator (untuk reproducibility dengan random_state)
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

// ---- Public API ----

/**
 * Jalankan K-Means clustering
 *
 * @param data - Data yang sudah dinormalisasi (n x d matrix)
 * @param k - Jumlah cluster
 * @param maxIter - Iterasi maksimum (default: 300)
 * @param nInit - Jumlah inisialisasi ulang, ambil hasil terbaik (default: 10)
 * @param randomState - Seed untuk reproducibility (default: 42)
 */
export function runKMeans(
  data: number[][],
  k: number,
  maxIter: number = 300,
  nInit: number = 10,
  randomState: number = 42
): ClusterResult {
  if (data.length === 0 || k <= 0) {
    return { labels: [], centroids: [], iterations: 0, inertia: 0, converged: false }
  }

  // Clamp k ke jumlah data
  k = Math.min(k, data.length)

  let bestResult: ClusterResult | null = null

  for (let init = 0; init < nInit; init++) {
    const rng = seededRandom(randomState + init * 1000)

    // K-Means++ initialization
    let centroids = initializeCentroidsPlusPlus(data, k, rng)
    let labels: number[] = []
    let iteration = 0
    let converged = false

    for (iteration = 0; iteration < maxIter; iteration++) {
      // Step 1: Assign clusters
      const newLabels = assignClusters(data, centroids)

      // Step 2: Check convergence
      if (labels.length > 0 && newLabels.every((l, i) => l === labels[i])) {
        converged = true
        labels = newLabels
        break
      }

      labels = newLabels

      // Step 3: Update centroids
      centroids = updateCentroids(data, labels, k)
    }

    const inertia = calculateInertia(data, labels, centroids)

    if (!bestResult || inertia < bestResult.inertia) {
      bestResult = { labels, centroids, iterations: iteration, inertia, converged }
    }
  }

  return bestResult!
}

/**
 * Auto-select K terbaik dengan menjalankan K-Means dari K=2 sampai K=maxK
 * Pilih K dengan Silhouette Score tertinggi
 */
export function findOptimalK(
  data: number[][],
  maxK: number = 10,
  maxIter: number = 300,
  randomState: number = 42
): OptimalKResult[] {
  // Lazy import to avoid circular dependency
  const { silhouetteScore } = require('./evaluation')

  const results: OptimalKResult[] = []
  const maxClusters = Math.min(maxK, data.length - 1)

  for (let k = 2; k <= maxClusters; k++) {
    const cluster = runKMeans(data, k, maxIter, 10, randomState)
    const silhouette = silhouetteScore(data, cluster.labels)

    results.push({
      k,
      silhouette,
      inertia: cluster.inertia,
    })
  }

  return results
}
