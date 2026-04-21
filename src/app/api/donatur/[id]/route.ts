import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params 

    const dataDonatur = await prisma.dim_donatur.findFirst({
      where: { id_donatur: id, is_active: true },
      include: {
        fact_donasi: {
          include: {
            dim_program_donasi: true,
            // Jika dim_jalur_pembayaran sudah ada di schema, aktifkan ini:
            // dim_jalur_pembayaran: true 
          },
          orderBy: { sk_tgl_bersih: 'desc' } // Sesuai kolom di DB
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
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}