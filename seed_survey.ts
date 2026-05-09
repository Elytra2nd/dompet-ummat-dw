import { prisma } from './src/lib/prisma'

const questions = [
  // IV DATA KELUARGA PENERIMA MANFAAT
  { kode_pertanyaan: 'DK-01', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Nama Kepala Keluarga' },
  { kode_pertanyaan: 'DK-02', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Pendidikan terakhir Kepala keluarga' },
  { kode_pertanyaan: 'DK-03', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Pekerjaan Kepala keluarga' },
  { kode_pertanyaan: 'DK-04', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Usia Kepala Keluarga' },
  { kode_pertanyaan: 'DK-05', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Status Marital' },
  { kode_pertanyaan: 'DK-06', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Kesehatan Kepala Keluarga' },
  { kode_pertanyaan: 'DK-07', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Jumlah Tanggungan' },
  { kode_pertanyaan: 'DK-08', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Jumlah Anak yang Sekolah' },
  { kode_pertanyaan: 'DK-09', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Ada Yang Putus Sekolah' },
  { kode_pertanyaan: 'DK-10', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Memiliki Balita dibawah lima tahun' },
  { kode_pertanyaan: 'DK-11', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Istri Hamil' },
  { kode_pertanyaan: 'DK-12', grup_pertanyaan: 'DATA KELUARGA', teks_pertanyaan: 'Status Penerima Manfaat dalam keluarga' },

  // V DATA KONDISI RUMAH PENERIMA MANFAAT
  { kode_pertanyaan: 'KR-01', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Kepemilikan Rumah' },
  { kode_pertanyaan: 'KR-02', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Luas Rumah dan Lantai' },
  { kode_pertanyaan: 'KR-03', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Dinding Rumah' },
  { kode_pertanyaan: 'KR-04', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Lantai' },
  { kode_pertanyaan: 'KR-05', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Atap' },
  { kode_pertanyaan: 'KR-06', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Dapur' },
  { kode_pertanyaan: 'KR-07', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Kursi' },
  { kode_pertanyaan: 'KR-08', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Sumber Air' },
  { kode_pertanyaan: 'KR-09', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Tempat MCK' },
  { kode_pertanyaan: 'KR-10', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Penerangan / Listrik' },
  { kode_pertanyaan: 'KR-11', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Daya Listrik' },
  { kode_pertanyaan: 'KR-12', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Lokasi Rumah' },
  { kode_pertanyaan: 'KR-13', grup_pertanyaan: 'KONDISI RUMAH', teks_pertanyaan: 'Tata Letak Bangunan Rumah' },

  // VI KEPEMILIKAN BARANG
  { kode_pertanyaan: 'KB-01', grup_pertanyaan: 'KEPEMILIKAN BARANG', teks_pertanyaan: 'Elektronik' },
  { kode_pertanyaan: 'KB-02', grup_pertanyaan: 'KEPEMILIKAN BARANG', teks_pertanyaan: 'Kendaraan' },
  { kode_pertanyaan: 'KB-03', grup_pertanyaan: 'KEPEMILIKAN BARANG', teks_pertanyaan: 'Alat komunikasi' },
  { kode_pertanyaan: 'KB-04', grup_pertanyaan: 'KEPEMILIKAN BARANG', teks_pertanyaan: 'Ternak' },
  { kode_pertanyaan: 'KB-05', grup_pertanyaan: 'KEPEMILIKAN BARANG', teks_pertanyaan: 'Perhiasan/emas' },
  { kode_pertanyaan: 'KB-06', grup_pertanyaan: 'KEPEMILIKAN BARANG', teks_pertanyaan: 'Tanah' },

  // VII KESEHATAN KELUARGA
  { kode_pertanyaan: 'KK-01', grup_pertanyaan: 'KESEHATAN KELUARGA', teks_pertanyaan: 'Kemampuan Berobat' },
  { kode_pertanyaan: 'KK-02', grup_pertanyaan: 'KESEHATAN KELUARGA', teks_pertanyaan: 'Pola Penyakit dalam Keluarga dalam sebulan' },
  { kode_pertanyaan: 'KK-03', grup_pertanyaan: 'KESEHATAN KELUARGA', teks_pertanyaan: 'Terdapat penyakit parah / memerlukan pembiayaan besar' },
  { kode_pertanyaan: 'KK-04', grup_pertanyaan: 'KESEHATAN KELUARGA', teks_pertanyaan: 'Kondisi Ibu Hamil' },
  { kode_pertanyaan: 'KK-05', grup_pertanyaan: 'KESEHATAN KELUARGA', teks_pertanyaan: 'Kondisi Gizi Ibu Hamil' },
  { kode_pertanyaan: 'KK-06', grup_pertanyaan: 'KESEHATAN KELUARGA', teks_pertanyaan: 'Berat badan Ibu di bawah standar' },
  { kode_pertanyaan: 'KK-07', grup_pertanyaan: 'KESEHATAN KELUARGA', teks_pertanyaan: 'Pemeriksaan kesehatan' },
  { kode_pertanyaan: 'KK-08', grup_pertanyaan: 'KESEHATAN KELUARGA', teks_pertanyaan: 'Pola makan sehari-hari (nasi)' },

  // VIII TANGGUNGAN KEBUTUHAN HIDUP
  { kode_pertanyaan: 'TK-01', grup_pertanyaan: 'TANGGUNGAN KEBUTUHAN HIDUP', teks_pertanyaan: 'Biaya Listrik' },
  { kode_pertanyaan: 'TK-02', grup_pertanyaan: 'TANGGUNGAN KEBUTUHAN HIDUP', teks_pertanyaan: 'Tanggungan Hutang' },
  { kode_pertanyaan: 'TK-03', grup_pertanyaan: 'TANGGUNGAN KEBUTUHAN HIDUP', teks_pertanyaan: 'Bayar Telpon/HP' },
  { kode_pertanyaan: 'TK-04', grup_pertanyaan: 'TANGGUNGAN KEBUTUHAN HIDUP', teks_pertanyaan: 'Transportasi' },
  { kode_pertanyaan: 'TK-05', grup_pertanyaan: 'TANGGUNGAN KEBUTUHAN HIDUP', teks_pertanyaan: 'Biaya Pendidikan' },

  // IX INDIKATOR KEIMANAN
  { kode_pertanyaan: 'IK-01', grup_pertanyaan: 'INDIKATOR KEIMANAN', teks_pertanyaan: 'Kebiasaan Patologis (miras, judi, zina, narkoba)' },
  { kode_pertanyaan: 'IK-02', grup_pertanyaan: 'INDIKATOR KEIMANAN', teks_pertanyaan: 'Pola sholat Pada Anggota Keluarga' },
  { kode_pertanyaan: 'IK-03', grup_pertanyaan: 'INDIKATOR KEIMANAN', teks_pertanyaan: 'Rajin Mengikuti Pengajian' },
  { kode_pertanyaan: 'IK-04', grup_pertanyaan: 'INDIKATOR KEIMANAN', teks_pertanyaan: 'Istri/ anak gadis memakai jilbab' },
  { kode_pertanyaan: 'IK-05', grup_pertanyaan: 'INDIKATOR KEIMANAN', teks_pertanyaan: 'Merokok' }
]

async function main() {
  console.log('Menghapus data detail survey lama jika ada...')
  await prisma.fact_survey_detail.deleteMany({})
  console.log('Menghapus indikator pertanyaan lama...')
  await prisma.dim_pertanyaan_survey.deleteMany({})
  
  console.log(`Memasukkan ${questions.length} pertanyaan baru...`)
  await prisma.dim_pertanyaan_survey.createMany({
    data: questions
  })
  
  console.log('Selesai!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
