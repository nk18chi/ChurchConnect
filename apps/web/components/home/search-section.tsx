"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui";
import { Input } from "@repo/ui";
import { Search } from "lucide-react";

export function SearchSection() {
  const router = useRouter();
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (location.trim()) {
      router.push(`/churches?search=${encodeURIComponent(location.trim())}`);
    } else {
      router.push("/churches");
    }
  };

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg border bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-center mb-6">
              Start Your Search
            </h2>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Enter city or prefecture..."
                  value={location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocation(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <Button type="submit" size="lg" className="h-12 px-8">
                <Search className="mr-2 h-5 w-5" />
                Search
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Or{" "}
              <a href="/churches" className="text-primary hover:underline">
                browse all churches
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
