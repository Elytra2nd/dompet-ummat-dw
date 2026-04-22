import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// --- READ (GET) ---
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
      // take: 100, // BARIS INI DIHAPUS agar mengambil semua data
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

    // Ambil record terakhir untuk increment ID bisnis
    const lastRecord = await prisma.dim_donatur.findFirst({
      orderBy: { sk_donatur: 'desc' },
      select: { id_donatur: true }
    })

    const lastIdNumber = lastRecord?.id_donatur 
      ? parseInt(lastRecord.id_donatur.split('.').pop() || '0')
      : 0

    const year = new Date().getFullYear().toString().substring(2);
    const id_donatur = `DU-${year}01.${(lastIdNumber + 1).toString().padStart(3, '0')}`

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

// --- UPDATE (PUT) - Implementasi SCD Type 2 ---
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { sk_donatur, nama_donatur, no_hp, alamat, kategori_donatur, perusahaan } = body

    if (!sk_donatur) return NextResponse.json({ error: "SK diperlukan untuk update histori" }, { status: 400 })

    const transaction = await prisma.$transaction(async (tx) => {
      const oldRecord = await tx.dim_donatur.findUnique({
        where: { sk_donatur: Number(sk_donatur) }
      })

      if (!oldRecord) throw new Error("Record asal tidak ditemukan di Warehouse")

      const now = new Date()
      const nextSecond = new Date(now.getTime() + 1000)

      const newVersion = await tx.dim_donatur.create({
        data: {
          id_donatur: oldRecord.id_donatur,
          nama_lengkap: nama_donatur,
          kontak_utama: no_hp,
          alamat: alamat,
          perusahaan: perusahaan || '-',
          tipe: kategori_donatur,
          is_active: true,
          valid_from: nextSecond,
          valid_to: new Date('9999-12-31'),
        }
      })

      await tx.dim_donatur.update({
        where: { sk_donatur: Number(sk_donatur) },
        data: {
          is_active: false,
          valid_to: now,
        }
      })

      return newVersion
    }, {
      timeout: 15000 
    })

    return NextResponse.json({ success: true, data: transaction })
  } catch (error: any) {
    console.error("SCD Type 2 Update Failed:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- DELETE (SOFT DELETE) ---
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sk = searchParams.get('sk')

    if (!sk) return NextResponse.json({ error: 'SK tidak ditemukan' }, { status: 400 })

    await prisma.dim_donatur.update({
      where: { sk_donatur: Number(sk) },
      data: { 
        is_active: false,
        valid_to: new Date()
      }, 
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}