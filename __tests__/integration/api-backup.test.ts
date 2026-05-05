import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/backup/route'

// ── Mock Prisma ──────────────────────────────────────────────────────────────
const { mockPrisma } = vi.hoisted(() => {
  return {
    mockPrisma: {
      dim_date: { findMany: vi.fn() },
      dim_donatur: { findMany: vi.fn() },
      dim_jalur_pembayaran: { findMany: vi.fn() },
      dim_lokasi: { findMany: vi.fn() },
      dim_mustahik: { findMany: vi.fn() },
      dim_pasien_ambulan: { findMany: vi.fn() },
      dim_penyalur_master: { findMany: vi.fn() },
      dim_pertanyaan_survey: { findMany: vi.fn() },
      dim_petugas: { findMany: vi.fn() },
      dim_program_donasi: { findMany: vi.fn() },
      fact_aktivitas_ambulan: { findMany: vi.fn() },
      fact_donasi: { findMany: vi.fn() },
      fact_layanan_ambulan: { findMany: vi.fn() },
      fact_penyaluran: { findMany: vi.fn() },
      fact_skor_kelayakan: { findMany: vi.fn() },
      fact_survey: { findMany: vi.fn() },
      fact_survey_detail: { findMany: vi.fn() },
    }
  }
})

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn().mockResolvedValue({ sub: 'user-id-123' }),
}))

vi.mock('@/lib/audit', () => ({
  logActivity: vi.fn().mockResolvedValue(true),
}))

// ── Mock JSZip & ExcelJS ─────────────────────────────────────────────────────
vi.mock('jszip', () => {
  return {
    default: class {
      file() {}
      async generateAsync() { return new ArrayBuffer(8) }
    },
  }
})

vi.mock('exceljs', () => {
  return {
    default: {
      Workbook: class {
        creator = ''
        created = null
        addWorksheet() {
          return {
            addRow: () => ({
              font: {}, fill: {}, alignment: {}, height: 0,
              getCell: () => ({ font: {}, fill: {} }),
            }),
            properties: {},
            columns: [],
            getRow: () => ({ font: {}, fill: {}, alignment: {}, height: 0 }),
          }
        }
        xlsx = {
          writeBuffer: async () => new ArrayBuffer(8),
        }
      },
    },
  }
})

function buildReq(url: string) {
  return new NextRequest(new URL(url, 'http://localhost'))
}

describe('API Route: GET /api/backup', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default resolve with empty arrays
    for (const model of Object.values(mockPrisma)) {
      model.findMany.mockResolvedValue([])
    }
  })

  it('should export all modules as ZIP when format=zip', async () => {
    mockPrisma.dim_mustahik.findMany.mockResolvedValue([
      { id_mustahik: 'MST01', nama: 'Fulan' },
    ])

    const req = buildReq('/api/backup?modules=all&format=zip')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/zip')
    expect(res.headers.get('content-disposition')).toContain('attachment; filename="backup_dompet_ummat_')
    expect(res.headers.get('content-disposition')).toContain('.zip"')

    expect(mockPrisma.dim_mustahik.findMany).toHaveBeenCalled()
    expect(mockPrisma.fact_donasi.findMany).toHaveBeenCalled()
  })

  it('should export all modules as Excel when format=xlsx', async () => {
    mockPrisma.fact_donasi.findMany.mockResolvedValue([
      { sk_fakta_donasi: 1, nominal: 100000 },
    ])

    const req = buildReq('/api/backup?modules=all&format=xlsx')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    expect(res.headers.get('content-disposition')).toContain('.xlsx"')

    expect(mockPrisma.fact_donasi.findMany).toHaveBeenCalled()
  })

  it('should filter by modules=dimensi', async () => {
    const req = buildReq('/api/backup?modules=dimensi&format=zip')
    await GET(req)

    expect(mockPrisma.dim_donatur.findMany).toHaveBeenCalled()
    expect(mockPrisma.fact_donasi.findMany).not.toHaveBeenCalled()
  })

  it('should filter by modules=fakta', async () => {
    const req = buildReq('/api/backup?modules=fakta&format=zip')
    await GET(req)

    expect(mockPrisma.dim_donatur.findMany).not.toHaveBeenCalled()
    expect(mockPrisma.fact_donasi.findMany).toHaveBeenCalled()
  })

  it('should apply date filters to fact tables', async () => {
    const req = buildReq('/api/backup?modules=fakta&format=xlsx&startDate=2023-01-01&endDate=2023-12-31')
    await GET(req)

    expect(mockPrisma.fact_donasi.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sk_tgl_bersih: { gte: 20230101, lte: 20231231 } },
      })
    )
  })

  it('should handle internal server errors gracefully', async () => {
    mockPrisma.dim_date.findMany.mockRejectedValue(new Error('DB Timeout'))

    const req = buildReq('/api/backup?modules=all')
    const res = await GET(req)

    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json.error).toBe('Gagal membuat backup')
    expect(json.details).toBe('DB Timeout')
  })
})
