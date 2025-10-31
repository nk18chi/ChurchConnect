import { MapPin, Phone, Mail, Globe, CheckCircle } from "lucide-react";
import { Badge } from "@repo/ui";

interface ChurchHeroProps {
  church: {
    name: string;
    address: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
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

export function ChurchHero({ church }: ChurchHeroProps) {
  return (
    <div className="relative">
      {church.heroImageUrl && (
        <div className="h-64 w-full overflow-hidden bg-gray-200 md:h-96">
          <img
            src={church.heroImageUrl}
            alt={church.name}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <h1 className="text-3xl font-bold md:text-4xl">
                  {church.name}
                </h1>
                {church.isVerified && (
                  <CheckCircle className="h-6 w-6 text-primary" />
                )}
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <Badge variant="secondary">{church.denomination.name}</Badge>
                {church.languages.map((language) => (
                  <Badge key={language.name} variant="outline">
                    {language.name}
                  </Badge>
                ))}
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>
                    {church.address}, {church.city.name},{" "}
                    {church.prefecture.name}
                  </span>
                </div>

                {church.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${church.phone}`} className="hover:text-primary">
                      {church.phone}
                    </a>
                  </div>
                )}

                {church.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${church.email}`} className="hover:text-primary">
                      {church.email}
                    </a>
                  </div>
                )}

                {church.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <a
                      href={church.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
