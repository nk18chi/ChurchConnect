"use client";

import { gql, useQuery } from "@apollo/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@repo/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";

const GET_FILTER_OPTIONS = gql`
  query GetFilterOptions {
    prefectures {
      id
      name
      nameJa
    }
    denominations {
      id
      name
      nameJa
    }
    languages {
      id
      name
      nameJa
    }
  }
`;

export function ChurchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data, loading } = useQuery(GET_FILTER_OPTIONS);

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/churches?${params.toString()}`);
  };

  if (loading) {
    return <div className="space-y-4">Loading filters...</div>;
  }

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex-1 min-w-[200px]">
        <Select
          value={searchParams.get("prefecture") || "all"}
          onValueChange={(value) => updateFilter("prefecture", value)}
        >
          <SelectTrigger id="prefecture">
            <SelectValue placeholder="Prefecture" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Prefectures</SelectItem>
            {data?.prefectures?.map((prefecture: any) => (
              <SelectItem key={prefecture.id} value={prefecture.id}>
                {prefecture.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Select
          value={searchParams.get("denomination") || "all"}
          onValueChange={(value) => updateFilter("denomination", value)}
        >
          <SelectTrigger id="denomination">
            <SelectValue placeholder="Denomination" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Denominations</SelectItem>
            {data?.denominations?.map((denomination: any) => (
              <SelectItem key={denomination.id} value={denomination.id}>
                {denomination.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 min-w-[200px]">
        <Select
          value={searchParams.get("language") || "all"}
          onValueChange={(value) => updateFilter("language", value)}
        >
          <SelectTrigger id="language">
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {data?.languages?.map((language: any) => (
              <SelectItem key={language.id} value={language.id}>
                {language.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
