import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const VALID_PROGRAMS = [
  'Pendidikan', 'Kesehatan', 'Ekonomi',
  'Sosial Kemanusiaan', 'Dakwah & Advokasi', 'Operasional',
] as const

// Map string param → nilai enum Prisma yang sesuai
// fact_donasi    : pakai dim_program_donasi.program_induk (FK ke dim_program_donasi)
// fact_penyaluran: pakai domain_program (enum langsung, tanpa FK)
const PROGRAM_INDUK_MAP: Record<string, string> = {
  'Pendidikan':         'Pendidikan',
  'Kesehatan':          'Kesehatan',
  'Ekonomi':            'Ekonomi',
  'Sosial Kemanusiaan': 'Sosial_Kemanusiaan',
  'Dakwah & Advokasi':  'Dakwah___Advokasi',
  'Operasional':        'Operasional',
}

function toNumber(val: any): number {
  if (val === null || val === undefined) return 0
  return parseFloat(val.toString())
}

function toIntDate(date: Date): number {
  const yyyy = date.getFullYear()
  const mm   = String(date.getMonth() + 1).padStart(2, '0')
  const dd   = String(date.getDate()).padStart(2, '0')
  return Number(`${yyyy}${mm}${dd}`)
}

function buildDateWhereAsDate(
  searchParams: URLSearchParams
): { gte: Date; lte: Date } | undefined {
  const filterType = searchParams.get('filterType') ?? 'none'

  if (filterType === 'year') {
    const startYear = searchParams.get('startYear')
    const endYear   = searchParams.get('endYear')
    if (!startYear || !endYear) return undefined
    return {
      gte: new Date(`${startYear}-01-01T00:00:00.000Z`),
      lte: new Date(`${endYear}-12-31T23:59:59.999Z`),
    }
  }

  if (filterType === 'month') {
    const startMonth = searchParams.get('startMonth')
    const endMonth   = searchParams.get('endMonth')
    if (!startMonth || !endMonth) return undefined
    const [ey, em] = endMonth.split('-').map(Number)
    const lastDay    = new Date(ey, em, 0)
    const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    return {
      gte: new Date(`${startMonth}-01T00:00:00.000Z`),
      lte: new Date(`${lastDayStr}T23:59:59.999Z`),
    }
  }

  if (filterType === 'day') {
    const startDate = searchParams.get('startDate')
    const endDate   = searchParams.get('endDate')
    if (!startDate || !endDate) return undefined
    return {
      gte: new Date(`${startDate}T00:00:00.000Z`),
      lte: new Date(`${endDate}T23:59:59.999Z`),
    }
  }

  return undefined
}

function buildDateWhere(
  searchParams: URLSearchParams
): { gte: number; lte: number } | undefined {
  const filterType = searchParams.get('filterType') ?? 'none'

  if (filterType === 'year') {
    const startYear = searchParams.get('startYear')
    const endYear   = searchParams.get('endYear')
    if (!startYear || !endYear) return undefined
    return {
      gte: Number(`${startYear}0101`),
      lte: Number(`${endYear}1231`),
    }
  }

  if (filterType === 'month') {
    const startMonth = searchParams.get('startMonth')
    const endMonth   = searchParams.get('endMonth')
    if (!startMonth || !endMonth) return undefined
    const [sy, sm] = startMonth.split('-').map(Number)
    const [ey, em] = endMonth.split('-').map(Number)
    const lastDay   = toIntDate(new Date(ey, em, 0))
    return {
      gte: Number(`${sy}${String(sm).padStart(2, '0')}01`),
      lte: lastDay,
    }
  }

  if (filterType === 'day') {
    const startDate = searchParams.get('startDate')
    const endDate   = searchParams.get('endDate')
    if (!startDate || !endDate) return undefined
    return {
      gte: Number(startDate.replace(/-/g, '')),
      lte: Number(endDate.replace(/-/g, '')),
    }
  }

  return undefined
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const filterType  = searchParams.get('filterType') ?? 'none'
    const dateWhere   = buildDateWhere(searchParams)
    const dimDateWhere = buildDateWhereAsDate(searchParams)

    // ── Filter program ────────────────────────────────────────────────────
    const programParam   = searchParams.get('program')
    const safeProgram    = VALID_PROGRAMS.includes(programParam as any) ? programParam : null
    const programInduk   = safeProgram ? PROGRAM_INDUK_MAP[safeProgram] : null

    console.log('[stats] filterType  :', filterType)
    console.log('[stats] dateWhere   :', dateWhere)
    console.log('[stats] safeProgram :', safeProgram)

    // ── fact_donasi: program via relasi FK → dim_program_donasi ──────────
    const donasiWhere: any = {
      ...(dateWhere   ? { sk_tgl_bersih: dateWhere } : {}),
      ...(programInduk
        ? { dim_program_donasi: { program_induk: programInduk } }
        : {}),
    }

    // ── fact_penyaluran: program via kolom enum domain_program langsung ──
    const penyaluranWhere: any = {
      ...(dateWhere   ? { sk_tgl_disalurkan: dateWhere } : {}),
      ...(programInduk ? { domain_program: programInduk } : {}),
    }

    // ── dim_donatur: tidak ada FK langsung ke program ─────────────────────
    // Filter via relasi fact_donasi → dim_program_donasi
    const donaturWhere: any = {
      is_active: true,
      ...(dimDateWhere ? { valid_from: dimDateWhere } : {}),
      ...(programInduk
        ? {
            fact_donasi: {
              some: {
                dim_program_donasi: { program_induk: programInduk },
              },
            },
          }
        : {}),
    }

    // ── dim_mustahik: filter via relasi fact_penyaluran.domain_program ───
    const mustahikWhere: any = {
      is_active: true,
      ...(dimDateWhere ? { valid_from: dimDateWhere } : {}),
      ...(programInduk
        ? {
            fact_penyaluran: {
              some: { domain_program: programInduk },
            },
          }
        : {}),
    }

    // Pertumbuhan hanya relevan saat tidak ada filter apapun
    const hitungPertumbuhan = filterType === 'none' && !safeProgram

    const now            = new Date()
    const awalBulanIni   = toIntDate(new Date(now.getFullYear(), now.getMonth(), 1))
    const akhirBulanIni  = toIntDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    const awalBulanLalu  = toIntDate(new Date(now.getFullYear(), now.getMonth() - 1, 1))
    const akhirBulanLalu = toIntDate(new Date(now.getFullYear(), now.getMonth(), 0))

    const [
      donasiAgg,
      donasiSekarang,
      donasiSebelumnya,
      donaturCount,
      ambulanAgg,
      penyaluranAgg,
      mustahikCount,
    ] = await Promise.all([

      prisma.fact_donasi.aggregate({
        _sum: { nominal_valid: true },
        where: donasiWhere,
      }),

      hitungPertumbuhan
        ? prisma.fact_donasi.aggregate({
            _sum: { nominal_valid: true },
            where: { sk_tgl_bersih: { gte: awalBulanIni, lte: akhirBulanIni } },
          })
        : Promise.resolve({ _sum: { nominal_valid: null } }),

      hitungPertumbuhan
        ? prisma.fact_donasi.aggregate({
            _sum: { nominal_valid: true },
            where: { sk_tgl_bersih: { gte: awalBulanLalu, lte: akhirBulanLalu } },
          })
        : Promise.resolve({ _sum: { nominal_valid: null } }),

      prisma.dim_donatur.count({ where: donaturWhere }),

      // Ambulan tidak difilter program — tidak ada relasi ke program di schema
      prisma.fact_layanan_ambulan.aggregate({ _sum: { jumlah_layanan: true } }),

      prisma.fact_penyaluran.aggregate({
        _sum: { dana_tersalur: true },
        where: penyaluranWhere,
      }),

      prisma.dim_mustahik.count({ where: mustahikWhere }),
    ])

    const sekarang   = toNumber(donasiSekarang._sum.nominal_valid)
    const sebelumnya = toNumber(donasiSebelumnya._sum.nominal_valid)

    let pertumbuhan = 0
    let statusPertumbuhan: 'naik' | 'turun' | 'stabil' | 'data_tidak_cukup' = 'data_tidak_cukup'

    if (hitungPertumbuhan) {
      if (sebelumnya > 0 && sekarang > 0) {
        pertumbuhan       = ((sekarang - sebelumnya) / sebelumnya) * 100
        statusPertumbuhan = pertumbuhan > 0 ? 'naik' : pertumbuhan < 0 ? 'turun' : 'stabil'
      } else if (sebelumnya === 0 && sekarang === 0) {
        statusPertumbuhan = 'stabil'
      }
    }

    return NextResponse.json({
      totalDonasi:      toNumber(donasiAgg._sum.nominal_valid),
      jumlahDonatur:    donaturCount,
      jumlahMustahik:   mustahikCount,
      danaTersalur:     toNumber(penyaluranAgg._sum?.dana_tersalur),
      layananAmbulan:   toNumber(ambulanAgg._sum.jumlah_layanan),
      pertumbuhan:      Number(pertumbuhan.toFixed(2)),
      statusPertumbuhan,
    })

  } catch (error: any) {
    console.error('[stats] Error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data DW' }, { status: 500 })
  }
}