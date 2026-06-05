import type React from "react";
import AdminStatsCards from "../../components/admin/home/AdminStatsCards";
import AdminEarningsChart from "../../components/admin/home/AdminEarningsChart";
import AdminDepartmentStats from "../../components/admin/home/AdminDepartmentStats";
import AdminRecentActivities from "../../components/admin/home/AdminRecentActivities";
import AdminEducationalUnitInfo from "@/components/admin/home/AdminEducationalUnitInfo";
import AdminProfileInfo from "@/components/admin/home/AdminProfileInfo";

const AdminDashboardPage: React.FC = () => {
  return (
    <>
      {/* Page Title */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-gray-600 mt-1">Chào mừng bạn quay trở lại!</p>
      </div>

      {/* Stats Cards */}
      <AdminStatsCards />

      {/* Chart and Educational Unit Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
        <div className="lg:col-span-2">
          <AdminEarningsChart />
        </div>
        <div className="lg:col-span-1">
          <AdminEducationalUnitInfo />
        </div>
      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <AdminDepartmentStats />
        <AdminRecentActivities />
        <AdminProfileInfo />
      </div>
    </>
  );
};

export default AdminDashboardPage;