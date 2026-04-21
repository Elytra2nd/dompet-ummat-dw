import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// --- READ ALL DATA (GET) ---
export async function GET() {
  try {
    const layanan = await prisma.fact_layanan_ambulan.findMany({
      include: {
        dim_pasien_ambulan: true, 
        dim_lokasi: true,        
      },
      orderBy: { sk_tanggal_layanan: 'desc' },
      // take: 100 // Dihapus agar mengambil semua data warehouse
    })

    return NextResponse.json(layanan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- CREATE (POST) ---
export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    // Generate ID Transaksi (Format: AMB-L-TahunBulan-Random)
    const datePrefix = new Date().toISOString().slice(2,7).replace('-', '')
    const id_transaksi = `AMB-L-${datePrefix}${Math.floor(Math.random() * 1000)}`

    const newLayanan = await prisma.fact_layanan_ambulan.create({
      data: {
        id_transaksi,
        sk_pasien: Number(body.sk_pasien),
        sk_tanggal_layanan: Number(body.sk_tanggal),
        jam: body.jam,
        armada: body.armada,
        kategori_layanan: body.kategori,
        sk_lokasi: Number(body.sk_lokasi) || -1,
        jumlah_layanan: 1
      }
    })

    return NextResponse.json(newLayanan)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- UPDATE (PUT) ---
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { sk_fakta_layanan_ambulan, ...updateData } = body

    const updated = await prisma.fact_layanan_ambulan.update({
      where: { sk_fakta_layanan_ambulan: Number(sk_fakta_layanan_ambulan) },
      data: {
        sk_pasien: Number(updateData.sk_pasien),
        sk_tanggal_layanan: Number(updateData.sk_tanggal),
        jam: updateData.jam,
        armada: updateData.armada,
        kategori_layanan: updateData.kategori,
        sk_lokasi: Number(updateData.sk_lokasi)
      }
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- DELETE ---
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sk = searchParams.get('sk')

    if (!sk) return NextResponse.json({ error: "SK required" }, { status: 400 })

    await prisma.fact_layanan_ambulan.delete({
      where: { sk_fakta_layanan_ambulan: Number(sk) }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}