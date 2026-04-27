/**
 * K-Medoids Clustering (PAM Algorithm)
 * =====================================
 * Berbeda dari K-Means yang menggunakan mean sebagai centroid,
 * K-Medoids menggunakan data point aktual sebagai medoid.
 * Lebih robust terhadap outlier.
 */

import { euclideanDistance } from './kmeans'

export interface KMedoidsResult {
  labels: number[]
  medoids: number[][]       // actual data points as centers
  medoidIndices: number[]    // indices of medoid points in original data
  iterations: number
  cost: number              // total distance to medoids
  converged: boolean
}

/**
 * Seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

/**
 * PAM (Partitioning Around Medoids) Algorithm
 * 
 * @param data - Normalized data matrix (n x d)
 * @param k - Jumlah cluster
 * @param maxIter - Iterasi maksimum
 * @param randomState - Seed untuk reproducibility
 */
export function runKMedoids(
  data: number[][],
  k: number,
  maxIter: number = 300,
  randomState: number = 42
): KMedoidsResult {
  const n = data.length
  if (n === 0 || k <= 0) {
    return { labels: [], medoids: [], medoidIndices: [], iterations: 0, cost: 0, converged: false }
  }
  k = Math.min(k, n)

  const rng = seededRandom(randomState)

  // Step 1: BUILD — pilih medoid awal (greedy)
  const medoidIndices = initMedoids(data, k, rng)

  // Pre-compute distance matrix untuk efisiensi
  const distMatrix = computeDistanceMatrix(data)

  let currentMedoids = [...medoidIndices]
  let labels = assignToMedoids(distMatrix, currentMedoids, n)
  let currentCost = totalCost(distMatrix, labels, currentMedoids)
  let converged = false
  let iteration = 0

  // Step 2: SWAP — iterasi perbaikan
  for (iteration = 0; iteration < maxIter; iteration++) {
    let improved = false

    for (let m = 0; m < k; m++) {
      for (let candidate = 0; candidate < n; candidate++) {
        if (currentMedoids.includes(candidate)) continue

        // Coba swap medoid m dengan candidate
        const newMedoids = [...currentMedoids]
        newMedoids[m] = candidate

        const newLabels = assignToMedoids(distMatrix, newMedoids, n)
        const newCost = totalCost(distMatrix, newLabels, newMedoids)

        if (newCost < currentCost) {
          currentMedoids = newMedoids
          labels = newLabels
          currentCost = newCost
          improved = true
          break // restart inner loop
        }
      }
      if (improved) break
    }

    if (!improved) {
      converged = true
      break
    }
  }

  return {
    labels,
    medoids: currentMedoids.map(i => [...data[i]]),
    medoidIndices: currentMedoids,
    iterations: iteration,
    cost: currentCost,
    converged,
  }
}

/**
 * Inisialisasi medoid — pilih k titik secara greedy
 */
function initMedoids(data: number[][], k: number, rng: () => number): number[] {
  const n = data.length
  const selected: number[] = []

  // Pilih medoid pertama: titik dengan total jarak terkecil ke semua titik lain
  let minTotalDist = Infinity
  let firstMedoid = 0

  for (let i = 0; i < n; i++) {
    let totalDist = 0
    for (let j = 0; j < n; j++) {
      if (i !== j) totalDist += euclideanDistance(data[i], data[j])
    }
    if (totalDist < minTotalDist) {
      minTotalDist = totalDist
      firstMedoid = i
    }
  }
  selected.push(firstMedoid)

  // Pilih medoid sisanya: titik terjauh dari medoid yang sudah ada
  while (selected.length < k) {
    let maxMinDist = -1
    let bestCandidate = 0

    for (let i = 0; i < n; i++) {
      if (selected.includes(i)) continue
      let minDist = Infinity
      for (const m of selected) {
        minDist = Math.min(minDist, euclideanDistance(data[i], data[m]))
      }
      if (minDist > maxMinDist) {
        maxMinDist = minDist
        bestCandidate = i
      }
    }
    selected.push(bestCandidate)
  }

  return selected
}

/**
 * Pre-compute distance matrix
 */
function computeDistanceMatrix(data: number[][]): number[][] {
  const n = data.length
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(0))
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclideanDistance(data[i], data[j])
      dist[i][j] = d
      dist[j][i] = d
    }
  }
  return dist
}

/**
 * Assign setiap titik ke medoid terdekat
 */
function assignToMedoids(distMatrix: number[][], medoids: number[], n: number): number[] {
  const labels = new Array(n).fill(0)
  for (let i = 0; i < n; i++) {
    let minDist = Infinity
    for (let m = 0; m < medoids.length; m++) {
      const d = distMatrix[i][medoids[m]]
      if (d < minDist) {
        minDist = d
        labels[i] = m
      }
    }
  }
  return labels
}

/**
 * Total cost: sum jarak semua titik ke medoid-nya
 */
function totalCost(distMatrix: number[][], labels: number[], medoids: number[]): number {
  let cost = 0
  for (let i = 0; i < labels.length; i++) {
    cost += distMatrix[i][medoids[labels[i]]]
  }
  return cost
}
