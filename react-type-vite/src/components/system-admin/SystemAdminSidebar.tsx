"use client";

import { useAuth } from "@/context/auth-context/useAuth";
import {
  BarChart3,
  Building2,
  Users,
  FolderOpen,
  DollarSign,
  LogOut,
  X,
  UserCog,
  Undo2,
  MessageSquare,
} from "lucide-react";
import type React from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/open-edu-light.png";

interface SystemAdminSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SystemAdminSidebar: React.FC<SystemAdminSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      id: "dashboard",
      label: "Tổng quan",
      icon: BarChart3,
      path: "/system-admin",
    },
    {
      id: "training-units",
      label: "Đơn vị đào tạo",
      icon: Building2,
      path: "/system-admin/training-units",
    },
    {
      id: "accounts",
      label: "Quản lý tài khoản",
      icon: Users,
      path: "/system-admin/accounts",
    },
    {
      id: "categories",
      label: "Quản lý danh mục",
      icon: FolderOpen,
      path: "/system-admin/categories",
    },
    {
      id: "revenue",
      label: "Theo dõi doanh thu",
      icon: DollarSign,
      path: "/system-admin/revenue",
    },
    {
      id: "refunds",
      label: "Yêu cầu hoàn tiền",
      icon: Undo2,
      path: "/system-admin/refunds",
    },
    {
      id: "forum",
      label: "Diễn Đàn",
      icon: MessageSquare,
      path: "/forum",
    },
    {
      id: "edit-profile",
      label: "Chỉnh sửa hồ sơ",
      icon: UserCog,
      path: "/system-admin/edit-profile",
    },
  ];

  // Helper function to check if current path matches menu item
  const isActiveItem = (itemPath: string) => {
    if (itemPath === "/system-admin") {
      return (
        location.pathname === "/system-admin" ||
        location.pathname === "/system-admin/dashboard"
      );
    }
    return location.pathname === itemPath;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 bg-gray-900 text-white overflow-y-auto z-50 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 lg:static lg:block`}
      >
        <div className="p-6">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/system-admin"
              className="flex items-center max-w-[140px] lg:max-w-[180px]"
              style={{ textDecoration: "none" }}
            >
              <img
                src={logo}
                alt="OpenEdu - E-Learning Platform"
                className="h-6 lg:h-8 w-auto max-w-full object-contain"
              />
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  onClick={() => {
                    // Close sidebar on mobile after selection
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${isActiveItem(item.path)
                    ? "bg-blue-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                >
                  <IconComponent className="mr-3 w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <div className="flex items-right justify-end">
              <button
                className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
                onClick={logout}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SystemAdminSidebar;
