"use client";

import {
    Package,
    LogOut,
    X,
    Tv,
    BookOpen,
    CheckCircle,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import type React from "react";
import { Link, useLocation } from "react-router-dom";
import "../../../styles/admin.css"; // Reuse admin styles
import { useAuth } from "@/context/auth-context/useAuth";
import { toast } from "react-toastify";

// Note: Using dark logo for light background
import openEduIcon from "@/assets/open-edu-dark.png";

interface ExpertSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    collapsed?: boolean;
    onToggleCollapse?: () => void;
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

interface MenuGroup {
    group?: string;
    items: MenuItem[];
}

const ExpertSidebar: React.FC<ExpertSidebarProps> = ({
    isSidebarOpen,
    setIsSidebarOpen,
    collapsed = false,
    onToggleCollapse,
}) => {
    const location = useLocation();
    const { logout } = useAuth();

    // Expert specific menu items grouped
    const menuGroups: MenuGroup[] = [
        {
            group: "Đào tạo",
            items: [
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
                {
                    id: "equivalent-courses-list",
                    label: "Quản lý Quy đổi",
                    icon: BookOpen,
                    path: "/expert/equivalent-courses",
                },
                {
                    id: "credit-transfers",
                    label: "Phê duyệt Tín chỉ",
                    icon: CheckCircle,
                    path: "/expert/credit-transfers",
                },
            ]
        }
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

    const handleLogout = (e: React.MouseEvent) => {
        e.preventDefault();
        logout();
        toast.success("Đăng xuất thành công!");
        if (window.innerWidth < 1024) {
            setIsSidebarOpen(false);
        }
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed lg:fixed inset-y-0 left-0 z-50 bg-background border-r border-border transform transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${collapsed ? "lg:w-16 w-72" : "w-72"}`}>
                <div className="flex items-center justify-between px-4 border-b border-border h-[73px]">
                    {!collapsed && (
                        <div className="flex items-center space-x-2 overflow-hidden">
                            <Link to="/expert">
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

                {/* Navigation Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col pt-4">
                    <div className="px-3 space-y-6">
                        {menuGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="space-y-1">
                                {group.group && !collapsed && (
                                    <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 truncate">
                                        {group.group}
                                    </h3>
                                )}
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = item.path ? isActive(item.path) : false;

                                    return (
                                        <div key={item.id}>
                                            <Link
                                                to={item.path!}
                                                onClick={() => handleMenuClick(item)}
                                                title={collapsed ? item.label : undefined}
                                                className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${active
                                                    ? "bg-blue-600 text-white font-medium shadow-sm"
                                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                                    }`}
                                            >
                                                <Icon
                                                    className={`w-5 h-5 flex-shrink-0 ${collapsed ? "mx-auto" : "mr-3"} ${active ? "text-white" : "text-gray-500 group-hover:text-gray-900"
                                                        }`}
                                                />
                                                {!collapsed && (
                                                    <span className="leading-tight whitespace-nowrap">{item.label}</span>
                                                )}
                                                {active && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full lg:hidden" />
                                                )}
                                            </Link>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-200 bg-gray-50/50 mt-6">
                        <div className="space-y-1">
                            <button
                                onClick={handleLogout}
                                className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-red-600 rounded-lg transition-all duration-200 group mt-1"
                                title={collapsed ? "Đăng xuất" : undefined}
                            >
                                <LogOut className={`w-5 h-5 ${collapsed ? "mx-auto" : "mr-3"} group-hover:text-red-600`} />
                                {!collapsed && <span className="truncate">Đăng xuất</span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ExpertSidebar;
