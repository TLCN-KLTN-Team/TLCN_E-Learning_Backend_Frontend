"use client";

import type React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  HelpCircle,
  TrendingUp,
  LogOut,
  ChevronLeft,
  ChevronRight,
  EarthLock,
  Box,
  ShoppingBag,
  FileCheck2,
  Sparkles,
  
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth-context/useAuth";
import openEduIcon from "@/assets/open-edu-dark.png";

const groupedMenuItems = [
  {
    group: "Học tập",
    items: [
      {
        name: "Khóa học nội bộ",
        icon: BookOpen,
        path: "/teacher/assigned-courses",
      },
      {
        name: "Khóa học thương mại",
        icon: HelpCircle,
        path: "/teacher/public-courses",
      },
      {
        name: "Ngân hàng câu hỏi",
        icon: Box,
        path: "/teacher/question-bank",
      },
      {
        name: "Tạo câu hỏi bằng AI",
        icon: Sparkles,
        path: "/teacher/generate-questions",
      },
      {
        name: "Không gian lớp học",
        icon: EarthLock,
        path: "/workspaces",
      },
    ],
  },
  {
    group: "Vận hành",
    items: [
      { name: "Theo dõi doanh thu", icon: TrendingUp, path: "/teacher/revenue" },
      { name: "Danh sách đơn hàng", icon: ShoppingBag, path: "/teacher/orders" },
      {
        name: "Vấn đáp quy đổi",
        icon: FileCheck2,
        path: "/teacher/credit-transfers",
      },
    ],
  },
  // Tiện ích group removed per user request
]

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    toast.success("Đăng xuất thành công!");
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between px-4 border-b border-border h-[73px]">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <img src={openEduIcon} alt="OpenEdu" className="h-8 w-auto" />
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md hover:bg-accent transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="flex-1 p-3">
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
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.name}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative ${isActive
                        ? "bg-blue-600 text-white shadow-md hover:bg-blue-700"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      to={item.path}
                      title={collapsed ? item.name : undefined}
                    >
                      {isActive && !collapsed && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-800 rounded-r-full" />
                      )}
                      <item.icon
                        className={`w-5 h-5 ${collapsed ? "mx-auto" : "mr-3"} ${isActive ? "text-white" : ""}`}
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
              className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-all duration-200 group"
              title={collapsed ? "Đăng xuất" : undefined}
            >
              <LogOut className={`w-5 h-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
              {!collapsed && <span>Đăng xuất</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;