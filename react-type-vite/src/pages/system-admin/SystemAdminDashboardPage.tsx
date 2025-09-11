import type React from "react";
import SystemStatsCards from "../../components/system-admin/SystemStatsCards";
import SystemStatistics from "../../components/system-admin/SystemStatistics";

const SystemAdminDashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl text-gray-900 font-semibold">
          Tổng quan hệ thống đào tạo
        </h1>
      </div>
      <SystemStatsCards />
      <SystemStatistics />
    </div>
  );
};

export default SystemAdminDashboardPage;
