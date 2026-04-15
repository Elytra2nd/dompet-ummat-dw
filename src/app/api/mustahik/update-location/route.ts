import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { sk_mustahik, latitude, longitude, desa, kecamatan } = await req.json()

    // 1. Buat baris baru di dim_lokasi
    const newLocation = await prisma.dim_lokasi.create({
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        desa_kelurahan: desa,
        kecamatan: kecamatan,
        kabupaten_kota: "Melawi", // Default sesuai lingkup project
        provinsi: "Kalimantan Barat"
      }
    })

    // 2. Update sk_lokasi di dim_mustahik
    await prisma.dim_mustahik.update({
      where: { sk_mustahik: parseInt(sk_mustahik) },
      data: { sk_lokasi: newLocation.sk_lokasi }
    })

    return NextResponse.json({ success: true, message: "Lokasi berhasil disimpan!" })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Gagal menyimpan lokasi" }, { status: 500 })
  }
}