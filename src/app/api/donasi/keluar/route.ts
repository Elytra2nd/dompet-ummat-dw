import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await prisma.fact_penyaluran.findMany({
      include: {
        dim_mustahik: true,
        dim_penyalur_master: true,
        dim_date_fact_penyaluran_sk_tgl_disalurkanTodim_date: true,
      },
      orderBy: { sk_fakta_penyaluran: 'desc' },
    })
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('KELUAR_GET_ERROR:', error.message)
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
      now.getDate().toString().padStart(2, '0'),
    )

    const penyaluran = await prisma.fact_penyaluran.create({
      data: {
        id_transaksi: `OUT-${Date.now()}`,
        sk_mustahik: parseInt(body.sk_mustahik),
        sk_penyalur: parseInt(body.sk_penyalur) || 1,
        sk_tgl_disalurkan: sk_tgl,
        sk_tgl_berkas: sk_tgl,
        dana_tersalur: body.jumlah,
        domain_program: body.domain || 'Sosial_Kemanusiaan',
        kategori_program: body.kategori || 'Sembako',
        jenis_bantuan: body.jenis || 'Tunai',
        status_pengajuan: 'Disetujui',
      },
    })

    return NextResponse.json({ success: true, data: penyaluran })
  } catch (error: any) {
    console.error('KELUAR_POST_ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { sk_fakta_penyaluran, dana_tersalur, domain_program, kategori_program, jenis_bantuan, status_pengajuan, kategori_penyakit } = body

    if (!sk_fakta_penyaluran) {
      return NextResponse.json({ error: 'sk_fakta_penyaluran diperlukan' }, { status: 400 })
    }

    const updated = await prisma.fact_penyaluran.update({
      where: { sk_fakta_penyaluran: parseInt(sk_fakta_penyaluran) },
      data: {
        ...(dana_tersalur !== undefined && { dana_tersalur: parseFloat(dana_tersalur) }),
        ...(domain_program && { domain_program: domain_program as any }),
        ...(kategori_program && { kategori_program: kategori_program as any }),
        ...(jenis_bantuan && { jenis_bantuan: jenis_bantuan as any }),
        ...(status_pengajuan && { status_pengajuan: status_pengajuan as any }),
        ...(kategori_penyakit !== undefined && { kategori_penyakit: kategori_penyakit as any }),
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('KELUAR_PUT_ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sk = searchParams.get('sk')

    if (!sk) return NextResponse.json({ error: 'Parameter sk diperlukan' }, { status: 400 })

    await prisma.fact_penyaluran.delete({
      where: { sk_fakta_penyaluran: parseInt(sk) },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('KELUAR_DELETE_ERROR:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}