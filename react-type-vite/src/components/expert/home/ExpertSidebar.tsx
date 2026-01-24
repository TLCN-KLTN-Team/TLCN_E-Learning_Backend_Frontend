"use client";

import {
    Package,
    LogOut,
    Globe,
    X,
    Settings,
    Tv
} from "lucide-react";
import type React from "react";
// import { useState } from "react"; // Removed unused import
import { Link, useLocation } from "react-router-dom";
import "../../../styles/admin.css"; // Reuse admin styles
import { Button } from '@/components/ui/button';
import logo from '@/assets/open-edu-light.png';

interface ExpertSidebarProps {
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

const ExpertSidebar: React.FC<ExpertSidebarProps> = ({
    isSidebarOpen,
    setIsSidebarOpen,
}) => {
    const location = useLocation();

    // Expert specific menu items
    const menuItems: MenuItem[] = [
        {
            id: "courses",
            label: "Khóa học",
            icon: Tv,
            path: "/expert/courses",
        },
        {
            id: "published-courses",
            label: "Duyệt Khóa Học Thương Mại",
            icon: Package,
            path: "/expert/published-courses",
        },
        // Add other Expert specific menus here if needed in future
    ];

    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };

    const handleMenuClick = (item: MenuItem) => {
        if (item.children) {
            // Logic for children (if implemented later)
        } else if (item.path) {
            // Close sidebar on mobile after navigation
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            }
        }
    };

    const renderMenuItem = (item: MenuItem) => {
        const Icon = item.icon;
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
                    </Button>
                ) : (
                    <Link
                        to={item.path!}
                        onClick={() => handleMenuClick(item)}
                        className={`no-transition flex items-center px-3 py-3 rounded transition-colors ${isActive(item.path!)
                            ? "bg-blue-600 text-white font-medium"
                            : "text-gray-300 hover:bg-gray-700 hover:text-white"
                            }`}
                        style={{ textDecoration: "none", display: "flex" }}
                    >
                        <Icon className="w-5 h-5 mr-3" />
                        <span>{item.label}</span>
                    </Link>
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
                className={`admin-sidebar w-64 bg-gray-900 text-white flex flex-col h-screen fixed left-0 top-0 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isSidebarOpen
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
                                <div className="flex items-center justify-between h-16 lg:h-20">
                                    {/* Logo */}
                                    <Link
                                        to="/"
                                        className="flex items-center max-w-[140px] lg:max-w-[180px] decoration-none no-hover-effect"
                                        style={{ textDecoration: "none" }}
                                    >
                                        <img
                                            src={logo}
                                            alt="OpenEdu - E-Learning Platform"
                                            className="h-6 lg:h-8 w-auto max-w-full object-contain"
                                        />
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
                    {/* Ensure all containers are closed before ending nav */}
                </div>
            </nav>
        </>
    );
};

export default ExpertSidebar;
