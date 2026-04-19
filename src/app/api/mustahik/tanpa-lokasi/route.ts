import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await prisma.dim_mustahik.findMany({
      where: { sk_lokasi: -1, is_active: true },
      select: { sk_mustahik: true, nama: true },
      take: 100,
      orderBy: { nama: 'asc' },
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Gagal ambil data' }, { status: 500 })
  }
}