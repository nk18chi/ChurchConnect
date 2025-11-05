import Link from "next/link";
import { MapPin, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader } from "@repo/ui";
import { Badge } from "@repo/ui";

interface ChurchCardProps {
  church: {
    slug: string;
    name: string;
    address: string;
    heroImageUrl?: string | null;
    isVerified: boolean;
    prefecture: {
      name: string;
    };
    city: {
      name: string;
    };
    denomination: {
      name: string;
    };
    languages: Array<{
      name: string;
    }>;
  };
}

export function ChurchCard({ church }: ChurchCardProps) {
  return (
    <Link href={`/churches/${church.slug}`} className="block group">
      <div className="overflow-hidden rounded-xl">
        {/* Image */}
        {church.heroImageUrl ? (
          <div className="aspect-[4/3] w-full overflow-hidden bg-gray-200 rounded-xl">
            <img
              src={church.heroImageUrl}
              alt={church.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[4/3] w-full bg-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}

        {/* Content below image */}
        <div className="mt-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 truncate">
              {church.city.name}, {church.prefecture.name}
            </h3>
            {church.isVerified && (
              <CheckCircle className="h-4 w-4 flex-shrink-0 text-primary" />
            )}
          </div>

          <p className="text-sm text-gray-600 truncate">{church.name}</p>

          <div className="flex flex-wrap gap-1.5 mt-2">
            <Badge variant="secondary" className="text-xs">{church.denomination.name}</Badge>
            {church.languages.slice(0, 2).map((language) => (
              <Badge key={language.name} variant="outline" className="text-xs">
                {language.name}
              </Badge>
            ))}
            {church.languages.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{church.languages.length - 2}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
