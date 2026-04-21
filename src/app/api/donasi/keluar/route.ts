import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await prisma.fact_penyaluran.findMany({
      include: {
        dim_mustahik: true,
        dim_penyalur_master: true,
        // Relasi ke dim_date (Tgl Disalurkan)
        dim_date_fact_penyaluran_sk_tgl_disalurkanTodim_date: true 
      },
      orderBy: { sk_fakta_penyaluran: 'desc' }
    })
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("PRISMA_GET_ERROR:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const now = new Date()
    const sk_tgl = parseInt(
      now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0')
    )

    const penyaluran = await prisma.fact_penyaluran.create({
      data: {
        id_transaksi: `OUT-${Date.now()}`,
        sk_mustahik: parseInt(body.sk_mustahik),
        sk_penyalur: parseInt(body.sk_penyalur) || 1,
        sk_tgl_disalurkan: sk_tgl,
        sk_tgl_berkas: sk_tgl,
        dana_tersalur: body.jumlah, // Prisma handle Decimal dari number/string
        domain_program: body.domain || 'Sosial_Kemanusiaan',
        kategori_program: body.kategori || 'Sembako',
        jenis_bantuan: body.jenis || 'Tunai',
        status_pengajuan: 'Disetujui',
      },
    })

    return NextResponse.json({ success: true, data: penyaluran })
  } catch (error: any) {
    console.error("PRISMA_POST_ERROR:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}