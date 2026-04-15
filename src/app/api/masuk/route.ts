import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateSkDate } from '@/lib/utils-ambulan'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      id_donatur, 
      sk_petugas, 
      jenis_donasi, 
      nominal_donasi, 
      metode_pembayaran, 
      bank_tujuan, 
      keterangan 
    } = body

    // 1. Validasi: Cari sk_donatur berdasarkan id_donatur (Natural Key)
    const donatur = await prisma.dim_donatur.findUnique({
      where: { id_donatur: id_donatur }
    })

    if (!donatur) {
      return NextResponse.json(
        { error: "Donatur tidak ditemukan. Pastikan ID sudah benar." }, 
        { status: 404 }
      )
    }

    // 2. Generate Smart Date Key (YYYYMMDD)
    const sk_tgl = generateSkDate()

    // 3. Simpan Transaksi ke fact_donasi
    // Kita buat ID Transaksi unik dengan prefix TRX-IN
    const transaksi = await prisma.fact_donasi.create({
      data: {
        id_transaksi_donasi: `TRX-IN-${Date.now()}`,
        sk_donatur: donatur.sk_donatur,
        sk_petugas: parseInt(sk_petugas) || 1,
        sk_tgl_bersih: sk_tgl,
        jenis_donasi: jenis_donasi as any,
        nominal_donasi: parseFloat(nominal_donasi),
        metode_pembayaran: metode_pembayaran as any,
        bank_tujuan: bank_tujuan as any,
        keterangan: keterangan || null,
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Donasi berhasil dicatat!",
      id: transaksi.id_transaksi_donasi 
    })

  } catch (error: any) {
    console.error("ERROR_DONASI_POST:", error)
    return NextResponse.json(
      { error: "Gagal memproses donasi", details: error.message }, 
      { status: 500 }
    )
  }
}