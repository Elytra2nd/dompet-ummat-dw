import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const donaturs = await prisma.dim_donatur.findMany({
    orderBy: { sk_donatur: 'desc' },
    take: 5
  })
  console.log(donaturs)
  
  const count = await prisma.dim_donatur.count({
    where: { is_active: true }
  })
  console.log("Total active donaturs:", count)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
