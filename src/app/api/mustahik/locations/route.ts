import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const locations = await prisma.dim_mustahik.findMany({
      select: {
        sk_mustahik: true,
        nama: true,
        dim_lokasi: {
          select: {
            latitude: true,
            longitude: true,
            desa_kelurahan: true,
            kecamatan: true,
          },
        },
      },
      // Ambil data yang koordinatnya valid saja
      where: {
        dim_lokasi: {
          latitude: { not: 0 },
          longitude: { not: 0 },
        },
      },
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    )
  }
}
