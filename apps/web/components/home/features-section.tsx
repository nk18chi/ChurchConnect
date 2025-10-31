import { MapPin, Globe, Calendar, Heart } from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Find Churches Near You",
    description:
      "Search by prefecture and city to discover churches in your area.",
  },
  {
    icon: Globe,
    title: "Multiple Languages",
    description:
      "Find churches offering services in Japanese, English, Korean, and more.",
  },
  {
    icon: Calendar,
    title: "Service Times",
    description:
      "View worship service schedules and plan your visit accordingly.",
  },
  {
    icon: Heart,
    title: "Connect with Community",
    description:
      "Discover church events, ministries, and ways to get involved.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">
            Why Use ChurchConnect?
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Your comprehensive directory for finding and connecting with
            churches across Japan.
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
