/**
 * Unit Tests — utils-ambulan.ts
 * ==============================
 * Tests for generateSkDate, formatRupiah, parseCoord.
 */
import { describe, it, expect } from 'vitest'
import { generateSkDate, formatRupiah, parseCoord } from '@/lib/utils-ambulan'

describe('generateSkDate', () => {
  it('should generate correct key for a normal date', () => {
    const date = new Date(2026, 3, 15) // April 15, 2026
    expect(generateSkDate(date)).toBe(20260415)
  })

  it('should pad single-digit months correctly', () => {
    const date = new Date(2026, 0, 5) // January 5, 2026
    expect(generateSkDate(date)).toBe(20260105)
  })

  it('should pad single-digit days correctly', () => {
    const date = new Date(2026, 11, 1) // December 1, 2026
    expect(generateSkDate(date)).toBe(20261201)
  })

  it('should handle end of year', () => {
    const date = new Date(2026, 11, 31) // December 31, 2026
    expect(generateSkDate(date)).toBe(20261231)
  })

  it('should handle start of year', () => {
    const date = new Date(2026, 0, 1) // January 1, 2026
    expect(generateSkDate(date)).toBe(20260101)
  })

  it('should return a number type', () => {
    expect(typeof generateSkDate(new Date())).toBe('number')
  })

  // ── Date/Timezone Awareness ────────────────────────────────────────────────
  it('should produce an 8-digit integer', () => {
    const result = generateSkDate(new Date(2026, 5, 15))
    expect(result.toString()).toHaveLength(8)
  })
})

describe('formatRupiah', () => {
  it('should format zero correctly', () => {
    const result = formatRupiah(0)
    expect(result).toContain('0')
    expect(result).toContain('Rp')
  })

  it('should format thousands correctly', () => {
    const result = formatRupiah(50000)
    expect(result).toContain('50.000') // id-ID uses dot as thousand separator
  })

  it('should format millions correctly', () => {
    const result = formatRupiah(1500000)
    expect(result).toContain('1.500.000')
  })

  it('should format billions correctly', () => {
    const result = formatRupiah(2500000000)
    expect(result).toContain('2.500.000.000')
  })

  // ── Financial Precision ────────────────────────────────────────────────────
  it('should not produce fractional digits for whole Rupiah amounts', () => {
    const result = formatRupiah(100000)
    // Should NOT contain decimals like ,00
    expect(result).not.toMatch(/,\d{2}$/)
  })

  it('should handle negative amounts (refunds)', () => {
    const result = formatRupiah(-50000)
    expect(result).toContain('50.000')
  })
})

describe('parseCoord', () => {
  it('should parse valid string coordinate', () => {
    expect(parseCoord('-0.0263')).toBeCloseTo(-0.0263)
  })

  it('should return 0 for NaN string', () => {
    expect(parseCoord('abc')).toBe(0)
  })

  it('should return 0 for empty string', () => {
    expect(parseCoord('')).toBe(0)
  })

  it('should pass through valid number', () => {
    expect(parseCoord(109.3425)).toBeCloseTo(109.3425)
  })

  it('should return 0 for NaN number', () => {
    expect(parseCoord(NaN)).toBe(0)
  })
})
