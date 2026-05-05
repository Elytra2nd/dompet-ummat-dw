import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { logActivity } from '@/lib/audit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const sk_survey = parseInt(id)
    if (isNaN(sk_survey)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

    const survey = await prisma.fact_survey.findUnique({
      where: { sk_survey },
      include: {
        dim_mustahik: true,
        fact_survey_detail: true,
      }
    })

    if (!survey) return NextResponse.json({ error: 'Survey tidak ditemukan' }, { status: 404 })

    const skorData = await prisma.fact_skor_kelayakan.findFirst({
      where: { id_survey: survey.no_register || '' }
    })

    // Format detail_skor menjadi objek { [sk_pertanyaan]: skor_angka }
    const detail_skor: { [key: number]: number } = {}
    survey.fact_survey_detail.forEach(d => {
       if (d.sk_pertanyaan && d.skor_angka) {
         detail_skor[d.sk_pertanyaan] = Number(d.skor_angka)
       }
    })

    return NextResponse.json({
      survey,
      skorData,
      detail_skor
    })
  } catch (error: any) {
    console.error('GET_SURVEY_ERROR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const userId = token?.sub || 'SYSTEM'
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    const { id } = await params
    const sk_survey = parseInt(id)
    
    if (isNaN(sk_survey)) return NextResponse.json({ error: 'ID tidak valid' }, { status: 400 })

    const body = await req.json()
    const {
      pendapatan_bulanan,
      pengeluaran_bulanan,
      jumlah_tanggungan,
      kondisi_tempat_tinggal,
      kategori_asnaf,
      kategori_rekomendasi,
      skor_akhir,
      status_kelayakan,
      detail_skor, // Objek berisi { sk_pertanyaan: skor_angka }
    } = body

    const existingSurvey = await prisma.fact_survey.findUnique({
      where: { sk_survey },
      include: { dim_mustahik: true }
    })

    if (!existingSurvey) {
      return NextResponse.json({ error: 'Data survey tidak ditemukan' }, { status: 404 })
    }
    
    // TRANSACTION: Update 3 Tabel Fakta (Replace detail)
    await prisma.$transaction(async (tx) => {
      // 1. Update fact_survey
      await tx.fact_survey.update({
        where: { sk_survey },
        data: {
          golongan_penerima: kategori_asnaf as any,
          kelayakan_sistem: status_kelayakan as any,
          total_skor_sistem: parseFloat(skor_akhir),
          kategori_rekomendasi: kategori_rekomendasi as any,
        }
      })

      // 2. Update fact_skor_kelayakan
      const no_register = existingSurvey.no_register
      if (no_register) {
         await tx.fact_skor_kelayakan.updateMany({
           where: { id_survey: no_register },
           data: {
             pendapatan_bulanan: parseFloat(pendapatan_bulanan),
             pengeluaran_bulanan: parseFloat(pengeluaran_bulanan),
             jumlah_tanggungan: parseInt(jumlah_tanggungan),
             skor_akhir: parseFloat(skor_akhir),
             status_kelayakan: status_kelayakan as any,
             kategori_asnaf: kategori_asnaf as any,
             kondisi_tempat_tinggal: kondisi_tempat_tinggal as any,
             kategori_rekomendasi: kategori_rekomendasi as any,
           }
         })
      }

      // 3. Delete & Recreate fact_survey_detail (Replace All)
      await tx.fact_survey_detail.deleteMany({
        where: { sk_survey }
      })

      const detailEntries = Object.entries(detail_skor).map(
        ([sk_pertanyaan, skor]) => ({
          sk_survey: sk_survey,
          sk_pertanyaan: parseInt(sk_pertanyaan),
          skor_angka: parseFloat(skor as string),
        }),
      )

      await tx.fact_survey_detail.createMany({
        data: detailEntries,
      })
    })

    if (userId !== 'SYSTEM') {
      await logActivity(userId, 'UPDATE_SURVEY', 'fact_survey', { sk_survey: sk_survey, no_register: existingSurvey.no_register }, ip)
    }

    return NextResponse.json({
      success: true,
      message: 'Data survey berhasil diperbarui'
    })
  } catch (error: any) {
    console.error('ERROR_SURVEY_UPDATE:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui data survey', details: error.message },
      { status: 500 },
    )
  }
}
