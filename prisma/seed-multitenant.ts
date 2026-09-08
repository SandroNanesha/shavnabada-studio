// This script was used to backfill studioId on all existing rows after Phase 1 nullable migration.
// After Phase 3 (enforce NOT NULL), studioId columns are no longer nullable, so this script
// is kept for reference only. It ran successfully before Phase 3 was applied.
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'

config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  // Create default studio
  await prisma.studio.upsert({
    where: { slug: 'shavnabada' },
    update: {},
    create: { id: 'default-studio', name: 'Shavnabada Studio', slug: 'shavnabada', enabled: true },
  })

  console.log('Default studio ensured')
}

main().catch(console.error).finally(() => prisma.$disconnect())
