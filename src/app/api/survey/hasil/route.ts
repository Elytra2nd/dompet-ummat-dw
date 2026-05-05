import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { logActivity } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const surveys = await prisma.fact_survey.findMany({
      include: {
        dim_mustahik: {
          select: {
            nama: true,
            id_mustahik: true,
            kategori_pm: true
          }
        },
        dim_date: true // Mengambil info tanggal survey
      },
      orderBy: { sk_survey: 'desc' }
    })

    return NextResponse.json(surveys)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const userId = token?.sub || 'SYSTEM'
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    const { searchParams } = new URL(req.url)
    const sk = searchParams.get('sk')

    if (!sk) {
      return NextResponse.json({ error: 'Parameter sk diperlukan' }, { status: 400 })
    }

    await prisma.fact_survey.delete({
      where: { sk_survey: parseInt(sk) }
    })

    if (userId !== 'SYSTEM') {
      await logActivity(userId, 'DELETE_SURVEY', 'fact_survey', { sk_survey: sk }, ip)
    }

    return NextResponse.json({ success: true, message: 'Data survey berhasil dihapus' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}