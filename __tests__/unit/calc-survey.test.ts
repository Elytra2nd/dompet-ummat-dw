/**
 * Unit Tests — calc-survey.ts
 * ===========================
 * Boundary value analysis untuk determineKelayakan dan calculateAverage.
 */
import { describe, it, expect } from 'vitest'
import { determineKelayakan, calculateAverage } from '@/lib/calc-survey'

describe('determineKelayakan', () => {
  // ── Boundary Value Analysis ────────────────────────────────────────────────
  it('should return "Sangat Layak" for score exactly 80', () => {
    const result = determineKelayakan(80)
    expect(result.value).toBe('Sangat_Layak')
    expect(result.label).toBe('Sangat Layak')
  })

  it('should return "Sangat Layak" for score above 80 (e.g. 100)', () => {
    expect(determineKelayakan(100).value).toBe('Sangat_Layak')
  })

  it('should return "Layak" for score exactly 79 (just below Sangat Layak)', () => {
    expect(determineKelayakan(79).value).toBe('Layak')
  })

  it('should return "Layak" for score exactly 60', () => {
    expect(determineKelayakan(60).value).toBe('Layak')
  })

  it('should return "Dipertimbangkan" for score exactly 59', () => {
    expect(determineKelayakan(59).value).toBe('Dipertimbangkan')
  })

  it('should return "Dipertimbangkan" for score exactly 40', () => {
    expect(determineKelayakan(40).value).toBe('Dipertimbangkan')
  })

  it('should return "Tidak Layak" for score exactly 39', () => {
    expect(determineKelayakan(39).value).toBe('Tidak_Layak')
  })

  it('should return "Tidak Layak" for score 0', () => {
    expect(determineKelayakan(0).value).toBe('Tidak_Layak')
  })

  it('should return "Tidak Layak" for negative score', () => {
    expect(determineKelayakan(-10).value).toBe('Tidak_Layak')
  })

  // ── Financial Precision ────────────────────────────────────────────────────
  it('should handle decimal scores correctly (79.999)', () => {
    // 79.999 < 80, jadi harus Layak
    expect(determineKelayakan(79.999).value).toBe('Layak')
  })

  it('should handle decimal boundary (80.0)', () => {
    expect(determineKelayakan(80.0).value).toBe('Sangat_Layak')
  })
})

describe('calculateAverage', () => {
  it('should return 0 for empty scores', () => {
    expect(calculateAverage({})).toBe(0)
  })

  it('should calculate correct average for single max score (5/5 = 100%)', () => {
    expect(calculateAverage({ q1: 5 })).toBe(100)
  })

  it('should calculate correct average for single min score (1/5 = 20%)', () => {
    expect(calculateAverage({ q1: 1 })).toBe(20)
  })

  it('should calculate correct average for mixed scores', () => {
    // scores: 3, 4, 5 → total=12, count=3, max=15 → (12/15)*100 = 80
    expect(calculateAverage({ q1: 3, q2: 4, q3: 5 })).toBe(80)
  })

  it('should calculate correct average for all mid-range scores', () => {
    // scores: 3, 3, 3 → total=9, count=3, max=15 → (9/15)*100 = 60
    expect(calculateAverage({ q1: 3, q2: 3, q3: 3 })).toBe(60)
  })

  it('should handle large number of questions', () => {
    const scores: Record<string, number> = {}
    for (let i = 0; i < 100; i++) {
      scores[`q${i}`] = 5
    }
    expect(calculateAverage(scores)).toBe(100)
  })

  // ── Financial Precision ────────────────────────────────────────────────────
  it('should not produce floating point errors on common inputs', () => {
    // 2 + 3 = 5, count=2, max=10 → (5/10)*100 = 50 (should be exact)
    const result = calculateAverage({ q1: 2, q2: 3 })
    expect(result).toBe(50)
  })
})
