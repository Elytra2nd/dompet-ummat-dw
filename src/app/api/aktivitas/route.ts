import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { jam, armada, kategori_aktivitas, biaya_operasional } = body

    // Generate Smart Date Key YYYYMMDD
    const now = new Date()
    const sk_tanggal = parseInt(
      now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0'),
    )

    const aktivitas = await prisma.fact_aktivitas_ambulan.create({
      data: {
        id_transaksi: `EXP-AMB-${Date.now()}`,
        sk_tanggal_aktivitas: sk_tanggal,
        jam: jam as any,
        armada: armada as any,
        kategori_aktivitas: kategori_aktivitas as any,
        biaya_operasional: parseFloat(biaya_operasional),
        jumlah_aktivitas: 1, // Measure frekuensi aktivitas
        sk_lokasi: -1, // Default ke -1 jika tidak pakai MapPicker untuk SPBU/Bengkel
      },
    })

    return NextResponse.json({ success: true, id: aktivitas.id_transaksi })
  } catch (error: any) {
    console.error('ERROR_AMBULAN_AKTIVITAS:', error)
    return NextResponse.json(
      { error: 'Gagal mencatat pengeluaran ambulans', details: error.message },
      { status: 500 },
    )
  }
}
