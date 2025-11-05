export type Locale = 'ja' | 'en';

export const translations = {
  ja: {
    // Hero Section
    hero: {
      title: '信仰でつながる',
      subtitle: 'あなたの教会を見つけよう',
      description: '日本全国の教会を検索できます。場所、教派、言語から探して、あなたに合った礼拝コミュニティとつながりましょう。',
      findChurches: '教会を探す',
      learnMore: '詳しく見る',
      stats: {
        churches: '登録教会数',
        prefectures: '都道府県',
        denominations: '教派・宗派',
      },
    },
    // Search Section
    search: {
      title: '教会を探す',
      prefecture: '都道府県',
      prefectureAll: '全国',
      denomination: '教派・宗派',
      denominationAll: '指定しない',
      searchButton: '検索',
      browseAll: '全ての教会を見る',
      stats: {
        churches: '登録教会数',
        prefectures: '都道府県',
        denominations: '教派・宗派',
      },
    },
    // Features Section
    features: {
      title: 'ChurchConnectの特徴',
      description: '日本全国の教会を検索し、つながるための総合ディレクトリです。',
      findNearby: {
        title: '近くの教会を探す',
        description: '都道府県や市区町村から、お近くの教会を簡単に検索できます。',
      },
      multiLanguage: {
        title: '多言語対応',
        description: '日本語、英語、韓国語など、様々な言語で礼拝を行う教会を見つけられます。',
      },
      serviceTimes: {
        title: '礼拝時間の確認',
        description: '礼拝のスケジュールを確認して、訪問の計画を立てることができます。',
      },
      community: {
        title: 'コミュニティとつながる',
        description: '教会のイベントや活動、参加方法を見つけて、コミュニティに参加しましょう。',
      },
    },
    // Common
    common: {
      language: '言語',
      japanese: '日本語',
      english: 'English',
    },
    // Navigation
    nav: {
      findChurches: '教会を探す',
      about: '私たちについて',
      contact: 'お問い合わせ',
      search: '検索',
    },
  },
  en: {
    // Hero Section
    hero: {
      title: 'United in Faith',
      subtitle: 'Find Your Church',
      description: 'Discover churches across Japan. Search by location, denomination, and language. Connect with worship communities near you.',
      findChurches: 'Find Churches',
      learnMore: 'Learn More',
      stats: {
        churches: 'Registered Churches',
        prefectures: 'Prefectures',
        denominations: 'Denominations',
      },
    },
    // Search Section
    search: {
      title: 'Find a Church',
      prefecture: 'Prefecture',
      prefectureAll: 'All Japan',
      denomination: 'Denomination',
      denominationAll: 'Any',
      searchButton: 'Search',
      browseAll: 'Browse all churches',
      stats: {
        churches: 'Registered Churches',
        prefectures: 'Prefectures',
        denominations: 'Denominations',
      },
    },
    // Features Section
    features: {
      title: 'Why Use ChurchConnect?',
      description: 'Your comprehensive directory for finding and connecting with churches across Japan.',
      findNearby: {
        title: 'Find Churches Near You',
        description: 'Search by prefecture and city to discover churches in your area.',
      },
      multiLanguage: {
        title: 'Multiple Languages',
        description: 'Find churches offering services in Japanese, English, Korean, and more.',
      },
      serviceTimes: {
        title: 'Service Times',
        description: 'View worship service schedules and plan your visit accordingly.',
      },
      community: {
        title: 'Connect with Community',
        description: 'Discover church events, ministries, and ways to get involved.',
      },
    },
    // Common
    common: {
      language: 'Language',
      japanese: '日本語',
      english: 'English',
    },
    // Navigation
    nav: {
      findChurches: 'Find Churches',
      about: 'About',
      contact: 'Contact',
      search: 'Search',
    },
  },
} as const;

export type TranslationKeys = typeof translations.ja;
