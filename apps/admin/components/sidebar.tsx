"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Church,
  Users,
  MessageSquare,
  CheckCircle,
  DollarSign,
  Settings,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Churches", href: "/churches", icon: Church },
  { name: "Users", href: "/users", icon: Users },
  { name: "Reviews", href: "/reviews", icon: MessageSquare },
  { name: "Verifications", href: "/verifications", icon: CheckCircle },
  { name: "Donations", href: "/donations", icon: DollarSign },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-dark">
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-white">ChurchConnect Admin</h1>
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
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-700 p-4">
        <p className="text-xs text-gray-400">Admin Portal v0.1.0</p>
      </div>
    </div>
  );
}
