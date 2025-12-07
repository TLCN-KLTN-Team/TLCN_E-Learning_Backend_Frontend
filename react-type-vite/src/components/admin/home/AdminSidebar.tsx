"use client";

import {
  GraduationCap,
  Home,
  Tv,
  Users,
  Package,
  DollarSign,
  Settings,
  Lock,
  FileText,
  GitBranch,
  ChevronDown,
  LogOut,
  Globe,
  X,
  Building2
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../../styles/admin.css";
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: {
    id: string;
    label: string;
    path: string;
    badge?: string;
  }[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Debug logging
  console.log("AdminSidebar render:", { isSidebarOpen, currentPath: location.pathname });

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Bảng điều khiển",
      icon: Home,
      path: "/admin", // Full path for dashboard
    },
    {
      id: "courses",
      label: "Khóa học",
      icon: Tv,
      path: "/admin/courses", // Full path
    },
    {
      id: "students",
      label: "Học viên",
      icon: GraduationCap,
      path: "/admin/students", // Full path
    },
    {
      id: "instructors",
      label: "Giảng viên",
      icon: Users,
      path: "/admin/instructors", // Full path
    },
    {
      id: "departments",
      label: "Khoa",
      icon: Building2, // Import from lucide-react
      path: "/admin/departments",
    },
    {
      id: "published-courses",
      label: "Duyệt Khóa Học Thương Mại",
      icon: Package, // Import from lucide-react
      path: "/admin/published-courses",
    },
    {
      id: "earnings",
      label: "Doanh thu",
      icon: DollarSign,
      path: "/admin/revenue",
    },
  ];

  const isActive = (path: string) => {
    // Handle both exact matches and dashboard case
    if (path === "/admin") {
      return location.pathname === "/admin" || location.pathname === "/admin/dashboard";
    }
    return location.pathname === path;
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenus((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleMenuClick = (item: MenuItem) => {
    if (item.children) {
      toggleMenu(item.id);
    } else if (item.path) {
      // Close sidebar on mobile after navigation
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isExpanded = expandedMenus.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="mb-1">
        {hasChildren ? (
          <Button
            onClick={() => handleMenuClick(item)}
            className="w-full flex items-center justify-between px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors no-transition"
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}>
            <div className="flex items-center">
              <Icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        ) : (
          <Link
            to={item.path!}
            onClick={() => handleMenuClick(item)}
            className={`no-transition flex items-center px-3 py-3 rounded transition-colors ${
              isActive(item.path!)
                ? "bg-blue-600 text-white font-medium"
                : "text-gray-300 hover:bg-gray-700 hover:text-white"
            }`}
            style={{ textDecoration: "none", display: "flex" }}
          >
            <Icon className="w-5 h-5 mr-3" />
            <span>{item.label}</span>
          </Link>
        )}

        {hasChildren && isExpanded && (
          <div className="ml-8 mt-2 space-y-1">
            {item.children!.map((child) => (
              <div key={child.id}>
                <Link
                  to={child.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`no-transition flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    isActive(child.path)
                      ? "text-blue-400 font-medium"
                      : "text-gray-400 hover:text-white"
                  }`}
                  style={{ textDecoration: "none", display: "flex" }}
                >
                  <span>{child.label}</span>
                  {child.badge && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                      {child.badge}
                    </span>
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden"
          style={{ zIndex: 30 }}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`admin-sidebar w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isSidebarOpen
            ? "translate-x-0 sidebar-open"
            : "-translate-x-full lg:translate-x-0"
        }`}
        style={{
          zIndex: 50,
          backgroundColor: "#111827",
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: "16rem",
        }}
      >
        {/* Navigation */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ position: "relative", zIndex: 51 }}
        >
          <div className="p-4 space-y-1">
            {/* Header with Close Button */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <Link to="/admin" className="no-transition flex items-center">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center mr-3">
                      <span className="text-white font-bold text-sm">e</span>
                    </div>
                    <span className="text-xl font-bold text-white">
                      OpenEdu
                    </span>
                  </div>
                </Link>
                {/* Mobile Close Button */}
                <Button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-1 text-gray-400 hover:text-white transition-colors"
                  style={{ zIndex: 52 }}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Dynamic Menu Items */}
            <div className="space-y-1">{menuItems.map(renderMenuItem)}</div>

            {/* Footer */}
            <div className="px-4 pb-4 mt-8 pt-6 border-t border-gray-700">
              <div className="flex justify-between items-center mb-3">
                <Link
                  to="/admin/settings"
                  className="no-transition text-gray-400 hover:text-white transition-colors"
                  title="Cài đặt"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <Link
                  to="/"
                  className="no-transition text-gray-400 hover:text-white transition-colors"
                  title="Trang chủ"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <Globe className="w-5 h-5" />
                </Link>
                <Link
                  to="/login"
                  className="no-transition text-gray-400 hover:text-white transition-colors"
                  title="Đăng xuất"
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setIsSidebarOpen(false);
                    }
                  }}
                >
                  <LogOut className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default AdminSidebar;