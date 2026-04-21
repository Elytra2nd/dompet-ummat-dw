import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const layananPerArmada = await prisma.fact_layanan_ambulan.groupBy({
      by: ['armada'],
      _count: { id_transaksi: true }
    })

    const kategoriLayanan = await prisma.fact_layanan_ambulan.groupBy({
      by: ['kategori_layanan'],
      _count: { id_transaksi: true }
    })

    const totalLayanan = await prisma.fact_layanan_ambulan.count()

    return NextResponse.json({ 
      total: totalLayanan, 
      perArmada: layananPerArmada,
      perKategori: kategoriLayanan 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}