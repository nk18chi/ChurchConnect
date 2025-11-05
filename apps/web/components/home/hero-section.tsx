"use client";

import Link from "next/link";
import { Button } from "@repo/ui";
import { useLocale } from "@/lib/i18n/locale-context";

export function HeroSection() {
  const { t } = useLocale();

  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            {t.hero.title}
            <span className="block text-primary">{t.hero.subtitle}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            {t.hero.description}
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/churches">
              <Button size="lg" className="text-base">
                {t.hero.findChurches}
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-base">
                {t.hero.learnMore}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
