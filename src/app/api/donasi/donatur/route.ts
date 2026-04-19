import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// --- READ (GET) ---
// Hanya mengambil record yang is_active: true (Current Version)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  try {
    const donatur = await prisma.dim_donatur.findMany({
      where: {
        is_active: true, 
        ...(query && {
          OR: [
            { nama_lengkap: { contains: query } },
            { kontak_utama: { contains: query } },
            { id_donatur: { contains: query } },
            { perusahaan: { contains: query } },
          ],
        }),
      },
      take: 50,
      orderBy: { nama_lengkap: 'asc' },
    })

    return NextResponse.json(donatur)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- CREATE (POST) ---
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nama_donatur, no_hp, alamat, kategori_donatur, perusahaan } = body

    const count = await prisma.dim_donatur.count()
    const year = new Date().getFullYear()
    const id_donatur = `DNR-${year}-${(count + 1).toString().padStart(4, '0')}`

    const newDonatur = await prisma.dim_donatur.create({
      data: {
        id_donatur,
        nama_lengkap: nama_donatur,
        kontak_utama: no_hp,
        alamat: alamat || '-',
        perusahaan: perusahaan || '-',
        tipe: kategori_donatur,
        is_active: true,
        valid_from: new Date(), // Menandai awal masa berlaku
        valid_to: new Date('9999-12-31'),
      },
    })

    return NextResponse.json({ success: true, data: newDonatur })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- UPDATE (PUT) - Implementasi SCD Type 2 ---
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { sk_donatur, nama_donatur, no_hp, alamat, kategori_donatur, perusahaan } = body

    if (!sk_donatur) throw new Error("Surrogate Key (sk_donatur) diperlukan")

    // Menjalankan transaksi agar record lama nonaktif & record baru lahir secara bersamaan
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Ambil data lama untuk mendapatkan id_donatur bisnisnya
      const oldRecord = await tx.dim_donatur.findUnique({
        where: { sk_donatur: Number(sk_donatur) }
      })

      if (!oldRecord) throw new Error("Data lama tidak ditemukan")

      // 2. Nonaktifkan record lama (Archiving)
      await tx.dim_donatur.update({
        where: { sk_donatur: Number(sk_donatur) },
        data: {
          is_active: false,
          valid_to: new Date(), // Berakhir sekarang
        }
      })

      // 3. Buat record baru dengan data terbaru (Versioning)
      return await tx.dim_donatur.create({
        data: {
          id_donatur: oldRecord.id_donatur, // Tetap menggunakan ID Bisnis yang sama
          nama_lengkap: nama_donatur,
          kontak_utama: no_hp,
          alamat: alamat,
          perusahaan: perusahaan || '-',
          tipe: kategori_donatur,
          is_active: true,
          valid_from: new Date(), // Mulai berlaku sekarang
          valid_to: new Date('9999-12-31'),
        }
      })
    })

    return NextResponse.json({ success: true, data: transaction })
  } catch (error: any) {
    console.error("Error SCD Update:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- DELETE (DELETE) ---
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sk = searchParams.get('sk')

    if (!sk) return NextResponse.json({ error: 'SK tidak ditemukan' }, { status: 400 })

    await prisma.dim_donatur.update({
      where: { sk_donatur: Number(sk) },
      data: { 
        is_active: false,
        valid_to: new Date() // Menandai record berakhir saat dihapus
      }, 
    })

    return NextResponse.json({ success: true, message: "Donatur berhasil dinonaktifkan" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}