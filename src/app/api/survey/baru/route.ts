
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateSkDate } from '@/lib/utils-ambulan' // Kita gunakan helper yang sudah dibuat

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      id_mustahik, 
      sk_petugas, 
      pendapatan_bulanan, 
      pengeluaran_bulanan, 
      jumlah_tanggungan, 
      kondisi_tempat_tinggal, 
      kategori_asnaf, 
      kategori_rekomendasi,
      skor_akhir,
      status_kelayakan,
      detail_skor // Objek berisi { sk_pertanyaan: skor_angka }
    } = body

    // 1. Cari sk_mustahik berdasarkan id_mustahik (MST-XXXX)
    const mustahik = await prisma.dim_mustahik.findUnique({
      where: { id_mustahik }
    })

    if (!mustahik) {
      return NextResponse.json({ error: "ID Mustahik tidak ditemukan" }, { status: 404 })
    }

    const sk_tgl = generateSkDate()
    const id_survey_gen = `SRV-${Date.now()}`

    // 2. TRANSACTION: Simpan ke 3 Tabel Fakta
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Simpan ke fact_skor_kelayakan (Data Ekonomi & Hasil Akhir)
      const skorKelayakan = await tx.fact_skor_kelayakan.create({
        data: {
          id_survey: id_survey_gen,
          sk_mustahik: mustahik.sk_mustahik,
          sk_petugas: sk_petugas || 1,
          sk_tgl_survey: sk_tgl,
          pendapatan_bulanan: parseFloat(pendapatan_bulanan),
          pengeluaran_bulanan: parseFloat(pengeluaran_bulanan),
          jumlah_tanggungan: parseInt(jumlah_tanggungan),
          skor_akhir: parseFloat(skor_akhir),
          status_kelayakan: status_kelayakan as any,
          kategori_asnaf: kategori_asnaf as any,
          kondisi_tempat_tinggal: kondisi_tempat_tinggal as any,
          kategori_rekomendasi: kategori_rekomendasi as any
        }
      })

      // B. Simpan ke fact_survey (Header Survey)
      const surveyHeader = await tx.fact_survey.create({
        data: {
          no_register: id_survey_gen,
          sk_mustahik: mustahik.sk_mustahik,
          sk_tgl_survey: sk_tgl,
          golongan_penerima: kategori_asnaf as any,
          kelayakan_sistem: status_kelayakan as any,
          total_skor_sistem: parseFloat(skor_akhir),
          kategori_rekomendasi: kategori_rekomendasi as any
        }
      })

      // C. Simpan ke fact_survey_detail (Butir-butir jawaban survey)
      const detailEntries = Object.entries(detail_skor).map(([sk_pertanyaan, skor]) => ({
        sk_survey: surveyHeader.sk_survey,
        sk_pertanyaan: parseInt(sk_pertanyaan),
        skor_angka: parseFloat(skor as string)
      }))

      await tx.fact_survey_detail.createMany({
        data: detailEntries
      })

      return { id_survey: id_survey_gen }
    })

    return NextResponse.json({ 
      success: true, 
      message: "Data survey dan skor kelayakan berhasil disimpan",
      id_survey: result.id_survey 
    })

  } catch (error: any) {
    console.error("ERROR_SURVEY_SAVE:", error)
    return NextResponse.json(
      { error: "Gagal memproses data survey", details: error.message }, 
      { status: 500 }
    )
  }
}