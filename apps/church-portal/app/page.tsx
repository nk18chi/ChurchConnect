"use client";

import Link from "next/link";
import { CheckCircle2, Circle, TrendingUp, Users, Eye } from "lucide-react";

// Mock data - will be replaced with real data from GraphQL
const mockCompleteness = {
  basicInfo: true,
  profile: false,
  staff: false,
  serviceTimes: true,
  photos: false,
  sermons: false,
  events: false,
};

const mockStats = {
  views: 245,
  viewsThisWeek: 12,
  reviewCount: 3,
};

export default function DashboardPage() {
  const checklistItems = [
    {
      title: "Basic Church Information",
      description: "Add your church name, location, and contact details",
      completed: mockCompleteness.basicInfo,
      href: "/settings",
    },
    {
      title: "Church Profile",
      description: "Share your vision, beliefs, and story",
      completed: mockCompleteness.profile,
      href: "/profile",
    },
    {
      title: "Staff & Leadership",
      description: "Introduce your pastoral team and leaders",
      completed: mockCompleteness.staff,
      href: "/staff",
    },
    {
      title: "Service Times",
      description: "Add your weekly service schedule",
      completed: mockCompleteness.serviceTimes,
      href: "/services",
    },
    {
      title: "Photo Gallery",
      description: "Upload photos of your church and community",
      completed: mockCompleteness.photos,
      href: "/photos",
    },
    {
      title: "Sermons",
      description: "Share your recent messages and teachings",
      completed: mockCompleteness.sermons,
      href: "/sermons",
    },
    {
      title: "Events",
      description: "Post upcoming events and gatherings",
      completed: mockCompleteness.events,
      href: "/events",
    },
  ];

  const completedCount = checklistItems.filter((item) => item.completed).length;
  const percentage = Math.round((completedCount / checklistItems.length) * 100);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">
          Welcome to your church management portal
        </p>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Views</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {mockStats.views}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <Eye className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Views This Week
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {mockStats.viewsThisWeek}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reviews</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {mockStats.reviewCount}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completeness */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Profile Completeness
            </h2>
            <span className="text-2xl font-bold text-primary">
              {percentage}%
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          {checklistItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-gray-50"
            >
              {item.completed ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-medium ${
                    item.completed ? "text-gray-900" : "text-gray-700"
                  }`}
                >
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>

        {percentage < 100 && (
          <div className="mt-6 rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              Complete your profile to improve visibility and help people find
              your church!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
