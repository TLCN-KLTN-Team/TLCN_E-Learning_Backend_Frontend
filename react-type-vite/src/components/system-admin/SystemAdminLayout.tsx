"use client";

import type React from "react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import SystemAdminSidebar from "./SystemAdminSidebar";
import SystemAdminHeader from "./SystemAdminHeader";
import "../../styles/system-admin.css";
import { useTheme } from "@/context/theme-context";

const SystemAdminLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const theme = useTheme();
  theme.setTheme("light");

  return (
    <div className="flex h-screen bg-gray-50 system-admin">
      <SystemAdminSidebar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col bg-gray-50 transition-all duration-300">
        <SystemAdminHeader
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SystemAdminLayout;
