import Link from "next/link";
import { Church } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Church className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">ChurchConnect Japan</span>
            </Link>
            <p className="text-sm text-gray-600 max-w-md">
              Connecting people with churches across Japan. Find worship
              communities, service times, and church information all in one
              place.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/churches" className="hover:text-primary">
                  Find Churches
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/churches" className="hover:text-primary">
                  Church Directory
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-primary">
                  Support ChurchConnect
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-gray-600">
          <p>&copy; {currentYear} ChurchConnect Japan. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
