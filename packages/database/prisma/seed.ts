import { PrismaClient, UserRole, ReviewStatus, DonationType, DonationStatus } from '@prisma/client'
import { hash } from 'bcryptjs'
import { prefectures } from './data/prefectures'
import { cities } from './data/cities'
import { languages } from './data/languages'
import { denominations } from './data/denominations'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ============================================
  // REFERENCE DATA
  // ============================================

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

  // ============================================
  // SAMPLE USERS
  // ============================================

  console.log('👥 Seeding users...')
  const passwordHash = await hash('password123', 10)

  // Platform Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@churchconnect.jp' },
    update: {},
    create: {
      email: 'admin@churchconnect.jp',
      name: 'Platform Admin',
      password: passwordHash,
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  })

  // Church Admin Users
  const churchAdmin1 = await prisma.user.upsert({
    where: { email: 'admin@tokyochurch.jp' },
    update: {},
    create: {
      email: 'admin@tokyochurch.jp',
      name: 'Tokyo Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin2 = await prisma.user.upsert({
    where: { email: 'admin@osakachurch.jp' },
    update: {},
    create: {
      email: 'admin@osakachurch.jp',
      name: 'Osaka Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin3 = await prisma.user.upsert({
    where: { email: 'admin@yokohamachurch.jp' },
    update: {},
    create: {
      email: 'admin@yokohamachurch.jp',
      name: 'Yokohama Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  // Regular Users
  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      name: 'John Smith',
      password: passwordHash,
      role: UserRole.USER,
      emailVerified: new Date(),
    },
  })

  const user2 = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      name: 'Sarah Johnson',
      password: passwordHash,
      role: UserRole.USER,
      emailVerified: new Date(),
    },
  })

  const user3 = await prisma.user.upsert({
    where: { email: 'michael@example.com' },
    update: {},
    create: {
      email: 'michael@example.com',
      name: 'Michael Chen',
      password: passwordHash,
      role: UserRole.USER,
      emailVerified: new Date(),
    },
  })

  console.log(`✅ Created 7 users`)

  // ============================================
  // SAMPLE CHURCHES
  // ============================================

  console.log('⛪ Seeding sample churches...')

  // Get reference data
  const tokyoPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Tokyo' } })
  const osakaPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Osaka' } })
  const kanagawaPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Kanagawa' } })

  const tokyoCity = await prisma.city.findFirst({ where: { name: 'Shibuya', prefectureId: tokyoPrefecture?.id } })
  const osakaCity = await prisma.city.findFirst({ where: { name: 'Osaka', prefectureId: osakaPrefecture?.id } })
  const yokohamaCity = await prisma.city.findFirst({ where: { name: 'Yokohama', prefectureId: kanagawaPrefecture?.id } })

  const evangelical = await prisma.denomination.findUnique({ where: { name: 'Evangelical' } })
  const baptist = await prisma.denomination.findUnique({ where: { name: 'Baptist' } })
  const pentecostal = await prisma.denomination.findUnique({ where: { name: 'Pentecostal' } })

  const english = await prisma.language.findUnique({ where: { code: 'en' } })
  const japanese = await prisma.language.findUnique({ where: { code: 'ja' } })
  const korean = await prisma.language.findUnique({ where: { code: 'ko' } })

  if (!tokyoPrefecture || !tokyoCity || !evangelical || !english || !japanese) {
    throw new Error('Required reference data not found')
  }

  // Church 1: Tokyo International Church (Complete, Verified)
  const church1 = await prisma.church.create({
    data: {
      name: 'Tokyo International Church',
      slug: 'tokyo-international-church',
      description: 'A vibrant international community of believers in the heart of Tokyo',
      denominationId: evangelical.id,
      prefectureId: tokyoPrefecture.id,
      cityId: tokyoCity.id,
      address: '1-2-3 Shibuya, Shibuya-ku',
      postalCode: '150-0002',
      latitude: 35.6595,
      longitude: 139.7004,
      phone: '03-1234-5678',
      email: 'info@tokyochurch.jp',
      website: 'https://tokyochurch.jp',
      contactEmail: 'contact@tokyochurch.jp',
      heroImageUrl: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3',
      isVerified: true,
      isComplete: true,
      isPublished: true,
      adminUserId: churchAdmin1.id,
      profile: {
        create: {
          whoWeAre: 'Tokyo International Church is a diverse, English-speaking Christian community in the heart of Tokyo. We are passionate about following Jesus, building authentic relationships, and serving our city.',
          vision: 'To be a church where people discover Jesus, grow in their faith, and make a difference in Tokyo and beyond.',
          statementOfFaith: 'We believe in the Trinity - God the Father, Jesus Christ the Son, and the Holy Spirit. We believe the Bible is God\'s inspired Word and our final authority for faith and life.',
          storyOfChurch: 'Founded in 1995 by missionaries from the United States, Tokyo International Church has grown from a small house church of 12 people to a vibrant community of over 300 members from 40+ countries.',
          kidChurchInfo: 'We offer age-appropriate programs for children from nursery through elementary school. Our teachers create a fun, safe environment where kids learn about Jesus.',
          whatToExpect: 'Expect contemporary worship music, biblical teaching, and a warm welcome. Services last about 90 minutes. Free coffee and snacks are available before and after the service.',
          dressCode: 'Come as you are! Most people dress casually.',
          worshipStyle: 'Contemporary worship with a live band',
          accessibility: ['Wheelchair accessible', 'Elevator', 'Accessible restrooms'],
          howToGive: 'You can give by cash or bank transfer. All donations support our ministries and outreach efforts.',
          bankName: 'MUFG Bank',
          bankAccountNumber: '1234567',
          bankAccountName: 'Tokyo International Church',
        },
      },
      social: {
        create: {
          youtubeUrl: 'https://youtube.com/@tokyochurch',
          instagramUrl: 'https://instagram.com/tokyochurch',
          facebookUrl: 'https://facebook.com/tokyochurch',
          twitterUrl: 'https://twitter.com/tokyochurch',
        },
      },
      languages: {
        create: [
          { languageId: english.id },
          { languageId: japanese.id },
        ],
      },
      serviceTimes: {
        create: [
          {
            dayOfWeek: 0, // Sunday
            startTime: '10:00',
            endTime: '11:30',
            languageId: english.id,
            serviceType: 'Main Service',
          },
          {
            dayOfWeek: 0, // Sunday
            startTime: '14:00',
            endTime: '15:30',
            languageId: japanese.id,
            serviceType: 'Japanese Service',
          },
        ],
      },
      staff: {
        create: [
          {
            name: 'Pastor David Wilson',
            title: 'Senior Pastor',
            role: 'Leadership',
            bio: 'David has been serving at Tokyo International Church since 2010. He is passionate about teaching the Bible and equipping believers for ministry.',
            order: 1,
          },
          {
            name: 'Emily Chen',
            title: 'Worship Director',
            role: 'Ministry',
            bio: 'Emily leads our worship team and has a heart for creating space for people to encounter God through music.',
            order: 2,
          },
          {
            name: 'Yuki Tanaka',
            title: 'Youth Pastor',
            role: 'Ministry',
            bio: 'Yuki oversees our youth ministry and loves helping young people grow in their faith.',
            order: 3,
          },
        ],
      },
      sermons: {
        create: [
          {
            title: 'Faith That Moves Mountains',
            description: 'Exploring what it means to have bold faith in challenging times',
            preacher: 'Pastor David Wilson',
            passage: 'Matthew 17:20',
            date: new Date('2025-10-28'),
            youtubeUrl: 'https://youtube.com/watch?v=example1',
          },
          {
            title: 'Living Generously',
            description: 'Discovering the joy of generosity and giving',
            preacher: 'Pastor David Wilson',
            passage: '2 Corinthians 9:6-11',
            date: new Date('2025-10-21'),
            youtubeUrl: 'https://youtube.com/watch?v=example2',
          },
          {
            title: 'The Power of Prayer',
            description: 'Understanding prayer as communion with God',
            preacher: 'Emily Chen',
            passage: 'James 5:13-18',
            date: new Date('2025-10-14'),
          },
        ],
      },
      events: {
        create: [
          {
            title: 'Christmas Eve Service',
            description: 'Join us for a special Christmas Eve celebration with worship, carols, and a message of hope.',
            startDate: new Date('2025-12-24T19:00:00'),
            endDate: new Date('2025-12-24T21:00:00'),
            location: 'Main Sanctuary',
          },
          {
            title: 'New Year Prayer Night',
            description: 'Start the year with prayer and worship as we seek God together.',
            startDate: new Date('2025-12-31T21:00:00'),
            endDate: new Date('2026-01-01T01:00:00'),
            location: 'Main Sanctuary',
          },
          {
            title: 'Bible Study - Online',
            description: 'Weekly Bible study via Zoom. All are welcome!',
            startDate: new Date('2025-11-06T19:30:00'),
            isOnline: true,
            registrationUrl: 'https://tokyochurch.jp/bible-study',
          },
        ],
      },
      analytics: {
        create: {
          totalViews: 243,
          viewsThisWeek: 15,
          viewsThisMonth: 67,
          lastViewedAt: new Date(),
        },
      },
    },
  })

  // Church 2: Osaka Grace Baptist Church (Complete, Unverified)
  if (osakaPrefecture && osakaCity && baptist) {
    const church2 = await prisma.church.create({
      data: {
        name: 'Osaka Grace Baptist Church',
        slug: 'osaka-grace-baptist-church',
        description: 'A welcoming Baptist community serving Osaka with the love of Christ',
        denominationId: baptist.id,
        prefectureId: osakaPrefecture.id,
        cityId: osakaCity.id,
        address: '4-5-6 Namba, Chuo-ku',
        postalCode: '542-0076',
        latitude: 34.6682,
        longitude: 135.5017,
        phone: '06-1234-5678',
        email: 'info@osakagrace.jp',
        website: 'https://osakagrace.jp',
        contactEmail: 'contact@osakagrace.jp',
        heroImageUrl: 'https://images.unsplash.com/photo-1478147427282-58a87a120781',
        isVerified: false,
        isComplete: true,
        isPublished: true,
        adminUserId: churchAdmin2.id,
        profile: {
          create: {
            whoWeAre: 'Osaka Grace Baptist Church is a Christ-centered community that values biblical teaching, authentic worship, and genuine fellowship.',
            vision: 'To see lives transformed by the gospel in Osaka and beyond.',
            statementOfFaith: 'We hold to historic Baptist beliefs including believer\'s baptism, the authority of Scripture, and the priesthood of all believers.',
            storyOfChurch: 'Established in 1982, our church has been faithfully serving the Osaka community for over 40 years.',
            whatToExpect: 'Traditional Baptist worship with hymns and expository preaching. Services run about 75 minutes.',
            dressCode: 'Business casual to formal',
            worshipStyle: 'Traditional hymns and worship songs',
            accessibility: ['Wheelchair accessible'],
          },
        },
        social: {
          create: {
            youtubeUrl: 'https://youtube.com/@osakagrace',
            facebookUrl: 'https://facebook.com/osakagrace',
          },
        },
        languages: {
          create: [
            { languageId: english.id },
            { languageId: japanese.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0, // Sunday
              startTime: '10:30',
              endTime: '12:00',
              languageId: english.id,
              serviceType: 'Morning Worship',
            },
          ],
        },
        staff: {
          create: [
            {
              name: 'Pastor Robert Taylor',
              title: 'Senior Pastor',
              role: 'Leadership',
              bio: 'Pastor Robert has been leading Osaka Grace since 2015. He has a passion for expository preaching and discipleship.',
              order: 1,
            },
            {
              name: 'Keiko Yamamoto',
              title: 'Music Director',
              role: 'Ministry',
              bio: 'Keiko coordinates our music ministry and choir.',
              order: 2,
            },
          ],
        },
        sermons: {
          create: [
            {
              title: 'The Gospel of Grace',
              description: 'Understanding God\'s amazing grace',
              preacher: 'Pastor Robert Taylor',
              passage: 'Ephesians 2:1-10',
              date: new Date('2025-10-27'),
            },
          ],
        },
        events: {
          create: [
            {
              title: 'Thanksgiving Potluck',
              description: 'Join us for a community Thanksgiving meal. Bring a dish to share!',
              startDate: new Date('2025-11-23T17:00:00'),
              endDate: new Date('2025-11-23T20:00:00'),
              location: 'Fellowship Hall',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 89,
            viewsThisWeek: 5,
            viewsThisMonth: 23,
            lastViewedAt: new Date(),
          },
        },
      },
    })
  }

  // Church 3: Yokohama Pentecostal Church (Incomplete Profile)
  if (kanagawaPrefecture && yokohamaCity && pentecostal && korean) {
    const church3 = await prisma.church.create({
      data: {
        name: 'Yokohama Pentecostal Church',
        slug: 'yokohama-pentecostal-church',
        description: 'A Spirit-filled church in Yokohama',
        denominationId: pentecostal.id,
        prefectureId: kanagawaPrefecture.id,
        cityId: yokohamaCity.id,
        address: '7-8-9 Kannai, Naka-ku',
        postalCode: '231-0023',
        phone: '045-123-4567',
        email: 'info@yokohamapentecostal.jp',
        isVerified: false,
        isComplete: false,
        isPublished: true,
        adminUserId: churchAdmin3.id,
        profile: {
          create: {
            whoWeAre: 'A diverse Pentecostal community welcoming all who seek to experience God\'s presence.',
            vision: 'To be a church where the Holy Spirit moves powerfully.',
          },
        },
        languages: {
          create: [
            { languageId: english.id },
            { languageId: japanese.id },
            { languageId: korean.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0, // Sunday
              startTime: '11:00',
              endTime: '13:00',
              languageId: english.id,
              serviceType: 'Sunday Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 34,
            viewsThisWeek: 3,
            viewsThisMonth: 12,
          },
        },
      },
    })
  }

  console.log(`✅ Created 3 sample churches`)

  // ============================================
  // SAMPLE REVIEWS
  // ============================================

  console.log('💬 Seeding sample reviews...')

  await prisma.review.create({
    data: {
      churchId: church1.id,
      userId: user1.id,
      content: 'Amazing community! I moved to Tokyo six months ago and was looking for a church home. Tokyo International Church welcomed me with open arms. The worship is uplifting, the teaching is solid, and I\'ve made great friends here.',
      visitDate: new Date('2025-10-15'),
      experienceType: 'Regular Attender',
      status: ReviewStatus.APPROVED,
      moderatedAt: new Date(),
      moderatedBy: admin.id,
    },
  })

  await prisma.review.create({
    data: {
      churchId: church1.id,
      userId: user2.id,
      content: 'Great church for families. Our kids love the children\'s program and we appreciate the biblical teaching. The international atmosphere is wonderful.',
      visitDate: new Date('2025-09-20'),
      experienceType: 'Regular Attender',
      status: ReviewStatus.APPROVED,
      moderatedAt: new Date(),
      moderatedBy: admin.id,
      response: {
        create: {
          content: 'Thank you so much for your kind words! We\'re blessed to have your family as part of our community.',
          respondedBy: churchAdmin1.id,
        },
      },
    },
  })

  await prisma.review.create({
    data: {
      churchId: church1.id,
      userId: user3.id,
      content: 'I visited last Sunday and really enjoyed the service. Everyone was friendly and the message was encouraging. Looking forward to visiting again!',
      visitDate: new Date('2025-10-27'),
      experienceType: 'First Time Visitor',
      status: ReviewStatus.PENDING,
    },
  })

  console.log(`✅ Created 3 sample reviews`)

  // ============================================
  // SAMPLE DONATIONS
  // ============================================

  console.log('💰 Seeding sample donations...')

  await prisma.platformDonation.create({
    data: {
      donorId: user1.id,
      churchId: church1.id,
      stripePaymentId: 'pi_test_1234567890',
      amount: 5000,
      currency: 'jpy',
      type: DonationType.ONE_TIME,
      status: DonationStatus.COMPLETED,
      createdAt: new Date('2025-10-20'),
    },
  })

  await prisma.platformDonation.create({
    data: {
      donorId: user2.id,
      stripePaymentId: 'pi_test_0987654321',
      amount: 3000,
      currency: 'jpy',
      type: DonationType.ONE_TIME,
      status: DonationStatus.COMPLETED,
      createdAt: new Date('2025-10-25'),
    },
  })

  console.log(`✅ Created 2 sample donations`)

  console.log('')
  console.log('✨ Database seeding complete!')
  console.log('')
  console.log('📋 Summary:')
  console.log(`   - ${languages.length} languages`)
  console.log(`   - ${denominations.length} denominations`)
  console.log(`   - ${prefectures.length} prefectures`)
  console.log(`   - ${cityCount} cities`)
  console.log(`   - 7 users (1 admin, 3 church admins, 3 regular users)`)
  console.log(`   - 3 sample churches (with profiles, staff, events, sermons)`)
  console.log(`   - 3 reviews`)
  console.log(`   - 2 donations`)
  console.log('')
  console.log('🔐 Test Credentials:')
  console.log('   Platform Admin: admin@churchconnect.jp / password123')
  console.log('   Church Admin 1: admin@tokyochurch.jp / password123')
  console.log('   Church Admin 2: admin@osakachurch.jp / password123')
  console.log('   Church Admin 3: admin@yokohamachurch.jp / password123')
  console.log('   Regular User 1: john@example.com / password123')
  console.log('   Regular User 2: sarah@example.com / password123')
  console.log('   Regular User 3: michael@example.com / password123')
  console.log('')
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
