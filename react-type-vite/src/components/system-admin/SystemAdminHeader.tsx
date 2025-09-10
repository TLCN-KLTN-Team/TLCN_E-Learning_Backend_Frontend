import { Search, Bell, Menu, X } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import AdminProfile from "../shared/AdminProfile";
import SystemAdminNotification from "../shared/SystemAdminNotification";

interface SystemAdminHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SystemAdminHeader: React.FC<SystemAdminHeaderProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [isNoficationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLDivElement;
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNoficationOpen, isProfileOpen]);

  const escapeKeyHandler = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      setSearchValue("");
    }
  };

  const handleSearchClear = () => {
    setSearchValue("");
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản, đơn vị, khóa học..."
              className="w-64 md:w-96 pl-10 pr-4 py-2.5 border-1 border-gray-200 rounded-lg bg-gray-50 focus:bg-white
                         placeholder-gray-500 text-gray-800 transition-all duration-200
                         hover:border-gray-300 hover:bg-white text-sm md:text-base"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => escapeKeyHandler(e)}
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
            <X
              className="absolute right-3 top-3 text-gray-900"
              onClick={handleSearchClear}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <button
            className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={() => setIsNotificationOpen(!isNoficationOpen)}
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-[10px] md:text-xs">
              3
            </span>

            {/* Notification Dropdown */}
            {isNoficationOpen && (
              <div
                className="absolute right-0 mt-2 w-72 md:w-80 bg-white rounded-lg shadow-lg border z-50"
                ref={notificationRef}
              >
                <SystemAdminNotification />
              </div>
            )}
          </button>

          {/* Profile */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden p-0 ring-2 ring-transparent hover:ring-blue-200 transition-all"
            >
              <img
                src="/placeholder.svg?height=40&width=40&text=SA"
                alt="System Admin Profile"
                className="w-full h-full object-cover rounded-full"
              />
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
