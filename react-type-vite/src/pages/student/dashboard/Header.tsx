import { getAvartarFromName } from "@/utils/callApiUtils";
import { Bell, ChevronDown, MessageCircleMore } from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

import uteLogoDark from "../../../assets/images/logo/ute-logo.jpg";
import { useState } from "react";
import { useAuth } from "@/context/auth-context/useAuth";

const profileMenu = [
  { name: "Hồ sơ", href: "/student/edit-profile" },
  { name: "Về trang home", href: "/" },
];

const Header = () => {
  const [isShowProfile, setIsShowProfile] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="student-dashboard-header">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink
            className="flex items-center h-8 w-10"
            to="/student/dashboard"
          >
            <img src={uteLogoDark} alt="" />
          </NavLink>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className="student-dashboard-nav-link px-3 py-2 text-md font-bold"
            >
              Trang chủ
            </Link>
            <span className="student-dashboard-nav-active px-3 py-2 text-md font-bold">
              <Link
                to="/student/dashboard"
                className="student-dashboard-nav-link px-3 py-2 text-md font-bold"
              >
                Khóa học của tôi
              </Link>
            </span>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <button className="student-dashboard-icon-btn">
              <Bell className="w-5 h-5" />
              {/* Notification Dropdown */}
            </button>
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
