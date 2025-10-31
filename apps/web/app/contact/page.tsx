import { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { Mail, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact | ChurchConnect Japan",
  description:
    "Get in touch with ChurchConnect Japan. We're here to help you find churches or list your church on our platform.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="mt-4 text-lg text-gray-600">
            We'd love to hear from you. Send us a message and we'll respond as
            soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Send us a message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Us
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-2">
                  For general inquiries:
                </p>
                <a
                  href="mailto:info@churchconnect.jp"
                  className="text-primary hover:underline"
                >
                  info@churchconnect.jp
                </a>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What can we help with?</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Finding a church near you</li>
                  <li>• Listing your church on our platform</li>
                  <li>• Technical support</li>
                  <li>• Partnership opportunities</li>
                  <li>• General questions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
