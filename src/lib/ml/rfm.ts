/**
 * RFM Calculation Module
 * Menghitung Recency, Frequency, dan Monetary dari data donatur
 */

export interface RFMResult {
  id_donatur: string
  nama: string
  recency: number      // dalam hari
  frequency: number    // jumlah transaksi
  monetary: number     // total nominal (Rp)
  r_score: number      // 1-5
  f_score: number      // 1-5
  m_score: number      // 1-5
  rfm_score: number    // rata-rata
  segment: string      // label segmen
}

export interface RFMInput {
  id_donatur: string
  nama: string
  last_date: string    // ISO date string
  frequency: number
  monetary: number
}

/**
 * Hitung nilai RFM dari data donatur
 * @param data - Array data donatur dari database
 * @param referenceDate - Tanggal referensi untuk menghitung Recency
 */
export function calculateRFM(
  data: RFMInput[],
  referenceDate: Date = new Date()
): RFMResult[] {
  // TODO: Implementasi penuh nanti
  // 1. Hitung Recency
  // 2. Assign quintile scores (1-5)
  // 3. Assign segment labels
  return []
}
