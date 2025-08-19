import { Search, Bell, Menu } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface SystemAdminHeaderProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const SystemAdminHeader: React.FC<SystemAdminHeaderProps> = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const modalRef = useRef<HTMLElement>(null);
  const [isNoficationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (modalRef.current && !modalRef.current.contains(target)) {
        setIsNotificationOpen(false);
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNoficationOpen, isProfileOpen]);

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
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản, đơn vị, khóa học..."
              className="w-64 md:w-96 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white
                         placeholder-gray-500 text-gray-900 transition-all duration-200
                         hover:border-gray-300 hover:bg-white text-sm md:text-base"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-[10px] md:text-xs">
              3
            </span>
          </button>

          {/* Profile */}
          <div className="flex items-center space-x-2 md:space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">SA</span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">System Admin</p>
              <p className="text-xs text-gray-500">admin@system.com</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SystemAdminHeader;
