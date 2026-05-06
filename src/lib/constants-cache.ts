/**
 * Cache TTL Constants
 * ====================
 * Centralized cache durations to ensure consistency across API routes.
 * All values are in milliseconds.
 *
 * Rationale:
 * - SEGMENTASI_RUN: 10min — heavy computation, data rarely changes
 * - SEGMENTASI_COMPARE: 30min — very expensive (multi-algorithm), semi-static
 * - SEGMENTASI_DONATUR: 5min — user-facing list, needs freshness
 * - CLIENT_POLL: 5min — frontend polling interval
 * - STATS: 5min — dashboard stats, moderate freshness
 */

/** Cache TTLs in milliseconds */
export const CACHE_TTL = {
  /** /api/segmentasi/run — RFM analysis result (10 minutes) */
  SEGMENTASI_RUN: 10 * 60 * 1000,

  /** /api/segmentasi/compare — multi-algorithm comparison (30 minutes) */
  SEGMENTASI_COMPARE: 30 * 60 * 1000,

  /** /api/segmentasi/donatur — per-segment donatur list (5 minutes) */
  SEGMENTASI_DONATUR: 5 * 60 * 1000,

  /** Client-side polling / refetch interval (5 minutes) */
  CLIENT_POLL: 5 * 60 * 1000,

  /** /api/stats — dashboard statistics (5 minutes) */
  STATS: 5 * 60 * 1000,
} as const

/** Check if a cached timestamp is still valid */
export function isCacheValid(cachedAt: number | null, ttl: number): boolean {
  if (!cachedAt) return false
  return Date.now() - cachedAt < ttl
}
