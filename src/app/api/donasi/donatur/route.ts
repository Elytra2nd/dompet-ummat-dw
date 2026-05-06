import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { validateQuery, DonaturQuerySchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

// --- READ (GET) ---
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const { data: qp, error } = validateQuery(searchParams, DonaturQuerySchema)
  if (error) return error
  const { q: query, page, limit } = qp

  try {
    const [donatur, total] = await Promise.all([
      prisma.dim_donatur.findMany({
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
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { nama_lengkap: 'asc' },
      }),
      prisma.dim_donatur.count({
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
      }),
    ])

    return NextResponse.json({ data: donatur, total, page, limit })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- CREATE (POST) ---
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nama_donatur, no_hp, alamat, kategori_donatur, perusahaan } = body

    const year = new Date().getFullYear().toString().substring(2);
    // Menggunakan timestamp + random string untuk menghindari race condition Unique Constraint
    const uniqueHash = Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const id_donatur = `DU-${year}01.${uniqueHash}`

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

      // Ambil business key asli (tanpa suffix versi jika sudah ada)
      const baseId = oldRecord.id_donatur.replace(/-v\d+$/, '')

      // Versi baru = menggunakan timestamp untuk menghindari race condition antar transaksi
      const newIdDonatur = `${baseId}-v${Date.now()}`

      const now = new Date()
      const nextSecond = new Date(now.getTime() + 1000)

      const newVersion = await tx.dim_donatur.create({
        data: {
          id_donatur: newIdDonatur,
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