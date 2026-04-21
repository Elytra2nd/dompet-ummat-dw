import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [donatur, mustahik, ambulan] = await Promise.all([
      prisma.dim_donatur.count({ where: { is_active: true } }),
      prisma.dim_mustahik.count({ where: { is_active: true } }),
      prisma.fact_layanan_ambulan.count()
    ])

    return NextResponse.json({ donatur, mustahik, ambulan })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}