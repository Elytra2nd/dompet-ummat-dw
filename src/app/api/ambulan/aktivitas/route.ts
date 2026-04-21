import { prisma } from '@/lib/prisma'
import { NextResponse, NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// GET: Ambil ringkasan aktivitas untuk Dashboard Utama
export async function GET() {
  try {
    const [totalAktivitas, totalBiaya, recentLogs] = await Promise.all([
      prisma.fact_aktivitas_ambulan.count(),
      prisma.fact_aktivitas_ambulan.aggregate({
        _sum: { biaya_operasional: true }
      }),
      prisma.fact_aktivitas_ambulan.findMany({
        take: 5,
        orderBy: { sk_fakta_aktivitas_ambulan: 'desc' }
      })
    ])

    return NextResponse.json({
      totalCount: totalAktivitas,
      totalExp: Number(totalBiaya._sum.biaya_operasional || 0),
      recentLogs: recentLogs
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Catat pengeluaran/aktivitas baru (Bensin, Servis, dll)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jam, armada, kategori_aktivitas, biaya_operasional, sk_tanggal_manual } = body

    // Generate Smart Date Key YYYYMMDD (Gunakan manual jika ada, jika tidak gunakan hari ini)
    const now = new Date()
    const sk_tanggal = sk_tanggal_manual ? parseInt(sk_tanggal_manual) : parseInt(
      now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0'),
    )

    const aktivitas = await prisma.fact_aktivitas_ambulan.create({
      data: {
        id_transaksi: `EXP-AMB-${Date.now()}`,
        sk_tanggal_aktivitas: sk_tanggal,
        jam: jam || 'Pagi__06_00_12_00_',
        armada: armada || 'Ambulan_1__KB_1234_XX_',
        kategori_aktivitas: kategori_aktivitas || 'Bahan_Bakar',
        biaya_operasional: parseFloat(biaya_operasional) || 0,
        jumlah_aktivitas: 1, 
        sk_lokasi: -1, // Default value untuk mapping lokasi non-pasien
      },
    })

    return NextResponse.json({ success: true, id: aktivitas.id_transaksi })
  } catch (error: any) {
    console.error('ERROR_AMBULAN_AKTIVITAS:', error)
    return NextResponse.json(
      { error: 'Gagal mencatat aktivitas ke warehouse', details: error.message },
      { status: 500 },
    )
  }
}