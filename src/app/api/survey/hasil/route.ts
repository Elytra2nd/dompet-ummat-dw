import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const surveys = await prisma.fact_survey.findMany({
      include: {
        dim_mustahik: {
          select: {
            nama: true,
            id_mustahik: true,
            kategori_pm: true
          }
        },
        dim_date: true // Mengambil info tanggal survey
      },
      orderBy: { sk_survey: 'desc' }
    })

    return NextResponse.json(surveys)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}