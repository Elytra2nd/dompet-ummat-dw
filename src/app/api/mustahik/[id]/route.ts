import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    const mustahik = await prisma.dim_mustahik.findFirst({
      where: { id_mustahik: id, is_active: true },
      // Jika ada relasi ke tabel fakta penyaluran, bisa di-include di sini
    })

    if (!mustahik) {
      return NextResponse.json({ error: "Mustahik tidak ditemukan" }, { status: 404 })
    }

    // Ambil histori SCD Type 2 (Rekam jejak kondisi sebelumnya)
    const history = await prisma.dim_mustahik.findMany({
      where: { id_mustahik: id, is_active: false },
      orderBy: { valid_from: 'desc' }
    })

    return NextResponse.json({ mustahik, history })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}