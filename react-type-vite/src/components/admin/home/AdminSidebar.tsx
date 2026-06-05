"use client";

import {
  GraduationCap,
  Home,
  Users,
  DollarSign,
  LogOut,
  Building2,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type React from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import "../../../styles/admin.css";
import { useAuth } from "@/context/auth-context/useAuth";
import { getAuthInfo } from "@/utils/auth.utils";
import openEduIcon from "@/assets/open-edu-dark.png";

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const rawGroups = [
  {
    group: "Tổng quan",
    items: [
      { id: "dashboard", name: "Bảng điều khiển", icon: Home, path: "/admin" },
    ]
  },
  {
    group: "Người dùng",
    items: [
      { id: "students", name: "Sinh viên", icon: GraduationCap, path: "/admin/students" },
      { id: "instructors", name: "Giảng viên", icon: Users, path: "/admin/instructors" },
      { id: "experts", name: "Chuyên Gia", icon: Users, path: "/admin/experts" },
    ]
  },
  {
    group: "Đào tạo",
    items: [
      { id: "departments", name: "Khoa", icon: Building2, path: "/admin/departments" },
    ]
  },
  {
    group: "Tài chính",
    items: [
      { id: "earnings", name: "Doanh thu", icon: DollarSign, path: "/admin/revenue" },
    ]
  }
];

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
  collapsed,
  onToggleCollapse
}) => {
  const location = useLocation();
  const { logout } = useAuth();
  const authInfo = getAuthInfo();
  const role = authInfo?.role;

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    toast.success("Đăng xuất thành công!");
  };

  const groupedMenuItems = rawGroups.map(group => {
    let filteredItems = group.items;
    if (role === 'EXPERT') {
      filteredItems = filteredItems.filter(item => item.id === 'published-courses');
    } else if (role === 'ADMIN') {
      filteredItems = filteredItems.filter(item => item.id !== 'published-courses');
    }
    return {
      ...group,
      items: filteredItems
    }
  }).filter(group => group.items.length > 0);

  const isActive = (path: string) => {
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/dashboard";
    }
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed lg:fixed inset-y-0 left-0 z-50 bg-background border-r border-border transform transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${collapsed ? "lg:w-16 w-64" : "w-64"}`}>
        <div className="flex items-center justify-between px-4 border-b border-border h-[73px]">
          {!collapsed && (
            <div className="flex items-center space-x-2 overflow-hidden">
              <Link to="/admin">
                <img src={openEduIcon} alt="OpenEdu" className="h-8 w-auto min-w-[32px]" />
              </Link>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-3 overflow-y-auto overflow-x-hidden">
          <div className="space-y-5">
            {groupedMenuItems.map((group, groupIndex) => (
              <div key={group.group} className="space-y-2">
                {!collapsed && (
                  <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {group.group}
                  </p>
                )}

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActive(item.path);

                    return (
                      <Link
                        key={item.id}
                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative ${active
                          ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                          }`}
                        to={item.path}
                        title={collapsed ? item.name : undefined}
                        onClick={() => {
                          if (window.innerWidth < 1024) setIsSidebarOpen(false);
                        }}
                      >
                        {active && !collapsed && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-800 rounded-r-full" />
                        )}
                        <item.icon
                          className={`w-5 h-5 ${collapsed ? "mx-auto" : "mr-3"} ${active ? "text-white" : "text-gray-500 group-hover:text-gray-900"}`}
                        />
                        {!collapsed && <span className="leading-tight whitespace-nowrap">{item.name}</span>}
                      </Link>
                    );
                  })}
                </div>

                {!collapsed && groupIndex < groupedMenuItems.length - 1 && (
                  <div className="border-t border-gray-200 pt-2" />
                )}
              </div>
            ))}

            <div className="border-t border-gray-200 pt-4">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-all duration-200 group mt-1"
                title={collapsed ? "Đăng xuất" : undefined}
              >
                <LogOut className={`w-5 h-5 ${collapsed ? "mx-auto" : "mr-3"} group-hover:text-red-600`} />
                {!collapsed && <span className="whitespace-nowrap">Đăng xuất</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;