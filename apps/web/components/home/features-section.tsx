"use client";

import { MapPin, Globe, Calendar, Heart } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";

export function FeaturesSection() {
  const { t } = useLocale();

  const features = [
    {
      icon: MapPin,
      title: t.features.findNearby.title,
      description: t.features.findNearby.description,
    },
    {
      icon: Globe,
      title: t.features.multiLanguage.title,
      description: t.features.multiLanguage.description,
    },
    {
      icon: Calendar,
      title: t.features.serviceTimes.title,
      description: t.features.serviceTimes.description,
    },
    {
      icon: Heart,
      title: t.features.community.title,
      description: t.features.community.description,
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            {t.features.title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {t.features.description}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex items-start gap-4"
            >
              <div className="flex-shrink-0">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <feature.icon className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div>
                <h3 className="mb-2 text-base font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
