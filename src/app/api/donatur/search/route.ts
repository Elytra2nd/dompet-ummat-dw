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
          { nama_lengkap: { contains: q } },
          { kontak_utama: { contains: q } },
        ]
      },
      select: {
        id_donatur: true,
        nama_lengkap: true,
        kontak_utama: true,
        alamat: true,
      },
      take: 10,
    })

    const formattedList = donaturList.map(d => ({
      id_donatur: d.id_donatur,
      nama_donatur: d.nama_lengkap || 'Tanpa Nama',
      no_hp: d.kontak_utama || '-',
      alamat_lengkap: d.alamat || '-',
    }))

    return NextResponse.json(formattedList)
  } catch (error: any) {
    console.error('SEARCH_DONATUR_ERROR:', error)
    return NextResponse.json({ error: 'Gagal mencari data donatur' }, { status: 500 })
  }
}
