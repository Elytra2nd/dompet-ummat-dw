/**
 * Mengonversi objek Date menjadi Smart Date Key (integer)
 * Contoh: 2026-04-15 -> 20260415
 */
export function generateSkDate(date: Date = new Date()): number {
  const yyyy = date.getFullYear().toString()
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const dd = date.getDate().toString().padStart(2, '0')
  return parseInt(yyyy + mm + dd)
}

/**
 * Format angka ke Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * Helper untuk membersihkan string koordinat
 */
export function parseCoord(coord: string | number): number {
  const parsed = typeof coord === 'string' ? parseFloat(coord) : coord
  return isNaN(parsed) ? 0 : parsed
}
