export function determineKelayakan(totalSkor: number): string {
  if (totalSkor >= 80) return 'Sangat Layak'
  if (totalSkor >= 60) return 'Layak'
  if (totalSkor >= 40) return 'Dipertimbangkan'
  return 'Tidak Layak'
}

export function calculateAverage(scores: { [key: string]: number }): number {
  const values = Object.values(scores)
  if (values.length === 0) return 0
  const total = values.reduce((acc, curr) => acc + curr, 0)
  // Asumsi skor maksimal per pertanyaan adalah 5, kita konversi ke skala 100
  return (total / (values.length * 5)) * 100
}
