"use client";

import {
  BarChart3,
  Building2,
  Users,
  FolderOpen,
  DollarSign,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react";
import type React from "react";

interface SystemAdminSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const SystemAdminSidebar: React.FC<SystemAdminSidebarProps> = ({
  activeSection,
  setActiveSection,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: BarChart3 },
    { id: "training-units", label: "Đơn vị đào tạo", icon: Building2 },
    { id: "accounts", label: "Quản lý tài khoản", icon: Users },
    { id: "categories", label: "Quản lý danh mục", icon: FolderOpen },
    { id: "revenue", label: "Quản lý doanh thu", icon: DollarSign },
    { id: "statistics", label: "Thống kê hệ thống", icon: TrendingUp },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white overflow-y-auto">
      <div className="p-6">
        {/* Logo */}
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-bold mr-3">
            S
          </div>
          <span className="text-xl font-bold">System Admin</span>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <IconComponent className="mr-3 w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg hover:bg-gray-800 transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAdminSidebar;
