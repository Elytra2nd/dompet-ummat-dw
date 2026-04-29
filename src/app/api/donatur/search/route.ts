import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get('q')

    if (!q || q.length < 2) {
      return NextResponse.json([])
    }

    const donaturList = await prisma.dim_donatur.findMany({
      where: {
        OR: [
          { nama_donatur: { contains: q } },
          { no_hp: { contains: q } },
        ]
      },
      select: {
        id_donatur: true,
        nama_donatur: true,
        no_hp: true,
        alamat_lengkap: true,
      },
      take: 10,
    })

    return NextResponse.json(donaturList)
  } catch (error: any) {
    console.error('SEARCH_DONATUR_ERROR:', error)
    return NextResponse.json({ error: 'Gagal mencari data donatur' }, { status: 500 })
  }
}
