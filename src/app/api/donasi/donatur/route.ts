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
        is_active: true, // Hanya ambil yang aktif
        ...(query && {
          OR: [
            { nama_lengkap: { contains: query } },
            { kontak_utama: { contains: query } },
            { id_donatur: { contains: query } },
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
    const { nama_donatur, no_hp, alamat, kategori_donatur } = body

    const count = await prisma.dim_donatur.count()
    const year = new Date().getFullYear()
    const id_donatur = `DNR-${year}-${(count + 1).toString().padStart(4, '0')}`

    const newDonatur = await prisma.dim_donatur.create({
      data: {
        id_donatur,
        nama_lengkap: nama_donatur,
        kontak_utama: no_hp,
        alamat: alamat || '-',
        tipe: kategori_donatur || 'PERSONAL',
        is_active: true,
      },
    })

    return NextResponse.json({ success: true, data: newDonatur })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- UPDATE (PUT) ---
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { sk_donatur, nama_donatur, no_hp, alamat, kategori_donatur } = body

    if (!sk_donatur) throw new Error("Surrogate Key (sk_donatur) diperlukan")

    const updatedDonatur = await prisma.dim_donatur.update({
      where: { sk_donatur: Number(sk_donatur) },
      data: {
        nama_lengkap: nama_donatur,
        kontak_utama: no_hp,
        alamat: alamat,
        tipe: kategori_donatur,
      },
    })

    return NextResponse.json({ success: true, data: updatedDonatur })
  } catch (error: any) {
    console.error("Error Update Donatur:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- DELETE (DELETE) - Soft Delete ---
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sk = searchParams.get('sk')

    if (!sk) return NextResponse.json({ error: 'SK tidak ditemukan' }, { status: 400 })

    await prisma.dim_donatur.update({
      where: { sk_donatur: Number(sk) },
      data: { is_active: false }, // Soft delete untuk integritas data DW
    })

    return NextResponse.json({ success: true, message: "Donatur berhasil dinonaktifkan" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}