import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// 1. GET: Mengambil daftar donatur untuk tabel/pencarian
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  try {
    const donatur = await prisma.dim_donatur.findMany({
      where: query ? {
        OR: [
          { nama_donatur: { contains: query } },
          { no_hp: { contains: query } },
          { id_donatur: { contains: query } }
        ]
      } : {},
      take: 10,
      orderBy: { sk_donatur: 'desc' }
    })
    
    return NextResponse.json(donatur)
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data donatur" }, { status: 500 })
  }
}

// 2. POST: Menambahkan donatur baru (Master Data)
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nama_donatur, no_hp, alamat, email, kategori_donatur } = body

    // Generate ID Donatur Unik (Natural Key)
    const count = await prisma.dim_donatur.count()
    const id_donatur = `DNR-${(count + 1).toString().padStart(4, '0')}`

    const newDonatur = await prisma.dim_donatur.create({
      data: {
        id_donatur,
        nama_donatur,
        no_hp,
        alamat,
        email: email || null,
        kategori_donatur: kategori_donatur || 'Individu',
        // Tambahkan kolom lain sesuai skema core kamu
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Donatur berhasil didaftarkan", 
      data: newDonatur 
    })
  } catch (error: any) {
    console.error("ERROR_DONATUR_POST:", error)
    return NextResponse.json({ 
      error: "Gagal menambah donatur", 
      details: error.message 
    }, { status: 500 })
  }
}