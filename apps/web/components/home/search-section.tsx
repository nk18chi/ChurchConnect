"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { Search, Church } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

// Japan's 47 prefectures
const PREFECTURES = [
  { value: "", label: "全国" },
  { value: "北海道", label: "北海道" },
  { value: "青森県", label: "青森県" },
  { value: "岩手県", label: "岩手県" },
  { value: "宮城県", label: "宮城県" },
  { value: "秋田県", label: "秋田県" },
  { value: "山形県", label: "山形県" },
  { value: "福島県", label: "福島県" },
  { value: "茨城県", label: "茨城県" },
  { value: "栃木県", label: "栃木県" },
  { value: "群馬県", label: "群馬県" },
  { value: "埼玉県", label: "埼玉県" },
  { value: "千葉県", label: "千葉県" },
  { value: "東京都", label: "東京都" },
  { value: "神奈川県", label: "神奈川県" },
  { value: "新潟県", label: "新潟県" },
  { value: "富山県", label: "富山県" },
  { value: "石川県", label: "石川県" },
  { value: "福井県", label: "福井県" },
  { value: "山梨県", label: "山梨県" },
  { value: "長野県", label: "長野県" },
  { value: "岐阜県", label: "岐阜県" },
  { value: "静岡県", label: "静岡県" },
  { value: "愛知県", label: "愛知県" },
  { value: "三重県", label: "三重県" },
  { value: "滋賀県", label: "滋賀県" },
  { value: "京都府", label: "京都府" },
  { value: "大阪府", label: "大阪府" },
  { value: "兵庫県", label: "兵庫県" },
  { value: "奈良県", label: "奈良県" },
  { value: "和歌山県", label: "和歌山県" },
  { value: "鳥取県", label: "鳥取県" },
  { value: "島根県", label: "島根県" },
  { value: "岡山県", label: "岡山県" },
  { value: "広島県", label: "広島県" },
  { value: "山口県", label: "山口県" },
  { value: "徳島県", label: "徳島県" },
  { value: "香川県", label: "香川県" },
  { value: "愛媛県", label: "愛媛県" },
  { value: "高知県", label: "高知県" },
  { value: "福岡県", label: "福岡県" },
  { value: "佐賀県", label: "佐賀県" },
  { value: "長崎県", label: "長崎県" },
  { value: "熊本県", label: "熊本県" },
  { value: "大分県", label: "大分県" },
  { value: "宮崎県", label: "宮崎県" },
  { value: "鹿児島県", label: "鹿児島県" },
  { value: "沖縄県", label: "沖縄県" },
];

// Common Christian denominations in Japan
const DENOMINATIONS = [
  { value: "", label: "指定しない" },
  { value: "カトリック", label: "カトリック" },
  { value: "プロテスタント", label: "プロテスタント" },
  { value: "正教会", label: "正教会" },
  { value: "福音派", label: "福音派" },
  { value: "聖公会", label: "聖公会" },
  { value: "ルーテル", label: "ルーテル" },
  { value: "バプテスト", label: "バプテスト" },
  { value: "メソジスト", label: "メソジスト" },
  { value: "長老派", label: "長老派" },
  { value: "ペンテコステ派", label: "ペンテコステ派" },
  { value: "その他", label: "その他" },
];

export function SearchSection() {
  const router = useRouter();
  const { t, locale } = useLocale();
  const [prefecture, setPrefecture] = useState("");
  const [denomination, setDenomination] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams();
    if (prefecture) params.set("prefecture", prefecture);
    if (denomination) params.set("denomination", denomination);

    const queryString = params.toString();
    router.push(queryString ? `/churches?${queryString}` : "/churches");
  };

  // Get localized first option labels
  const prefectureAllLabel = locale === 'ja' ? '全国' : 'All Japan';
  const denominationAllLabel = locale === 'ja' ? '指定しない' : 'Any';

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Compact search card */}
      <div className="rounded-2xl bg-white p-6 shadow-2xl">
        {/* Search form */}
        <form onSubmit={handleSearch}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Prefecture dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                {t.search.prefecture}
              </label>
              <select
                value={prefecture}
                onChange={(e) => setPrefecture(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{prefectureAllLabel}</option>
                {PREFECTURES.slice(1).map((pref) => (
                  <option key={pref.value} value={pref.value}>
                    {pref.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Denomination dropdown */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                {t.search.denomination}
              </label>
              <select
                value={denomination}
                onChange={(e) => setDenomination(e.target.value)}
                className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{denominationAllLabel}</option>
                {DENOMINATIONS.slice(1).map((denom) => (
                  <option key={denom.value} value={denom.value}>
                    {denom.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search button */}
            <div className="flex items-end">
              <Button
                type="submit"
                size="lg"
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-semibold"
              >
                <Search className="mr-2 h-4 w-4" />
                {t.search.searchButton}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
