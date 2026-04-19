import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// Paksa agar tidak di-cache oleh Vercel (penting untuk data transaksional)
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  try {
    const donatur = await prisma.dim_donatur.findMany({
      where: query
        ? {
            OR: [
              { nama_lengkap: { contains: query } },
              { kontak_utama: { contains: query } },
              { id_donatur: { contains: query } },
            ],
            // Pastikan hanya donatur aktif yang muncul di pilihan
            is_active: true,
          }
        : { is_active: true },
      take: 10,
      // Urutkan berdasarkan nama agar mudah dicari di dropdown
      orderBy: { nama_lengkap: 'asc' },
    })

    return NextResponse.json(donatur)
  } catch (error: any) {
    console.error("Error Fetch Donatur:", error)
    return NextResponse.json(
      {
        error: 'Gagal memuat data donatur',
        message: error.message,
      },
      { status: 500 },
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Sesuai dengan payload yang dikirim dari form input donatur
    const { nama_donatur, no_hp, alamat, kategori_donatur } = body

    // 1. Generate ID Donatur Unik (Format: DNR-2026-0001)
    const count = await prisma.dim_donatur.count()
    const year = new Date().getFullYear()
    const id_donatur = `DNR-${year}-${(count + 1).toString().padStart(4, '0')}`

    // 2. Simpan ke Database - Versi Stabil (Tanpa SCD fields yang belum terdaftar)
    const newDonatur = await prisma.dim_donatur.create({
      data: {
        id_donatur,
        nama_lengkap: nama_donatur,
        kontak_utama: no_hp,
        alamat: alamat || '-',
        tipe: kategori_donatur || 'PERSONAL', // Pastikan sesuai Enum/String di Prisma
        is_active: true,
      },
    })

    return NextResponse.json({ success: true, data: newDonatur })
  } catch (error: any) {
    console.error("Error Create Donatur:", error)
    return NextResponse.json(
      { error: 'Gagal menambahkan donatur baru', message: error.message }, 
      { status: 500 }
    )
  }
}