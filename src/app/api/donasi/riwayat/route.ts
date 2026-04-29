import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const [total, data] = await Promise.all([
      prisma.fact_donasi.count(),
      prisma.fact_donasi.findMany({
        skip,
        take: limit,
        orderBy: {
          sk_fakta_donasi: 'desc',
        },
        include: {
          dim_donatur: { select: { nama_lengkap: true } },
          dim_program_donasi: { select: { program_induk: true, sub_program: true } },
          dim_jalur_pembayaran: { select: { metode_bayar: true, bank_asal: true } },
        }
      })
    ])

    return NextResponse.json({
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('GET_RIWAYAT_DONASI_ERROR:', error)
    return NextResponse.json({ error: 'Gagal mengambil riwayat donasi' }, { status: 500 })
  }
}
