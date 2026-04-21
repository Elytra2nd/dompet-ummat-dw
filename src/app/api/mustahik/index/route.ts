import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const mustahik = await prisma.dim_mustahik.findMany({
      where: { is_active: true },
      include: {
        dim_lokasi: true, // Join ke data wilayah
      },
      orderBy: { sk_mustahik: 'desc' }
    })

    return NextResponse.json(mustahik)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}