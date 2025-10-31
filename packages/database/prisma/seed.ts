import { PrismaClient } from '@prisma/client'
import { prefectures } from './data/prefectures'
import { cities } from './data/cities'
import { languages } from './data/languages'
import { denominations } from './data/denominations'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed Languages
  console.log('📚 Seeding languages...')
  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {},
      create: language,
    })
  }
  console.log(`✅ Created ${languages.length} languages`)

  // Seed Denominations
  console.log('⛪ Seeding denominations...')
  for (const denomination of denominations) {
    await prisma.denomination.upsert({
      where: { name: denomination.name },
      update: {},
      create: denomination,
    })
  }
  console.log(`✅ Created ${denominations.length} denominations`)

  // Seed Prefectures
  console.log('🗾 Seeding prefectures...')
  for (const prefecture of prefectures) {
    await prisma.prefecture.upsert({
      where: { name: prefecture.name },
      update: {},
      create: prefecture,
    })
  }
  console.log(`✅ Created ${prefectures.length} prefectures`)

  // Seed Cities
  console.log('🏙️ Seeding cities...')
  let cityCount = 0
  for (const [prefectureName, prefectureCities] of Object.entries(cities)) {
    const prefecture = await prisma.prefecture.findUnique({
      where: { name: prefectureName },
    })

    if (!prefecture) {
      console.warn(`⚠️ Prefecture ${prefectureName} not found`)
      continue
    }

    for (const city of prefectureCities) {
      await prisma.city.upsert({
        where: {
          prefectureId_name: {
            prefectureId: prefecture.id,
            name: city.name,
          },
        },
        update: {},
        create: {
          ...city,
          prefectureId: prefecture.id,
        },
      })
      cityCount++
    }
  }
  console.log(`✅ Created ${cityCount} cities`)

  console.log('✨ Seeding complete!')
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
