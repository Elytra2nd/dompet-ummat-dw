import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const id = 1
    const res = await prisma.$transaction(async (tx) => {
      return await tx.fact_survey.update({
        where: { sk_survey: id },
        data: {
          kategori_rekomendasi: "Bantuan_Konsumtif__Sembako_Uang_",
        }
      })
    })
    console.log("Success:", res)
  } catch (e) {
    console.error("Failed:", e)
  }
}

main()
