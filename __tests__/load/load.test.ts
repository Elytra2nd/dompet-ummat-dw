/**
 * Load / Stress Tests
 * ====================
 * Validates performance under heavy data volumes.
 * Target: 10,000 rows validated in < 3 seconds.
 */
import { describe, it, expect } from 'vitest'
import {
  validateDonasiRow,
  validateMustahikRow,
  validateAmbulanAktivitasRow,
  chunk,
} from '@/lib/import-validation'

// ═══════════════════════════════════════════════════════════════════════════════
// BULK VALIDATION PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Bulk Donasi Validation (10,000 rows)', () => {
  it('should validate 10,000 valid donasi rows in < 3 seconds', () => {
    const rows: Record<string, unknown>[] = []
    for (let i = 0; i < 10000; i++) {
      rows.push({
        id_transaksi_donasi: `TRX-${String(i).padStart(5, '0')}`,
        tanggal: '15/04/2024',
        nama_donatur: 'Ahmad Fauzi',
        tipe_donatur: 'Individu',
        nominal_valid: 100000 + i,
        metode_bayar: 'Transfer Bank',
        program_induk: 'Pendidikan',
        nama_petugas: 'Petugas Test',
      })
    }

    const start = performance.now()
    let validCount = 0
    let errorCount = 0

    rows.forEach((row, i) => {
      const { parsed } = validateDonasiRow(row, i + 1)
      if (parsed) validCount++
      else errorCount++
    })

    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(3000) // < 3 seconds
    expect(validCount).toBe(10000)
    expect(errorCount).toBe(0)

    console.log(`✅ 10,000 donasi rows validated in ${elapsed.toFixed(0)}ms`)
  })

  it('should validate 10,000 invalid rows (all errors) in < 3 seconds', () => {
    const rows: Record<string, unknown>[] = []
    for (let i = 0; i < 10000; i++) {
      rows.push({
        id_transaksi_donasi: '', // missing
        tanggal: 'invalid',
        nama_donatur: 'ab', // too short
        tipe_donatur: 'Invalid',
        nominal_valid: 'not a number',
        metode_bayar: 'Invalid',
        program_induk: 'Invalid',
        nama_petugas: '',
      })
    }

    const start = performance.now()
    let errorCount = 0

    rows.forEach((row, i) => {
      const { errors } = validateDonasiRow(row, i + 1)
      if (errors.length > 0) errorCount++
    })

    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(3000)
    expect(errorCount).toBe(10000)

    console.log(`✅ 10,000 invalid donasi rows validated in ${elapsed.toFixed(0)}ms`)
  })
})

describe('Bulk Mustahik Validation (10,000 rows)', () => {
  it('should validate 10,000 mustahik rows in < 3 seconds', () => {
    const rows: Record<string, unknown>[] = []
    for (let i = 0; i < 10000; i++) {
      rows.push({
        nama: 'Siti Aminah',
        nik: `617101${String(i).padStart(10, '0')}`,
        gender: i % 2 === 0 ? 'L' : 'P',
        alamat: 'Jl. Test No. ' + i,
        kabupaten_kota: 'Kota Pontianak',
        kategori_pm: 'Fakir',
        jumlah_jiwa: (i % 8) + 1,
      })
    }

    const start = performance.now()
    let validCount = 0

    rows.forEach((row, i) => {
      const { parsed } = validateMustahikRow(row, i + 1)
      if (parsed) validCount++
    })

    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(3000)
    expect(validCount).toBe(10000)

    console.log(`✅ 10,000 mustahik rows validated in ${elapsed.toFixed(0)}ms`)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// CHUNK UTILITY PERFORMANCE
// ═══════════════════════════════════════════════════════════════════════════════

describe('chunk() Performance', () => {
  it('should chunk 100,000 items correctly and quickly', () => {
    const largeArray = Array.from({ length: 100000 }, (_, i) => i)

    const start = performance.now()
    const result = chunk(largeArray, 500)
    const elapsed = performance.now() - start

    expect(result.length).toBe(200) // 100000 / 500
    expect(result[0].length).toBe(500)
    expect(result[199].length).toBe(500)
    expect(elapsed).toBeLessThan(500) // < 500ms

    console.log(`✅ 100,000 items chunked (size=500) in ${elapsed.toFixed(0)}ms`)
  })

  it('should chunk 1,000,000 items without running out of memory', () => {
    const largeArray = Array.from({ length: 1000000 }, (_, i) => i)

    const start = performance.now()
    const result = chunk(largeArray, 1000)
    const elapsed = performance.now() - start

    expect(result.length).toBe(1000)
    expect(elapsed).toBeLessThan(2000)

    console.log(`✅ 1,000,000 items chunked (size=1000) in ${elapsed.toFixed(0)}ms`)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// MEMORY STABILITY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Memory Stability', () => {
  it('should not accumulate excessive error objects in batch validation', () => {
    const allErrors: any[] = []

    for (let i = 0; i < 5000; i++) {
      const { errors } = validateAmbulanAktivitasRow({
        id_transaksi: '',
        tanggal_aktivitas: 'invalid',
        jam: 'invalid',
        armada: 'invalid',
        kategori_aktivitas: 'invalid',
        biaya_operasional: 'invalid',
      }, i + 1)
      allErrors.push(...errors)
    }

    // 5000 rows × ~6 errors each ≈ 30,000 error objects
    // This should be manageable — just verifying it doesn't crash
    expect(allErrors.length).toBeGreaterThan(25000)
    expect(allErrors.length).toBeLessThan(40000)

    console.log(`✅ 5,000 invalid rows produced ${allErrors.length} error objects without crash`)
  })
})
