import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
config()

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL ?? 'admin@shavnabada.com'
  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'changeme123'
  const hash = await bcrypt.hash(password, 12)

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash: hash, role: 'super_admin', studioId: null },
    create: { email, passwordHash: hash, role: 'super_admin', studioId: null },
  })
  console.log(`✓ Super-admin user: ${email}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
