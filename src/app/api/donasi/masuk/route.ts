import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateSkDate } from '@/lib/utils-ambulan'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      id_donatur,
      sk_petugas,
      jenis_donasi,      // Ini ID Program
      nominal_donasi,    // Ini Angka Nominal
      metode_pembayaran, // Ini ID Jalur Bayar
      bank_tujuan,       
      keterangan,
    } = body

    // 1. Cari sk_donatur berdasarkan id_donatur (Natural Key dari UI)
    const donatur = await prisma.dim_donatur.findUnique({
      where: { id_donatur: id_donatur },
    })

    if (!donatur) {
      return NextResponse.json(
        {
          error:
            'Donatur tidak ditemukan. Pastikan data master donatur sudah ada.',
        },
        { status: 404 },
      )
    }

    // 2. Generate Surrogate Key Tanggal (YYYYMMDD)
    const sk_tgl = generateSkDate()

    // 3. Simpan Transaksi ke fact_donasi
    // Catatan: Nama properti di dalam 'data' HARUS sama persis dengan schema.prisma
    const transaksi = await prisma.fact_donasi.create({
      data: {
        id_transaksi_donasi: `TRX-IN-${Date.now()}`, 
        sk_donatur: donatur.sk_donatur,
        sk_petugas: parseInt(sk_petugas) || 1,
        sk_tgl_bersih: sk_tgl,
        
        // MAPPING PEMBETULAN:
        sk_program_donasi: parseInt(jenis_donasi) || 1, 
        sk_jalur_pembayaran: parseInt(metode_pembayaran) || 1,
        nominal_valid: parseFloat(nominal_donasi), 
        no_ref: bank_tujuan || keterangan || "-", 
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Data donasi berhasil dicatat ke sistem!',
      id: transaksi.id_transaksi_donasi,
    })
  } catch (error: any) {
    console.error('DATABASE_ERROR_DONASI:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan transaksi donasi', details: error.message },
      { status: 500 },
    )
  }
}