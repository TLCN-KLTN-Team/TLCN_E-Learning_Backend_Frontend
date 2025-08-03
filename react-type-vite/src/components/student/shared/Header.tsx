import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
  User,
  LogOut,
  Settings,
} from "lucide-react";
import { useAuth } from "@/context/auth-context/useAuth";

interface HeaderProps {
  theme: string;
  onThemeChange: (theme: string) => void;
}

const Header = ({ theme, onThemeChange }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsThemeDropdownOpen(false);
      }
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getThemeIcon = () => {
    switch (theme) {
      case "dark":
        return <Moon size={16} />;
      case "light":
        return <Sun size={16} />;
      default:
        return <Monitor size={16} />;
    }
  };

  return (
    <header className="px-10 sticky top-0 z-50 bg-white dark:bg-[#24292d] shadow-sm">
      <nav className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href="#" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-[#066ac9] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">e</span>
            </div>
            <span className="text-xl font-bold text-[#24292d] dark:text-white">
              Eduport
            </span>
          </a>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <div className="relative group">
              <button className="flex items-center space-x-1 text-[#066ac9] dark:text-[#066ac9] hover:text-[#0555a1] dark:hover:text-[#0555a1] font-medium transition-colors">
                <span>Home</span>
                <ChevronDown
                  size={16}
                  className="transition-transform group-hover:rotate-180"
                />
              </button>
              {/* Dropdown menu can be added here */}
            </div>
            <a
              href="#"
              className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] font-medium transition-colors"
            >
              Course
            </a>
            <a
              href="#"
              className="text-[#747579] dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] font-medium transition-colors"
            >
              Contact
            </a>
          </div>

          {/* Theme switcher and Buy button */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {getThemeIcon()}
              </button>

              {isThemeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <button
                    onClick={() => {
                      onThemeChange("light");
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${
                      theme === "light"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Sun size={16} />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => {
                      onThemeChange("dark");
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${
                      theme === "dark"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Moon size={16} />
                    <span>Dark</span>
                  </button>
                  <button
                    onClick={() => {
                      onThemeChange("auto");
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 ${
                      theme === "auto"
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <Monitor size={16} />
                    <span>Auto</span>
                  </button>
                </div>
              )}
            </div>

            {/* User section */}
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-8 h-8 bg-[#066ac9] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {user.firstName?.charAt(0).toUpperCase() ||
                        user.username?.charAt(0).toUpperCase() ||
                        "U"}
                    </span>
                  </div>
                  <span className="text-[#24292d] dark:text-white font-medium text-sm">
                    {user.firstName
                      ? `${user.firstName} ${user.lastName}`
                      : user.username}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${
                      isUserDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isUserDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        // Navigate to dashboard
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                    >
                      <User size={16} />
                      <span>Dashboard</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        // Navigate to settings
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <hr className="my-1 border-gray-200 dark:border-gray-600" />
                    <button
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2 text-red-600 dark:text-red-400"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Button className="bg-[#066ac9] dark:bg-[#066ac9] text-white hover:bg-[#0555a1] dark:hover:bg-[#0555a1] font-medium px-6 py-2 rounded-lg transition-colors">
                Login
              </Button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex flex-col space-y-4">
              <a
                href="#"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 py-2 transition-colors"
              >
                Demos
              </a>
              <a
                href="#"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 py-2 transition-colors"
              >
                Course
              </a>
              <a
                href="#"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 py-2 transition-colors"
              >
                Contact
              </a>

              {/* Mobile Theme Switcher */}
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  Theme
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => onThemeChange("light")}
                    className={`p-2 rounded-full ${
                      theme === "light"
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    } transition-colors`}
                  >
                    <Sun size={16} />
                  </button>
                  <button
                    onClick={() => onThemeChange("dark")}
                    className={`p-2 rounded-full ${
                      theme === "dark"
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    } transition-colors`}
                  >
                    <Moon size={16} />
                  </button>
                  <button
                    onClick={() => onThemeChange("auto")}
                    className={`p-2 rounded-full ${
                      theme === "auto"
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                    } transition-colors`}
                  >
                    <Monitor size={16} />
                  </button>
                </div>
              </div>

              {/* Mobile User section */}
              {user ? (
                <div className="flex flex-col space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#066ac9] rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user.firstName?.charAt(0).toUpperCase() ||
                          user.username?.charAt(0).toUpperCase() ||
                          "U"}
                      </span>
                    </div>
                    <span className="text-[#24292d] dark:text-white font-medium text-sm">
                      {user.firstName
                        ? `${user.firstName} ${user.lastName}`
                        : user.username}
                    </span>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <button className="flex items-center space-x-2 text-left text-gray-700 dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] py-2 transition-colors">
                      <User size={16} />
                      <span>Dashboard</span>
                    </button>
                    <button className="flex items-center space-x-2 text-left text-gray-700 dark:text-gray-300 hover:text-[#066ac9] dark:hover:text-[#066ac9] py-2 transition-colors">
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={logout}
                      className="flex items-center space-x-2 text-left text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 py-2 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              ) : (
                <Button className="w-full bg-[#066ac9] dark:bg-[#066ac9] text-white hover:bg-[#0555a1] dark:hover:bg-[#0555a1] font-medium transition-colors mt-4">
                  Login
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
