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
    <Link href={`/churches/${church.slug}`}>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg h-full">
        {church.heroImageUrl && (
          <div className="aspect-video w-full overflow-hidden bg-gray-200">
            <img
              src={church.heroImageUrl}
              alt={church.name}
              className="h-full w-full object-cover"
            />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold">{church.name}</h3>
            {church.isVerified && (
              <CheckCircle className="h-5 w-5 flex-shrink-0 text-primary" />
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>
              {church.city.name}, {church.prefecture.name}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{church.denomination.name}</Badge>
            {church.languages.map((language) => (
              <Badge key={language.name} variant="outline">
                {language.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
