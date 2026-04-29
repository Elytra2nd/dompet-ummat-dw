import { PrismaClient } from "../src/generated/prisma/client.js"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import bcrypt from "bcryptjs"
import { config } from "dotenv"

// Load .env.local first, fallback to .env
config({ path: ".env.local" })
config()

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT ?? 4000),
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  ssl: {
    rejectUnauthorized: true,
  },
  connectTimeout: 10000,
})

const prisma = new PrismaClient({ adapter })

async function main() {
  const hashedPasswordAdmin = await bcrypt.hash("admin123", 10)
  const hashedPasswordRelawan = await bcrypt.hash("relawan123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@dompetummat.id" },
    update: {},
    create: {
      email: "admin@dompetummat.id",
      name: "Admin BIDA",
      password: hashedPasswordAdmin,
      role: "ADMIN",
    },
  })

  const relawan = await prisma.user.upsert({
    where: { email: "relawan@dompetummat.id" },
    update: {},
    create: {
      email: "relawan@dompetummat.id",
      name: "Relawan Dompet Ummat",
      password: hashedPasswordRelawan,
      role: "SURVEYOR",
    },
  })

  console.log("✅ Seed success:", { admin: admin.email, relawan: relawan.email })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })