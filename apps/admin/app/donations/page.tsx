"use client";

import { StatusBadge } from "@/components/status-badge";
import { DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";

export default function DonationsPage() {
  // This will be populated with real data from GraphQL
  const donations: any[] = [];

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const oneTimeCount = donations.filter((d) => d.type === "ONE_TIME").length;
  const monthlyCount = donations.filter((d) => d.type === "MONTHLY").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Donation Analytics</h1>
        <p className="mt-2 text-gray-600">
          Track platform donations and subscription metrics
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Donations</p>
              <p className="mt-1 text-2xl font-bold">
                ¥{totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">One-Time</p>
              <p className="mt-1 text-2xl font-bold">{oneTimeCount}</p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Monthly</p>
              <p className="mt-1 text-2xl font-bold">{monthlyCount}</p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Donors</p>
              <p className="mt-1 text-2xl font-bold">0</p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Donation Trends</h2>
          <div className="flex h-64 items-center justify-center text-gray-500">
            <div className="text-center">
              <TrendingUp className="mx-auto mb-2 h-12 w-12 text-gray-400" />
              <p className="text-sm">Chart will be displayed here</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Top Donors</h2>
          <div className="flex h-64 items-center justify-center text-gray-500">
            <div className="text-center">
              <Users className="mx-auto mb-2 h-12 w-12 text-gray-400" />
              <p className="text-sm">Donor list will be displayed here</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Recent Donations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Donor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Church
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {donations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <DollarSign className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                      <p className="text-lg font-medium">No donations yet</p>
                      <p className="mt-1 text-sm">
                        Platform donations will appear here when users contribute
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                donations.map((donation: any) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {donation.donor?.name || "Anonymous"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        ¥{donation.amount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={donation.type}
                        variant={donation.type === "MONTHLY" ? "info" : "success"}
                      />
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={donation.status}
                        variant={
                          donation.status === "COMPLETED"
                            ? "success"
                            : donation.status === "FAILED"
                            ? "error"
                            : "warning"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {donation.church?.name || "Platform"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(donation.createdAt).toLocaleDateString()}
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
