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
  BellRing,
} from "lucide-react";
import "../../../styles/admin.css";
import { useResponsive } from "../../../hooks/useResponsive";
import { useAuth } from "@/context/auth-context/useAuth";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import * as notificationApi from "@/services/api/notificationApi";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMIN_ROUTES } from "@/constants/routes";

import openEduIcon from "@/assets/open-edu-dark.png";

interface AdminHeaderProps {
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

interface Notification {
  id?: string;
  senderId?: string;
  recipientId: string;
  content: string;
  message?: string;
  type: string;
  isRead: boolean;
  createdAt?: string;
  link?: string;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const { isMobile } = useResponsive();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentRole = user?.role || user?.roles?.[0] || "";
  const isExpertView = currentRole === "EXPERT";
  const notificationPagePath = isExpertView
    ? "/expert/notifications"
    : ADMIN_ROUTES.NOTIFICATIONS;
  const dashboardFallbackPath = isExpertView
    ? "/expert/courses"
    : ADMIN_ROUTES.DASHBOARD;

  // Profile menu items for admin
  const profileMenuItems: MenuSection[] = [
    {
      section: "Admin",
      items: [
        { name: "Dashboard", icon: User, href: "/admin/dashboard" },
        { name: "Quản lý thông tin cá nhân", icon: UserCircle, href: "/admin/info" },
      ],
    },
    {
      section: "Notifications",
      items: [
        {
          name: "Thông báo",
          icon: BellRing,
          href: notificationPagePath,
          badge: "New",
        },
      ],
    },
    {
      section: "Account Settings",
      items: [
        {
          name: "Cài đặt tài khoản",
          icon: Settings,
          href: "/admin/settings",
        },
      ],
    },
  ];

  // Generate avatar initials from firstName and lastName
  const getAvatarInitials = (firstName: string, lastName: string): string => {
    const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""
      }`;
    return initials.toUpperCase() || "??";
  };

  // Get full name from firstName and lastName
  const getFullName = (firstName: string, lastName: string): string => {
    return `${firstName || ""} ${lastName || ""}`.trim() || "Admin User";
  };

  const getRoleName = () => {
    // Check singular role first (backend field)
    if (user?.role) {
      if (user.role === "ADMIN") return "Admin";
      return user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase();
    }

    if (!user?.roles || user.roles.length === 0) return "User";
    if (user.roles.includes("ADMIN")) return "Admin";
    const role = user.roles[0]; // Assuming single/primary role
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProfileOpen(false);
    logout();
    toast.success("Đăng xuất thành công!");
  };

  const getNotificationTarget = (notif: Notification) => {
    const fallback = dashboardFallbackPath;
    const rawLink = (notif.link || "").trim();

    if (!rawLink) return fallback;
    if (rawLink.startsWith("http://") || rawLink.startsWith("https://")) {
      return rawLink;
    }

    const normalizedPath = rawLink.startsWith("/") ? rawLink : `/${rawLink}`;
    if (normalizedPath === "/notifications" || normalizedPath === ADMIN_ROUTES.NOTIFICATIONS) {
      return notificationPagePath;
    }

    return normalizedPath;
  };

  const handleOpenNotification = (notif: Notification, idx: number) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((n, i) => (i === idx ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (notif.id && user?.id) {
        notificationApi
          .markNotificationAsRead(notif.id, user.id)
          .catch((err) => console.error("Failed to mark notification as read", err));
      }
    }
    const target = getNotificationTarget(notif);
    if (target.startsWith("http://") || target.startsWith("https://")) {
      window.location.assign(target);
    } else {
      navigate(target);
    }
    setIsNotificationOpen(false);
  };

  useEffect(() => {
    if (!user?.id) return;

    notificationApi
      .getUserNotifications(user.id)
      .then((res) => {
        // @ts-ignore
        const data: Notification[] = res.data?.result || res.data || [];
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      })
      .catch((err) => console.error("Failed to fetch notifications", err));

    const eventSource = notificationApi.subscribeToNotifications(user.id);

    const pushNotification = (raw: any) => {
      const notifObj: Notification = {
        recipientId: raw.userId || user.id,
        content: raw.message || raw.content || "",
        type: raw.type || "NOTIFICATION",
        isRead: false,
        createdAt: new Date().toISOString(),
        link: raw.link,
      };
      setNotifications((prev) => [notifObj, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    const handleEvent = (event: MessageEvent) => {
      try {
        const payload = JSON.parse(event.data);
        pushNotification(payload);
      } catch {
      }
    };

    const eventTypes = [
      "NOTIFICATION",
      "REFUND_REQUESTED",
      "REFUND_APPROVED",
      "PAYMENT_SUCCESS",
      "COURSE_APPROVED",
      "COURSE_REJECTED",
      "ASSIGNMENT",
      "message",
    ];

    eventTypes.forEach((type) => {
      eventSource.addEventListener(type, handleEvent as EventListener);
    });

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user?.id]);

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
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  setIsProfileOpen(false);
                }}
                className="relative p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
              >
                <Bell className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div
                  className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] flex flex-col"
                  ref={modalRef}
                >
                  <div className="p-4 border-b border-gray-200 flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <h6 className="font-semibold m-0 text-gray-900">
                        Thông báo{" "}
                        {unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                            {unreadCount} mới
                          </span>
                        )}
                      </h6>
                      <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => {
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, isRead: true }))
                          );
                          setUnreadCount(0);

                          if (user?.id) {
                            notificationApi
                              .markAllNotificationsAsRead(user.id)
                              .catch((err) => console.error("Failed to mark all notifications as read", err));
                          }
                        }}
                      >
                        Đọc tất cả
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1">
                    <ul className="list-none m-0 p-0">
                      {notifications.length === 0 ? (
                        <li className="p-4 text-center text-gray-500 text-sm">
                          Chưa có thông báo
                        </li>
                      ) : (
                        notifications.slice(0, 20).map((notif, idx) => (
                          <li key={notif.id ?? idx}>
                            <div
                              className={`p-3 border-b border-gray-100 hover:bg-gray-50 flex cursor-pointer ${
                                !notif.isRead ? "bg-blue-50" : ""
                              }`}
                              onClick={() => handleOpenNotification(notif, idx)}
                            >
                              <div className="mr-3 flex-shrink-0">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <BellRing size={20} />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm m-0 text-gray-800 break-words">
                                  {notif.content || notif.message}
                                </p>
                                <div className="flex justify-between items-center mt-1">
                                  <small className="text-gray-500">
                                    {notif.createdAt
                                      ? new Date(notif.createdAt).toLocaleString("vi-VN")
                                      : "Vừa xong"}
                                  </small>
                                  {notif.link && (
                                    <button
                                      type="button"
                                      className="text-xs text-blue-600 underline ml-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenNotification(notif, idx);
                                      }}
                                    >
                                      Xem
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div className="p-3 text-center border-t border-gray-200 flex-shrink-0">
                    <button
                      className="text-blue-600 hover:underline text-sm"
                      onClick={() => {
                          navigate(notificationPagePath, { state: { background: location } });
                        setIsNotificationOpen(false);
                      }}
                    >
                      Xem tất cả thông báo
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
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
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
                      <div className="text-xs text-gray-500">{getRoleName()}</div>
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
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
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
                          <div className="text-xs text-gray-400">
                            {getRoleName()}
                          </div>
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
                              onClick={(event) => {
                                if (item.href === notificationPagePath) {
                                  event.preventDefault();
                                  navigate(notificationPagePath, { state: { background: location } });
                                }
                                setIsProfileOpen(false);
                              }}
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

export default AdminHeader;
