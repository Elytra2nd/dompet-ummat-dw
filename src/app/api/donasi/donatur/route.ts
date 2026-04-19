import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// --- READ (GET) ---
// Hanya mengambil record yang is_active: true (Versi Terbaru/Aktif)
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
        valid_from: new Date(),
        valid_to: new Date('9999-12-31'),
      },
    })

    return NextResponse.json({ success: true, data: newDonatur })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- UPDATE (PUT) - Implementasi Full SCD Type 2 ---
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { sk_donatur, nama_donatur, no_hp, alamat, kategori_donatur, perusahaan } = body

    if (!sk_donatur) return NextResponse.json({ error: "Surrogate Key (SK) diperlukan" }, { status: 400 })

    // Gunakan transaksi agar proses tutup record lama & buat record baru sinkron
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Ambil data lama untuk mendapatkan Business Key (id_donatur)
      const oldRecord = await tx.dim_donatur.findUnique({
        where: { sk_donatur: Number(sk_donatur) }
      })

      if (!oldRecord) throw new Error("Data master tidak ditemukan")

      // 2. Nonaktifkan record lama (Expiring the current record)
      await tx.dim_donatur.update({
        where: { sk_donatur: Number(sk_donatur) },
        data: {
          is_active: false,
          valid_to: new Date(), // Berakhir detik ini
        }
      })

      // 3. Buat baris baru dengan data terbaru (Versioning)
      // Ini aman karena id_donatur sudah tidak UNIQUE di database
      return await tx.dim_donatur.create({
        data: {
          id_donatur: oldRecord.id_donatur, // Tetap pakai ID Bisnis yang sama
          nama_lengkap: nama_donatur,
          kontak_utama: no_hp,
          alamat: alamat,
          perusahaan: perusahaan || '-',
          tipe: kategori_donatur,
          is_active: true,
          valid_from: new Date(), // Berlaku mulai detik ini
          valid_to: new Date('9999-12-31'),
        }
      })
    })

    return NextResponse.json({ success: true, data: transaction })
  } catch (error: any) {
    console.error("SCD Type 2 Update Error:", error)
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
        valid_to: new Date() // Record berakhir saat dihapus
      }, 
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}