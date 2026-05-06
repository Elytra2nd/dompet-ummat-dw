import { describe, it, expect } from 'vitest'
import { calculateRFM, minMaxNormalize, type RFMInput } from '@/lib/ml/rfm'

// --- Fixed toy dataset ---
const REF_DATE = new Date('2026-01-01')

const SAMPLE_DATA: RFMInput[] = [
  { sk_donatur: 1, id_donatur: 'D-001', nama_lengkap: 'Champions Donor', last_donation_date: '2025-12-30', total_transactions: 50, total_amount: 5000000 },
  { sk_donatur: 2, id_donatur: 'D-002', nama_lengkap: 'Loyal Donor', last_donation_date: '2025-12-15', total_transactions: 30, total_amount: 3000000 },
  { sk_donatur: 3, id_donatur: 'D-003', nama_lengkap: 'At Risk Donor', last_donation_date: '2025-06-01', total_transactions: 25, total_amount: 2000000 },
  { sk_donatur: 4, id_donatur: 'D-004', nama_lengkap: 'Hibernating Donor', last_donation_date: '2025-03-01', total_transactions: 5, total_amount: 500000 },
  { sk_donatur: 5, id_donatur: 'D-005', nama_lengkap: 'Lost Donor', last_donation_date: '2024-06-01', total_transactions: 1, total_amount: 50000 },
  { sk_donatur: 6, id_donatur: 'D-006', nama_lengkap: 'New Donor', last_donation_date: '2025-12-28', total_transactions: 1, total_amount: 100000 },
  { sk_donatur: 7, id_donatur: 'D-007', nama_lengkap: 'Promising', last_donation_date: '2025-12-20', total_transactions: 2, total_amount: 200000 },
  { sk_donatur: 8, id_donatur: 'D-008', nama_lengkap: 'Medium Donor', last_donation_date: '2025-09-01', total_transactions: 10, total_amount: 1000000 },
  { sk_donatur: 9, id_donatur: 'D-009', nama_lengkap: 'Potential', last_donation_date: '2025-12-25', total_transactions: 8, total_amount: 800000 },
  { sk_donatur: 10, id_donatur: 'D-010', nama_lengkap: 'Need Attention', last_donation_date: '2025-10-01', total_transactions: 12, total_amount: 1500000 },
]

describe('minMaxNormalize', () => {
  it('should normalize values to [0, 1]', () => {
    const result = minMaxNormalize([10, 20, 30, 40, 50])
    expect(result).toEqual([0, 0.25, 0.5, 0.75, 1])
  })

  it('should return all zeros for identical values', () => {
    const result = minMaxNormalize([5, 5, 5])
    expect(result).toEqual([0, 0, 0])
  })

  it('should return empty array for empty input', () => {
    expect(minMaxNormalize([])).toEqual([])
  })
})

describe('calculateRFM', () => {
  it('should return empty results for empty input', () => {
    const { results, stats } = calculateRFM([], REF_DATE)
    expect(results).toEqual([])
    expect(stats.total_donatur).toBe(0)
  })

  it('should return correct number of results', () => {
    const { results } = calculateRFM(SAMPLE_DATA, REF_DATE)
    expect(results).toHaveLength(10)
  })

  it('should calculate correct recency (days since last donation)', () => {
    const { results } = calculateRFM(SAMPLE_DATA, REF_DATE)
    const champion = results.find(r => r.id_donatur === 'D-001')!
    // 2025-12-30 → 2026-01-01 = 2 days
    expect(champion.recency).toBe(2)

    const lost = results.find(r => r.id_donatur === 'D-005')!
    // 2024-06-01 → 2026-01-01 = 579 days
    expect(lost.recency).toBe(579)
  })

  it('should assign scores between 1-5', () => {
    const { results } = calculateRFM(SAMPLE_DATA, REF_DATE)
    results.forEach(r => {
      expect(r.r_score).toBeGreaterThanOrEqual(1)
      expect(r.r_score).toBeLessThanOrEqual(5)
      expect(r.f_score).toBeGreaterThanOrEqual(1)
      expect(r.f_score).toBeLessThanOrEqual(5)
      expect(r.m_score).toBeGreaterThanOrEqual(1)
      expect(r.m_score).toBeLessThanOrEqual(5)
    })
  })

  it('should assign higher R score to more recent donors', () => {
    const { results } = calculateRFM(SAMPLE_DATA, REF_DATE)
    const champion = results.find(r => r.id_donatur === 'D-001')! // 2 days ago
    const lost = results.find(r => r.id_donatur === 'D-005')!     // 549 days ago
    expect(champion.r_score).toBeGreaterThan(lost.r_score)
  })

  it('should assign higher F score to more frequent donors', () => {
    const { results } = calculateRFM(SAMPLE_DATA, REF_DATE)
    const champion = results.find(r => r.id_donatur === 'D-001')! // 50 txns
    const lost = results.find(r => r.id_donatur === 'D-005')!     // 1 txn
    expect(champion.f_score).toBeGreaterThan(lost.f_score)
  })

  it('should produce valid segment keys', () => {
    const VALID_SEGMENTS = [
      'champions', 'loyal', 'potential', 'new_donors', 'promising',
      'need_attention', 'at_risk', 'hibernating', 'lost'
    ]
    const { results } = calculateRFM(SAMPLE_DATA, REF_DATE)
    results.forEach(r => {
      expect(VALID_SEGMENTS).toContain(r.segment_key)
    })
  })

  it('should compute rfm_score as average of r, f, m scores', () => {
    const { results } = calculateRFM(SAMPLE_DATA, REF_DATE)
    results.forEach(r => {
      const expected = Math.round(((r.r_score + r.f_score + r.m_score) / 3) * 100) / 100
      expect(r.rfm_score).toBe(expected)
    })
  })

  it('should normalize values between 0 and 1', () => {
    const { results } = calculateRFM(SAMPLE_DATA, REF_DATE)
    results.forEach(r => {
      expect(r.r_normalized).toBeGreaterThanOrEqual(0)
      expect(r.r_normalized).toBeLessThanOrEqual(1)
      expect(r.f_normalized).toBeGreaterThanOrEqual(0)
      expect(r.f_normalized).toBeLessThanOrEqual(1)
      expect(r.m_normalized).toBeGreaterThanOrEqual(0)
      expect(r.m_normalized).toBeLessThanOrEqual(1)
    })
  })

  it('should compute reasonable stats', () => {
    const { stats } = calculateRFM(SAMPLE_DATA, REF_DATE)
    expect(stats.total_donatur).toBe(10)
    expect(stats.avg_recency).toBeGreaterThan(0)
    expect(stats.avg_frequency).toBeGreaterThan(0)
    expect(stats.avg_monetary).toBeGreaterThan(0)
    expect(stats.median_recency).toBeGreaterThan(0)
  })
})
