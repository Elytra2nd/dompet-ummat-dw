/**
 * RFM Calculation Module
 * =====================
 * Menghitung Recency, Frequency, dan Monetary dari data donatur.
 * Assign quintile scores (1-5) dan segment labels.
 */

// ---- Types ----

export interface RFMInput {
  sk_donatur: number
  id_donatur: string
  nama_lengkap: string
  last_donation_date: string   // ISO date
  total_transactions: number
  total_amount: number
}

export interface RFMResult {
  sk_donatur: number
  id_donatur: string
  nama_lengkap: string
  recency: number       // hari sejak donasi terakhir
  frequency: number     // jumlah transaksi
  monetary: number      // total nominal (Rp)
  r_normalized: number  // 0-1 setelah Min-Max
  f_normalized: number
  m_normalized: number
  r_score: number       // 1-5 (quintile)
  f_score: number
  m_score: number
  rfm_score: number     // rata-rata (r+f+m)/3
  segment_key: string   // key internal (champions, loyal, dll)
  segment_label: string // label user-friendly
}

export interface RFMStats {
  total_donatur: number
  avg_recency: number
  avg_frequency: number
  avg_monetary: number
  median_recency: number
  median_frequency: number
  median_monetary: number
}

// ---- Core Functions ----

/**
 * Hitung hari antara dua tanggal
 */
function daysBetween(dateStr: string, referenceDate: Date): number {
  const d = new Date(dateStr)
  const diffMs = referenceDate.getTime() - d.getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}

/**
 * Hitung median dari array angka
 */
function median(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * Assign quintile scores (1-5) menggunakan pd.qcut equivalent
 * Untuk Recency: semakin KECIL (baru) → skor semakin TINGGI (5)
 * Untuk Frequency & Monetary: semakin BESAR → skor semakin TINGGI (5)
 */
function assignQuintileScores(
  values: number[],
  inverse: boolean = false
): number[] {
  if (values.length === 0) return []

  // Sort indices by value
  const indexed = values.map((v, i) => ({ value: v, index: i }))
  indexed.sort((a, b) => a.value - b.value)

  const n = indexed.length
  const scores = new Array(n).fill(0)

  for (let i = 0; i < n; i++) {
    // Quintile bucket: 1-5
    const bucket = Math.min(5, Math.floor((i / n) * 5) + 1)
    scores[indexed[i].index] = inverse ? (6 - bucket) : bucket
  }

  return scores
}

/**
 * Min-Max Normalization: x' = (x - min) / (max - min)
 */
export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  if (range === 0) return values.map(() => 0)
  return values.map(v => (v - min) / range)
}

/**
 * Main function: hitung RFM dari data donatur
 */
export function calculateRFM(
  data: RFMInput[],
  referenceDate: Date = new Date()
): { results: RFMResult[]; stats: RFMStats } {
  if (data.length === 0) {
    return {
      results: [],
      stats: {
        total_donatur: 0,
        avg_recency: 0, avg_frequency: 0, avg_monetary: 0,
        median_recency: 0, median_frequency: 0, median_monetary: 0,
      },
    }
  }

  // Step 1: Hitung raw R, F, M
  const recencies = data.map(d => daysBetween(d.last_donation_date, referenceDate))
  const frequencies = data.map(d => d.total_transactions)
  const monetaries = data.map(d => d.total_amount)

  // Step 2: Assign quintile scores
  const rScores = assignQuintileScores(recencies, true)  // inverse: kecil = baik
  const fScores = assignQuintileScores(frequencies, false)
  const mScores = assignQuintileScores(monetaries, false)

  // Step 3: Normalisasi Min-Max
  const rNorm = minMaxNormalize(recencies)
  const fNorm = minMaxNormalize(frequencies)
  const mNorm = minMaxNormalize(monetaries)

  // Step 4: Assign segment labels
  const results: RFMResult[] = data.map((d, i) => {
    const rfmScore = (rScores[i] + fScores[i] + mScores[i]) / 3
    const segmentKey = getSegmentKey(rScores[i], fScores[i], mScores[i])

    return {
      sk_donatur: d.sk_donatur,
      id_donatur: d.id_donatur,
      nama_lengkap: d.nama_lengkap,
      recency: recencies[i],
      frequency: frequencies[i],
      monetary: monetaries[i],
      r_normalized: rNorm[i],
      f_normalized: fNorm[i],
      m_normalized: mNorm[i],
      r_score: rScores[i],
      f_score: fScores[i],
      m_score: mScores[i],
      rfm_score: Math.round(rfmScore * 100) / 100,
      segment_key: segmentKey,
      segment_label: '', // akan diisi dari constants-segmentasi.ts
    }
  })

  // Step 5: Stats
  const stats: RFMStats = {
    total_donatur: data.length,
    avg_recency: Math.round(recencies.reduce((a, b) => a + b, 0) / recencies.length),
    avg_frequency: Math.round((frequencies.reduce((a, b) => a + b, 0) / frequencies.length) * 100) / 100,
    avg_monetary: Math.round(monetaries.reduce((a, b) => a + b, 0) / monetaries.length),
    median_recency: median(recencies),
    median_frequency: median(frequencies),
    median_monetary: median(monetaries),
  }

  return { results, stats }
}

/**
 * Mapping RFM scores ke segment key
 * Berdasarkan aturan yang sudah didefinisikan di BAB IV laporan
 */
function getSegmentKey(r: number, f: number, m: number): string {
  const avg = (r + f + m) / 3

  // Champions: R tinggi, F tinggi, M tinggi
  if (r >= 4 && f >= 4 && m >= 4) return 'champions'

  // Loyal: F tinggi
  if (f >= 4 && r >= 3) return 'loyal'

  // Potential Loyalist: R tinggi, F sedang
  if (r >= 4 && f >= 2 && f <= 4) return 'potential'

  // New Donors: R tinggi, F rendah
  if (r >= 4 && f <= 2) return 'new_donors'

  // Promising: R sedang-tinggi, F rendah, M rendah-sedang
  if (r >= 3 && f <= 2) return 'promising'

  // Need Attention: R sedang, F sedang, M sedang
  if (r >= 2 && r <= 4 && f >= 2 && f <= 4 && avg >= 2.5) return 'need_attention'

  // At Risk: R rendah, F tinggi (dulu aktif, sekarang tidak)
  if (r <= 2 && f >= 3) return 'at_risk'

  // Hibernating: R rendah, F rendah-sedang
  if (r <= 2 && f <= 3 && avg >= 1.5) return 'hibernating'

  // Lost: semua rendah
  return 'lost'
}
