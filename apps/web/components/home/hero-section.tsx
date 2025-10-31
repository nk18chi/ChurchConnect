import Link from "next/link";
import { Button } from "@repo/ui";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white py-20 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            Find Your Church
            <span className="block text-primary">Across Japan</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Discover churches across Japan. Search by location, denomination,
            and language. Connect with worship communities near you.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/churches">
              <Button size="lg" className="text-base">
                Find Churches
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="text-base">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
