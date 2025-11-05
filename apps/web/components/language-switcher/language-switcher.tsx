"use client";

import { useLocale } from '@/lib/i18n/locale-context';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-600" />
      <button
        onClick={() => setLocale(locale === 'ja' ? 'en' : 'ja')}
        className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        aria-label={t.common.language}
      >
        {locale === 'ja' ? t.common.english : t.common.japanese}
      </button>
    </div>
  );
}
