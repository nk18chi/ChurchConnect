"use client";

import { SearchSection } from "./search-section";
import { useLocale } from "@/lib/i18n/locale-context";

export function HeroSection() {
  const { t } = useLocale();

  return (
    <section className="relative h-[600px] md:h-[700px] overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1507692049790-de58290a4334?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=2070')",
        }}
      >
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content Container */}
      <div className="relative h-full flex flex-col items-center justify-center px-4">
        {/* Hero Text */}
        <div className="text-center mb-8 max-w-4xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            {t.hero.title}{" "}
            <span className="italic font-light">{t.hero.subtitle}</span>
          </h1>
        </div>

        {/* Integrated Search Card */}
        <SearchSection />

        {/* Statistics */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 md:gap-12">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">1,000+</div>
            <div className="text-sm md:text-base text-gray-200 mt-1">
              {t.hero.stats.churches}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">47</div>
            <div className="text-sm md:text-base text-gray-200 mt-1">
              {t.hero.stats.prefectures}
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-white">12+</div>
            <div className="text-sm md:text-base text-gray-200 mt-1">
              {t.hero.stats.denominations}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
