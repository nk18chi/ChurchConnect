"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n/locale-context";

export function PrefectureMapSection() {
  const { t, locale } = useLocale();

  // Organize prefectures by region
  const regions = {
    hokkaido: {
      title: locale === 'ja' ? '北海道・東北' : 'Hokkaido & Tohoku',
      prefectures: [
        { name: '北海道', value: '北海道' },
        { name: '青森', value: '青森県' },
        { name: '岩手', value: '岩手県' },
        { name: '宮城', value: '宮城県' },
        { name: '秋田', value: '秋田県' },
        { name: '山形', value: '山形県' },
        { name: '福島', value: '福島県' },
      ],
    },
    kanto: {
      title: locale === 'ja' ? '関東' : 'Kanto',
      prefectures: [
        { name: '茨城', value: '茨城県' },
        { name: '栃木', value: '栃木県' },
        { name: '群馬', value: '群馬県' },
        { name: '埼玉', value: '埼玉県' },
        { name: '千葉', value: '千葉県' },
        { name: '東京', value: '東京都' },
        { name: '神奈川', value: '神奈川県' },
      ],
    },
    chubu: {
      title: locale === 'ja' ? '中部' : 'Chubu',
      prefectures: [
        { name: '新潟', value: '新潟県' },
        { name: '富山', value: '富山県' },
        { name: '石川', value: '石川県' },
        { name: '福井', value: '福井県' },
        { name: '山梨', value: '山梨県' },
        { name: '長野', value: '長野県' },
        { name: '岐阜', value: '岐阜県' },
        { name: '静岡', value: '静岡県' },
        { name: '愛知', value: '愛知県' },
      ],
    },
    kinki: {
      title: locale === 'ja' ? '関西' : 'Kansai',
      prefectures: [
        { name: '三重', value: '三重県' },
        { name: '滋賀', value: '滋賀県' },
        { name: '京都', value: '京都府' },
        { name: '大阪', value: '大阪府' },
        { name: '兵庫', value: '兵庫県' },
        { name: '奈良', value: '奈良県' },
        { name: '和歌山', value: '和歌山県' },
      ],
    },
    chugoku: {
      title: locale === 'ja' ? '中国' : 'Chugoku',
      prefectures: [
        { name: '鳥取', value: '鳥取県' },
        { name: '島根', value: '島根県' },
        { name: '岡山', value: '岡山県' },
        { name: '広島', value: '広島県' },
        { name: '山口', value: '山口県' },
      ],
    },
    shikoku: {
      title: locale === 'ja' ? '四国' : 'Shikoku',
      prefectures: [
        { name: '徳島', value: '徳島県' },
        { name: '香川', value: '香川県' },
        { name: '愛媛', value: '愛媛県' },
        { name: '高知', value: '高知県' },
      ],
    },
    kyushu: {
      title: locale === 'ja' ? '九州・沖縄' : 'Kyushu & Okinawa',
      prefectures: [
        { name: '福岡', value: '福岡県' },
        { name: '佐賀', value: '佐賀県' },
        { name: '長崎', value: '長崎県' },
        { name: '熊本', value: '熊本県' },
        { name: '大分', value: '大分県' },
        { name: '宮崎', value: '宮崎県' },
        { name: '鹿児島', value: '鹿児島県' },
        { name: '沖縄', value: '沖縄県' },
      ],
    },
  };

  return (
    <section className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {locale === 'ja' ? '都道府県から教会を探す' : 'Find Churches by Prefecture'}
            </h2>
            <p className="text-lg text-gray-600">
              {locale === 'ja' ? 'お住まいの地域から教会を検索できます。' : 'Search for churches in your area.'}
            </p>
          </div>

          {/* Prefecture Map with Geographically Positioned Links */}
          <div className="relative max-w-6xl mx-auto min-h-[600px]">
            {/* Background Map - Centered */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-xl">
              <img
                src="/japan_map_blue.svg"
                alt="Japan Map"
                className="w-full h-auto opacity-20"
              />
            </div>

            {/* Prefecture Links - Positioned in Container */}
            <div className="relative w-full h-full">
                  {/* Hokkaido & Tohoku - Right side */}
                  <div className="absolute top-0 right-[20%] border border-gray-300 rounded-lg p-4 bg-white bg-opacity-80">
                    <h3 className="font-bold text-gray-900 text-base mb-2 border-b border-gray-300 pb-1">
                      {regions.hokkaido.title}
                    </h3>
                    <ul className="space-y-1">
                      {regions.hokkaido.prefectures.map((pref) => (
                        <li key={pref.value}>
                          <Link
                            href={`/churches?prefecture=${encodeURIComponent(pref.value)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline text-base font-medium block"
                          >
                            {pref.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Kanto - Right side, lower */}
                  <div className="absolute right-[20%] border border-gray-300 rounded-lg p-4 bg-white bg-opacity-80" style={{top: '400px'}}>
                    <h3 className="font-bold text-gray-900 text-base mb-2 border-b border-gray-300 pb-1">
                      {regions.kanto.title}
                    </h3>
                    <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {regions.kanto.prefectures.map((pref) => (
                        <li key={pref.value}>
                          <Link
                            href={`/churches?prefecture=${encodeURIComponent(pref.value)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline text-base font-medium block"
                          >
                            {pref.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Chubu - Removed for now, will add back if needed */}

                  {/* Kinki/Kansai */}
                  <div className="absolute left-[40%] border border-gray-300 rounded-lg p-4 bg-white bg-opacity-80" style={{top: '80px'}}>
                    <h3 className="font-bold text-gray-900 text-base mb-2 border-b border-gray-300 pb-1">
                      {regions.kinki.title}
                    </h3>
                    <ul className="space-y-1">
                      {regions.kinki.prefectures.map((pref) => (
                        <li key={pref.value}>
                          <Link
                            href={`/churches?prefecture=${encodeURIComponent(pref.value)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline text-base font-medium block"
                          >
                            {pref.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Chugoku */}
                  <div className="absolute left-[26%] border border-gray-300 rounded-lg p-4 bg-white bg-opacity-80" style={{top: '200px'}}>
                    <h3 className="font-bold text-gray-900 text-base mb-2 border-b border-gray-300 pb-1">
                      {regions.chugoku.title}
                    </h3>
                    <ul className="space-y-1">
                      {regions.chugoku.prefectures.map((pref) => (
                        <li key={pref.value}>
                          <Link
                            href={`/churches?prefecture=${encodeURIComponent(pref.value)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline text-base font-medium block"
                          >
                            {pref.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Shikoku */}
                  <div className="absolute left-[36%] border border-gray-300 rounded-lg p-4 bg-white bg-opacity-80" style={{top: '400px'}}>
                    <h3 className="font-bold text-gray-900 text-base mb-2 border-b border-gray-300 pb-1">
                      {regions.shikoku.title}
                    </h3>
                    <ul className="space-y-1">
                      {regions.shikoku.prefectures.map((pref) => (
                        <li key={pref.value}>
                          <Link
                            href={`/churches?prefecture=${encodeURIComponent(pref.value)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline text-base font-medium block"
                          >
                            {pref.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Kyushu & Okinawa */}
                  <div className="absolute left-[11%] border border-gray-300 rounded-lg p-4 bg-white bg-opacity-80" style={{top: '250px'}}>
                    <h3 className="font-bold text-gray-900 text-base mb-2 border-b border-gray-300 pb-1">
                      {regions.kyushu.title}
                    </h3>
                    <ul className="space-y-1">
                      {regions.kyushu.prefectures.map((pref) => (
                        <li key={pref.value}>
                          <Link
                            href={`/churches?prefecture=${encodeURIComponent(pref.value)}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline text-base font-medium block"
                          >
                            {pref.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
            </div>
          </div>

          <p className="text-center text-sm text-gray-600 mt-6">
            {locale === 'ja' ? '全国47都道府県に対応' : 'All 47 Prefectures'}
          </p>
        </div>
      </div>
    </section>
  );
}
