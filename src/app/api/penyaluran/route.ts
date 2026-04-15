import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateSkDate } from '@/lib/utils-ambulan'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      id_mustahik, 
      sk_penyalur, 
      domain_program, 
      kategori_program, 
      jenis_bantuan, 
      dana_tersalur, 
      status_pengajuan, 
      kategori_penyakit,
      no_referensi_lama
    } = body

    // 1. Validasi: Cari sk_mustahik berdasarkan ID (Natural Key)
    // Ingat: Tabel fakta butuh Surrogate Key (sk_)
    const mustahik = await prisma.dim_mustahik.findUnique({
      where: { id_mustahik: id_mustahik }
    })

    if (!mustahik) {
      return NextResponse.json(
        { error: "ID Mustahik tidak ditemukan di database." }, 
        { status: 404 }
      )
    }

    // 2. Generate Smart Date Key
    const sk_tgl = generateSkDate()

    // 3. Simpan ke fact_penyaluran
    const transaksi = await prisma.fact_penyaluran.create({
      data: {
        id_transaksi: `TRX-OUT-${Date.now()}`,
        no_referensi_lama: no_referensi_lama || null,
        sk_mustahik: mustahik.sk_mustahik,
        sk_penyalur: parseInt(sk_penyalur) || 1,
        domain_program: domain_program as any,
        kategori_program: kategori_program as any,
        jenis_bantuan: jenis_bantuan as any,
        status_pengajuan: status_pengajuan as any,
        kategori_penyakit: kategori_penyakit as any,
        dana_tersalur: parseFloat(dana_tersalur),
        sk_tgl_berkas: sk_tgl,
        sk_tgl_disalurkan: sk_tgl,
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Transaksi penyaluran berhasil dicatat",
      id: transaksi.id_transaksi 
    })

  } catch (error: any) {
    console.error("ERROR_PENYALURAN_POST:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan transaksi penyaluran", details: error.message }, 
      { status: 500 }
    )
  }
}