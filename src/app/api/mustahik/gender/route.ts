import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

const VALID_PROGRAMS = [
  'Pendidikan', 'Kesehatan', 'Ekonomi',
  'Sosial Kemanusiaan', 'Dakwah & Advokasi', 'Operasional',
] as const

// Map string param → enum fact_penyaluran_domain_program
const PROGRAM_ENUM_MAP: Record<string, string> = {
  'Pendidikan':         'Pendidikan',
  'Kesehatan':          'Kesehatan',
  'Ekonomi':            'Ekonomi',
  'Sosial Kemanusiaan': 'Sosial_Kemanusiaan',
  'Dakwah & Advokasi':  'Dakwah___Advokasi',
  'Operasional':        'Operasional',
}

function buildValidFromWhere(
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
    const lastDay = new Date(ey, em, 0)
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const validFromWhere = buildValidFromWhere(searchParams)

    // ── Filter program ────────────────────────────────────────────────────
    const programParam = searchParams.get('program')
    const safeProgram  = VALID_PROGRAMS.includes(programParam as any) ? programParam : null
    // domain_program di fact_penyaluran memakai enum Prisma, bukan string
    const domainEnum   = safeProgram ? PROGRAM_ENUM_MAP[safeProgram] : null

    const whereCondition: any = {
      is_active: true,
      ...(validFromWhere ? { valid_from: validFromWhere } : {}),
      // Filter program: mustahik yang pernah menerima penyaluran di domain program tsb
      ...(domainEnum
        ? {
            fact_penyaluran: {
              some: { domain_program: domainEnum },
            },
          }
        : {}),
    }

    const results = await prisma.dim_mustahik.groupBy({
      by: ['gender'],
      _count: { _all: true },
      where: whereCondition,
    })

    // Map enum → label tampilan
    const GENDER_LABEL: Record<string, string> = {
      L:                 'L',
      P:                 'P',
      To_Be_Determined:  'Unknown',
      Not_Applicable:    'Unknown',
      Data_Corrupted:    'Unknown',
    }

    const aggregated: Record<string, number> = {}
    results.forEach((item) => {
      const key = item.gender ? (GENDER_LABEL[item.gender] ?? 'Unknown') : 'Unknown'
      aggregated[key] = (aggregated[key] ?? 0) + item._count._all
    })

    const data = Object.entries(aggregated).map(([gender, total]) => ({ gender, total }))

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('API_MUSTAHIK_GENDER_ERROR:', error)
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data gender mustahik', detail: error?.message },
      { status: 500 }
    )
  }
}