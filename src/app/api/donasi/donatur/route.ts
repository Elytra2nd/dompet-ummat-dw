import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')

  try {
    const donatur = await prisma.dim_donatur.findMany({
      where: query ? {
        OR: [
          { nama_lengkap: { contains: query } },
          { kontak_utama: { contains: query } },
          { id_donatur: { contains: query } }
        ]
      } : {},
      take: 10,
      orderBy: { sk_donatur: 'desc' }
    })
    
    return NextResponse.json(donatur)
  } catch (error: any) {
    return NextResponse.json({ 
      error: "Gagal memuat data donatur", 
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // Sesuaikan destructuring dengan nama input dari form
    const { nama_donatur, no_hp, alamat, kategori_donatur } = body

    const count = await prisma.dim_donatur.count()
    const id_donatur = `DNR-${(count + 1).toString().padStart(4, '0')}`

    const newDonatur = await prisma.dim_donatur.create({
      data: {
        id_donatur,
        nama_lengkap: nama_donatur, // Map ke kolom database
        kontak_utama: no_hp,        // Map ke kolom database
        alamat: alamat,
        tipe: kategori_donatur as any, // Map ke kolom database (Enum)
        is_active: true
      }
    })

    return NextResponse.json({ success: true, data: newDonatur })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}