"use client";

import { useQuery, gql } from "@apollo/client";
import { StatCard } from "@/components/stat-card";
import { Church, Users, MessageSquare, DollarSign, CheckCircle } from "lucide-react";

const DASHBOARD_STATS_QUERY = gql`
  query DashboardStats {
    churches {
      id
    }
  }
`;

export default function AdminDashboard() {
  const { data, loading } = useQuery(DASHBOARD_STATS_QUERY);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  const totalChurches = data?.churches?.length || 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of ChurchConnect platform metrics and activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Churches"
          value={totalChurches}
          icon={Church}
          description="Registered churches"
          trend={{ value: "+12% from last month", positive: true }}
        />
        <StatCard
          title="Total Users"
          value="0"
          icon={Users}
          description="Platform users"
          trend={{ value: "+8% from last month", positive: true }}
        />
        <StatCard
          title="Pending Reviews"
          value="0"
          icon={MessageSquare}
          description="Awaiting moderation"
        />
        <StatCard
          title="Total Donations"
          value="¥0"
          icon={DollarSign}
          description="Platform donations"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <p className="text-sm font-medium">No recent activity</p>
                <p className="text-xs text-gray-500">Platform is ready</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Pending Actions</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm">Verification Requests</span>
              </div>
              <span className="text-sm font-semibold">0</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-500" />
                <span className="text-sm">Review Moderation</span>
              </div>
              <span className="text-sm font-semibold">0</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <button className="rounded-lg border border-primary bg-primary px-4 py-3 text-sm font-medium text-white hover:bg-primary/90">
            Add New Church
          </button>
          <button className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-gray-50">
            View All Users
          </button>
          <button className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-gray-50">
            Platform Settings
          </button>
        </div>
      </div>
    </div>
  );
}
