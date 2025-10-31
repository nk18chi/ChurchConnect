"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Church,
  Users,
  Clock,
  Image,
  Video,
  CalendarDays,
  Star,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Church Profile", href: "/profile", icon: Church },
  { name: "Staff", href: "/staff", icon: Users },
  { name: "Service Times", href: "/services", icon: Clock },
  { name: "Photos", href: "/photos", icon: Image },
  { name: "Sermons", href: "/sermons", icon: Video },
  { name: "Events", href: "/events", icon: CalendarDays },
  { name: "Reviews", href: "/reviews", icon: Star },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold text-primary">Church Portal</h1>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
            <Church className="h-5 w-5 text-gray-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">My Church</p>
            <p className="text-xs text-gray-500">Admin Account</p>
          </div>
        </div>
      </div>
    </div>
  );
}
