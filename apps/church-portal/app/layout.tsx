import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { ApolloWrapper } from "@/components/apollo-wrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Church Portal - ChurchConnect Japan",
  description: "Manage your church profile and content",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Add authentication check here in Phase 9
  // For now, we allow access to all pages

  return (
    <html lang="en">
      <body className={inter.className}>
        <ApolloWrapper>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-gray-50">
              {children}
            </main>
          </div>
        </ApolloWrapper>
      </body>
    </html>
  );
}
