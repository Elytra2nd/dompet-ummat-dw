import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const year = searchParams.get('year')

    if (!id || !year) {
      return NextResponse.json({ error: 'Parameter id_donatur dan year wajib diisi' }, { status: 400 })
    }

    const donatur = await prisma.dim_donatur.findUnique({
      where: { id_donatur: id },
      select: {
        sk_donatur: true,
        nama_lengkap: true,
        alamat: true,
        kontak_utama: true,
      }
    })

    if (!donatur) {
      return NextResponse.json({ error: 'Donatur tidak ditemukan' }, { status: 404 })
    }

    // Ambil histori transaksi pada tahun yang dipilih
    const transactions = await prisma.fact_donasi.findMany({
      where: {
        sk_donatur: donatur.sk_donatur,
        dim_date: {
          tahun: Number(year)
        }
      },
      include: {
        dim_date: true,
        dim_program_donasi: true,
      },
      orderBy: {
        dim_date: { tanggal: 'asc' }
      }
    })

    // Mapping dan agregasi transaksi
    const riwayat = transactions.map(trx => ({
      tanggal: trx.dim_date?.tanggal || new Date(),
      jenis_transaksi: trx.dim_program_donasi?.program_induk || '-',
      sub_donasi: trx.dim_program_donasi?.sub_program || '-',
      jumlah: Number(trx.nominal_valid || 0)
    }))

    const rekap = {
      zakat: 0,
      infak: 0,
      wakaf: 0,
      kurban: 0,
    }

    for (const item of riwayat) {
      const jenis = String(item.jenis_transaksi).toUpperCase()
      if (jenis.includes('ZAKAT')) rekap.zakat += item.jumlah
      else if (jenis.includes('INFAK') || jenis.includes('INFAQ') || jenis.includes('SEDEKAH')) rekap.infak += item.jumlah
      else if (jenis.includes('WAKAF')) rekap.wakaf += item.jumlah
      else if (jenis.includes('KURBAN') || jenis.includes('QURBAN') || jenis.includes('AKIKAH')) rekap.kurban += item.jumlah
      else rekap.infak += item.jumlah // Default to infak if unrecognized
    }

    return NextResponse.json({
      donatur: {
        nama_donatur: donatur.nama_lengkap || 'Tanpa Nama',
        alamat_lengkap: donatur.alamat || '-',
        no_hp: donatur.kontak_utama || '-',
      },
      periode: year,
      riwayat,
      rekap
    })
  } catch (error: any) {
    console.error('REPORTS_INDIVIDU_ERROR:', error)
    return NextResponse.json({ error: 'Gagal memuat laporan donatur' }, { status: 500 })
  }
}
