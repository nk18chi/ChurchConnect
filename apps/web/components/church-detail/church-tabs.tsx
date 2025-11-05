"use client";

import { useRef, useState } from "react";
import { Badge } from "@repo/ui";
import { Calendar, Wifi, Accessibility, Music, Baby, PartyPopper, BookOpen, MapPin } from "lucide-react";

interface ChurchTabsProps {
  church: {
    id: string;
    name: string;
    address: string;
    prefecture: {
      name: string;
    };
    city: {
      name: string;
    };
    profile?: {
      whoWeAre?: string | null;
      vision?: string | null;
      statementOfFaith?: string | null;
      storyOfChurch?: string | null;
      kidChurchInfo?: string | null;
      whatToExpect?: string | null;
      dressCode?: string | null;
      worshipStyle?: string | null;
      accessibility?: string[];
      howToGive?: string | null;
      bankName?: string | null;
      bankAccountNumber?: string | null;
      bankAccountName?: string | null;
      externalDonationUrl?: string | null;
    } | null;
    staff?: Array<{
      id: string;
      name: string;
      title?: string | null;
      role?: string | null;
      bio?: string | null;
      photoUrl?: string | null;
      email?: string | null;
    }>;
    serviceTimes?: Array<{
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime?: string | null;
      serviceType?: string | null;
      language: {
        name: string;
      };
    }>;
    events?: Array<{
      id: string;
      title: string;
      description?: string | null;
      startDate: string;
      endDate?: string | null;
      location?: string | null;
      isOnline: boolean;
      registrationUrl?: string | null;
      imageUrl?: string | null;
    }>;
    sermons?: Array<{
      id: string;
      title: string;
      description?: string | null;
      preacher: string;
      passage?: string | null;
      date: string;
      youtubeUrl?: string | null;
      podcastUrl?: string | null;
    }>;
    social?: {
      youtubeUrl?: string | null;
      podcastUrl?: string | null;
      instagramUrl?: string | null;
      twitterUrl?: string | null;
      facebookUrl?: string | null;
      spotifyUrl?: string | null;
      lineUrl?: string | null;
    } | null;
    email?: string | null;
    contactEmail?: string | null;
    website?: string | null;
  };
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function ChurchTabs({ church }: ChurchTabsProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const overviewRef = useRef<HTMLDivElement>(null);
  const facilitiesRef = useRef<HTMLDivElement>(null);
  const worshipRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const leadershipRef = useRef<HTMLDivElement>(null);
  const eventsRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>, section: string) => {
    setActiveSection(section);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const sermonsRef = useRef<HTMLDivElement>(null);
  const giveRef = useRef<HTMLDivElement>(null);
  const connectRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: "overview", label: "Overview", ref: overviewRef },
    { id: "facilities", label: "Facilities", ref: facilitiesRef },
    { id: "worship", label: "Worship", ref: worshipRef },
    { id: "location", label: "Location", ref: locationRef },
    { id: "leadership", label: "Leadership", ref: leadershipRef },
    { id: "events", label: "Events", ref: eventsRef },
    { id: "sermons", label: "Sermons", ref: sermonsRef },
    { id: "give", label: "Give", ref: giveRef },
    { id: "connect", label: "Connect", ref: connectRef },
  ];

  const facilities = [
    { icon: Wifi, label: "Free WiFi" },
    { icon: Accessibility, label: "Wheelchair Accessible" },
    { icon: Music, label: "Live Worship" },
    { icon: Baby, label: "Kids Ministry" },
    { icon: PartyPopper, label: "Events Space" },
    { icon: BookOpen, label: "Bible Studies" },
  ];

  return (
    <div className="border-t">
      {/* Navigation Tabs */}
      <div className="sticky top-16 z-30 bg-white border-b">
        <div className="container mx-auto px-6">
          <nav className="flex gap-8 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.ref, item.id)}
                className={`py-4 text-sm font-medium border-b-2 transition whitespace-nowrap ${
                  activeSection === item.id
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-3xl">
          {/* Overview Section */}
          <section ref={overviewRef} className="mb-16 scroll-mt-32">
            <h2 className="text-2xl font-semibold mb-4">About This Church</h2>
            {church.profile?.whoWeAre && (
              <p className="text-gray-600 leading-relaxed mb-4">
                {church.profile.whoWeAre}
              </p>
            )}
            {church.profile?.vision && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed">
                  {church.profile.vision}
                </p>
              </div>
            )}
            {church.profile?.statementOfFaith && (
              <div className="mt-6">
                <h3 className="font-semibold mb-2">Statement of Faith</h3>
                <p className="text-gray-600 leading-relaxed">
                  {church.profile.statementOfFaith}
                </p>
              </div>
            )}
          </section>

          {/* Facilities Section */}
          <section ref={facilitiesRef} className="mb-16 pb-8 border-b scroll-mt-32">
            <h2 className="text-2xl font-semibold mb-6">What This Church Offers</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {facilities.map((facility, index) => (
                <div key={index} className="flex items-center gap-3">
                  <facility.icon className="w-6 h-6" />
                  <span className="text-gray-700">{facility.label}</span>
                </div>
              ))}
            </div>
            {church.profile?.accessibility && church.profile.accessibility.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Accessibility</h3>
                <ul className="space-y-2">
                  {church.profile.accessibility.map((item, index) => (
                    <li key={index} className="text-gray-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Worship Section */}
          <section ref={worshipRef} className="mb-16 pb-8 border-b scroll-mt-32">
            <h2 className="text-2xl font-semibold mb-6">Service Times</h2>
            {church.serviceTimes && church.serviceTimes.length > 0 ? (
              <div className="space-y-4">
                {church.serviceTimes.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-start justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {DAYS[service.dayOfWeek]}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {service.startTime}
                        {service.endTime && ` - ${service.endTime}`}
                      </p>
                      {service.serviceType && (
                        <p className="text-sm text-gray-600">
                          {service.serviceType}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">{service.language.name}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No service times available.</p>
            )}

            {church.profile?.whatToExpect && (
              <div className="mt-8">
                <h3 className="font-semibold mb-3">What to Expect</h3>
                <p className="text-gray-600 leading-relaxed">
                  {church.profile.whatToExpect}
                </p>
              </div>
            )}

            {church.profile?.worshipStyle && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Worship Style</h3>
                <p className="text-gray-600">{church.profile.worshipStyle}</p>
              </div>
            )}
          </section>

          {/* Location Section */}
          <section ref={locationRef} className="mb-16 pb-8 border-b scroll-mt-32">
            <h2 className="text-2xl font-semibold mb-6">Location</h2>
            <div className="mb-4">
              <p className="text-gray-900 font-medium">{church.address}</p>
              <p className="text-gray-600">{church.city.name}, {church.prefecture.name}</p>
            </div>
            <div className="w-full h-[400px] bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Map Coming Soon</p>
              </div>
            </div>
          </section>

          {/* Leadership Section */}
          <section ref={leadershipRef} className="mb-16 pb-8 border-b scroll-mt-32">
            <h2 className="text-2xl font-semibold mb-6">Leadership Team</h2>
            {church.staff && church.staff.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {church.staff.map((member) => (
                  <div key={member.id} className="flex gap-4">
                    {member.photoUrl && (
                      <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      {member.title && (
                        <p className="text-sm text-gray-600">{member.title}</p>
                      )}
                      {member.bio && (
                        <p className="text-sm text-gray-600 mt-2">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No leadership information available.</p>
            )}
          </section>

          {/* Events Section */}
          <section ref={eventsRef} className="mb-16 pb-8 border-b scroll-mt-32">
            <h2 className="text-2xl font-semibold mb-6">Upcoming Events</h2>
            {church.events && church.events.length > 0 ? (
              <div className="space-y-6">
                {church.events.map((event) => (
                  <div key={event.id} className="pb-6 border-b last:border-0">
                    <div className="flex gap-4">
                      {event.imageUrl && (
                        <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                          <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(event.startDate).toLocaleDateString()}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </div>
                          )}
                          {event.isOnline && (
                            <Badge variant="secondary">Online</Badge>
                          )}
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No upcoming events.</p>
            )}
          </section>

          {/* Sermons Section */}
          <section ref={sermonsRef} className="mb-16 pb-8 border-b scroll-mt-32">
            <h2 className="text-2xl font-semibold mb-6">Recent Sermons</h2>
            {church.sermons && church.sermons.length > 0 ? (
              <div className="space-y-6">
                {church.sermons.map((sermon) => (
                  <div key={sermon.id} className="pb-6 border-b last:border-0">
                    <h3 className="font-semibold text-gray-900 mb-1">{sermon.title}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {sermon.preacher} • {new Date(sermon.date).toLocaleDateString()}
                    </p>
                    {sermon.passage && (
                      <p className="text-sm text-primary mb-2">{sermon.passage}</p>
                    )}
                    {sermon.description && (
                      <p className="text-sm text-gray-600 mb-3">{sermon.description}</p>
                    )}
                    {(sermon.youtubeUrl || sermon.podcastUrl) && (
                      <div className="flex gap-3">
                        {sermon.youtubeUrl && (
                          <a
                            href={sermon.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Watch on YouTube
                          </a>
                        )}
                        {sermon.podcastUrl && (
                          <a
                            href={sermon.podcastUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Listen to Podcast
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No sermons available.</p>
            )}
          </section>

          {/* Give Section */}
          <section ref={giveRef} className="mb-16 pb-8 border-b scroll-mt-32">
            <h2 className="text-2xl font-semibold mb-6">Give</h2>
            {church.profile?.howToGive && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">How to Give</h3>
                <p className="text-gray-600 leading-relaxed">{church.profile.howToGive}</p>
              </div>
            )}

            {(church.profile?.bankName ||
              church.profile?.bankAccountNumber ||
              church.profile?.bankAccountName) && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Bank Transfer Information</h3>
                <div className="space-y-3">
                  {church.profile.bankName && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Bank Name</p>
                      <p className="text-gray-900">{church.profile.bankName}</p>
                    </div>
                  )}
                  {church.profile.bankAccountName && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Account Name</p>
                      <p className="text-gray-900">{church.profile.bankAccountName}</p>
                    </div>
                  )}
                  {church.profile.bankAccountNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Account Number</p>
                      <p className="text-gray-900">{church.profile.bankAccountNumber}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {church.profile?.externalDonationUrl && (
              <div>
                <a
                  href={church.profile.externalDonationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-white hover:bg-gray-800 transition"
                >
                  Give Online
                </a>
              </div>
            )}

            {!church.profile?.howToGive &&
              !church.profile?.bankName &&
              !church.profile?.bankAccountNumber &&
              !church.profile?.bankAccountName &&
              !church.profile?.externalDonationUrl && (
                <p className="text-gray-600">No giving information available.</p>
              )}
          </section>

          {/* Connect Section */}
          <section ref={connectRef} className="mb-16 scroll-mt-32">
            <h2 className="text-2xl font-semibold mb-6">Connect With Us</h2>

            {(church.contactEmail || church.website) && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Contact Information</h3>
                <div className="space-y-2">
                  {church.contactEmail && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <a
                        href={`mailto:${church.contactEmail}`}
                        className="text-primary hover:underline"
                      >
                        {church.contactEmail}
                      </a>
                    </div>
                  )}
                  {church.website && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Website</p>
                      <a
                        href={church.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {church.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {church.social && (
              <div>
                <h3 className="font-semibold mb-3">Follow Us</h3>
                <div className="flex flex-wrap gap-3">
                  {church.social.youtubeUrl && (
                    <a
                      href={church.social.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      YouTube
                    </a>
                  )}
                  {church.social.instagramUrl && (
                    <a
                      href={church.social.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Instagram
                    </a>
                  )}
                  {church.social.facebookUrl && (
                    <a
                      href={church.social.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Facebook
                    </a>
                  )}
                  {church.social.twitterUrl && (
                    <a
                      href={church.social.twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}

            {!church.contactEmail && !church.website && !church.social && (
              <p className="text-gray-600">No contact information available.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
