import { useEffect, useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context/useAuth";
import * as notificationApi from "@/services/api/notificationApi";

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

interface NotificationCenterPageProps {
  title: string;
  emptyText?: string;
  fallbackPath: string;
  notificationsPagePath: string;
}

const NotificationCenterPage = ({
  title,
  emptyText = "Không có thông báo",
  fallbackPath,
  notificationsPagePath,
}: NotificationCenterPageProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const resolveTarget = (notif: Notification) => {
    const rawLink = (notif.link || "").trim();
    if (!rawLink) return fallbackPath;

    if (rawLink.startsWith("http://") || rawLink.startsWith("https://")) {
      return rawLink;
    }

    const normalizedPath = rawLink.startsWith("/") ? rawLink : `/${rawLink}`;
    if (/^\/teacher\/published-courses\/\d+$/.test(normalizedPath)) {
      return "/teacher/public-courses";
    }
    if (/^\/teacher\/courses\/\d+$/.test(normalizedPath)) {
      return "/teacher/assigned-courses";
    }
    if (/^\/student\/classes\/\d+$/.test(normalizedPath)) {
      const classId = normalizedPath.split("/").pop();
      return classId ? `/student/dashboard/course/classes/${classId}` : "/student/dashboard";
    }
    if (normalizedPath === "/notifications") {
      return notificationsPagePath;
    }

    return normalizedPath;
  };

  const openNotification = (notif: Notification, idx: number) => {
    if (!notif.isRead) {
      setNotifications((prev) =>
        prev.map((item, i) => (i === idx ? { ...item, isRead: true } : item))
      );
    }

    const target = resolveTarget(notif);
    if (target.startsWith("http://") || target.startsWith("https://")) {
      window.location.assign(target);
      return;
    }

    navigate(target);
  };

  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    notificationApi
      .getUserNotifications(user.id)
      .then((res) => {
        const data: Notification[] =
          // @ts-ignore
          res.data?.result || res.data || [];

        const sorted = [...data].sort((a, b) => {
          const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return timeB - timeA;
        });

        setNotifications(sorted);
      })
      .catch(() => {
        setNotifications([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [user?.id]);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="p-4 md:p-6 border-b border-gray-200 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl md:text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {unreadCount} chưa đọc
            </span>
          )}
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline"
            onClick={() => {
              setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
              if (user?.id) {
                notificationApi
                  .markAllNotificationsAsRead(user.id)
                  .catch((err) => console.error("Failed to mark all notifications as read", err));
              }
            }}
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-6 text-sm text-gray-500">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">{emptyText}</div>
        ) : (
          <ul className="list-none m-0 p-0">
            {notifications.map((notif, idx) => (
              <li key={notif.id ?? `${notif.createdAt ?? "n"}-${idx}`}>
                <button
                  type="button"
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    !notif.isRead ? "bg-blue-50" : ""
                  }`}
                  onClick={() => openNotification(notif, idx)}
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 break-words m-0">
                        {notif.content || notif.message || "Thông báo mới"}
                      </p>
                      <div className="mt-1 text-xs text-gray-500 flex items-center justify-between gap-2">
                        <span>
                          {notif.createdAt
                            ? new Date(notif.createdAt).toLocaleString("vi-VN")
                            : "Vừa xong"}
                        </span>
                        {!!notif.link && <span className="text-blue-600">Xem chi tiết</span>}
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationCenterPage;
