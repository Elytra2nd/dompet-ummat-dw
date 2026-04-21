import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

// Menghindari cache Vercel agar data selalu fresh dari warehouse
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const logs = await prisma.fact_layanan_ambulan.findMany({
      include: {
        dim_pasien_ambulan: true,
        dim_lokasi: true,
      },
      orderBy: {
        sk_fakta_layanan_ambulan: 'desc'
      },
    })

    return NextResponse.json(logs)
  } catch (error: any) {
    console.error("GET_AMBULAN_ERROR:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')
    const randomId = Math.floor(1000 + Math.random() * 9000)
    const idTransaksi = `AMB-${dateStr}-${randomId}`

    const newLog = await prisma.fact_layanan_ambulan.create({
      data: {
        id_transaksi: idTransaksi,
        sk_pasien: parseInt(body.sk_pasien),
        sk_lokasi: parseInt(body.sk_lokasi),
        sk_tanggal_layanan: parseInt(body.sk_tanggal),
        jam: body.jam,
        armada: body.armada,
        kategori_layanan: body.kategori,
      }
    })

    return NextResponse.json(newLog)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const updatedLog = await prisma.fact_layanan_ambulan.update({
      where: { sk_fakta_layanan_ambulan: body.sk_fakta_layanan_ambulan },
      data: {
        sk_pasien: parseInt(body.sk_pasien),
        sk_lokasi: parseInt(body.sk_lokasi),
        sk_tanggal_layanan: parseInt(body.sk_tanggal),
        jam: body.jam,
        armada: body.armada,
        kategori_layanan: body.kategori,
      }
    })
    return NextResponse.json(updatedLog)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sk = searchParams.get('sk')

    if (!sk) return NextResponse.json({ error: "SK missing" }, { status: 400 })

    await prisma.fact_layanan_ambulan.delete({
      where: { sk_fakta_layanan_ambulan: parseInt(sk) }
    })

    return NextResponse.json({ message: "Data deleted" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}