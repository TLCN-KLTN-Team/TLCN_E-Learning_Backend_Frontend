"use client";

import {
  GraduationCap,
  Home,
  Tv,
  Users,
  MessageSquare,
  DollarSign,
  Settings,
  Lock,
  FileText,
  GitBranch,
  ChevronDown,
  LogOut,
  Globe,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../../styles/admin.css";

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
  console.log("AdminSidebar render:", { isSidebarOpen, expandedMenus });

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
      path: "/admin",
    },
    {
      id: "courses",
      label: "Courses",
      icon: Tv,
      children: [
        { id: "all-courses", label: "All Courses", path: "/admin/courses" },
        {
          id: "course-category",
          label: "Course Category",
          path: "/admin/course-category",
        },
        {
          id: "course-detail",
          label: "Course Detail",
          path: "/admin/course-detail",
        },
      ],
    },
    {
      id: "students",
      label: "Students",
      icon: GraduationCap,
      path: "/admin/students",
    },
    {
      id: "instructors",
      label: "Instructors",
      icon: Users,
      children: [
        {
          id: "all-instructors",
          label: "Instructors",
          path: "/admin/instructors",
        },
        {
          id: "instructor-detail",
          label: "Instructor Detail",
          path: "/admin/instructor-detail",
        },
        {
          id: "instructor-requests",
          label: "Instructor requests",
          path: "/admin/instructor-requests",
          badge: "2",
        },
      ],
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: MessageSquare,
      path: "/admin/reviews",
    },
    {
      id: "earnings",
      label: "Earnings",
      icon: DollarSign,
      path: "/admin/earnings",
    },
    {
      id: "settings",
      label: "Admin Settings",
      icon: Settings,
      path: "/admin/settings",
    },
    {
      id: "authentication",
      label: "Authentication",
      icon: Lock,
      children: [
        { id: "sign-up", label: "Sign Up", path: "/register" },
        { id: "sign-in", label: "Sign In", path: "/login" },
        {
          id: "forgot-password",
          label: "Forgot Password",
          path: "/forgot-password",
        },
        { id: "error-404", label: "Error 404", path: "/404" },
      ],
    },
    {
      id: "documentation",
      label: "Documentation",
      icon: FileText,
      path: "/admin/docs",
    },
    {
      id: "changelog",
      label: "Changelog",
      icon: GitBranch,
      path: "/admin/changelog",
    },
  ];

  const isActive = (path: string) => location.pathname === path;

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
          <button
            onClick={() => handleMenuClick(item)}
            className="w-full flex items-center justify-between px-3 py-3 text-gray-300 hover:bg-gray-700 hover:text-white rounded transition-colors no-transition"
            style={{
              backgroundColor: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            <div className="flex items-center">
              <Icon className="w-5 h-5 mr-3" />
              <span>{item.label}</span>
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
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
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-1 text-gray-400 hover:text-white transition-colors"
                  style={{ zIndex: 52 }}
                >
                  <X className="w-5 h-5" />
                </button>
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
                  title="Settings"
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
                  title="Home"
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
                  title="Sign out"
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
