import { HeroSection } from "@/components/home/hero-section";
import { FeaturesSection } from "@/components/home/features-section";
import { PrefectureMapSection } from "@/components/home/prefecture-map-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <PrefectureMapSection />
    </>
  );
}
