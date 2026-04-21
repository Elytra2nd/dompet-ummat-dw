import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await prisma.fact_penyaluran.findMany({
      include: {
        dim_program: true,
        dim_mustahik: true,
      },
      orderBy: { sk_fakta_penyaluran: 'desc' }
    })
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const now = new Date()
    const sk_tanggal = parseInt(now.toISOString().split('T')[0].replace(/-/g, ''))

    const penyaluran = await prisma.fact_penyaluran.create({
      data: {
        id_transaksi: `OUT-${Date.now()}`,
        sk_tanggal_penyaluran: sk_tanggal,
        sk_program: parseInt(body.sk_program),
        sk_mustahik: parseInt(body.sk_mustahik),
        jumlah_penyaluran: parseFloat(body.jumlah),
        keterangan: body.keterangan,
        metode_penyaluran: body.metode || 'Transfer',
      },
    })

    return NextResponse.json({ success: true, data: penyaluran })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}