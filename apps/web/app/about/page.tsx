import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Church, Heart, Users, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "About | ChurchConnect Japan",
  description:
    "Learn about ChurchConnect Japan - our mission to connect people with churches across Japan.",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold">About ChurchConnect Japan</h1>
          <p className="mt-4 text-lg text-gray-600">
            Connecting people with churches across Japan
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                ChurchConnect Japan exists to help people discover and connect
                with churches across Japan. We believe that finding the right
                church community is an important part of one's spiritual
                journey, and we want to make that search easier and more
                accessible for everyone.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="h-5 w-5 text-primary" />
                What We Do
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                We provide a comprehensive directory of churches across Japan,
                making it easy to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Search for churches by location, denomination, and language</li>
                <li>View detailed information about each church</li>
                <li>Find service times and contact information</li>
                <li>Learn about church staff and ministries</li>
                <li>Stay updated on church events and sermons</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We envision a Japan where everyone can easily find a church
                community that welcomes them, regardless of their location,
                language, or background. Through technology and partnership with
                churches, we're working to make this vision a reality.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                For Churches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                We partner with churches across Japan to help them reach more
                people in their communities. Churches can manage their own
                profiles, update information, share events and sermons, and
                connect with visitors - all through our platform.
              </p>
            </CardContent>
          </Card>

          <div className="mt-12 rounded-lg bg-gray-50 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Want to learn more or get involved?
            </h2>
            <p className="text-gray-600 mb-6">
              We'd love to hear from you. Whether you're looking for a church or
              want to list your church on our platform, get in touch with us.
            </p>
            <a
              href="/contact"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary/90"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
