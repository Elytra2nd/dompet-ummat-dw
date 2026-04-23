import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Grouping Berdasarkan Kategori PM (Existing)
    const sebaranKategori = await prisma.dim_mustahik.groupBy({
      by: ['kategori_pm'],
      _count: { id_mustahik: true },
      where: { is_active: true }
    })

    // 2. INSIGHT BARU: Analisis Gender (Demografi)
    const sebaranGender = await prisma.dim_mustahik.groupBy({
      by: ['gender'],
      _count: { id_mustahik: true },
      where: { is_active: true }
    })

    // 3. INSIGHT BARU: Analisis Lokasi Terpadat (Top 5 Kabupaten/Kota)
    const sebaranWilayah = await prisma.dim_mustahik.groupBy({
      by: ['kabupaten_kota'],
      _count: { id_mustahik: true },
      where: { is_active: true },
      orderBy: { _count: { id_mustahik: 'desc' } },
      take: 5
    })

    // 4. INSIGHT BARU: Rata-rata Skor Kelayakan (Tingkat Kerentanan)
    // Menghitung rata-rata skor dari mustahik yang aktif
    const agregatSkor = await prisma.dim_mustahik.aggregate({
      _avg: {
        skoring: true
      },
      _max: {
        skoring: true
      },
      where: { is_active: true }
    })

    // 5. INSIGHT BARU: Tren Registrasi Mustahik Baru (3 Bulan Terakhir)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    
    const mustahikBaru = await prisma.dim_mustahik.count({
      where: {
        valid_from: { gte: threeMonthsAgo },
        is_active: true
      }
    })

    const total = await prisma.dim_mustahik.count({ where: { is_active: true } })

    return NextResponse.json({ 
      total, 
      sebaranKategori,
      insights: {
        gender_stats: sebaranGender,
        top_locations: sebaranWilayah,
        avg_score: agregatSkor._avg.skoring ? Number(agregatSkor._avg.skoring).toFixed(2) : 0,
        max_score: agregatSkor._max.skoring ? Number(agregatSkor._max.skoring).toFixed(2) : 0,
        new_registrations_3m: mustahikBaru
      },
      // Rasio Ketergantungan (Contoh Analisis)
      analysis: {
        vulnerability_index: mustahikBaru > 0 ? (total / mustahikBaru).toFixed(1) : total
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}