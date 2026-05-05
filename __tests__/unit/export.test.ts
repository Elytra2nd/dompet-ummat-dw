import { describe, it, expect, vi } from 'vitest'
import {
  DONATUR_SCHEMA,
  AMBULAN_SCHEMA,
  MUSTAHIK_SCHEMA,
  SEGMEN_DONATUR_SCHEMA,
  buildFilename,
  exportExcel,
  exportPDF,
} from '@/lib/export'

// Mock dependencies using class syntax so they can be instantiated with 'new'
vi.mock('exceljs', () => {
  return {
    default: {
      Workbook: class {
        creator = ''
        created = null
        addWorksheet() {
          return {
            addRow: () => ({
              getCell: () => ({ font: {}, fill: {}, alignment: {}, border: {} }),
              eachCell: (cb: any) => {},
            }),
            getColumn: () => ({ width: 0 }),
            mergeCells: () => {},
            views: [],
            autoFilter: {},
          }
        }
        xlsx = {
          writeBuffer: async () => new ArrayBuffer(8),
        }
      },
    },
  }
})

vi.mock('jspdf', () => {
  return {
    default: class {
      internal = { pageSize: { width: 210, height: 297 } }
      setFontSize() { return this }
      setFont() { return this }
      setTextColor() { return this }
      text() { return this }
      setDrawColor() { return this }
      setLineWidth() { return this }
      line() { return this }
      getNumberOfPages() { return 1 }
      output() { return new ArrayBuffer(8) }
    },
  }
})

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}))

describe('Export Utilities', () => {
  describe('Schemas', () => {
    it('should define DONATUR_SCHEMA correctly', () => {
      expect(DONATUR_SCHEMA).toBeDefined()
      expect(DONATUR_SCHEMA.length).toBeGreaterThan(0)
      expect(DONATUR_SCHEMA[0]).toHaveProperty('header')
      expect(DONATUR_SCHEMA[0]).toHaveProperty('key')
    })

    it('should define AMBULAN_SCHEMA correctly', () => {
      expect(AMBULAN_SCHEMA).toBeDefined()
    })

    it('should define MUSTAHIK_SCHEMA correctly', () => {
      expect(MUSTAHIK_SCHEMA).toBeDefined()
    })

    it('should define SEGMEN_DONATUR_SCHEMA correctly', () => {
      expect(SEGMEN_DONATUR_SCHEMA).toBeDefined()
    })
  })

  describe('buildFilename', () => {
    it('should generate a valid filename without period', () => {
      const filename = buildFilename('Laporan Donatur', 'xlsx')
      expect(filename).toMatch(/^DU_Laporan_Donatur_\d{8}\.xlsx$/)
    })

    it('should generate a valid filename with start and end period', () => {
      const filename = buildFilename('Laporan Ambulan', 'pdf', { from: '2023-01-01', to: '2023-12-31' })
      expect(filename).toMatch(/^DU_Laporan_Ambulan_20230101_20231231_\d{8}\.pdf$/)
    })

    it('should generate a valid filename with only start period', () => {
      const filename = buildFilename('Data Mustahik', 'csv', { from: '2023-01-01' })
      expect(filename).toMatch(/^DU_Data_Mustahik_20230101_now_\d{8}\.csv$/)
    })

    it('should strip special characters from title', () => {
      const filename = buildFilename('Laporan @Donatur #1!', 'xlsx')
      expect(filename).toMatch(/^DU_Laporan_Donatur_1_\d{8}\.xlsx$/)
    })
  })

  describe('Export functions (mocked)', () => {
    const mockOptions = {
      title: 'Test Report',
      columns: [
        { header: 'Name', key: 'name' },
        { header: 'Amount', key: 'amount', format: 'rupiah' as const }
      ],
      rows: [
        { name: 'John Doe', amount: 500000 },
        { name: 'Jane Smith', amount: 1000000 }
      ]
    }

    it('should call exceljs and generate Blob for exportExcel', async () => {
      const result = await exportExcel(mockOptions)
      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    })

    it('should call jspdf and generate Blob for exportPDF', () => {
      const result = exportPDF(mockOptions)
      expect(result).toBeInstanceOf(Blob)
      expect(result.type).toBe('application/pdf')
    })
  })
})
