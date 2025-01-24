import React from "react";
import { MetricsDashboard } from "@/components/dashboard/MetricsDashboard";

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid gap-6">
        <MetricsDashboard />
      </div>
    </div>
  );
}