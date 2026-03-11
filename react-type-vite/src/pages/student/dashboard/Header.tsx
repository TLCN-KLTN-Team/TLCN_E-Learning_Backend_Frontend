import { getAvartarFromName } from "@/utils/callApiUtils";
import { Bell, ChevronDown, MessageCircleMore, BellRing } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import uteLogoDark from "../../../assets/open-edu-dark.png";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context/useAuth";
import * as notificationApi from "@/services/api/notificationApi";
import { toast } from "react-toastify";
import { PUBLIC_ROUTES, STUDENT_ROUTES } from "@/constants/routes";

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

const profileMenu = [
  { name: "Hồ sơ", href: STUDENT_ROUTES.EDIT_PROFILE },
  { name: "Về trang home", href: PUBLIC_ROUTES.HOME },
];

const Header = () => {
  const [isShowProfile, setIsShowProfile] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      // 1. Fetch notification history
      notificationApi
        .getUserNotifications(user.id)
        .then((res) => {
          // @ts-ignore
          const data = res.data?.result || res.data || [];
          // @ts-ignore
          setNotifications(data);
          // @ts-ignore
          setUnreadCount(data.filter((n) => !n.isRead).length);
        })
        .catch((err) => console.error("Failed to fetch notifications", err));

      // 2. Subscribe to SSE notifications
      const eventSource = notificationApi.subscribeToNotifications(user.id);

      eventSource.onopen = () => console.log("SSE Connected");

      // Listen for ENROLLMENT type notifications
      eventSource.addEventListener("ENROLLMENT", (event) => {
        const newNotif = JSON.parse(event.data);
        const notifObj: Notification = {
          recipientId: newNotif.userId,
          content: newNotif.message,
          type: newNotif.type,
          isRead: false,
          createdAt: new Date().toISOString(),
          link: newNotif.link,
        };

        setNotifications((prev) => [notifObj, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info(`Thông báo mới: ${notifObj.content}`);
      });

      // Listen for general NOTIFICATION type
      eventSource.addEventListener("NOTIFICATION", (event) => {
        const newNotif = JSON.parse(event.data);
        const notifObj: Notification = {
          recipientId: newNotif.userId,
          content: newNotif.message,
          type: newNotif.type,
          isRead: false,
          createdAt: new Date().toISOString(),
          link: newNotif.link,
        };
        setNotifications((prev) => [notifObj, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info(`Thông báo mới: ${notifObj.content}`);
      });

      eventSource.onerror = (err) => {
        console.error("SSE Error", err);
        eventSource.close();
      };

      return () => {
        eventSource.close();
      };
    }
  }, [user?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
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
    <header className="student-dashboard-header">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink
            className="flex items-center h-20 w-32"
            to={STUDENT_ROUTES.DASHBOARD}
          >
            <img
              src={uteLogoDark}
              alt=""
              className="w-full h-full object-contain"
            />
          </NavLink>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to={PUBLIC_ROUTES.HOME}
              className="student-dashboard-nav-link px-3 py-2 text-md font-bold"
            >
              Trang chủ
            </Link>
            <span className="student-dashboard-nav-active px-3 py-2 text-md font-bold">
              <Link
                to={STUDENT_ROUTES.DASHBOARD}
                className="student-dashboard-nav-link px-3 py-2 text-md font-bold"
              >
                Khóa học của tôi
              </Link>
            </span>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                className="student-dashboard-icon-btn relative"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-lg border z-50 max-h-[80vh] flex flex-col">
                  <div className="p-4 border-b bg-transparent flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <h6 className="font-semibold m-0">
                        Thông báo{" "}
                        {unreadCount > 0 && (
                          <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                            {unreadCount} mới
                          </span>
                        )}
                      </h6>
                      <button className="text-sm text-blue-600 hover:underline">
                        Đánh dấu đã đọc
                      </button>
                    </div>
                  </div>
                  <div className="p-0 overflow-y-auto flex-1">
                    <ul className="list-none">
                      {notifications.length === 0 ? (
                        <li className="p-4 text-center text-gray-500">
                          Không có thông báo
                        </li>
                      ) : (
                        notifications.map((notif, idx) => (
                          <li key={idx}>
                            <div
                              className={`p-3 border-b hover:bg-gray-50 flex ${!notif.isRead ? "bg-blue-50" : ""}`}
                            >
                              <div className="mr-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                  <BellRing size={20} />
                                </div>
                              </div>
                              <div>
                                <p className="text-sm m-0 text-gray-800">
                                  {notif.content}
                                </p>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs text-gray-500">
                                    {notif.createdAt
                                      ? new Date(
                                          notif.createdAt,
                                        ).toLocaleString()
                                      : "Vừa xong"}
                                  </span>
                                  {notif.link && (
                                    <a
                                      href={notif.link}
                                      className="text-xs text-blue-600 underline ml-2"
                                    >
                                      Xem
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                  <div className="p-3 text-center border-t bg-transparent relative flex-shrink-0">
                    <button className="text-blue-600 hover:underline">
                      Xem tất cả thông báo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <span
              className="student-dashboard-icon-btn"
              onClick={() => {
                navigate("/workspaces");
              }}
            >
              <MessageCircleMore className="w-5 h-5" />
            </span>
            <div className="flex items-center relative">
              <button
                className="w-8 h-8 rounded-full bg-bs-primary text-white flex items-center justify-center font-medium text-sm"
                onClick={() => setIsShowProfile(!isShowProfile)}
              >
                <span className="w-full h-full rounded-full object-cover overflow-hidden">
                  <img src={getAvartarFromName("Tran Trung")} alt="avatar" />
                </span>
              </button>
              <span className="student-dashboard-icon-btn">
                <ChevronDown className="w-5 h-5 font-bold" />
              </span>

              {/* Profile Dropdown */}
              {isShowProfile && (
                <div className="relative">
                  <div className="absolute dropdown-menu right-0 mt-4 w-40 rounded-lg shadow-2xl py-2">
                    {profileMenu.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsShowProfile(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    <div
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                      onClick={logout}
                    >
                      Đăng xuất
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
