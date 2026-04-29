/**
 * Types untuk Reports
 * ===================
 * Interface yang digunakan di /reports dan API terkait.
 */

// ---- Reports Page State ----

export interface ReportsSummary {
  system: {
    status: string
    version: string
    last_sync: string
  }
  totals: {
    donatur: number
    mustahik: number
    ambulan: number
  }
  growth: {
    donatur_new: number
    mustahik_new: number
    ambulan_this_month: number
  }
}

export interface DonaturStats {
  tipe: string | null
  _count: { id_donatur: number }
}

export interface DonaturReport {
  stats: DonaturStats[]
  insights: {
    total_historical_changes: number
    corporate_donors: number
  }
}

export interface AmbulanWaktu {
  jam: string
  _count: { id_transaksi: number }
}

export interface AmbulanReport {
  perWaktu: AmbulanWaktu[]
  insight_summary: {
    most_busy_armada: {
      armada: string
      _count: { id_transaksi: number }
    }
  }
}

export interface MustahikLocation {
  kabupaten_kota: string
  _count: { id_mustahik: number }
}

export interface MustahikReport {
  insights: {
    top_locations: MustahikLocation[]
    avg_score: number
    new_registrations_3m: number
  }
}

// ---- Generic Report Item (used in export functions) ----

export interface ReportExportItem {
  tipe?: string | null
  armada?: string | null
  kategori_pm?: string | null
  jam?: string | null
  kabupaten_kota?: string | null
  _count?: {
    id_donatur?: number
    id_transaksi?: number
    id_mustahik?: number
  }
}

/**
 * Extract label dari report item berdasarkan domain
 */
export function getReportItemLabel(item: ReportExportItem): string {
  return item.tipe || item.armada || item.kategori_pm || item.jam || item.kabupaten_kota || 'N/A'
}

/**
 * Extract total count dari report item
 */
export function getReportItemCount(item: ReportExportItem): number {
  return item._count?.id_donatur || item._count?.id_transaksi || item._count?.id_mustahik || 0
}
