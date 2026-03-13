import { Bell, Menu } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import AdminProfile from "../shared/AdminProfile";
import { useAuth } from "@/context/auth-context/useAuth";
import * as notificationApi from "@/services/api/notificationApi";

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

            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div
                className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-lg border z-50 max-h-[80vh] flex flex-col"
                ref={notificationRef}
              >
                <div className="p-4 border-b bg-gray-50 rounded-t-lg">
                  <div className="flex justify-between items-center">
                    <h6 className="font-semibold text-gray-800 m-0">
                      System Notifications
                      {unreadCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                          {unreadCount} new
                        </span>
                      )}
                    </h6>
                    <button
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                      onClick={() => {
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, isRead: true }))
                        );
                        setUnreadCount(0);
                      }}
                    >
                      Mark all read
                    </button>
                  </div>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  <ul className="list-none divide-y divide-gray-100 m-0 p-0">
                    {notifications.length === 0 ? (
                      <li className="p-4 text-center text-sm text-gray-500">
                        No notifications
                      </li>
                    ) : (
                      notifications.slice(0, 20).map((notif, idx) => (
                        <li key={notif.id ?? idx}>
                          <div
                            className={`p-4 transition-colors cursor-pointer ${
                              notif.isRead ? "hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-100"
                            }`}
                            onClick={() => {
                              if (!notif.isRead) {
                                setNotifications((prev) =>
                                  prev.map((n, i) =>
                                    i === idx ? { ...n, isRead: true } : n
                                  )
                                );
                                setUnreadCount((prev) => Math.max(0, prev - 1));
                              }
                              if (notif.link) {
                                window.location.href = notif.link;
                              }
                              setIsNotificationOpen(false);
                            }}
                          >
                            <div className="flex items-start">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 mb-2">
                                  {notif.content || notif.message}
                                </p>
                                <div className="flex justify-between items-center">
                                  <small className="text-gray-500">
                                    {notif.createdAt
                                      ? new Date(notif.createdAt).toLocaleString()
                                      : "Just now"}
                                  </small>
                                  {notif.link && (
                                    <span className="text-xs text-blue-600 hover:underline">
                                      View
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            )}
          </button>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
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
