import { Suspense } from "react";
import { ChurchList } from "@/components/churches/church-list";
import { ChurchFilters } from "@/components/churches/church-filters";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Churches | ChurchConnect Japan",
  description:
    "Browse churches across Japan. Filter by location, denomination, and language to find the perfect church community for you.",
};

export default function ChurchesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find Churches</h1>
        <p className="mt-2 text-gray-600">
          Discover churches across Japan that match your preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <Suspense fallback={<div>Loading filters...</div>}>
            <ChurchFilters />
          </Suspense>
        </aside>

        <div className="lg:col-span-3">
          <Suspense fallback={<div>Loading churches...</div>}>
            <ChurchList searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
