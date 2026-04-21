/**
 * ML Library — Segmentasi Donatur (Dzaky)
 * ========================================
 * Modul ini berisi logic untuk:
 * 1. RFM Calculation — Recency, Frequency, Monetary
 * 2. Min-Max Normalization
 * 3. K-Means++ Clustering
 * 4. Evaluation Metrics (Silhouette, DBI, CHI)
 */

export { calculateRFM, minMaxNormalize } from './rfm'
export type { RFMInput, RFMResult, RFMStats } from './rfm'

export { runKMeans, findOptimalK, euclideanDistance } from './kmeans'
export type { ClusterResult, OptimalKResult } from './kmeans'

export {
  silhouetteScore,
  daviesBouldinIndex,
  calinskiHarabaszIndex,
  silhouetteToRating,
} from './evaluation'
