import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// --- GET: Mengambil data mustahik terintegrasi dengan spasial ---
export async function GET() {
  try {
    const mustahik = await prisma.dim_mustahik.findMany({
      where: { is_active: true },
      include: {
        dim_lokasi: true, 
      },
      orderBy: { sk_mustahik: 'desc' }
    })

    // Transformasi data agar koordinat dari dim_lokasi naik ke level utama
    const formattedData = mustahik.map(m => ({
      ...m,
      latitude: m.dim_lokasi?.latitude ? Number(m.dim_lokasi.latitude) : 0,
      longitude: m.dim_lokasi?.longitude ? Number(m.dim_lokasi.longitude) : 0,
    }))

    return NextResponse.json(formattedData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- POST: Registrasi Mustahik Baru dengan Data Spasial ---
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { nama, nik, alamat, kabupaten_kota, kategori_pm, skoring, latitude, longitude } = body

    // 1. Buat record lokasi baru di dim_lokasi
    const lokasi = await prisma.dim_lokasi.create({
      data: {
        provinsi: "Kalimantan Barat",
        kabupaten_kota: kabupaten_kota,
        latitude: latitude,
        longitude: longitude,
      }
    })

    // 2. Buat record mustahik dan hubungkan ke sk_lokasi baru
    const newMustahik = await prisma.dim_mustahik.create({
      data: {
        id_mustahik: `MST-${Date.now()}`, // Generate ID sederhana
        nama,
        nik,
        alamat,
        kategori_pm,
        skoring,
        sk_lokasi: lokasi.sk_lokasi,
        is_active: true,
      }
    })

    return NextResponse.json(newMustahik)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- PUT: Update Data dengan Logika SCD Type 2 ---
export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { sk_mustahik, nama, nik, alamat, kabupaten_kota, kategori_pm, skoring, latitude, longitude } = body

    // 1. Cari data lama untuk proses historisasi (SCD Type 2)
    const oldData = await prisma.dim_mustahik.findUnique({
      where: { sk_mustahik }
    })

    if (!oldData) throw new Error("Data tidak ditemukan")

    // 2. Nonaktifkan record lama
    await prisma.dim_mustahik.update({
      where: { sk_mustahik },
      data: {
        is_active: false,
        valid_to: new Date()
      }
    })

    // 3. Buat record lokasi baru (karena koordinat/wilayah mungkin berubah)
    const lokasiBaru = await prisma.dim_lokasi.create({
      data: {
        provinsi: "Kalimantan Barat",
        kabupaten_kota: kabupaten_kota,
        latitude: latitude,
        longitude: longitude,
      }
    })

    // 4. Buat record mustahik baru sebagai versi terbaru (Active)
    const updatedMustahik = await prisma.dim_mustahik.create({
      data: {
        id_mustahik: oldData.id_mustahik, // ID Bisnis tetap sama
        nama,
        nik,
        alamat,
        kategori_pm,
        skoring,
        sk_lokasi: lokasiBaru.sk_lokasi,
        is_active: true,
        valid_from: new Date(),
      }
    })

    return NextResponse.json(updatedMustahik)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// --- DELETE: Soft Delete (SCD Type 2) ---
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sk = parseInt(searchParams.get('sk') || '0')

    await prisma.dim_mustahik.update({
      where: { sk_mustahik: sk },
      data: {
        is_active: false,
        valid_to: new Date()
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}