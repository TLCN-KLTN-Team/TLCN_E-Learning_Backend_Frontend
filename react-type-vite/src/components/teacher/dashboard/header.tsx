"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Bell,
  Menu,
  User,
  Settings,
  LogOut,
  UserCircle,
  CreditCard,
  BellDot,
  BellRing,
} from "lucide-react";
import "../../../styles/admin.css";
import { useResponsive } from "../../../hooks/useResponsive";
import { useAuth } from "@/context/auth-context/useAuth";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";

import openEduIcon from "@/assets/open-edu-dark.png";

interface HeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

interface MenuItem {
  name: string;
  icon: any;
  href: string;
  badge?: string;
}

interface MenuSection {
  section: string;
  items: MenuItem[];
}

const Header: React.FC<HeaderProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();
  const { user, logout } = useAuth();

  const profileMenuItems: MenuSection[] = [
    {
      section: "Teacher",
      items: [
        { name: "Dashboard", icon: User, href: "/teacher/dashboard" },
        { name: "Quản lý thông tin cá nhân", icon: UserCircle, href: "/teacher/info" },
      ],
    },
    {
      section: "Notifications",
      items: [
        {
          name: "Thông báo",
          icon: BellRing,
          href: "/teacher/notifications",
          badge: "New",
        },
        {
          name: "Tin nhắn",
          icon: BellDot,
          href: "/teacher/messages",
          badge: "5",
        },
      ],
    },
    {
      section: "Account Settings",
      items: [
        {
          name: "Account Settings",
          icon: Settings,
          href: "/teacher/settings",
        },
        {
          name: "Payment Methods",
          icon: CreditCard,
          href: "/teacher/payments",
        },
      ],
    },
    // {
    //   section: "Other",
    //   items: [
    //     {
    //       name: "Language",
    //       icon: Globe,
    //       href: "/teacher/language",
    //       badge: "English",
    //     },
    //     { name: "Help & Support", icon: HelpCircle, href: "/teacher/help" },
    //   ],
    // },
  ];

  // Generate avatar initials from firstName and lastName
  const getAvatarInitials = (firstName: string, lastName: string): string => {
    const initials = `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
    }`;
    return initials.toUpperCase() || "??";
  };

  // Get full name from firstName and lastName
  const getFullName = (firstName: string, lastName: string): string => {
    return `${firstName || ""} ${lastName || ""}`.trim() || "Teacher User";
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProfileOpen(false);
    logout();
    toast.success("Đăng xuất thành công!");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Handle notification dropdown
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }

      // Handle profile dropdown
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotificationOpen, isProfileOpen]);

  return (
    <nav className="bg-white border-b border-gray-200 py-2 md:py-4.5">
      <div className="container-fluid px-4 md:px-6">
        <div className="flex items-center justify-between w-full">
          {/* Left side - Mobile logo and sidebar toggle */}
          <div className="flex items-center">
            {isMobile && (
              <div className="flex items-center lg:hidden">
                <img
                  src={openEduIcon}
                  alt="OpenEdu"
                  className="h-6 w-6 md:h-8 mr-3 md:mr-4"
                />
              </div>
            )}

            {/* Sidebar toggle */}
            <div className="lg:hidden">
              <Button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none"
                type="button"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Empty space for layout balance */}
          <div className="flex-1"></div>

          {/* Right side - Notifications and Profile */}
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Notifications */}
            <div className="relative">
              <Button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              </Button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-lg border z-50"
                  ref={modalRef}
                >
                  <div className="p-4 border-b bg-transparent">
                    <div className="flex justify-between items-center">
                      <h6 className="font-semibold m-0">
                        Notifications{" "}
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                          2 new
                        </span>
                      </h6>
                      <button className="text-sm text-blue-600 hover:underline">
                        Clear all
                      </button>
                    </div>
                  </div>
                  <div className="p-0">
                    <ul className="list-none">
                      {/* Notification items */}
                      <li>
                        <div className="p-3 border-b hover:bg-gray-50 flex">
                          <div className="mr-3">
                            <img
                              src="/placeholder.svg?height=40&width=40&text=JW"
                              alt="Avatar"
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div>
                            <p className="text-sm m-0">
                              Congratulate <strong>Joan Wallace</strong> for
                              graduating from{" "}
                              <strong>Microverse university</strong>
                            </p>
                            <span className="text-xs text-blue-600 underline">
                              Say congrats
                            </span>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="p-3 border-b hover:bg-gray-50 flex">
                          <div className="mr-3">
                            <img
                              src="/placeholder.svg?height=40&width=40&text=LL"
                              alt="Avatar"
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div>
                            <h6 className="text-sm font-semibold mb-1">
                              Larry Lawson Added a new course
                            </h6>
                            <p className="text-xs text-gray-600 m-0">
                              What's new! Find out about new features
                            </p>
                            <span className="text-xs text-blue-600 underline">
                              View detail
                            </span>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="p-3 border-b hover:bg-gray-50 flex">
                          <div className="mr-3">
                            <img
                              src="/placeholder.svg?height=40&width=40&text=NR"
                              alt="Avatar"
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div>
                            <h6 className="text-sm font-semibold mb-1">
                              New request to apply for Instructor
                            </h6>
                            <span className="text-xs text-blue-600 underline">
                              View detail
                            </span>
                          </div>
                        </div>
                      </li>
                      <li>
                        <div className="p-3 border-b hover:bg-gray-50 flex">
                          <div className="mr-3">
                            <img
                              src="/placeholder.svg?height=40&width=40&text=UP"
                              alt="Avatar"
                              className="w-10 h-10 rounded-full"
                            />
                          </div>
                          <div>
                            <h6 className="text-sm font-semibold mb-1">
                              Update v2.3 completed successfully
                            </h6>
                            <p className="text-xs text-gray-600 m-0">
                              What's new! Find out about new features
                            </p>
                            <small className="text-gray-600">5 min ago</small>
                          </div>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 text-center border-t bg-transparent relative">
                    <button className="text-blue-600 hover:underline">
                      See all incoming activity
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown - Updated */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-medium text-sm">
                      {user.avatar ? (
                        <img
                          src={
                            user.avatar instanceof File
                              ? URL.createObjectURL(user.avatar)
                              : user.avatar
                          }
                          alt={getFullName(user.firstName, user.lastName)}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getAvatarInitials(user.firstName, user.lastName)
                      )}
                    </div>
                    {/* User Info - Hidden on mobile */}
                    <div className="text-left hidden md:block">
                      <div className="text-sm font-medium text-gray-900">
                        {getFullName(user.firstName, user.lastName)}
                      </div>
                      <div className="text-xs text-gray-500">Teacher</div>
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 py-2 z-50">
                    {/* User Header */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-medium">
                          {user.avatar ? (
                            <img
                              src={
                                user.avatar instanceof File
                                  ? URL.createObjectURL(user.avatar)
                                  : user.avatar
                              }
                              alt={getFullName(user.firstName, user.lastName)}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            getAvatarInitials(user.firstName, user.lastName)
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-purple-600">
                            {getFullName(user.firstName, user.lastName)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                          <div className="text-xs text-gray-400">Teacher</div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="max-h-96 overflow-y-auto">
                      {profileMenuItems.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          {section.items.map((item) => (
                            <a
                              key={item.name}
                              href={item.href}
                              className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors text-sm group text-gray-700"
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <div className="flex items-center space-x-3">
                                <item.icon
                                  size={16}
                                  className="text-gray-500 group-hover:opacity-80"
                                />
                                <span>{item.name}</span>
                              </div>
                              {item.badge && (
                                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                  {item.badge}
                                </span>
                              )}
                            </a>
                          ))}
                          {sectionIndex < profileMenuItems.length - 1 && (
                            <div className="my-1 border-t border-gray-200"></div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-50 transition-colors text-sm text-red-600"
                      >
                        <LogOut size={16} />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Fallback profile button if no user
              <div className="w-10 h-10 rounded-full overflow-hidden p-0">
                <img
                  src="/placeholder.svg?height=40&width=40&text=LF"
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
