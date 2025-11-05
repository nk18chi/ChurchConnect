import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ApolloProvider } from "@/lib/apollo-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import SessionProvider from "./components/session-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { LocaleProvider } from "@/lib/i18n/locale-context";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "ChurchConnect Japan - Find Churches Across Japan",
  description:
    "Discover churches across Japan. Search by location, denomination, and language. Find service times, staff information, and connect with churches near you.",
  keywords: [
    "church",
    "Japan",
    "church directory",
    "Christian",
    "worship",
    "church finder",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://churchconnect.jp",
    siteName: "ChurchConnect Japan",
    title: "ChurchConnect Japan - Find Churches Across Japan",
    description:
      "Discover churches across Japan. Search by location, denomination, and language.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ChurchConnect Japan",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ChurchConnect Japan - Find Churches Across Japan",
    description:
      "Discover churches across Japan. Search by location, denomination, and language.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <ErrorBoundary>
          <SessionProvider>
            <ApolloProvider>
              <LocaleProvider>
                <div className="flex min-h-screen flex-col">
                  <Header />
                  <main className="flex-1">{children}</main>
                  <Footer />
                </div>
              </LocaleProvider>
            </ApolloProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
