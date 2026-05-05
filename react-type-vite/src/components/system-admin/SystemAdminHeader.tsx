import { Bell, Menu } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import AdminProfile from "../shared/AdminProfile";
import { useAuth } from "@/context/auth-context/useAuth";
import * as notificationApi from "@/services/api/notificationApi";
import { useLocation, useNavigate } from "react-router-dom";
import { SYSTEM_ADMIN_ROUTES } from "@/constants/routes";

interface SystemAdminHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
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

const SystemAdminHeader: React.FC<SystemAdminHeaderProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const { user } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const getNotificationTarget = (notif: Notification) => {
    const fallback = SYSTEM_ADMIN_ROUTES.DASHBOARD;
    const rawLink = (notif.link || "").trim();

    if (!rawLink) return fallback;
    if (rawLink.startsWith("http://") || rawLink.startsWith("https://")) {
      return rawLink;
    }

    const normalizedPath = rawLink.startsWith("/") ? rawLink : `/${rawLink}`;
    if (normalizedPath === "/notifications" || normalizedPath === "/admin/notifications") {
      return SYSTEM_ADMIN_ROUTES.NOTIFICATIONS;
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

  const getAvatarInitials = () => {
    if (!user) return "SA";
    const firstName = user.firstName || "";
    const lastName = user.lastName || "";
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "SA";
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
        // Ignore non-JSON events (e.g. initial connected ping)
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
      const target = event.target as HTMLDivElement;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* System Admin Title */}
          <h1 className="text-lg md:text-xl font-bold text-gray-900">
            System Admin
          </h1>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
              aria-label="Open notifications"
              onClick={() => {
                setIsNotificationOpen(!isNotificationOpen);
                setIsProfileOpen(false);
              }}
            >
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 min-w-4 px-1 md:h-5 md:min-w-5 flex items-center justify-center text-[10px] md:text-xs">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <h6 className="font-semibold text-gray-900 m-0">
                      Thông báo hệ thống
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
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
                      <li className="p-4 text-center text-sm text-gray-500">
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
                                <Bell className="w-5 h-5" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800 break-words m-0">
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
                      navigate(SYSTEM_ADMIN_ROUTES.NOTIFICATIONS, { state: { background: location } });
                      setIsNotificationOpen(false);
                    }}
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile */}
                              onClick={(event) => {
                                if (item.href === SYSTEM_ADMIN_ROUTES.NOTIFICATIONS) {
                                  event.preventDefault();
                                  navigate(SYSTEM_ADMIN_ROUTES.NOTIFICATIONS, { state: { background: location } });
                                }
                                setIsProfileOpen(false);
                              }}
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden p-0 ring-2 ring-transparent hover:ring-blue-200 transition-all"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="System Admin Profile"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs md:text-sm">
                  {getAvatarInitials()}
                </div>
              )}
            </button>

            {/* Profile Dropdown */}
            {isProfileOpen && <AdminProfile />}
          </div>
        </div>
      </div>
    </header>
  );
};

export default SystemAdminHeader;
