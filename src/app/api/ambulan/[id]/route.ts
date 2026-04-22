import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const skFakta = parseInt(id)

    const detailLayanan = await prisma.fact_layanan_ambulan.findUnique({
      where: { sk_fakta_layanan_ambulan: skFakta },
      include: {
        dim_pasien_ambulan: true,
        dim_lokasi: true,
        // Jika kamu punya dimensi petugas atau unit, include di sini
      }
    })

    if (!detailLayanan) {
      return NextResponse.json({ error: "Log layanan tidak ditemukan" }, { status: 404 })
    }

    return NextResponse.json(detailLayanan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}