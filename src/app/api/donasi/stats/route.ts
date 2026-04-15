import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 1. Agregasi menggunakan nama kolom yang benar: nominal_valid
    const aggregateDonasi = await prisma.fact_donasi.aggregate({
      _sum: {
        nominal_valid: true
      }
    })

    // 2. Hitung Jumlah Donatur Unik (Muzakki)
    const totalDonatur = await prisma.dim_donatur.count()

    // 3. Ambil data dengan proteksi fallback jika null/undefined
    // Kita gunakan optional chaining dan nullish coalescing (??)
    const totalUang = aggregateDonasi?._sum?.nominal_valid ? Number(aggregateDonasi._sum.nominal_valid) : 0

    return NextResponse.json({
      totalDonasi: totalUang,
      jumlahDonatur: totalDonatur,
      targetBulanan: 100000000,
      pertumbuhan: 15.4
    })
  } catch (error: any) {
    console.error("STATS_ERROR:", error)
    return NextResponse.json({ 
      error: "Gagal memuat statistik", 
      details: error.message 
    }, { status: 500 })
  }
}