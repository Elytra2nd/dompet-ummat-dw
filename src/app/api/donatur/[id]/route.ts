import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } 
) {
  try {
    // Await params dulu sebelum digunakan
    const { id } = await context.params 

    const dataDonatur = await prisma.dim_donatur.findFirst({
      where: { id_donatur: id, is_active: true },
      include: {
        fact_donasi: {
          include: {
            dim_program_donasi: true,
          },
          orderBy: { sk_tgl_bersih: 'desc' }
        }
      } 
    })

    if (!dataDonatur) {
      return NextResponse.json({ error: "Donatur tidak ditemukan" }, { status: 404 })
    }

    const history = await prisma.dim_donatur.findMany({
      where: { id_donatur: id, is_active: false },
      orderBy: { valid_from: 'desc' }
    })

    return NextResponse.json({ donatur: dataDonatur, history })
  } catch (error: any) {
    console.error("API_ERROR:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}