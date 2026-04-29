/**
 * Unit Tests — constants-segmentasi.ts
 * =====================================
 * Data integrity for segment configurations.
 */
import { describe, it, expect } from 'vitest'
import { SEGMENT_CONFIGS, SEGMENT_ORDER, getSegmentConfig } from '@/lib/constants-segmentasi'

describe('SEGMENT_CONFIGS', () => {
  it('should have all required segments defined', () => {
    const requiredSegments = [
      'champions', 'loyal', 'potential', 'new_donors',
      'promising', 'need_attention', 'at_risk', 'hibernating', 'lost',
    ]
    requiredSegments.forEach(seg => {
      expect(SEGMENT_CONFIGS).toHaveProperty(seg)
    })
  })

  it('every config should have all required fields', () => {
    Object.entries(SEGMENT_CONFIGS).forEach(([key, config]) => {
      expect(config.key).toBe(key)
      expect(config.label).toBeTruthy()
      expect(config.description).toBeTruthy()
      expect(config.color).toMatch(/^text-/)
      expect(config.bgColor).toMatch(/^bg-/)
      expect(config.borderColor).toMatch(/^border-/)
      expect(config.iconName).toBeTruthy()
      expect(config.recommendation).toBeDefined()
      expect(config.recommendation.title).toBeTruthy()
      expect(config.recommendation.description).toBeTruthy()
      expect(config.recommendation.channels.length).toBeGreaterThan(0)
    })
  })
})

describe('SEGMENT_ORDER', () => {
  it('should contain all keys from SEGMENT_CONFIGS', () => {
    const configKeys = Object.keys(SEGMENT_CONFIGS).sort()
    const orderKeys = [...SEGMENT_ORDER].sort()
    expect(orderKeys).toEqual(configKeys)
  })

  it('should have no duplicates', () => {
    const unique = new Set(SEGMENT_ORDER)
    expect(unique.size).toBe(SEGMENT_ORDER.length)
  })

  it('should start with "champions" (best) and end with "lost" (worst)', () => {
    expect(SEGMENT_ORDER[0]).toBe('champions')
    expect(SEGMENT_ORDER[SEGMENT_ORDER.length - 1]).toBe('lost')
  })
})

describe('getSegmentConfig', () => {
  it('should return correct config for valid key', () => {
    const config = getSegmentConfig('champions')
    expect(config.label).toBe('Donatur Utama')
  })

  it('should fallback to "lost" config for unknown key', () => {
    const config = getSegmentConfig('nonexistent_segment')
    expect(config.key).toBe('lost')
    expect(config.label).toBe('Hilang')
  })

  it('should fallback for empty string', () => {
    const config = getSegmentConfig('')
    expect(config.key).toBe('lost')
  })
})
