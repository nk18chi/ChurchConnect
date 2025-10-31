"use client";

import { StatusBadge } from "@/components/status-badge";
import { Check, X, Eye } from "lucide-react";

export default function ReviewsPage() {
  // This will be populated with real data from GraphQL
  const reviews: any[] = [];

  const pendingCount = reviews.filter((r) => r.status === "PENDING").length;
  const approvedCount = reviews.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = reviews.filter((r) => r.status === "REJECTED").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Review Moderation</h1>
        <p className="mt-2 text-gray-600">
          Moderate user reviews and testimonials
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <Eye className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="mt-1 text-2xl font-bold">{approvedCount}</p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="mt-1 text-2xl font-bold">{rejectedCount}</p>
            </div>
            <div className="rounded-full bg-red-100 p-3">
              <X className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <div className="flex gap-2">
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
              All
            </button>
            <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Pending
            </button>
            <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Approved
            </button>
            <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
              Rejected
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Church
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Reviewer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <Eye className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                      <p className="text-lg font-medium">No reviews to moderate</p>
                      <p className="mt-1 text-sm">
                        Reviews will appear here when users submit them
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((review: any) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {review.church.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {review.user.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md truncate text-sm text-gray-900">
                        {review.content}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={review.status}
                        variant={
                          review.status === "APPROVED"
                            ? "success"
                            : review.status === "REJECTED"
                            ? "error"
                            : "warning"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-green-600 p-2 text-white hover:bg-green-700">
                          <Check className="h-4 w-4" />
                        </button>
                        <button className="rounded-lg bg-red-600 p-2 text-white hover:bg-red-700">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
