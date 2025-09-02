"use client";

import type React from "react";
import { useState } from "react";
import SystemAdminSidebar from "../../components/system-admin/SystemAdminSidebar";
import SystemAdminHeader from "../../components/system-admin/SystemAdminHeader";
import SystemStatsCards from "../../components/system-admin/SystemStatsCards";
import TrainingUnitsManagement from "../../components/system-admin/TrainingUnitsManagement";
import AccountManagement from "../../components/system-admin/AccountManagement";
import CategoryManagement from "../../components/system-admin/CategoryManagement";
import RevenueManagement from "../../components/system-admin/RevenueManagement";
import SystemStatistics from "../../components/system-admin/SystemStatistics";
import "../../styles/system-admin.css";

const SystemAdminDashboard: React.FC = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
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
      case "training-units":
        return <TrainingUnitsManagement />;
      case "accounts":
        return <AccountManagement />;
      case "categories":
        return <CategoryManagement />;
      case "revenue":
        return <RevenueManagement />;
      case "statistics":
        return <SystemStatistics />;
      default:
        return (
          <div className="space-y-6">
            <SystemStatsCards />
            <SystemStatistics />
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 system-admin">
      <SystemAdminSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />
      <div
        className={`flex-1 flex flex-col bg-gray-50 transition-all duration-300`}
      >
        <SystemAdminHeader
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SystemAdminDashboard;
