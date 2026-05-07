import { PrismaClient } from './src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log("Checking ambulan records...");
    let record = await prisma.fact_layanan_ambulan.findFirst();
    let isTemp = false;

    if (!record) {
      console.log("No record found. Creating a temporary record...");
      record = await prisma.fact_layanan_ambulan.create({
        data: {
          id_transaksi: "AMB-TEST-001",
          sk_pasien: 1,
          sk_lokasi: 1,
          sk_tanggal_layanan: 20260508,
          jam: "Pagi__06_00_12_00_",
          armada: "Ambulan_1__KB_1234_XX_",
          kategori_layanan: "Antar_Pasien",
        }
      });
      isTemp = true;
    }

    console.log("Current Record:", record);

    console.log("Testing PUT update...");
    const updated = await prisma.fact_layanan_ambulan.update({
      where: { sk_fakta_layanan_ambulan: record.sk_fakta_layanan_ambulan },
      data: {
        kategori_layanan: "Layanan_Jenazah",
        armada: "Ambulan_2__KB_5678_YY_"
      }
    });

    console.log("Updated Record:", updated);

    if (updated.kategori_layanan === "Layanan_Jenazah" && updated.armada === "Ambulan_2__KB_5678_YY_") {
      console.log("SUCCESS: Edit functionality is working correctly at database level!");
    } else {
      console.error("FAILED: Edit functionality did not update as expected.");
    }

    // Revert back or delete
    if (isTemp) {
      await prisma.fact_layanan_ambulan.delete({
        where: { sk_fakta_layanan_ambulan: record.sk_fakta_layanan_ambulan }
      });
      console.log("Temporary record deleted.");
    } else {
      await prisma.fact_layanan_ambulan.update({
        where: { sk_fakta_layanan_ambulan: record.sk_fakta_layanan_ambulan },
        data: {
          kategori_layanan: record.kategori_layanan,
          armada: record.armada
        }
      });
      console.log("Record reverted to original state.");
    }

  } catch (error) {
    console.error("Error during test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
