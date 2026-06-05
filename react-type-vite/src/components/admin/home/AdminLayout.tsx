import type React from "react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

const AdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  console.log("AdminLayout rendering..."); // Debug log

  return (
    <div className="admin-container flex min-h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          collapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />

        {/* Main Content */}
        <div className={`flex-1 ml-0 ${isCollapsed ? "lg:ml-16" : "lg:ml-64"} transition-all duration-300`}>
          {/* Header */}
          <AdminHeader
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />

          {/* Dynamic Page Content - This will render the current route's component */}
          <div className="p-4 md:p-6 lg:pl-10 lg:pt-4">
            <Outlet />
          </div>
        </div>
      </div>
  );
};

export default AdminLayout;