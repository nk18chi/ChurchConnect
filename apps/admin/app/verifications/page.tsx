"use client";

import { StatusBadge } from "@/components/status-badge";
import { Check, X, FileText, ExternalLink } from "lucide-react";

export default function VerificationsPage() {
  // This will be populated with real data from GraphQL
  const verifications: any[] = [];

  const pendingCount = verifications.filter((v) => v.status === "PENDING").length;
  const approvedCount = verifications.filter((v) => v.status === "APPROVED").length;
  const rejectedCount = verifications.filter((v) => v.status === "REJECTED").length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Church Verification</h1>
        <p className="mt-2 text-gray-600">
          Review and approve church verification requests
        </p>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Requests</p>
              <p className="mt-1 text-2xl font-bold">{pendingCount}</p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3">
              <FileText className="h-6 w-6 text-yellow-600" />
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
              Pending
            </button>
            <button className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50">
              All
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
                  Requested By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {verifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FileText className="mx-auto mb-3 h-12 w-12 text-gray-400" />
                      <p className="text-lg font-medium">No verification requests</p>
                      <p className="mt-1 text-sm">
                        Church verification requests will appear here
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                verifications.map((verification: any) => (
                  <tr key={verification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">
                        {verification.church.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {verification.church.city.name}, {verification.church.prefecture.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {verification.requestedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {verification.requestEmail}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={verification.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge
                        status={verification.status}
                        variant={
                          verification.status === "APPROVED"
                            ? "success"
                            : verification.status === "REJECTED"
                            ? "error"
                            : "warning"
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(verification.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="rounded-lg bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700">
                          Approve
                        </button>
                        <button className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700">
                          Reject
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
