import { Search, Bell } from "lucide-react";
import type React from "react";

const SystemAdminHeader: React.FC = () => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản, đơn vị, khóa học..."
              className="w-96 pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg bg-gray-50 focus:bg-white
                         placeholder-gray-500 text-gray-900 transition-all duration-200
                         hover:border-gray-300 hover:bg-white"
            />
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <Bell className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile */}
          <div className="flex items-center space-x-3">
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
