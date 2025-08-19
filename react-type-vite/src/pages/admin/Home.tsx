import type React from "react";
import { useState } from "react";
import AdminSidebar from "../../components/admin/home/AdminSidebar";
import AdminHeader from "../../components/admin/home/AdminHeader";
import AdminStatsCards from "../../components/admin/home/AdminStatsCards";
import AdminEarningsChart from "../../components/admin/home/AdminEarningsChart";
import AdminSupportRequests from "../../components/admin/home/AdminSupportRequests";
import AdminTopInstructors from "../../components/admin/home/AdminTopInstructors";
import AdminNoticeBoard from "../../components/admin/home/AdminNoticeBoard";
import AdminTrafficSources from "../../components/admin/home/AdminTrafficSources";
import "../../styles/admin.css";

const AdminDashboard: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="admin-container flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        {/* Header */}
        <AdminHeader
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />

        {/* Page Content */}
        <div className="p-4 md:p-6 lg:pl-10 lg:pt-4">
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
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
