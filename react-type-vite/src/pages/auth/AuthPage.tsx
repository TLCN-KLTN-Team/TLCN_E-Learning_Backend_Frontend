import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import { useState } from "react";

interface AuthPageProps {
  isLoggin: boolean;
}

const AuthPage = ({ isLoggin }: AuthPageProps) => {
  const [currentPage, setCurrentPage] = useState<boolean>(isLoggin);

  const showLogin = () => {
    setCurrentPage(true);
  };

  const showRegister = () => {
    setCurrentPage(false);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Toggle */}

      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-2 flex space-x-2">
          <button
            onClick={showLogin}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === true
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Login
          </button>
          <button
            onClick={showRegister}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === false
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Register
          </button>
        </div>
      </div>

      {/* Content */}
      {currentPage === true ? <LoginPage /> : <RegisterPage />}
    </div>
  );
};

export default AuthPage;
