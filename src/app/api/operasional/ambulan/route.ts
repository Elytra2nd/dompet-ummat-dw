import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const layanan = await prisma.fact_layanan_ambulan.findMany({
      include: {
        dim_pasien_ambulan: true, // Ambil nama pasien
        dim_lokasi: true,         // Ambil detail wilayah
      },
      orderBy: { sk_tanggal_layanan: 'desc' },
      take: 100
    })

    return NextResponse.json(layanan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Generate ID Transaksi sederhana
    const id_transaksi = `AMB-L-26${Math.floor(Math.random() * 10000)}`

    const newLayanan = await prisma.fact_layanan_ambulan.create({
      data: {
        id_transaksi,
        sk_pasien: Number(body.sk_pasien),
        sk_tanggal_layanan: Number(body.sk_tanggal), // Format YYYYMMDD
        jam: body.jam,
        armada: body.armada,
        kategori_layanan: body.kategori,
        sk_lokasi: body.sk_lokasi || -1,
        jumlah_layanan: 1
      }
    })

    return NextResponse.json(newLayanan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}