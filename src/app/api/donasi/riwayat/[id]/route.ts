import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const { nominal_valid, no_ref } = body
    
    const updated = await prisma.fact_donasi.update({
      where: { sk_fakta_donasi: parseInt(params.id) },
      data: {
        nominal_valid: nominal_valid ? parseFloat(nominal_valid) : undefined,
        no_ref: no_ref !== undefined ? no_ref : undefined,
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('UPDATE_DONASI_ERROR:', error)
    return NextResponse.json({ error: 'Gagal memperbarui transaksi' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.fact_donasi.delete({
      where: { sk_fakta_donasi: parseInt(params.id) }
    })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('DELETE_DONASI_ERROR:', error)
    return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 })
  }
}
