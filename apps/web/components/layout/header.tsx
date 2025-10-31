import Link from "next/link";
import { Church } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <Church className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">ChurchConnect Japan</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link
            href="/churches"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Find Churches
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm font-medium transition-colors hover:text-primary"
          >
            Contact
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link
            href="/churches"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
          >
            Search
          </Link>
        </div>
      </div>
    </header>
  );
}
