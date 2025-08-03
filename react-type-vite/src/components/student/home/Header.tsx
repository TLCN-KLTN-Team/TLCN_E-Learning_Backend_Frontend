import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../../context/theme-context";
import { ThemeToggle } from "../../ui/ThemeToggle";
import { NavLink } from "react-router-dom";
import {
  User,
  Settings,
  ShoppingCart,
  BookOpen,
  Bell,
  CreditCard,
  Globe,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/auth-context/useAuth";
import { toast } from "react-toastify";

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

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
  });
  const { theme } = useTheme();
  const profileRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Calculate dropdown position
  const updateDropdownPosition = () => {
    if (profileRef.current) {
      const rect = profileRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    console.log("User data from Auth Context:", user);
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [user]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
      if (isProfileOpen) {
        updateDropdownPosition();
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updateDropdownPosition);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateDropdownPosition);
    };
  }, [isProfileOpen]);

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsProfileOpen(false);
    logout();
    toast.success("Đăng xuất thành công!");
  };

  // Generate avatar initials from firstName and lastName
  const getAvatarInitials = (firstName: string, lastName: string): string => {
    const initials = `${firstName?.charAt(0) || ""}${
      lastName?.charAt(0) || ""
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
        { name: "Giỏ hàng của tôi", icon: ShoppingCart, href: "/cart" },
        { name: "Mong muốn", icon: BookOpen, href: "/wishlist" },
        {
          name: "Bảng điều khiển của giảng viên",
          icon: User,
          href: "/instructor",
        },
      ],
    },
    {
      section: "Thông báo",
      items: [
        {
          name: "Thông báo.",
          icon: Bell,
          href: "/notifications",
          badge: "Hơn 9",
        },
        { name: "Tin nhắn", icon: Bell, href: "/messages", badge: "Hơn 9" },
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
        { name: "Thuê bao", icon: CreditCard, href: "/subscriptions" },
        { name: "Ưu đãi Udemy", icon: Settings, href: "/offers" },
        { name: "Lịch sử mua", icon: ShoppingCart, href: "/purchase-history" },
      ],
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
        { name: "Chỉnh sửa hồ sơ", icon: User, href: "/edit-profile" },
      ],
    },
  ];

  const navigation = [
    { name: "Trang chủ", href: "#home" },
    { name: "Khóa học", href: "#courses" },
    { name: "Về chúng tôi", href: "#about" },
    { name: "Liên hệ", href: "#contact" },
  ];

  // const homeNavigation = [
  //   {name: "Trang dạy học số"},
  //   {name: "Trang giáo viên"},
  //   {name: "Trang Admin"},
  // ];

  return (
    <header
      className={`px-12 fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-sm shadow-bs border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <NavLink
            to="/"
            className="flex items-center max-w-[120px] lg:max-w-[150px] decoration-none no-hover-effect"
          >
            <img
              src={
                theme === "dark"
                  ? "/src/assets/images/logo-light.svg"
                  : "/src/assets/images/logo.svg"
              }
              alt="E-Learning Platform"
              className="h-6 lg:h-8 w-fit"
            />
          </NavLink>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-foreground hover:text-bs-primary transition-colors font-medium"
              >
                {item.name}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center space-x-4">
            <ThemeToggle />
            {user ? (
              // User Profile Dropdown
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => {
                    setIsProfileOpen(!isProfileOpen);
                    if (!isProfileOpen) {
                      updateDropdownPosition();
                    }
                  }}
                  className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center space-x-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-bs-primary text-white flex items-center justify-center font-medium text-sm">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={getFullName(user.firstName, user.lastName)}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        getAvatarInitials(user.firstName, user.lastName)
                      )}
                    </div>
                    {/* User Info */}
                    <div className="text-left">
                      <div className="text-sm font-medium text-foreground">
                        {getFullName(user.firstName, user.lastName)}
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
                              src={user.avatar}
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

                    {/* Menu Items */}
                    <div className="max-h-96 overflow-y-auto">
                      {profileMenuItems.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          {section.items.map((item) => (
                            <a
                              key={item.name}
                              href={item.href}
                              className="flex items-center justify-between px-4 py-2 hover:bg-opacity-10 transition-colors text-sm group no-hover-effect"
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
                                  style={{ color: "var(--bs-secondary-color)" }}
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
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:text-bs-primary transition-colors font-medium no-hover-effect"
                >
                  Đăng nhập
                </NavLink>
                <NavLink
                  to="/register"
                  className="bg-bs-primary text-white px-6 py-2 rounded-lg font-medium hover:bg-bs-primary-dark transition-colors no-hover-effect"
                >
                  Đăng ký
                </NavLink>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 lg:hidden">
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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-background border-t border-border">
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
                        {user.avatar ? (
                          <img
                            src={user.avatar}
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
