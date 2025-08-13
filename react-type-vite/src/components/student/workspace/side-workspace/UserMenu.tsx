import { useState, useRef, useEffect } from "react";
import { FileUser } from "lucide-react";
import { useAuth } from "@/context/auth-context/useAuth";
import { getRoles } from "@/utils/localStorageVariables";
import { getAvartarFromName } from "@/utils/callApiUtils";

interface UserMenuProps {
  className?: string;
}

const UserMenu = ({ className = "" }: UserMenuProps) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="w-12 h-12 rounded-full overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-gray-600 transition-all"
        onClick={() => setShowUserDropdown(!showUserDropdown)}
      >
        <img
          src={getAvartarFromName(`${user?.firstName} ${user?.lastName}`)}
          alt={user?.firstName || "User"}
          className="w-full h-full object-cover"
        />
      </div>

      {/* User Dropdown */}
      {showUserDropdown && (
        <div className="absolute bottom-16 left-0 bg-gray-800 rounded-lg shadow-lg py-2 w-48 z-20 border border-gray-700">
          <div className="px-4 py-2 border-b border-gray-700">
            <div className="font-semibold text-white text-sm">
              {user?.firstName} {user?.lastName}
            </div>
            <span className="text-gray-400 text-md flex items-center">
              <FileUser />{" "}
              {getRoles().includes("TEACHER") ? "Giảng viên" : "Sinh viên"}
            </span>
          </div>
          <button
            className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
            onClick={() => (window.location.href = "/")}
          >
            <svg
              className="w-4 h-4 inline mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
            Về trang chủ
          </button>
          <button className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors text-sm">
            <svg
              className="w-4 h-4 inline mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                clipRule="evenodd"
              />
            </svg>
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
