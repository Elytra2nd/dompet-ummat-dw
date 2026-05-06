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
      no_referensi_lama,
    } = body

    // 1. Validasi: Cari sk_mustahik berdasarkan ID (Natural Key)
    // Ingat: Tabel fakta butuh Surrogate Key (sk_)
    const mustahik = await prisma.dim_mustahik.findUnique({
      where: { id_mustahik: id_mustahik },
    })

    if (!mustahik) {
      return NextResponse.json(
        { error: 'ID Mustahik tidak ditemukan di database.' },
        { status: 404 },
      )
    }

    const DOMAIN_MAP: Record<string, any> = {
      'Pendidikan': 'Pendidikan',
      'Kesehatan': 'Kesehatan',
      'Ekonomi': 'Ekonomi',
      'Sosial Kemanusiaan': 'Sosial_Kemanusiaan',
      'Dakwah & Advokasi': 'Dakwah___Advokasi',
      'Operasional': 'Operasional',
    }
    const KATEGORI_MAP: Record<string, any> = {
      'Beasiswa': 'Beasiswa',
      'Bantuan Biaya Pengobatan': 'Bantuan_Biaya_Pengobatan',
      'Modal Usaha': 'Modal_Usaha',
      'Sembako': 'Sembako',
      'Santunan Tunai': 'Santunan_Tunai',
      'Lainnya': 'Lainnya',
    }
    const JENIS_MAP: Record<string, any> = {
      'Tunai': 'Tunai',
      'Barang/Logistik': 'Barang_Logistik',
      'Jasa/Layanan': 'Jasa_Layanan',
      'Lainnya': 'Lainnya',
    }
    const STATUS_MAP: Record<string, any> = {
      'Proses': 'Proses',
      'Disetujui': 'Disetujui',
      'Ditolak': 'Ditolak',
      'Batal': 'Batal',
    }
    const PENYAKIT_MAP: Record<string, any> = {
      'Penyakit Kronis': 'Penyakit_Kronis',
      'Penyakit Menular': 'Penyakit_Menular',
      'Penyakit Ringan': 'Penyakit_Ringan',
      'Gawat Darurat/Kecelakaan': 'Gawat_Darurat_Kecelakaan',
      'Tidak Ada/Not Applicable': 'Tidak_Ada_Not_Applicable',
    }

    // 2. Generate Smart Date Key
    const sk_tgl = generateSkDate()

    // 3. Simpan ke fact_penyaluran
    const idTransaksi = `TRX-OUT-${Date.now()}`
    const transaksi = await prisma.fact_penyaluran.create({
      data: {
        id_transaksi: idTransaksi,
        no_referensi_lama: no_referensi_lama?.trim() ? no_referensi_lama.trim() : `REF-${idTransaksi}`,
        sk_mustahik: mustahik.sk_mustahik,
        sk_penyalur: parseInt(sk_penyalur) || 1,
        domain_program: DOMAIN_MAP[domain_program] || 'To_Be_Determined',
        kategori_program: KATEGORI_MAP[kategori_program] || 'To_Be_Determined',
        jenis_bantuan: JENIS_MAP[jenis_bantuan] || 'To_Be_Determined',
        status_pengajuan: STATUS_MAP[status_pengajuan] || 'To_Be_Determined',
        kategori_penyakit: PENYAKIT_MAP[kategori_penyakit] || 'Tidak_Ada_Not_Applicable',
        dana_tersalur: parseFloat(dana_tersalur),
        sk_tgl_berkas: sk_tgl,
        sk_tgl_disalurkan: sk_tgl,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Transaksi penyaluran berhasil dicatat',
      id: transaksi.id_transaksi,
    })
  } catch (error: any) {
    console.error('ERROR_PENYALURAN_POST:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan transaksi penyaluran' },
      { status: 500 },
    )
  }
}
