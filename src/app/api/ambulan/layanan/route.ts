import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      nama_pasien,
      gender,
      no_hp,
      status_ekonomi,
      alamat_jemput,
      jam,
      armada,
      kategori_layanan,
      desa,
      kelurahan_kecamatan,
      kabupaten_kota,
      provinsi,
      latitude,
      longitude,
    } = body

    // --- 1. GENERATE SMART DATE KEY (YYYYMMDD) ---
    const now = new Date()
    const sk_tanggal = parseInt(
      now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0'),
    )

    // --- 2. TRANSACTION: LOKASI -> PASIEN -> FAKTA LAYANAN ---
    const result = await prisma.$transaction(async (tx) => {
      // A. Simpan Lokasi Tujuan ke dim_lokasi
      const newLocation = await tx.dim_lokasi.create({
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          desa_kelurahan: desa || 'To Be Determined',
          kecamatan: kelurahan_kecamatan || 'To Be Determined',
          kabupaten_kota: kabupaten_kota || 'Melawi',
          provinsi: provinsi || 'Kalimantan Barat',
        },
      })

      // B. Upsert Pasien (Cek berdasarkan Nama & No HP untuk meminimalisir duplikasi)
      // Catatan: Di skema kamu id_pasien manual, kita generate otomatis jika baru.
      const pasien = await tx.dim_pasien_ambulan.create({
        data: {
          id_pasien: `PAS-${Date.now()}`,
          nama_pasien,
          gender: (gender as any) || 'To_Be_Determined',
          no_hp: no_hp || null,
          status_ekonomi: (status_ekonomi as any) || 'To_Be_Determined',
          alamat_jemput,
          desa: desa || null,
          kelurahan_kecamatan: kelurahan_kecamatan || null,
          kabupaten_kota: kabupaten_kota || 'Melawi',
        },
      })

      // C. Simpan ke fact_layanan_ambulan
      const layanan = await tx.fact_layanan_ambulan.create({
        data: {
          id_transaksi: `SRV-AMB-${Date.now()}`,
          sk_pasien: pasien.sk_pasien,
          sk_tanggal_layanan: sk_tanggal,
          jam: jam as any, // Sesuai Enum fact_layanan_ambulan_jam_enum
          armada: armada as any, // Sesuai Enum fact_layanan_ambulan_armada_enum
          kategori_layanan: kategori_layanan as any,
          sk_lokasi: newLocation.sk_lokasi,
          jumlah_layanan: 1, // Measure untuk SUM frekuensi
        },
      })

      return { pasien, layanan }
    })

    return NextResponse.json({
      success: true,
      message: 'Layanan ambulans berhasil dicatat',
      id_pasien: result.pasien.id_pasien,
    })
  } catch (error: any) {
    console.error('ERROR_AMBULAN_LAYANAN:', error)
    return NextResponse.json(
      { error: 'Gagal mencatat layanan ambulans', details: error.message },
      { status: 500 },
    )
  }
}
