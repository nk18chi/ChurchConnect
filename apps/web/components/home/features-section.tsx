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
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            {t.features.title}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {t.features.description}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
