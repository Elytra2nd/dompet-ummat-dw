/**
 * Segmentasi Query — Shared SQL + Transform
 * ==========================================
 * Satu sumber kebenaran untuk query data RFM.
 * Digunakan oleh: /api/segmentasi/run, /donatur, /compare
 */

import { db } from '@/lib/db'
import type { RFMInput } from '@/lib/ml/rfm'

/**
 * Row yang dikembalikan dari query SQL
 */
export interface DonaturRawRow {
  sk_donatur: number
  id_donatur: string
  nama_lengkap: string
  tipe?: string
  kontak_utama?: string
  last_donation_date: Date | string
  total_transactions: number
  total_amount: number
}

/**
 * Opsi untuk query — bisa include field tambahan
 */
interface QueryOptions {
  /** Include kolom tipe dan kontak_utama */
  includeProfile?: boolean
}

/**
 * Query data donatur dari Data Warehouse untuk keperluan RFM.
 * Mengembalikan raw rows dari database.
 */
export async function queryDonaturRFM(
  conn: any,
  options: QueryOptions = {}
): Promise<DonaturRawRow[]> {
  const { includeProfile = false } = options

  const profileCols = includeProfile ? ',\n        d.tipe,\n        d.kontak_utama' : ''
  const profileGroup = includeProfile ? ', d.tipe, d.kontak_utama' : ''

  const rows = await conn.query(`
    SELECT
      d.sk_donatur,
      d.id_donatur,
      d.nama_lengkap${profileCols},
      MAX(dd.tanggal) AS last_donation_date,
      COUNT(f.sk_fakta_donasi) AS total_transactions,
      COALESCE(SUM(f.nominal_valid), 0) AS total_amount
    FROM fact_donasi f
    JOIN dim_donatur d ON f.sk_donatur = d.sk_donatur
    JOIN dim_date dd ON f.sk_tgl_bersih = dd.sk_date
    WHERE d.sk_donatur > 0
      AND d.is_active = 1
      AND f.nominal_valid > 0
    GROUP BY d.sk_donatur, d.id_donatur, d.nama_lengkap${profileGroup}
    HAVING total_transactions >= 1
    ORDER BY total_amount DESC
  `)

  return rows || []
}

/**
 * Transform raw rows ke RFMInput format yang dipakai oleh calculateRFM()
 */
export function transformToRFMInput(rows: DonaturRawRow[]): RFMInput[] {
  return rows.map((row) => ({
    sk_donatur: Number(row.sk_donatur),
    id_donatur: String(row.id_donatur),
    nama_lengkap: String(row.nama_lengkap || 'Tanpa Nama'),
    last_donation_date: row.last_donation_date
      ? new Date(row.last_donation_date as string).toISOString()
      : new Date().toISOString(),
    total_transactions: Number(row.total_transactions),
    total_amount: Number(row.total_amount),
  }))
}

/**
 * Shortcut: Query + Transform sekaligus
 */
export async function fetchRFMData(
  conn: any,
  options: QueryOptions = {}
): Promise<{ rows: DonaturRawRow[]; rfmInput: RFMInput[] }> {
  const rows = await queryDonaturRFM(conn, options)
  const rfmInput = transformToRFMInput(rows)
  return { rows, rfmInput }
}
