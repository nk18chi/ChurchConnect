"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@repo/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Badge } from "@repo/ui";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { ChurchContactForm } from "@/components/contact/church-contact-form";

interface ChurchTabsProps {
  church: {
    id: string;
    name: string;
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
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="about" className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="worship">Worship</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="sermons">Sermons</TabsTrigger>
          <TabsTrigger value="give">Give</TabsTrigger>
          <TabsTrigger value="connect">Connect</TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="about" className="space-y-6">
            {church.profile?.whoWeAre && (
              <Card>
                <CardHeader>
                  <CardTitle>Who We Are</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-600">
                    {church.profile.whoWeAre}
                  </p>
                </CardContent>
              </Card>
            )}

            {church.profile?.vision && (
              <Card>
                <CardHeader>
                  <CardTitle>Our Vision</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-600">
                    {church.profile.vision}
                  </p>
                </CardContent>
              </Card>
            )}

            {church.profile?.statementOfFaith && (
              <Card>
                <CardHeader>
                  <CardTitle>Statement of Faith</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-600">
                    {church.profile.statementOfFaith}
                  </p>
                </CardContent>
              </Card>
            )}

            {church.profile?.storyOfChurch && (
              <Card>
                <CardHeader>
                  <CardTitle>Our Story</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-600">
                    {church.profile.storyOfChurch}
                  </p>
                </CardContent>
              </Card>
            )}

            {church.profile?.kidChurchInfo && (
              <Card>
                <CardHeader>
                  <CardTitle>Kids Ministry</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-600">
                    {church.profile.kidChurchInfo}
                  </p>
                </CardContent>
              </Card>
            )}

            {!church.profile && (
              <Card>
                <CardContent className="py-12 text-center text-gray-600">
                  No information available yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leadership">
            {church.staff && church.staff.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {church.staff.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="pt-6">
                      {member.photoUrl && (
                        <div className="mb-4 aspect-square overflow-hidden rounded-lg bg-gray-200">
                          <img
                            src={member.photoUrl}
                            alt={member.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <h3 className="text-lg font-semibold">{member.name}</h3>
                      {member.title && (
                        <p className="text-sm text-primary">{member.title}</p>
                      )}
                      {member.role && (
                        <p className="text-sm text-gray-600">{member.role}</p>
                      )}
                      {member.bio && (
                        <p className="mt-2 text-sm text-gray-600">
                          {member.bio}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-600">
                  No staff information available yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="worship" className="space-y-6">
            {church.serviceTimes && church.serviceTimes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Service Times</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {church.serviceTimes.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-start justify-between border-b pb-3 last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {DAYS[service.dayOfWeek]}
                          </p>
                          <p className="text-sm text-gray-600">
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
                </CardContent>
              </Card>
            )}

            {church.profile?.whatToExpect && (
              <Card>
                <CardHeader>
                  <CardTitle>What to Expect</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-600">
                    {church.profile.whatToExpect}
                  </p>
                </CardContent>
              </Card>
            )}

            {church.profile?.worshipStyle && (
              <Card>
                <CardHeader>
                  <CardTitle>Worship Style</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{church.profile.worshipStyle}</p>
                </CardContent>
              </Card>
            )}

            {!church.serviceTimes?.length && !church.profile?.whatToExpect && (
              <Card>
                <CardContent className="py-12 text-center text-gray-600">
                  No worship information available yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="events">
            {church.events && church.events.length > 0 ? (
              <div className="space-y-4">
                {church.events.map((event) => (
                  <Card key={event.id}>
                    <CardContent className="pt-6">
                      <div className="flex gap-4">
                        {event.imageUrl && (
                          <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(event.startDate).toLocaleDateString()}
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {event.location}
                              </div>
                            )}
                            {event.isOnline && (
                              <Badge variant="secondary">Online</Badge>
                            )}
                          </div>
                          {event.description && (
                            <p className="mt-2 text-sm text-gray-600">
                              {event.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-600">
                  No upcoming events.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sermons">
            {church.sermons && church.sermons.length > 0 ? (
              <div className="space-y-4">
                {church.sermons.map((sermon) => (
                  <Card key={sermon.id}>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold">{sermon.title}</h3>
                      <p className="text-sm text-gray-600">
                        {sermon.preacher} •{" "}
                        {new Date(sermon.date).toLocaleDateString()}
                      </p>
                      {sermon.passage && (
                        <p className="mt-1 text-sm text-primary">
                          {sermon.passage}
                        </p>
                      )}
                      {sermon.description && (
                        <p className="mt-2 text-sm text-gray-600">
                          {sermon.description}
                        </p>
                      )}
                      <div className="mt-4 flex gap-2">
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-gray-600">
                  No sermons available yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="give" className="space-y-6">
            {church.profile?.howToGive && (
              <Card>
                <CardHeader>
                  <CardTitle>How to Give</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-line text-gray-600">
                    {church.profile.howToGive}
                  </p>
                </CardContent>
              </Card>
            )}

            {(church.profile?.bankName ||
              church.profile?.bankAccountNumber ||
              church.profile?.bankAccountName) && (
              <Card>
                <CardHeader>
                  <CardTitle>Bank Transfer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {church.profile.bankName && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Bank Name
                      </p>
                      <p className="text-gray-900">{church.profile.bankName}</p>
                    </div>
                  )}
                  {church.profile.bankAccountName && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Account Name
                      </p>
                      <p className="text-gray-900">
                        {church.profile.bankAccountName}
                      </p>
                    </div>
                  )}
                  {church.profile.bankAccountNumber && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Account Number
                      </p>
                      <p className="text-gray-900">
                        {church.profile.bankAccountNumber}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {church.profile?.externalDonationUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Give Online</CardTitle>
                </CardHeader>
                <CardContent>
                  <a
                    href={church.profile.externalDonationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90"
                  >
                    Give Online
                  </a>
                </CardContent>
              </Card>
            )}

            {!church.profile?.howToGive &&
              !church.profile?.bankName &&
              !church.profile?.bankAccountNumber &&
              !church.profile?.bankAccountName &&
              !church.profile?.externalDonationUrl && (
                <Card>
                  <CardContent className="py-12 text-center text-gray-600">
                    No giving information available yet.
                  </CardContent>
                </Card>
              )}
          </TabsContent>

          <TabsContent value="connect" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {church.contactEmail && (
                      <div>
                        <p className="text-sm font-medium">Email</p>
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
                        <p className="text-sm font-medium">Website</p>
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
                    {!church.contactEmail && !church.website && (
                      <p className="text-sm text-gray-600">
                        No contact information available.
                      </p>
                    )}
                  </CardContent>
                </Card>

                {church.social && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Social Media</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {church.social.youtubeUrl && (
                          <a
                            href={church.social.youtubeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            YouTube
                          </a>
                        )}
                        {church.social.instagramUrl && (
                          <a
                            href={church.social.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Instagram
                          </a>
                        )}
                        {church.social.facebookUrl && (
                          <a
                            href={church.social.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Facebook
                          </a>
                        )}
                        {church.social.twitterUrl && (
                          <a
                            href={church.social.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline"
                          >
                            Twitter
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {(church.contactEmail || church.email) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Send a Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChurchContactForm
                      churchId={church.id}
                      churchName={church.name}
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
