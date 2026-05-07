import { PrismaClient } from './src/generated/prisma'

const prisma = new PrismaClient()

async function testUpdate() {
  try {
    // Cari donatur aktif
    let oldRecord = await prisma.dim_donatur.findFirst({
      where: { is_active: true }
    })

    if (!oldRecord) {
      console.log("Tidak ada donatur aktif. Membuat data dummy...");
      oldRecord = await prisma.dim_donatur.create({
        data: {
          id_donatur: `DU-TEST-${Date.now()}`,
          nama_lengkap: "Donatur Test",
          kontak_utama: "08123456789",
          alamat: "Alamat Test",
          perusahaan: "Perusahaan Test",
          tipe: "Individu",
          is_active: true,
          valid_from: new Date(),
          valid_to: new Date('9999-12-31'),
        }
      });
    }

    console.log("Original Record:", oldRecord);

    const sk_donatur = oldRecord.sk_donatur;
    const baseId = oldRecord.id_donatur.replace(/-v\d+$/, '')
    const newIdDonatur = `${baseId}-v${Date.now()}`
    const now = new Date()
    const nextSecond = new Date(now.getTime() + 1000)

    console.log("Mencoba SCD transaction...");
    const transaction = await prisma.$transaction(async (tx) => {
      const newVersion = await tx.dim_donatur.create({
        data: {
          id_donatur: newIdDonatur,
          nama_lengkap: "Nama Update SCD",
          kontak_utama: "089999",
          alamat: "Alamat Baru",
          perusahaan: "-",
          tipe: "Individu",
          is_active: true,
          valid_from: nextSecond,
          valid_to: new Date('9999-12-31'),
        }
      })

      await tx.dim_donatur.update({
        where: { sk_donatur: Number(sk_donatur) },
        data: {
          is_active: false,
          valid_to: now,
        }
      })

      return newVersion
    }, {
      timeout: 15000 
    })

    console.log("SCD Update Berhasil:", transaction);

  } catch (error) {
    console.error("Gagal update SCD:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();
