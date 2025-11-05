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
    <div className="flex flex-col h-screen">
      {/* Sticky Filter Bar */}
      <div className="sticky top-16 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Suspense fallback={<div>Loading filters...</div>}>
            <ChurchFilters />
          </Suspense>
        </div>
      </div>

      {/* Split Screen Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side - Scrollable Church List */}
        <div className="w-full lg:w-[55%] overflow-y-auto">
          <div className="container mx-auto px-6 py-6">
            <Suspense fallback={<div>Loading churches...</div>}>
              <ChurchList searchParams={searchParams} />
            </Suspense>
          </div>
        </div>

        {/* Right Side - Fixed Map */}
        <div className="hidden lg:block lg:w-[45%]">
          <div className="sticky top-[72px] h-[calc(100vh-72px)] bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500">Map Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
