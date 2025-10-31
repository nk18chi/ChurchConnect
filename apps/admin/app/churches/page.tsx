"use client";

import { useQuery, gql } from "@apollo/client";
import { StatusBadge } from "@/components/status-badge";
import { Edit, Trash2, Plus } from "lucide-react";

const CHURCHES_QUERY = gql`
  query Churches {
    churches(limit: 100) {
      id
      name
      slug
      isVerified
      isComplete
      isPublished
      denomination {
        name
      }
      prefecture {
        name
      }
      city {
        name
      }
      createdAt
    }
  }
`;

export default function ChurchesPage() {
  const { data, loading, error } = useQuery(CHURCHES_QUERY);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading churches...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-red-600">Error loading churches: {error.message}</div>
      </div>
    );
  }

  const churches = data?.churches || [];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Church Management</h1>
          <p className="mt-2 text-gray-600">
            Manage all churches on the platform
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Add Church
        </button>
      </div>

      <div className="rounded-lg border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Church Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Denomination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {churches.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No churches found. Click "Add Church" to create one.
                  </td>
                </tr>
              ) : (
                churches.map((church: any) => (
                  <tr key={church.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{church.name}</div>
                        <div className="text-sm text-gray-500">/{church.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {church.city.name}, {church.prefecture.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {church.denomination.name}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {church.isVerified && (
                          <StatusBadge status="Verified" variant="success" />
                        )}
                        {church.isComplete && (
                          <StatusBadge status="Complete" variant="info" />
                        )}
                        {church.isPublished ? (
                          <StatusBadge status="Published" variant="success" />
                        ) : (
                          <StatusBadge status="Draft" variant="warning" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button className="rounded p-1 hover:bg-gray-100">
                          <Edit className="h-4 w-4 text-gray-600" />
                        </button>
                        <button className="rounded p-1 hover:bg-gray-100">
                          <Trash2 className="h-4 w-4 text-red-600" />
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

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>Showing {churches.length} churches</div>
      </div>
    </div>
  );
}
