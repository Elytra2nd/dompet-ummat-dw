/**
 * CRUD Tests — All Business Modules
 * ====================================
 * Tests API route handlers with mocked Prisma client.
 * Covers: Mustahik, Donasi, Penyaluran, Survey, Ambulan Layanan, Ambulan Aktivitas.
 *
 * Strategy: Mock `@/lib/prisma` globally so all API handlers use the fake Prisma.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK PRISMA
// ═══════════════════════════════════════════════════════════════════════════════

const mockPrisma = {
  dim_mustahik: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  dim_lokasi: {
    create: vi.fn(),
  },
  dim_donatur: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  dim_pasien_ambulan: {
    create: vi.fn(),
  },
  fact_donasi: {
    create: vi.fn(),
  },
  fact_penyaluran: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  fact_layanan_ambulan: {
    create: vi.fn(),
  },
  fact_aktivitas_ambulan: {
    count: vi.fn(),
    aggregate: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  fact_skor_kelayakan: {
    create: vi.fn(),
  },
  fact_survey: {
    create: vi.fn(),
  },
  fact_survey_detail: {
    createMany: vi.fn(),
  },
  $transaction: vi.fn((fn: any) => fn(mockPrisma)),
}

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

beforeEach(() => {
  vi.clearAllMocks()
})

// Helper: create a Request object with JSON body
function createJsonRequest(url: string, body: any, method = 'POST'): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ═══════════════════════════════════════════════════════════════════════════════
// MUSTAHIK MODULE — Full CRUD
// ═══════════════════════════════════════════════════════════════════════════════

describe('Mustahik CRUD', () => {
  describe('GET /api/mustahik/index — Read All', () => {
    it('should return formatted mustahik list with coordinates', async () => {
      const { GET } = await import('@/app/api/mustahik/index/route')

      mockPrisma.dim_mustahik.findMany.mockResolvedValue([
        {
          sk_mustahik: 1,
          id_mustahik: 'MST-KES-0001',
          nama: 'Siti Aminah',
          is_active: true,
          dim_lokasi: { latitude: -0.0263, longitude: 109.3425 },
        },
      ])

      const res = await GET()
      const data = await res.json()

      expect(Array.isArray(data)).toBe(true)
      expect(data[0].latitude).toBeCloseTo(-0.0263)
      expect(data[0].longitude).toBeCloseTo(109.3425)
      expect(data[0].nama).toBe('Siti Aminah')
    })

    it('should return empty array when no mustahik exists', async () => {
      const { GET } = await import('@/app/api/mustahik/index/route')
      mockPrisma.dim_mustahik.findMany.mockResolvedValue([])

      const res = await GET()
      const data = await res.json()

      expect(data).toEqual([])
    })

    it('should return 500 on database error', async () => {
      const { GET } = await import('@/app/api/mustahik/index/route')
      mockPrisma.dim_mustahik.findMany.mockRejectedValue(new Error('DB connection lost'))

      const res = await GET()
      expect(res.status).toBe(500)
    })
  })

  describe('POST /api/mustahik/index — Create', () => {
    it('should create mustahik with location', async () => {
      const { POST } = await import('@/app/api/mustahik/index/route')

      mockPrisma.dim_lokasi.create.mockResolvedValue({ sk_lokasi: 10 })
      mockPrisma.dim_mustahik.create.mockResolvedValue({
        sk_mustahik: 1,
        id_mustahik: 'MST-12345',
        nama: 'Test Mustahik',
      })

      const req = createJsonRequest('http://localhost/api/mustahik/index', {
        nama: 'Test Mustahik',
        nik: '6171012345678901',
        alamat: 'Jl. Test',
        kabupaten_kota: 'Kota Pontianak',
        kategori_pm: 'Fakir',
        latitude: -0.0263,
        longitude: 109.3425,
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.nama).toBe('Test Mustahik')
      expect(mockPrisma.dim_lokasi.create).toHaveBeenCalledOnce()
      expect(mockPrisma.dim_mustahik.create).toHaveBeenCalledOnce()
    })
  })

  describe('PUT /api/mustahik/index — Update (SCD Type 2)', () => {
    it('should deactivate old record and create new one', async () => {
      const { PUT } = await import('@/app/api/mustahik/index/route')

      const oldData = {
        sk_mustahik: 1,
        id_mustahik: 'MST-KES-0001',
        nama: 'Old Name',
        is_active: true,
      }
      mockPrisma.dim_mustahik.findUnique.mockResolvedValue(oldData)
      mockPrisma.dim_mustahik.findMany.mockResolvedValue([{ id_mustahik: 'MST-KES-0001' }]) // Mock existing versions
      mockPrisma.dim_mustahik.update.mockResolvedValue({ ...oldData, is_active: false })
      mockPrisma.dim_lokasi.create.mockResolvedValue({ sk_lokasi: 20 })
      mockPrisma.dim_mustahik.create.mockResolvedValue({
        sk_mustahik: 2,
        id_mustahik: 'MST-KES-0001-v2', // Versioned ID
        nama: 'New Name',
        is_active: true,
      })

      const req = createJsonRequest('http://localhost/api/mustahik/index', {
        sk_mustahik: 1,
        nama: 'New Name',
        nik: '6171012345678901',
        alamat: 'Jl. Baru',
        kabupaten_kota: 'Kota Pontianak',
        kategori_pm: 'Miskin',
        latitude: -0.03,
        longitude: 109.35,
      }, 'PUT')

      const res = await PUT(req)
      const data = await res.json()

      // Old record should be deactivated
      expect(mockPrisma.dim_mustahik.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sk_mustahik: 1 },
          data: expect.objectContaining({ is_active: false }),
        })
      )
      // New record should have versioned ID
      expect(data.id_mustahik).toBe('MST-KES-0001-v2')
      expect(data.is_active).toBe(true)
    })

    it('should return 500 when old record not found', async () => {
      const { PUT } = await import('@/app/api/mustahik/index/route')
      mockPrisma.dim_mustahik.findUnique.mockResolvedValue(null)

      const req = createJsonRequest('http://localhost/api/mustahik/index', {
        sk_mustahik: 999,
        nama: 'Ghost',
      }, 'PUT')

      const res = await PUT(req)
      expect(res.status).toBe(500)
    })
  })

  describe('DELETE /api/mustahik/index — Soft Delete (SCD Type 2)', () => {
    it('should soft-delete by setting is_active=false', async () => {
      const { DELETE } = await import('@/app/api/mustahik/index/route')

      mockPrisma.dim_mustahik.update.mockResolvedValue({ is_active: false })

      const req = new Request('http://localhost/api/mustahik/index?sk=5', { method: 'DELETE' })
      const res = await DELETE(req)
      const data = await res.json()

      expect(data.success).toBe(true)
      expect(mockPrisma.dim_mustahik.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sk_mustahik: 5 },
          data: expect.objectContaining({ is_active: false }),
        })
      )
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// DONASI MODULE — Create
// ═══════════════════════════════════════════════════════════════════════════════

describe('Donasi CRUD', () => {
  describe('POST /api/donasi/masuk — Create Transaction', () => {
    it('should create donasi when donatur exists', async () => {
      const { POST } = await import('@/app/api/donasi/masuk/route')

      mockPrisma.dim_donatur.findUnique.mockResolvedValue({
        sk_donatur: 1,
        id_donatur: 'DON-001',
        nama_lengkap: 'Ahmad Fauzi',
      })
      mockPrisma.fact_donasi.create.mockResolvedValue({
        id_transaksi_donasi: 'TRX-IN-123',
      })

      const req = createJsonRequest('http://localhost/api/donasi/masuk', {
        id_donatur: 'DON-001',
        sk_petugas: '1',
        jenis_donasi: '1',
        nominal_donasi: '500000',
        metode_pembayaran: '1',
        bank_tujuan: 'BSI',
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.success).toBe(true)
      expect(mockPrisma.fact_donasi.create).toHaveBeenCalledOnce()
    })

    it('should return 404 when donatur does not exist', async () => {
      const { POST } = await import('@/app/api/donasi/masuk/route')
      mockPrisma.dim_donatur.findUnique.mockResolvedValue(null)

      const req = createJsonRequest('http://localhost/api/donasi/masuk', {
        id_donatur: 'NONEXISTENT',
        nominal_donasi: '100000',
      })

      const res = await POST(req)
      expect(res.status).toBe(404)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PENYALURAN MODULE — Read + Create
// ═══════════════════════════════════════════════════════════════════════════════

describe('Penyaluran CRUD', () => {
  describe('GET /api/donasi/keluar — Read All Penyaluran', () => {
    it('should return list of penyaluran with relations', async () => {
      const { GET } = await import('@/app/api/donasi/keluar/route')

      mockPrisma.fact_penyaluran.findMany.mockResolvedValue([
        {
          id_transaksi: 'OUT-001',
          dana_tersalur: 500000,
          dim_mustahik: { nama: 'Penerima Test' },
        },
      ])

      const res = await GET()
      const data = await res.json()

      expect(Array.isArray(data)).toBe(true)
      expect(data[0].id_transaksi).toBe('OUT-001')
    })
  })

  describe('POST /api/donasi/keluar — Create Penyaluran', () => {
    it('should create penyaluran record', async () => {
      const { POST } = await import('@/app/api/donasi/keluar/route')

      mockPrisma.fact_penyaluran.create.mockResolvedValue({
        id_transaksi: 'OUT-123',
        dana_tersalur: 300000,
      })

      const req = new NextRequest('http://localhost/api/donasi/keluar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sk_mustahik: '1',
          sk_penyalur: '1',
          jumlah: 300000,
          domain: 'Pendidikan',
          kategori: 'Beasiswa',
          jenis: 'Tunai',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.success).toBe(true)
    })
  })

  describe('PUT /api/donasi/keluar — Update Penyaluran', () => {
    it('should update penyaluran record', async () => {
      const { PUT } = await import('@/app/api/donasi/keluar/route')

      mockPrisma.fact_penyaluran.update.mockResolvedValue({
        sk_fakta_penyaluran: 1,
        dana_tersalur: 400000,
        status_pengajuan: 'Disetujui',
      })

      const req = new NextRequest('http://localhost/api/donasi/keluar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sk_fakta_penyaluran: 1,
          dana_tersalur: 400000,
          status_pengajuan: 'Disetujui',
        }),
      })

      const res = await PUT(req)
      const data = await res.json()

      expect(data.success).toBe(true)
      expect(mockPrisma.fact_penyaluran.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sk_fakta_penyaluran: 1 },
          data: expect.objectContaining({
            dana_tersalur: 400000,
            status_pengajuan: 'Disetujui',
          }),
        })
      )
    })

    it('should return error if no sk is provided', async () => {
      const { PUT } = await import('@/app/api/donasi/keluar/route')

      const req = new NextRequest('http://localhost/api/donasi/keluar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const res = await PUT(req)
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /api/donasi/keluar — Delete Penyaluran', () => {
    it('should delete penyaluran record', async () => {
      const { DELETE } = await import('@/app/api/donasi/keluar/route')

      mockPrisma.fact_penyaluran.delete.mockResolvedValue({})

      const req = new NextRequest('http://localhost/api/donasi/keluar?sk=1', {
        method: 'DELETE',
      })

      const res = await DELETE(req)
      const data = await res.json()

      expect(data.success).toBe(true)
      expect(mockPrisma.fact_penyaluran.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sk_fakta_penyaluran: 1 } })
      )
    })

    it('should return error if no sk is provided', async () => {
      const { DELETE } = await import('@/app/api/donasi/keluar/route')

      const req = new NextRequest('http://localhost/api/donasi/keluar', {
        method: 'DELETE',
      })

      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// SURVEY MODULE — Create (Transaction: 3 tables)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Survey CRUD', () => {
  describe('POST /api/survey/baru — Create Survey (Multi-table Transaction)', () => {
    it('should save survey to 3 fact tables in transaction', async () => {
      const { POST } = await import('@/app/api/survey/baru/route')

      mockPrisma.dim_mustahik.findUnique.mockResolvedValue({
        sk_mustahik: 5,
        id_mustahik: 'MST-KES-0001',
      })
      mockPrisma.fact_skor_kelayakan.create.mockResolvedValue({ id_survey: 'SRV-123' })
      mockPrisma.fact_survey.create.mockResolvedValue({ sk_survey: 10 })
      mockPrisma.fact_survey_detail.createMany.mockResolvedValue({ count: 3 })

      const req = createJsonRequest('http://localhost/api/survey/baru', {
        id_mustahik: 'MST-KES-0001',
        sk_petugas: 1,
        pendapatan_bulanan: '1500000',
        pengeluaran_bulanan: '1200000',
        jumlah_tanggungan: '4',
        kondisi_tempat_tinggal: 'Tidak_Layak',
        kategori_asnaf: 'Fakir',
        kategori_rekomendasi: 'Sangat_Layak',
        skor_akhir: '85',
        status_kelayakan: 'Sangat_Layak',
        detail_skor: { '1': '5', '2': '4', '3': '3' },
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.success).toBe(true)
      expect(data.id_survey).toBeDefined()
      // Verify all 3 tables were written
      expect(mockPrisma.fact_skor_kelayakan.create).toHaveBeenCalledOnce()
      expect(mockPrisma.fact_survey.create).toHaveBeenCalledOnce()
      expect(mockPrisma.fact_survey_detail.createMany).toHaveBeenCalledOnce()
    })

    it('should return 404 when mustahik not found', async () => {
      const { POST } = await import('@/app/api/survey/baru/route')
      mockPrisma.dim_mustahik.findUnique.mockResolvedValue(null)

      const req = createJsonRequest('http://localhost/api/survey/baru', {
        id_mustahik: 'NONEXISTENT',
        detail_skor: {},
      })

      const res = await POST(req)
      expect(res.status).toBe(404)
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// AMBULAN LAYANAN MODULE — Create (Transaction: 3 tables)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Ambulan Layanan CRUD', () => {
  describe('POST /api/ambulan/layanan — Create Layanan', () => {
    it('should save layanan with lokasi and pasien in transaction', async () => {
      const { POST } = await import('@/app/api/ambulan/layanan/route')

      mockPrisma.dim_lokasi.create.mockResolvedValue({ sk_lokasi: 15 })
      mockPrisma.dim_pasien_ambulan.create.mockResolvedValue({
        sk_pasien: 3,
        id_pasien: 'PAS-123',
      })
      mockPrisma.fact_layanan_ambulan.create.mockResolvedValue({
        id_transaksi: 'SRV-AMB-123',
      })

      const req = createJsonRequest('http://localhost/api/ambulan/layanan', {
        nama_pasien: 'Pasien Test',
        gender: 'L',
        no_hp: '08123456789',
        status_ekonomi: 'Dhuafa',
        alamat_jemput: 'Jl. Test No. 1',
        jam: 'Pagi__06_00_12_00_',
        armada: 'Ambulan_1__KB_1234_XX_',
        kategori_layanan: 'Antar_Pasien',
        kabupaten_kota: 'Kota Pontianak',
        latitude: '-0.0263',
        longitude: '109.3425',
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.success).toBe(true)
      expect(data.id_pasien).toBeDefined()
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// AMBULAN AKTIVITAS MODULE — Full CRUD
// ═══════════════════════════════════════════════════════════════════════════════

describe('Ambulan Aktivitas CRUD', () => {
  describe('GET /api/ambulan/aktivitas — Read', () => {
    it('should return summary with total count and expenses', async () => {
      const { GET } = await import('@/app/api/ambulan/aktivitas/route')

      mockPrisma.fact_aktivitas_ambulan.count.mockResolvedValue(50)
      mockPrisma.fact_aktivitas_ambulan.aggregate.mockResolvedValue({
        _sum: { biaya_operasional: 5000000 },
      })
      mockPrisma.fact_aktivitas_ambulan.findMany.mockResolvedValue([])

      const res = await GET()
      const data = await res.json()

      expect(data.totalCount).toBe(50)
      expect(data.totalExp).toBe(5000000)
    })
  })

  describe('POST /api/ambulan/aktivitas — Create', () => {
    it('should create aktivitas record', async () => {
      const { POST } = await import('@/app/api/ambulan/aktivitas/route')

      mockPrisma.fact_aktivitas_ambulan.create.mockResolvedValue({
        id_transaksi: 'EXP-AMB-123',
        biaya_operasional: 150000,
      })

      const req = new NextRequest('http://localhost/api/ambulan/aktivitas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jam: 'Pagi__06_00_12_00_',
          armada: 'Ambulan_1__KB_1234_XX_',
          kategori_aktivitas: 'Bahan_Bakar',
          biaya_operasional: '150000',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(data.success).toBe(true)
      expect(data.id).toBeDefined()
    })
  })

  describe('PUT /api/ambulan/aktivitas — Update', () => {
    it('should update existing aktivitas', async () => {
      const { PUT } = await import('@/app/api/ambulan/aktivitas/route')

      mockPrisma.fact_aktivitas_ambulan.update.mockResolvedValue({
        sk_fakta_aktivitas_ambulan: 10,
        biaya_operasional: 200000,
      })

      const req = new NextRequest('http://localhost/api/ambulan/aktivitas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sk_fakta_aktivitas_ambulan: '10',
          jam: 'Siang__12_00_15_00_',
          armada: 'Ambulan_2__KB_5678_YY_',
          kategori_aktivitas: 'Servis_Rutin',
          biaya_operasional: '200000',
        }),
      })

      const res = await PUT(req)
      const data = await res.json()

      expect(data.biaya_operasional).toBe(200000)
    })
  })

  describe('DELETE /api/ambulan/aktivitas — Delete', () => {
    it('should delete aktivitas by SK', async () => {
      const { DELETE } = await import('@/app/api/ambulan/aktivitas/route')
      mockPrisma.fact_aktivitas_ambulan.delete.mockResolvedValue({})

      const req = new NextRequest('http://localhost/api/ambulan/aktivitas?sk=10', {
        method: 'DELETE',
      })

      const res = await DELETE(req)
      const data = await res.json()

      expect(data.success).toBe(true)
      expect(mockPrisma.fact_aktivitas_ambulan.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { sk_fakta_aktivitas_ambulan: 10 } })
      )
    })

    it('should return 400 when SK is missing', async () => {
      const { DELETE } = await import('@/app/api/ambulan/aktivitas/route')

      const req = new NextRequest('http://localhost/api/ambulan/aktivitas', {
        method: 'DELETE',
      })

      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })
  })
})
