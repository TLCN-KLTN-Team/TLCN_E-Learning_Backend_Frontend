"use client";

import type React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  BookOpen,
  HelpCircle,
  TrendingUp,
  Users,
  FolderCheck,
  Star,
  Edit,
  Wallet,
  Settings,
  Trash2,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import openEduIcon from "@/assets/open-edu-dark.png";

const menuItems = [
  { name: "Dashboard", icon: LayoutGrid, path: "/teacher/home" },
  {
    name: "Khóa Học Được Gán",
    icon: BookOpen,
    path: "/teacher/assigned-courses",
  },
  {
    name: "Khóa Học Thương Mại",
    icon: HelpCircle,
    path: "/teacher/public-courses",
  },
  { name: "Theo dõi doanh thu", icon: TrendingUp, path: "/teacher/revenue" },
  { name: "Students", icon: Users, path: "/teacher/students" },
  { name: "Orders", icon: FolderCheck, path: "/teacher/orders" },
  { name: "Reviews", icon: Star, path: "/teacher/reviews" },
  { name: "Edit Profile", icon: Edit, path: "/teacher/edit-profile" },
  { name: "Payouts", icon: Wallet, path: "/teacher/payouts" },
  { name: "Settings", icon: Settings, path: "/teacher/settings" },
  { name: "Delete Profile", icon: Trash2, path: "/teacher/delete-profile" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  const location = useLocation();

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center justify-between p-4 border-b border-border">
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
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group relative ${
                  isActive
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
                  className={`w-5 h-5 ${collapsed ? "mx-auto" : "mr-3"} ${
                    isActive ? "text-white" : ""
                  }`}
                />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}

          <button
            className={`flex items-center w-full px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-all duration-200 group mt-4`}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className={`w-5 h-5 ${collapsed ? "mx-auto" : "mr-3"}`} />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
