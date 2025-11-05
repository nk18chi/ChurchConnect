"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { Search, Church } from "lucide-react";

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

  return (
    <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl">
          {/* Single unified search card with Church icon */}
          <div className="rounded-xl border-2 border-blue-100 bg-white p-8 shadow-lg">
            {/* Header with icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-3">
                  <Church className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  教会を探す
                </h2>
              </div>
            </div>

            {/* Search form */}
            <form onSubmit={handleSearch}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Prefecture dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    都道府県
                  </label>
                  <select
                    value={prefecture}
                    onChange={(e) => setPrefecture(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {PREFECTURES.map((pref) => (
                      <option key={pref.value} value={pref.value}>
                        {pref.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Denomination dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    教派・宗派
                  </label>
                  <select
                    value={denomination}
                    onChange={(e) => setDenomination(e.target.value)}
                    className="w-full h-12 px-4 rounded-lg border border-gray-300 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    {DENOMINATIONS.map((denom) => (
                      <option key={denom.value} value={denom.value}>
                        {denom.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Single search button */}
              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-lg font-semibold bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <Search className="mr-2 h-5 w-5" />
                検索
              </Button>
            </form>

            {/* Helper text */}
            <p className="mt-6 text-center text-sm text-gray-600">
              または{" "}
              <a href="/churches" className="text-blue-600 hover:text-blue-700 hover:underline font-medium">
                全ての教会を見る
              </a>
            </p>
          </div>

          {/* Stats or info cards below */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600">1,000+</div>
              <div className="text-sm text-gray-600 mt-1">登録教会数</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600">47</div>
              <div className="text-sm text-gray-600 mt-1">都道府県</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className="text-3xl font-bold text-blue-600">12+</div>
              <div className="text-sm text-gray-600 mt-1">教派・宗派</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
