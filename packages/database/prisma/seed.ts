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

  // Get additional reference data for new churches
  const kyotoPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Kyoto' } })
  const fukuokaPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Fukuoka' } })
  const hokkaidoPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Hokkaido' } })
  const saitamaPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Saitama' } })
  const chibaPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Chiba' } })
  const hiroshimaPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Hiroshima' } })
  const nagoyaPrefecture = await prisma.prefecture.findUnique({ where: { name: 'Aichi' } })

  const kyotoCity = await prisma.city.findFirst({ where: { name: 'Nakagyo', prefectureId: kyotoPrefecture?.id } })
  const fukuokaCity = await prisma.city.findFirst({ where: { name: 'Fukuoka City', prefectureId: fukuokaPrefecture?.id } })
  const shinjukuCity = await prisma.city.findFirst({ where: { name: 'Shinjuku', prefectureId: tokyoPrefecture?.id } })
  const setagayaCity = await prisma.city.findFirst({ where: { name: 'Setagaya', prefectureId: tokyoPrefecture?.id } })
  const minatoCity = await prisma.city.findFirst({ where: { name: 'Minato', prefectureId: tokyoPrefecture?.id } })
  const kawasakiCity = await prisma.city.findFirst({ where: { name: 'Kawasaki', prefectureId: kanagawaPrefecture?.id } })
  const osakaKitaCity = await prisma.city.findFirst({ where: { name: 'Kita', prefectureId: osakaPrefecture?.id } })

  const catholic = await prisma.denomination.findUnique({ where: { name: 'Catholic' } })
  const lutheran = await prisma.denomination.findUnique({ where: { name: 'Lutheran' } })
  const methodist = await prisma.denomination.findUnique({ where: { name: 'Methodist' } })
  const presbyterian = await prisma.denomination.findUnique({ where: { name: 'Presbyterian' } })
  const nonDenom = await prisma.denomination.findUnique({ where: { name: 'Non-denominational' } })
  const reformed = await prisma.denomination.findUnique({ where: { name: 'Reformed' } })

  const chinese = await prisma.language.findUnique({ where: { code: 'zh' } })
  const spanish = await prisma.language.findUnique({ where: { code: 'es' } })
  const portuguese = await prisma.language.findUnique({ where: { code: 'pt' } })
  const tagalog = await prisma.language.findUnique({ where: { code: 'tl' } })

  // Create additional church admin users
  const churchAdmin4 = await prisma.user.upsert({
    where: { email: 'admin@kyotochurch.jp' },
    update: {},
    create: {
      email: 'admin@kyotochurch.jp',
      name: 'Kyoto Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin5 = await prisma.user.upsert({
    where: { email: 'admin@fukuokachurch.jp' },
    update: {},
    create: {
      email: 'admin@fukuokachurch.jp',
      name: 'Fukuoka Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin6 = await prisma.user.upsert({
    where: { email: 'admin@shinjukuchurch.jp' },
    update: {},
    create: {
      email: 'admin@shinjukuchurch.jp',
      name: 'Shinjuku Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin7 = await prisma.user.upsert({
    where: { email: 'admin@setagayachurch.jp' },
    update: {},
    create: {
      email: 'admin@setagayachurch.jp',
      name: 'Setagaya Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin8 = await prisma.user.upsert({
    where: { email: 'admin@minatochurch.jp' },
    update: {},
    create: {
      email: 'admin@minatochurch.jp',
      name: 'Minato Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin9 = await prisma.user.upsert({
    where: { email: 'admin@kawasakichurch.jp' },
    update: {},
    create: {
      email: 'admin@kawasakichurch.jp',
      name: 'Kawasaki Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin10 = await prisma.user.upsert({
    where: { email: 'admin@osakakitachurch.jp' },
    update: {},
    create: {
      email: 'admin@osakakitachurch.jp',
      name: 'Osaka Kita Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin11 = await prisma.user.upsert({
    where: { email: 'admin@yokohama2church.jp' },
    update: {},
    create: {
      email: 'admin@yokohama2church.jp',
      name: 'Yokohama 2 Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin12 = await prisma.user.upsert({
    where: { email: 'admin@tokyo2church.jp' },
    update: {},
    create: {
      email: 'admin@tokyo2church.jp',
      name: 'Tokyo 2 Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  const churchAdmin13 = await prisma.user.upsert({
    where: { email: 'admin@osaka2church.jp' },
    update: {},
    create: {
      email: 'admin@osaka2church.jp',
      name: 'Osaka 2 Church Admin',
      password: passwordHash,
      role: UserRole.CHURCH_ADMIN,
      emailVerified: new Date(),
    },
  })

  // Church 4: Kyoto Catholic Church
  if (kyotoPrefecture && kyotoCity && catholic) {
    await prisma.church.create({
      data: {
        name: 'Kyoto Catholic Church',
        slug: 'kyoto-catholic-church',
        description: 'A historic Catholic church serving the Kyoto community',
        denominationId: catholic.id,
        prefectureId: kyotoPrefecture.id,
        cityId: kyotoCity.id,
        address: '5-10 Kawaramachi-dori, Nakagyo-ku',
        postalCode: '604-8006',
        phone: '075-123-4567',
        email: 'info@kyotocatholic.jp',
        heroImageUrl: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7',
        isVerified: true,
        isComplete: true,
        isPublished: true,
        adminUserId: churchAdmin4.id,
        profile: {
          create: {
            whoWeAre: 'Kyoto Catholic Church has been serving the community for over 100 years.',
            vision: 'To bring the love of Christ to Kyoto through service and worship.',
          },
        },
        languages: {
          create: [
            { languageId: japanese.id },
            { languageId: english.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0,
              startTime: '09:00',
              endTime: '10:30',
              languageId: japanese.id,
              serviceType: 'Sunday Mass',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 156,
            viewsThisWeek: 12,
            viewsThisMonth: 45,
          },
        },
      },
    })
  }

  // Church 5: Fukuoka Community Church
  if (fukuokaPrefecture && fukuokaCity && nonDenom) {
    await prisma.church.create({
      data: {
        name: 'Fukuoka Community Church',
        slug: 'fukuoka-community-church',
        description: 'A diverse community church welcoming all',
        denominationId: nonDenom.id,
        prefectureId: fukuokaPrefecture.id,
        cityId: fukuokaCity.id,
        address: '3-15-20 Tenjin, Chuo-ku',
        postalCode: '810-0001',
        phone: '092-123-4567',
        email: 'info@fukuokacommunity.jp',
        heroImageUrl: 'https://images.unsplash.com/photo-1517840545241-b491010a8af4',
        isVerified: true,
        isComplete: true,
        isPublished: true,
        adminUserId: churchAdmin5.id,
        profile: {
          create: {
            whoWeAre: 'A welcoming community of believers from diverse backgrounds.',
            vision: 'To see Fukuoka transformed by the gospel of Jesus Christ.',
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
              dayOfWeek: 0,
              startTime: '10:30',
              endTime: '12:00',
              languageId: english.id,
              serviceType: 'Sunday Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 98,
            viewsThisWeek: 8,
            viewsThisMonth: 32,
          },
        },
      },
    })
  }

  // Church 6: Shinjuku Lutheran Church
  if (tokyoPrefecture && shinjukuCity && lutheran) {
    await prisma.church.create({
      data: {
        name: 'Shinjuku Lutheran Church',
        slug: 'shinjuku-lutheran-church',
        description: 'A Lutheran congregation in the heart of Shinjuku',
        denominationId: lutheran.id,
        prefectureId: tokyoPrefecture.id,
        cityId: shinjukuCity.id,
        address: '2-8-10 Nishi-Shinjuku',
        postalCode: '160-0023',
        phone: '03-2345-6789',
        email: 'info@shinjukulutheran.jp',
        isVerified: false,
        isComplete: true,
        isPublished: true,
        adminUserId: churchAdmin6.id,
        profile: {
          create: {
            whoWeAre: 'A traditional Lutheran church serving the Shinjuku area.',
            vision: 'Grace alone, faith alone, Scripture alone.',
          },
        },
        languages: {
          create: [
            { languageId: japanese.id },
            { languageId: english.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0,
              startTime: '10:00',
              endTime: '11:15',
              languageId: japanese.id,
              serviceType: 'Sunday Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 72,
            viewsThisWeek: 6,
            viewsThisMonth: 28,
          },
        },
      },
    })
  }

  // Church 7: Setagaya Methodist Church
  if (tokyoPrefecture && setagayaCity && methodist && chinese) {
    await prisma.church.create({
      data: {
        name: 'Setagaya Methodist Church',
        slug: 'setagaya-methodist-church',
        description: 'A Methodist church with Chinese and Japanese services',
        denominationId: methodist.id,
        prefectureId: tokyoPrefecture.id,
        cityId: setagayaCity.id,
        address: '4-12-5 Setagaya',
        postalCode: '154-0017',
        phone: '03-3456-7890',
        email: 'info@setagayamethodist.jp',
        heroImageUrl: 'https://images.unsplash.com/photo-1519491050282-cf00c82424b4',
        isVerified: true,
        isComplete: false,
        isPublished: true,
        adminUserId: churchAdmin7.id,
        profile: {
          create: {
            whoWeAre: 'A multicultural Methodist community serving Setagaya.',
            vision: 'Open hearts, open minds, open doors.',
          },
        },
        languages: {
          create: [
            { languageId: japanese.id },
            { languageId: chinese.id },
            { languageId: english.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0,
              startTime: '10:30',
              endTime: '12:00',
              languageId: japanese.id,
              serviceType: 'Sunday Service',
            },
            {
              dayOfWeek: 0,
              startTime: '14:00',
              endTime: '15:30',
              languageId: chinese.id,
              serviceType: 'Chinese Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 134,
            viewsThisWeek: 11,
            viewsThisMonth: 52,
          },
        },
      },
    })
  }

  // Church 8: Minato Presbyterian Church
  if (tokyoPrefecture && minatoCity && presbyterian) {
    await prisma.church.create({
      data: {
        name: 'Minato Presbyterian Church',
        slug: 'minato-presbyterian-church',
        description: 'A Presbyterian church in Minato ward',
        denominationId: presbyterian.id,
        prefectureId: tokyoPrefecture.id,
        cityId: minatoCity.id,
        address: '1-5-8 Roppongi, Minato-ku',
        postalCode: '106-0032',
        phone: '03-4567-8901',
        email: 'info@minatopresbyterian.jp',
        heroImageUrl: 'https://images.unsplash.com/photo-1507692049790-de58290a4334',
        isVerified: false,
        isComplete: true,
        isPublished: true,
        adminUserId: churchAdmin8.id,
        profile: {
          create: {
            whoWeAre: 'A Reformed Presbyterian church in the heart of Tokyo.',
            vision: 'Reformed and always reforming.',
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
              dayOfWeek: 0,
              startTime: '11:00',
              endTime: '12:30',
              languageId: english.id,
              serviceType: 'Sunday Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 187,
            viewsThisWeek: 14,
            viewsThisMonth: 63,
          },
        },
      },
    })
  }

  // Church 9: Kawasaki International Church
  if (kanagawaPrefecture && kawasakiCity && evangelical && tagalog) {
    await prisma.church.create({
      data: {
        name: 'Kawasaki International Church',
        slug: 'kawasaki-international-church',
        description: 'A diverse international church in Kawasaki',
        denominationId: evangelical.id,
        prefectureId: kanagawaPrefecture.id,
        cityId: kawasakiCity.id,
        address: '2-3-15 Kawasaki-ku',
        postalCode: '210-0001',
        phone: '044-123-4567',
        email: 'info@kawasakiinternational.jp',
        isVerified: true,
        isComplete: false,
        isPublished: true,
        adminUserId: churchAdmin9.id,
        profile: {
          create: {
            whoWeAre: 'An international church serving the Kawasaki community.',
            vision: 'Many nations, one family in Christ.',
          },
        },
        languages: {
          create: [
            { languageId: english.id },
            { languageId: japanese.id },
            { languageId: tagalog.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0,
              startTime: '10:00',
              endTime: '11:30',
              languageId: english.id,
              serviceType: 'Sunday Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 115,
            viewsThisWeek: 9,
            viewsThisMonth: 41,
          },
        },
      },
    })
  }

  // Church 10: Osaka Kita Reformed Church
  if (osakaPrefecture && osakaKitaCity && reformed) {
    await prisma.church.create({
      data: {
        name: 'Osaka Kita Reformed Church',
        slug: 'osaka-kita-reformed-church',
        description: 'A Reformed church in Osaka Kita ward',
        denominationId: reformed.id,
        prefectureId: osakaPrefecture.id,
        cityId: osakaKitaCity.id,
        address: '3-8-12 Umeda, Kita-ku',
        postalCode: '530-0001',
        phone: '06-2345-6789',
        email: 'info@osakakitareformed.jp',
        heroImageUrl: 'https://images.unsplash.com/photo-1544864327-2660fa1d5c8b',
        isVerified: false,
        isComplete: true,
        isPublished: true,
        adminUserId: churchAdmin10.id,
        profile: {
          create: {
            whoWeAre: 'A Reformed church committed to biblical teaching.',
            vision: 'Soli Deo Gloria - Glory to God alone.',
          },
        },
        languages: {
          create: [
            { languageId: japanese.id },
            { languageId: english.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0,
              startTime: '10:30',
              endTime: '12:00',
              languageId: japanese.id,
              serviceType: 'Sunday Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 91,
            viewsThisWeek: 7,
            viewsThisMonth: 35,
          },
        },
      },
    })
  }

  // Church 11: Yokohama Filipino Church
  if (kanagawaPrefecture && yokohamaCity && nonDenom && tagalog) {
    await prisma.church.create({
      data: {
        name: 'Yokohama Filipino Church',
        slug: 'yokohama-filipino-church',
        description: 'A Filipino community church in Yokohama',
        denominationId: nonDenom.id,
        prefectureId: kanagawaPrefecture.id,
        cityId: yokohamaCity.id,
        address: '5-12-3 Isezakicho, Naka-ku',
        postalCode: '231-0045',
        phone: '045-234-5678',
        email: 'info@yokohamafilipino.jp',
        heroImageUrl: 'https://images.unsplash.com/photo-1533854775446-95c4609da544',
        isVerified: true,
        isComplete: true,
        isPublished: true,
        adminUserId: churchAdmin11.id,
        profile: {
          create: {
            whoWeAre: 'A vibrant Filipino Christian community in Yokohama.',
            vision: 'To minister to the Filipino community in Japan with the love of Christ.',
          },
        },
        languages: {
          create: [
            { languageId: tagalog.id },
            { languageId: english.id },
            { languageId: japanese.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0,
              startTime: '13:00',
              endTime: '15:00',
              languageId: tagalog.id,
              serviceType: 'Sunday Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 203,
            viewsThisWeek: 16,
            viewsThisMonth: 71,
          },
        },
      },
    })
  }

  // Church 12: Tokyo Brazilian Church
  if (tokyoPrefecture && tokyoCity && pentecostal && portuguese) {
    await prisma.church.create({
      data: {
        name: 'Tokyo Brazilian Church',
        slug: 'tokyo-brazilian-church',
        description: 'A Portuguese-speaking Pentecostal church',
        denominationId: pentecostal.id,
        prefectureId: tokyoPrefecture.id,
        cityId: tokyoCity.id,
        address: '6-15-10 Shibuya',
        postalCode: '150-0002',
        phone: '03-5678-9012',
        email: 'info@tokyobrazilian.jp',
        isVerified: false,
        isComplete: false,
        isPublished: true,
        adminUserId: churchAdmin12.id,
        profile: {
          create: {
            whoWeAre: 'A Brazilian Pentecostal church serving the Portuguese-speaking community.',
            vision: 'Bringing Brazilian believers together in worship and fellowship.',
          },
        },
        languages: {
          create: [
            { languageId: portuguese.id },
            { languageId: japanese.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0,
              startTime: '15:00',
              endTime: '17:00',
              languageId: portuguese.id,
              serviceType: 'Sunday Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 67,
            viewsThisWeek: 5,
            viewsThisMonth: 22,
          },
        },
      },
    })
  }

  // Church 13: Osaka Spanish Church
  if (osakaPrefecture && osakaCity && baptist && spanish) {
    await prisma.church.create({
      data: {
        name: 'Osaka Spanish Church',
        slug: 'osaka-spanish-church',
        description: 'A Spanish-speaking Baptist church in Osaka',
        denominationId: baptist.id,
        prefectureId: osakaPrefecture.id,
        cityId: osakaCity.id,
        address: '2-5-18 Namba, Chuo-ku',
        postalCode: '542-0076',
        phone: '06-3456-7890',
        email: 'info@osakaspanish.jp',
        heroImageUrl: 'https://images.unsplash.com/photo-1490367532201-b9bc1dc483f6',
        isVerified: true,
        isComplete: true,
        isPublished: true,
        adminUserId: churchAdmin13.id,
        profile: {
          create: {
            whoWeAre: 'A Spanish-speaking Baptist community in Osaka.',
            vision: 'To reach Spanish speakers in Japan with the gospel.',
          },
        },
        languages: {
          create: [
            { languageId: spanish.id },
            { languageId: japanese.id },
            { languageId: english.id },
          ],
        },
        serviceTimes: {
          create: [
            {
              dayOfWeek: 0,
              startTime: '14:00',
              endTime: '16:00',
              languageId: spanish.id,
              serviceType: 'Sunday Service',
            },
          ],
        },
        analytics: {
          create: {
            totalViews: 142,
            viewsThisWeek: 10,
            viewsThisMonth: 48,
          },
        },
      },
    })
  }

  console.log(`✅ Created 13 sample churches`)

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
  console.log(`   - 17 users (1 admin, 13 church admins, 3 regular users)`)
  console.log(`   - 13 sample churches (with profiles, staff, events, sermons)`)
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
