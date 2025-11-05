import { MapPin, Phone, Mail, Globe, CheckCircle, Share, Heart } from "lucide-react";
import { Badge } from "@repo/ui";
import { ChurchGallery } from "./church-gallery";

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
    photos?: Array<{
      id: string;
      url: string;
      caption?: string | null;
    }>;
  };
}

export function ChurchHero({ church }: ChurchHeroProps) {
  return (
    <div className="relative">
      {/* Gallery */}
      <div className="container mx-auto px-6 pt-6">
        <ChurchGallery
          heroImageUrl={church.heroImageUrl}
          photos={church.photos || []}
          churchName={church.name}
        />
      </div>

      {/* Church Info */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                {church.name}
              </h1>
              {church.isVerified && (
                <CheckCircle className="h-6 w-6 text-primary" />
              )}
            </div>

            <div className="text-gray-600">
              {church.city.name}, {church.prefecture.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition">
              <Share className="w-4 h-4" />
              <span className="text-sm font-semibold underline">Share</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition">
              <Heart className="w-4 h-4" />
              <span className="text-sm font-semibold underline">Save</span>
            </button>
          </div>
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
  );
}
