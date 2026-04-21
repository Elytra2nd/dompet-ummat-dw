import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sebaranKategori = await prisma.dim_mustahik.groupBy({
      by: ['kategori_pm'],
      _count: { id_mustahik: true },
      where: { is_active: true }
    })

    const total = await prisma.dim_mustahik.count({ where: { is_active: true } })

    return NextResponse.json({ total, sebaranKategori })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}