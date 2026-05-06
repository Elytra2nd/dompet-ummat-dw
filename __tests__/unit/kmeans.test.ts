import { describe, it, expect } from 'vitest'
import { runKMeans, euclideanDistance } from '@/lib/ml/kmeans'

// --- Toy dataset: 3 obvious clusters ---
const CLUSTER_DATA = [
  // Cluster A (near origin)
  [0.1, 0.1], [0.2, 0.15], [0.15, 0.2], [0.05, 0.1],
  // Cluster B (top-right)
  [0.9, 0.9], [0.85, 0.95], [0.95, 0.85], [0.88, 0.92],
  // Cluster C (bottom-right)
  [0.9, 0.1], [0.85, 0.15], [0.95, 0.05], [0.88, 0.12],
]

describe('euclideanDistance', () => {
  it('should return 0 for identical points', () => {
    expect(euclideanDistance([1, 2], [1, 2])).toBe(0)
  })

  it('should compute correct distance', () => {
    // sqrt((3-0)^2 + (4-0)^2) = 5
    expect(euclideanDistance([0, 0], [3, 4])).toBe(5)
  })

  it('should handle high-dimensional points', () => {
    const a = [1, 0, 0, 0]
    const b = [0, 1, 0, 0]
    expect(euclideanDistance(a, b)).toBeCloseTo(Math.SQRT2)
  })
})

describe('runKMeans', () => {
  it('should return empty result for empty data', () => {
    const result = runKMeans([], 3)
    expect(result.labels).toEqual([])
    expect(result.centroids).toEqual([])
    expect(result.converged).toBe(false)
  })

  it('should assign correct number of labels', () => {
    const result = runKMeans(CLUSTER_DATA, 3)
    expect(result.labels).toHaveLength(12)
  })

  it('should find 3 clusters in well-separated data', () => {
    const result = runKMeans(CLUSTER_DATA, 3, 300, 10, 42)
    const uniqueLabels = new Set(result.labels)
    expect(uniqueLabels.size).toBe(3)
  })

  it('should group nearby points in the same cluster', () => {
    const result = runKMeans(CLUSTER_DATA, 3, 300, 10, 42)
    // Points 0-3 (Cluster A) should have same label
    const clusterA = result.labels.slice(0, 4)
    expect(new Set(clusterA).size).toBe(1)
    // Points 4-7 (Cluster B) should have same label
    const clusterB = result.labels.slice(4, 8)
    expect(new Set(clusterB).size).toBe(1)
    // Points 8-11 (Cluster C) should have same label
    const clusterC = result.labels.slice(8, 12)
    expect(new Set(clusterC).size).toBe(1)
  })

  it('should converge within max iterations', () => {
    const result = runKMeans(CLUSTER_DATA, 3)
    expect(result.converged).toBe(true)
    expect(result.iterations).toBeLessThan(300)
  })

  it('should produce positive inertia', () => {
    const result = runKMeans(CLUSTER_DATA, 3)
    expect(result.inertia).toBeGreaterThan(0)
  })

  it('should have correct number of centroids', () => {
    const result = runKMeans(CLUSTER_DATA, 3)
    expect(result.centroids).toHaveLength(3)
    result.centroids.forEach(c => {
      expect(c).toHaveLength(2) // 2D
    })
  })

  it('should be reproducible with same random_state', () => {
    const r1 = runKMeans(CLUSTER_DATA, 3, 300, 10, 42)
    const r2 = runKMeans(CLUSTER_DATA, 3, 300, 10, 42)
    expect(r1.labels).toEqual(r2.labels)
    expect(r1.inertia).toEqual(r2.inertia)
  })

  it('should clamp k to data length', () => {
    const smallData = [[0.1, 0.1], [0.9, 0.9]]
    const result = runKMeans(smallData, 5) // k > n
    expect(result.centroids.length).toBeLessThanOrEqual(2)
  })

  it('should decrease inertia as k increases', () => {
    const r2 = runKMeans(CLUSTER_DATA, 2, 300, 5, 42)
    const r3 = runKMeans(CLUSTER_DATA, 3, 300, 5, 42)
    expect(r3.inertia).toBeLessThan(r2.inertia)
  })
})
