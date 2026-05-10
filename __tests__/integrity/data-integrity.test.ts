/**
 * Data Integrity Tests
 * =====================
 * Ensures consistency between validators, Prisma enums, and config objects.
 * Also covers Financial Precision, Idempotency, and API Contract checks.
 */
import { describe, it, expect } from 'vitest'
import { SEGMENT_CONFIGS, SEGMENT_ORDER } from '@/lib/constants-segmentasi'
import {
  validateDonasiRow,
  validateMustahikRow,
  validatePenyaluranRow,
  validateAmbulanLayananRow,
  validateAmbulanAktivitasRow,
  chunk,
} from '@/lib/import-validation'
import { determineKelayakan, calculateAverage } from '@/lib/calc-survey'
import { generateSkDate, formatRupiah } from '@/lib/utils-ambulan'

// ═══════════════════════════════════════════════════════════════════════════════
// ENUM CONSISTENCY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Enum Consistency with Prisma Schema', () => {
  // These are the valid values defined in the Prisma schema for each enum
  const PRISMA_TIPE_DONATUR = ['Individu', 'Lembaga/Korporasi', 'Komunitas']
  const PRISMA_GENDER = ['L', 'P']
  const PRISMA_KATEGORI_PM = ['Fakir', 'Miskin', 'Amil', 'Muallaf', 'Riqab', 'Gharimin', 'Fisabilillah', 'Ibnu Sabil']
  const PRISMA_METODE_BAYAR = ['Transfer Bank', 'Tunai', 'QRIS', 'E-Wallet', 'Virtual Account', 'Jemput Donasi', 'Lainnya']

  it('valid tipe_donatur should pass donasi validation', () => {
    PRISMA_TIPE_DONATUR.forEach(tipe => {
      const { errors } = validateDonasiRow({
        tanggal: '15/04/2024',
        nama_donatur: 'Test User',
        tipe_donatur: tipe,
        nominal_valid: 100000,
        metode_bayar: 'Tunai',
        program_induk: 'Pendidikan',
        nama_petugas: 'Petugas',
      }, 1)
      const tipeErrors = errors.filter(e => e.field === 'tipe_donatur')
      expect(tipeErrors).toHaveLength(0)
    })
  })

  it('valid gender values should pass mustahik validation', () => {
    PRISMA_GENDER.forEach(g => {
      const { errors } = validateMustahikRow({
        nama: 'Test User',
        nik: '6171012345678901',
        gender: g,
        alamat: 'Jl. Test',
        kabupaten_kota: 'Kota Pontianak',
        kategori_pm: 'Fakir',
        jumlah_jiwa: 1,
      }, 1)
      const genderErrors = errors.filter(e => e.field === 'gender')
      expect(genderErrors).toHaveLength(0)
    })
  })

  it('all kategori_pm values should pass mustahik validation', () => {
    PRISMA_KATEGORI_PM.forEach(kat => {
      const { errors } = validateMustahikRow({
        nama: 'Test User',
        nik: '6171012345678901',
        gender: 'L',
        alamat: 'Jl. Test',
        kabupaten_kota: 'Kota Pontianak',
        kategori_pm: kat,
        jumlah_jiwa: 1,
      }, 1)
      const katErrors = errors.filter(e => e.field === 'kategori_pm')
      expect(katErrors).toHaveLength(0)
    })
  })

  it('all metode_bayar values should pass donasi validation', () => {
    PRISMA_METODE_BAYAR.forEach(metode => {
      const { errors } = validateDonasiRow({
        tanggal: '15/04/2024',
        nama_donatur: 'Test User',
        tipe_donatur: 'Individu',
        nominal_valid: 100000,
        metode_bayar: metode,
        program_induk: 'Pendidikan',
        nama_petugas: 'Petugas',
      }, 1)
      const metodeErrors = errors.filter(e => e.field === 'metode_bayar')
      expect(metodeErrors).toHaveLength(0)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCIAL PRECISION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Financial Precision', () => {
  it('formatRupiah should not lose precision on large amounts', () => {
    const amount = 999999999999 // ~1 Triliun
    const formatted = formatRupiah(amount)
    expect(formatted).toContain('999.999.999.999')
  })

  it('donasi nominal validation should reject floating point amounts', () => {
    // Classic floating point: 0.1 + 0.2 = 0.30000000000000004
    const { errors } = validateDonasiRow({
      tanggal: '15/04/2024',
      nama_donatur: 'Test User',
      tipe_donatur: 'Individu',
      nominal_valid: 0.1 + 0.2, // 0.30000000000000004
      metode_bayar: 'Tunai',
      program_induk: 'Pendidikan',
      nama_petugas: 'Petugas',
    }, 1)
    // Should fail because it's not an integer and < 1000
    expect(errors.length).toBeGreaterThan(0)
  })

  it('survey score calculation should produce clean percentages', () => {
    // 3 questions all scored 4 → total=12, count=3, max=15 → 80%
    const avg = calculateAverage({ q1: 4, q2: 4, q3: 4 })
    expect(avg).toBe(80)
    expect(Number.isInteger(avg) || (avg * 100) % 1 === 0).toBe(true) // clean number
  })

  it('kelayakan boundaries should be deterministic at exact boundary values', () => {
    // Run 1000 times at boundary — must always return same result
    for (let i = 0; i < 1000; i++) {
      expect(determineKelayakan(80).value).toBe('Sangat_Layak')
      expect(determineKelayakan(79.9999999).value).toBe('Layak')
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// IDEMPOTENCY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Validation Idempotency', () => {
  const row = {
    tanggal: '15/04/2024',
    nama_donatur: 'Ahmad Fauzi',
    tipe_donatur: 'Individu',
    nominal_valid: 100000,
    metode_bayar: 'Transfer Bank',
    program_induk: 'Pendidikan',
    nama_petugas: 'Petugas',
  }

  it('should produce identical results when validating same row twice', () => {
    const result1 = validateDonasiRow(row, 1)
    const result2 = validateDonasiRow(row, 1)

    expect(result1.errors.length).toBe(result2.errors.length)
    expect(result1.parsed).toEqual(result2.parsed)
  })

  it('should not mutate the input row object', () => {
    const rowCopy = JSON.parse(JSON.stringify(row))
    validateDonasiRow(row, 1)
    expect(row).toEqual(rowCopy)
  })

  it('generateSkDate should return same value for same date', () => {
    const date = new Date(2026, 3, 15)
    const result1 = generateSkDate(date)
    const result2 = generateSkDate(date)
    expect(result1).toBe(result2)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// API CONTRACT (Response Shape)
// ═══════════════════════════════════════════════════════════════════════════════

describe('API Contract — Expected Response Shapes', () => {
  it('validateDonasiRow parsed output should have all required fields', () => {
    const { parsed } = validateDonasiRow({
      tanggal: '15/04/2024',
      nama_donatur: 'Test User',
      tipe_donatur: 'Individu',
      nominal_valid: 100000,
      metode_bayar: 'Tunai',
      program_induk: 'Pendidikan',
      nama_petugas: 'Petugas',
    }, 1)

    expect(parsed).toHaveProperty('tanggal')
    expect(parsed).toHaveProperty('nama_donatur')
    expect(parsed).toHaveProperty('tipe_donatur')
    expect(parsed).toHaveProperty('nominal_valid')
    expect(parsed).toHaveProperty('metode_bayar')
    expect(parsed).toHaveProperty('program_induk')
    expect(parsed).toHaveProperty('nama_petugas')
    expect(typeof parsed!.nominal_valid).toBe('number')
  })

  it('validateMustahikRow parsed output should have all required fields', () => {
    const { parsed } = validateMustahikRow({
      nama: 'Test User',
      nik: '6171012345678901',
      gender: 'L',
      alamat: 'Jl. Test',
      kabupaten_kota: 'Kota Pontianak',
      kategori_pm: 'Fakir',
      jumlah_jiwa: 3,
    }, 1)

    expect(parsed).toHaveProperty('nama')
    expect(parsed).toHaveProperty('nik')
    expect(parsed).toHaveProperty('gender')
    expect(parsed).toHaveProperty('alamat')
    expect(parsed).toHaveProperty('kabupaten_kota')
    expect(parsed).toHaveProperty('kategori_pm')
    expect(parsed).toHaveProperty('jumlah_jiwa')
    expect(typeof parsed!.jumlah_jiwa).toBe('number')
  })

  it('SEGMENT_CONFIGS should follow SegmentConfig contract for every segment', () => {
    Object.values(SEGMENT_CONFIGS).forEach(config => {
      // Every config must have the recommendation sub-object
      expect(typeof config.recommendation.title).toBe('string')
      expect(typeof config.recommendation.description).toBe('string')
      expect(Array.isArray(config.recommendation.channels)).toBe(true)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR RECOVERY
// ═══════════════════════════════════════════════════════════════════════════════

describe('Error Recovery — Partial Batch Handling', () => {
  it('should correctly count valid vs invalid rows in a mixed batch', () => {
    const rows = [
      // 3 valid
      { id_transaksi_donasi: 'TRX-1', tanggal: '15/04/2024', nama_donatur: 'User Satu', tipe_donatur: 'Individu', nominal_valid: 100000, metode_bayar: 'Tunai', program_induk: 'Pendidikan', nama_petugas: 'Petugas' },
      { id_transaksi_donasi: 'TRX-2', tanggal: '15/04/2024', nama_donatur: 'User Dua', tipe_donatur: 'Individu', nominal_valid: 200000, metode_bayar: 'QRIS', program_induk: 'Kesehatan', nama_petugas: 'Petugas' },
      { id_transaksi_donasi: 'TRX-3', tanggal: '15/04/2024', nama_donatur: 'User Tiga', tipe_donatur: 'Komunitas', nominal_valid: 300000, metode_bayar: 'Tunai', program_induk: 'Ekonomi', nama_petugas: 'Petugas' },
      // 2 invalid
      { id_transaksi_donasi: '', tanggal: 'invalid', nama_donatur: 'ab', tipe_donatur: 'XX', nominal_valid: 'not', metode_bayar: 'XX', program_induk: 'XX', nama_petugas: '' },
      { id_transaksi_donasi: 'TRX-5', tanggal: '99/99/9999', nama_donatur: 'invalid case', tipe_donatur: 'Individu', nominal_valid: -500, metode_bayar: 'Tunai', program_induk: 'Pendidikan', nama_petugas: 'Petugas' },
    ]

    let validCount = 0
    let errorCount = 0
    const allErrors: any[] = []

    rows.forEach((row, i) => {
      const { errors, parsed } = validateDonasiRow(row, i + 1)
      if (parsed) validCount++
      else errorCount++
      allErrors.push(...errors)
    })

    expect(validCount).toBe(3)
    expect(errorCount).toBe(2)
    expect(allErrors.length).toBeGreaterThan(0)
  })

  it('valid rows in a batch should not be affected by invalid rows', () => {
    const validRow = {
      id_transaksi_donasi: 'TRX-VALID',
      tanggal: '15/04/2024',
      nama_donatur: 'Valid User',
      tipe_donatur: 'Individu',
      nominal_valid: 100000,
      metode_bayar: 'Tunai',
      program_induk: 'Pendidikan',
      nama_petugas: 'Petugas',
    }

    // Validate invalid row first
    validateDonasiRow({ nama_donatur: 'invalid' } as any, 1)

    // Then validate valid row — should still pass
    const { parsed } = validateDonasiRow(validRow, 2)
    expect(parsed).not.toBeNull()
    expect(parsed!.nama_donatur).toBe('Valid User')
  })
})
