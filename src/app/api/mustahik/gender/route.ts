import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const results = await prisma.dim_mustahik.groupBy({
      by: ['gender'],
      _count: {
        _all: true,
      },
      where: {
        is_active: true,
      },
    })

    // Normalisasi gender
    const normalizeGender = (gender: string | null): string => {
      if (!gender) return 'Unknown'

      const g = gender.toLowerCase()

      if (g === 'l') return 'L'
      if (g === 'p') return 'P'
      if (g === 'non_applicable' || g === 'not_applicable') return 'Unknown'

      return 'Unknown'
    }

    // Re-aggregate supaya tidak ada duplikasi kategori
    const aggregated: Record<string, number> = {}

    results.forEach((item) => {
      const key = normalizeGender(item.gender)

      if (!aggregated[key]) {
        aggregated[key] = 0
      }

      aggregated[key] += item._count._all
    })

    // Format ke array untuk frontend
    const data = Object.entries(aggregated).map(([gender, total]) => ({
      gender,
      total,
    }))

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error: any) {
    console.error('API_MUSTAHIK_GENDER_ERROR:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memuat data gender mustahik',
        detail: error?.message || String(error),
      },
      { status: 500 }
    )
  }
}