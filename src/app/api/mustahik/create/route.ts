import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      nama, nik, kk, gender, no_hp, alamat, desa, 
      kelurahan_kecamatan, kabupaten_kota, provinsi,
      latitude, longitude, kategori_pm, program_induk,
      sub_program, jumlah_jiwa, dana_tersalur 
    } = body

    // --- 1. LOGIKA AUTO-ID BERDASARKAN PROGRAM_INDUK ---
    let prefix = "MST-GEN" 
    const prog = (program_induk || "").toUpperCase()

    if (prog.includes("KESEHATAN")) prefix = "MST-KES"
    else if (prog.includes("PENDIDIKAN")) prefix = "MST-EDU"
    else if (prog.includes("EKONOMI")) prefix = "MST-EKO"
    else if (prog.includes("SOSIAL")) prefix = "MST-SOS"
    else if (prog.includes("DAKWAH")) prefix = "MST-DKW"
    else if (prog.includes("OPERASIONAL")) prefix = "PTG-OPS"

    const lastRecord = await prisma.dim_mustahik.findFirst({
      where: { id_mustahik: { startsWith: prefix } },
      orderBy: { id_mustahik: 'desc' },
    })

    let nextNumber = 1
    if (lastRecord) {
      const parts = lastRecord.id_mustahik.split('-')
      const lastSeq = parseInt(parts[parts.length - 1])
      if (!isNaN(lastSeq)) nextNumber = lastSeq + 1
    }
    const autoId = `${prefix}-${nextNumber.toString().padStart(4, '0')}`

    // --- 2. TRANSACTION (LOKASI -> MUSTAHIK -> PENYALURAN) ---
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Simpan ke dim_lokasi
      const newLocation = await tx.dim_lokasi.create({
        data: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          desa_kelurahan: desa,
          kecamatan: kelurahan_kecamatan,
          kabupaten_kota: kabupaten_kota || "Melawi",
          provinsi: provinsi || "Kalimantan Barat"
        }
      })

      // B. Simpan ke dim_mustahik
      const mustahik = await tx.dim_mustahik.create({
        data: {
          id_mustahik: autoId,
          nama,
          nik: nik || null,
          kk: kk || null,
          gender: gender === 'L' ? 'L' : gender === 'P' ? 'P' : 'To_Be_Determined',
          no_hp: no_hp || null,
          alamat,
          desa,
          kelurahan_kecamatan,
          kabupaten_kota: kabupaten_kota || "Melawi",
          kategori_pm: (kategori_pm as any) || 'To_Be_Determined', 
          sk_lokasi: newLocation.sk_lokasi,
          jumlah_jiwa: parseInt(jumlah_jiwa) || 1,
          is_active: true,
          valid_from: new Date(),
        }
      })

      // C. Simpan ke fact_penyaluran (Jika ada dana yang diinput)
      if (parseFloat(dana_tersalur) > 0) {
        await tx.fact_penyaluran.create({
          data: {
            id_transaksi: `TX-${Date.now()}-${autoId}`,
            sk_mustahik: mustahik.sk_mustahik,
            dana_tersalur: parseFloat(dana_tersalur),
            domain_program: (program_induk as any) || 'To_Be_Determined',
            status_pengajuan: 'Disetujui',
            // Smart Date Key: YYYYMMDD (Standar Data Warehouse)
            sk_tgl_disalurkan: parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''))
          }
        })
      }

      return { mustahik, autoId }
    })

    return NextResponse.json({ 
      success: true, 
      id_generated: result.autoId 
    })

  } catch (error: any) {
    console.error("ERROR_API_MUSTAHIK:", error)
    return NextResponse.json(
      { error: "Gagal menyimpan ke Data Warehouse", details: error.message }, 
      { status: 500 }
    )
  }
}