import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../../context/theme-context";
import { ThemeToggle } from "../../ui/ThemeToggle";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { STUDENT_ROUTES } from "@/constants/routes";
import {
  Settings,
  ShoppingCart,
  BellDot,
  BellRing,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
  UserCircle,
  BookOpen,
  History,
  Heart,
  LibraryBig,
  Bell,
} from "lucide-react";
import { useAuth } from "@/context/auth-context/useAuth";
import * as notificationApi from "@/services/api/notificationApi";
import { toast } from "react-toastify";
import lightLogo from "@/assets/open-edu-light.png";
import darkLogo from "@/assets/open-edu-dark.png";

import { navigation } from "./data/pageNavigations";

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

interface HeaderProps {
  variant?: 'default' | 'course-detail';
}

const Header = ({ variant = 'default' }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { theme } = useTheme();
  const profileRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getNotificationTarget = (notif: Notification) => {
    const fallback = "/notifications";
    const rawLink = (notif.link || "").trim();

    if (!rawLink) return fallback;
    if (rawLink.startsWith("http://") || rawLink.startsWith("https://")) {
      return rawLink;
    }

    const normalizedPath = rawLink.startsWith("/") ? rawLink : `/${rawLink}`;
    if (normalizedPath === "/notifications") {
      return "/notifications";
    }
    if (normalizedPath === "/admin/notifications") {
      return fallback;
    }

    return normalizedPath;
  };

  const handleOpenNotification = (notif: Notification, idx: number) => {
    if (!notif.isRead) {
      setNotifications(prev =>
        prev.map((n, i) => i === idx ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications history + SSE subscription
  useEffect(() => {
    if (!user?.id) return;

    notificationApi.getUserNotifications(user.id)
      .then(res => {
        // @ts-ignore
        const data: Notification[] = res.data?.result || res.data || [];
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.isRead).length);
      })
      .catch(err => console.error("Failed to fetch notifications", err));

    const eventSource = notificationApi.subscribeToNotifications(user.id);
    eventSource.onopen = () => console.log("SSE Connected");

    const makeNotif = (raw: any): Notification => ({
      recipientId: raw.userId || user.id,
      content: raw.message || raw.content || "",
      type: raw.type || "NOTIFICATION",
      isRead: false,
      createdAt: new Date().toISOString(),
      link: raw.link,
    });

    eventSource.addEventListener("REFUND_REQUESTED", (event) => {
      const notifObj = makeNotif(JSON.parse(event.data));
      setNotifications(prev => [notifObj, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.info(`Hoàn tiền: ${notifObj.content}`);
    });

    eventSource.addEventListener("REFUND_APPROVED", (event) => {
      const notifObj = makeNotif(JSON.parse(event.data));
      setNotifications(prev => [notifObj, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.success(`Hoàn tiền được duyệt: ${notifObj.content}`);
    });

    eventSource.addEventListener("PAYMENT_SUCCESS", (event) => {
      const notifObj = makeNotif(JSON.parse(event.data));
      setNotifications(prev => [notifObj, ...prev]);
      setUnreadCount(prev => prev + 1);
      toast.success(`Thanh toán thành công: ${notifObj.content}`);
    });

    eventSource.addEventListener("NOTIFICATION", (event) => {
      const notifObj = makeNotif(JSON.parse(event.data));
      setNotifications(prev => [notifObj, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    eventSource.onerror = (err) => {
      console.error("SSE Error", err);
      eventSource.close();
    };

    return () => { eventSource.close(); };
  }, [user?.id]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProfileOpen(false);
    logout();
    toast.success("Đăng xuất thành công!");
  };

  // Generate avatar initials from firstName and lastName
  const getAvatarInitials = (firstName: string, lastName: string): string => {
    const initials = `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""
      }`;
    return initials.toUpperCase() || "??";
  };

  // Get full name from firstName and lastName
  const getFullName = (firstName: string, lastName: string): string => {
    return `${firstName || ""} ${lastName || ""}`.trim() || "User";
  };

  const profileMenuItems: MenuSection[] = [
    {
      section: "Học tập",
      items: [
        { name: "Khóa học của tôi", icon: BookOpen, href: "/my-courses" },
        {name: "Thư viện tài liệu của tôi", icon: LibraryBig, href: "/document-library"},
        { name: "Giỏ hàng của tôi", icon: ShoppingCart, href: "/cart" },
        { name: "Danh sách yêu thích", icon: Heart, href: "/wishlist" },
        { name: "Chỉnh sửa hồ sơ", icon: UserCircle, href: "/edit-profile" },
        { name: "Lịch sử đơn hàng", icon: History, href: "/purchase-history" },
      ],
    },
    {
      section: "Thông báo",
      items: [
        {
          name: "Thông báo.",
          icon: BellRing,
          href: "/notifications",
          badge: "Hơn 9",
        },
        { name: "Tin nhắn", icon: BellDot, href: "/messages", badge: "Hơn 9" },
      ],
    },
    {
      section: "Cài đặt tài khoản",
      items: [
        {
          name: "Cài đặt tài khoản",
          icon: Settings,
          href: "/account/settings",
        },
        {
          name: "Phương thức thanh toán",
          icon: CreditCard,
          href: "/payment-methods",
        },
        { name: "Gói đăng ký", icon: CreditCard, href: "/subscriptions" },
        { name: "Lịch sử mua", icon: History, href: "/purchase-history" },
        { name: "Ưu đãi Udemy", icon: Settings, href: "/offers" },      ],
    },
    {
      section: "Khác",
      items: [
        {
          name: "Ngôn ngữ",
          icon: Globe,
          href: "/language",
          badge: "Tiếng Việt",
        },
        { name: "Hỗ sợ công khai", icon: HelpCircle, href: "/public-profile" },
      ],
    },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${variant === 'course-detail'
        ? 'bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800'
        : isScrolled
          ? "bg-background backdrop-blur-md shadow-bs border-b border-border"
          : "bg-background border-b border-border/50"
        }`}
    >
      <div className="px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center max-w-[140px] lg:max-w-[180px] decoration-none no-hover-effect"
          >
            <img
              src={theme === "dark" ? lightLogo : darkLogo}
              alt="OpenEdu - E-Learning Platform"
              className="h-6 lg:h-8 w-auto max-w-full object-contain"
            />
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <div key={item.name} className="relative">
                {item.features && item.features.length > 0 ? (
                  <div className="group relative">
                    <a
                      href={item.href}
                      className="text-foreground hover:text-bs-primary transition-colors font-medium cursor-pointer flex items-center space-x-1"
                    >
                      <span>{item.name}</span>
                      <svg
                        className="w-4 h-4 transition-transform group-hover:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </a>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full pt-3 invisible opacity-0 translate-y-1 group-hover:visible group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-out z-[120]">
                      {/* Caret pointer */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-[7px] w-3 h-3 rotate-45 border-l border-t"
                        style={{
                          backgroundColor: "var(--bs-body-bg)",
                          borderColor: "var(--bs-border-color)",
                        }}
                      />
                      <div
                        className="relative border shadow-xl rounded-xl p-2 min-w-[240px] whitespace-nowrap"
                        style={{
                          backgroundColor: "var(--bs-body-bg)",
                          borderColor: "var(--bs-border-color)",
                          color: "var(--bs-body-color)",
                        }}
                      >
                        {item.features.map((feature) => (
                          <NavLink
                            key={feature.name}
                            to={feature.href}
                            className="group/item flex items-center justify-between gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 no-hover-effect"
                            style={{ color: "var(--bs-body-color)" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "var(--bs-primary-bg-subtle)";
                              e.currentTarget.style.color = "var(--bs-primary)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.color = "var(--bs-body-color)";
                            }}
                          >
                            <span>{feature.name}</span>
                            <svg
                              className="w-4 h-4 opacity-0 -translate-x-1 transition-all duration-200 group-hover/item:opacity-100 group-hover/item:translate-x-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <a
                    href={item.href}
                    className="text-foreground hover:text-bs-primary transition-colors font-medium"
                  >
                    {item.name}
                  </a>
                )}
              </div>
            ))}
          </nav>

          {/* Desktop Actions when responsive*/}
          <div className="hidden lg:flex items-center space-x-4">
            <ThemeToggle />

            {/* Wishlist Icon */}
            {user && (
              <button
                onClick={() => navigate("/wishlist")}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#6ea8fe] transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </button>
            )}

            {/* Cart Icon */}
            {user && (
              <button
                onClick={() => navigate("/cart")}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#6ea8fe] transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}

            {/* Notification Bell - Desktop */}
            {user && (
              <div className="relative" ref={modalRef}>
                <button
                  onClick={() => {
                    setIsNotificationOpen(!isNotificationOpen);
                    setIsProfileOpen(false);
                  }}
                  className="relative p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-[#066ac9] dark:hover:text-[#6ea8fe] transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 md:w-5 md:h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>

                {isNotificationOpen && (
                  <div className="absolute right-0 mt-2 w-72 md:w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] flex flex-col">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                      <div className="flex justify-between items-center">
                        <h6 className="font-semibold m-0 text-gray-900 dark:text-gray-100">
                          Thông báo{" "}
                          {unreadCount > 0 && (
                            <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                              {unreadCount} mới
                            </span>
                          )}
                        </h6>
                        <button
                          onClick={() => {
                            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                            setUnreadCount(0);

                            if (user?.id) {
                              notificationApi
                                .markAllNotificationsAsRead(user.id)
                                .catch((err) => console.error("Failed to mark all notifications as read", err));
                            }
                          }}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Đọc tất cả
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto flex-1">
                      <ul className="list-none m-0 p-0">
                        {notifications.length === 0 ? (
                          <li className="p-4 text-center text-gray-500 text-sm">Chưa có thông báo</li>
                        ) : (
                          notifications.slice(0, 20).map((notif, idx) => (
                            <li key={notif.id ?? idx}>
                              <div
                                className={`p-3 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 flex cursor-pointer ${
                                  !notif.isRead ? "bg-blue-50 dark:bg-blue-950/30" : ""
                                }`}
                                onClick={() => handleOpenNotification(notif, idx)}
                              >
                                <div className="mr-3 flex-shrink-0">
                                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600">
                                    <BellRing size={20} />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm m-0 text-gray-800 dark:text-gray-200">
                                    {notif.content}
                                  </p>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-500">
                                      {notif.createdAt
                                        ? new Date(notif.createdAt).toLocaleString("vi-VN")
                                        : "Vừa xong"}
                                    </span>
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
                    <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                        <button
                          onClick={() => { navigate(STUDENT_ROUTES.NOTIFICATIONS, { state: { background: location } }); setIsNotificationOpen(false); }}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Xem tất cả thông báo
                        </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              // User Profile Dropdown
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                  }}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-bs-primary text-white flex items-center justify-center font-medium text-sm">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={getFullName(user.lastName, user.firstName)}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getAvatarInitials(user.lastName, user.firstName)
                      )}
                    </div>
                    {/* User Info */}
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">
                        {getFullName(user.lastName, user.firstName)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu with Bootstrap CSS Classes */}
                {isProfileOpen && (
                  <div className="dropdown-menu right-0 mt-2 w-80 rounded-lg shadow-2xl py-2">
                    {/* User Header */}
                    <div
                      className="px-4 py-3 border-b"
                      style={{ borderColor: "var(--bs-border-color)" }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white flex items-center justify-center font-medium">
                          {user.avatar ? (
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
                          <div
                            className="font-medium text-purple-600"
                            style={{ color: "var(--bs-primary)" }}
                          >
                            {getFullName(user.firstName, user.lastName)}
                          </div>
                          <div
                            className="text-sm"
                            style={{ color: "var(--bs-secondary-color)" }}
                          >
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Menu Items */}
                    <div className="max-h-96 overflow-y-auto">
                      {profileMenuItems.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          {section.items.map((item) => (
                            <a
                              key={item.name}
                              href={item.href}
                              className="flex items-center justify-between px-4 py-2 hover:bg-opacity-10 transition-colors text-sm group no-hover-effect text-gray-600"
                              style={
                                {
                                  color: "var(--bs-body-color)",
                                  "--hover-bg": "var(--bs-secondary-bg)",
                                } as React.CSSProperties
                              }
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "var(--bs-secondary-bg)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor =
                                  "transparent";
                              }}
                              onClick={() => setIsProfileOpen(false)}
                            >
                              <div className="flex items-center space-x-3">
                                <item.icon
                                  size={16}
                                  className="group-hover:opacity-80"
                                />
                                <span>{item.name}</span>
                              </div>
                              {item.badge && (
                                <span
                                  className="text-white text-xs px-2 py-1 rounded-full"
                                  style={{
                                    backgroundColor: "var(--bs-primary)",
                                  }}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </a>
                          ))}
                          {sectionIndex < profileMenuItems.length - 1 && (
                            <div
                              className="my-1"
                              style={{
                                borderTop: "1px solid var(--bs-border-color)",
                              }}
                            ></div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Logout */}
                    <div
                      style={{ borderTop: "1px solid var(--bs-border-color)" }}
                      className="mt-1"
                    >
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 transition-colors text-sm no-hover-effect"
                        style={
                          {
                            color: "var(--bs-danger)",
                            "--hover-bg": "var(--bs-danger-bg-subtle)",
                          } as React.CSSProperties
                        }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--bs-danger-bg-subtle)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                        }}
                      >
                        <LogOut size={16} />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // Login/Register buttons for non-authenticated users
              <>
                <NavLink
                  to="/login"
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg transition-colors font-medium hover:bg-gray-600 no-hover-effect"
                >
                  Đăng nhập
                </NavLink>
                <NavLink
                  to="/register"
                  className="bg-bs-primary text-white px-6 py-2 rounded-lg font-medium transition-colors no-hover-effect"
                >
                  Đăng ký
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
            {/* Wishlist Icon - Mobile */}
            {user && (
              <button
                onClick={() => navigate("/wishlist")}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#6ea8fe] transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </button>
            )}

            {/* Cart Icon - Mobile */}
            {user && (
              <button
                onClick={() => navigate("/cart")}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#6ea8fe] transition-colors"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5" />
              </button>
            )}

            {/* Notification Bell - Mobile */}
            {user && (
              <button
                onClick={() => navigate(STUDENT_ROUTES.NOTIFICATIONS, { state: { background: location } })}
                className="relative p-2 text-gray-700 dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#6ea8fe] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
            )}

            <ThemeToggle />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-foreground hover:text-bs-primary transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu when zoom out*/}
        {isMenuOpen && (
          <div className="lg:hidden bg-background/98 backdrop-blur-md border-t border-border z-[110] relative shadow-lg">
            <nav className="py-4 space-y-2">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-2 text-foreground hover:text-bs-primary hover:bg-muted transition-colors font-medium rounded-lg"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}

              <div className="border-t border-border pt-4 mt-4 px-4 space-y-2">
                {user ? (
                  // User info in mobile menu
                  <>
                    <div className="flex items-center space-x-3 py-2">
                      <div className="w-10 h-10 rounded-full bg-bs-primary text-white flex items-center justify-center font-medium text-sm">
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
                        <div className="text-sm font-medium text-foreground">
                          {getFullName(user.firstName, user.lastName)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <NavLink
                      to="/profile"
                      className="block w-full text-left py-2 text-foreground hover:text-bs-primary transition-colors font-medium no-hover-effect"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Thông tin cá nhân
                    </NavLink>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left py-2 text-red-600 hover:text-red-700 transition-colors font-medium"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  // Login/Register for mobile
                  <>
                    <NavLink
                      to="/login"
                      className="block w-full text-left py-2 text-foreground hover:text-bs-primary transition-colors font-medium no-hover-effect"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Đăng nhập
                    </NavLink>
                    <NavLink
                      to="/register"
                      className="block w-full bg-bs-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-bs-primary-dark transition-colors text-center no-hover-effect"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Đăng ký
                    </NavLink>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
