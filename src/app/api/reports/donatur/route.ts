import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const stats = await prisma.dim_donatur.groupBy({
      by: ['tipe'],
      _count: { id_donatur: true },
      where: { is_active: true }
    })

    const total = await prisma.dim_donatur.count({ where: { is_active: true } })

    return NextResponse.json({ total, stats })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}