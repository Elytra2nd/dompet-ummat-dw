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

    const newMustahik = await prisma.$transaction(async (tx) => {
      // 1. Buat record lokasi baru di dim_lokasi
      const lokasi = await tx.dim_lokasi.create({
        data: {
          provinsi: "Kalimantan Barat",
          kabupaten_kota: kabupaten_kota,
          latitude: latitude,
          longitude: longitude,
        }
      })

      // 2. Buat record mustahik dan hubungkan ke sk_lokasi baru
      const mustahik = await tx.dim_mustahik.create({
        data: {
          id_mustahik: `MST-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`, // Generate ID dengan timestamp unik
          nama,
          nik,
          alamat,
          kategori_pm,
          skoring,
          sk_lokasi: lokasi.sk_lokasi,
          is_active: true,
        }
      })
      
      return mustahik
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

    // Gunakan Transaction agar tidak ada partial commit (orphaned data)
    const updatedMustahik = await prisma.$transaction(async (tx) => {
      // 1. Cari data lama untuk proses historisasi (SCD Type 2)
      const oldData = await tx.dim_mustahik.findUnique({
        where: { sk_mustahik }
      })

      if (!oldData) throw new Error("Data tidak ditemukan")

      // 2. Ambil business key asli (tanpa suffix versi jika sudah ada)
      const baseId = oldData.id_mustahik.replace(/-v\d+$/, '')

      // 3. Versi baru = menggunakan timestamp untuk menghindari race condition antar transaksi
      const newIdMustahik = `${baseId}-v${Date.now()}`

      // 4. Nonaktifkan record lama
      await tx.dim_mustahik.update({
        where: { sk_mustahik },
        data: {
          is_active: false,
          valid_to: new Date()
        }
      })

      // 5. Buat record lokasi baru (karena koordinat/wilayah mungkin berubah)
      const lokasiBaru = await tx.dim_lokasi.create({
        data: {
          provinsi: "Kalimantan Barat",
          kabupaten_kota: kabupaten_kota,
          latitude: latitude,
          longitude: longitude,
        }
      })

      // 6. Buat record mustahik baru sebagai versi terbaru (Active) dengan ID unik
      const mustahikBaru = await tx.dim_mustahik.create({
        data: {
          id_mustahik: newIdMustahik,
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
      
      return mustahikBaru
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