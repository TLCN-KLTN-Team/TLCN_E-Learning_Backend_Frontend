import type React from "react";
import AdminStatsCards from "../../components/admin/home/AdminStatsCards";
import AdminEarningsChart from "../../components/admin/home/AdminEarningsChart";
import AdminSupportRequests from "../../components/admin/home/AdminSupportRequests";
import AdminTopInstructors from "../../components/admin/home/AdminTopInstructors";
import AdminNoticeBoard from "../../components/admin/home/AdminNoticeBoard";
import AdminTrafficSources from "../../components/admin/home/AdminTrafficSources";

const AdminDashboardPage: React.FC = () => {
  return (
    <>
      {/* Page Title */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards />

      {/* Chart and Support Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="lg:col-span-2">
          <AdminEarningsChart />
        </div>
        <div className="lg:col-span-1">
          <AdminSupportRequests />
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <AdminTopInstructors />
        <AdminNoticeBoard />
        <AdminTrafficSources />
      </div>
    </>
  );
};

export default AdminDashboardPage;