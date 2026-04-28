export function determineKelayakan(totalSkor: number): { label: string, value: string } {
  if (totalSkor >= 80) return { label: 'Sangat Layak', value: 'Sangat_Layak' }
  if (totalSkor >= 60) return { label: 'Layak', value: 'Layak' }
  if (totalSkor >= 40) return { label: 'Dipertimbangkan', value: 'Dipertimbangkan' }
  return { label: 'Tidak Layak', value: 'Tidak_Layak' }
}

export function calculateAverage(scores: { [key: string]: number }): number {
  const values = Object.values(scores)
  if (values.length === 0) return 0
  const total = values.reduce((acc, curr) => acc + curr, 0)
  // Asumsi skor maksimal per pertanyaan adalah 5, kita konversi ke skala 100
  return (total / (values.length * 5)) * 100
}
