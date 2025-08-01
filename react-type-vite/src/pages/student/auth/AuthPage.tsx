import LoginPage from "@/components/student/auth/LoginPage";
import RegisterPage from "@/components/student/auth/RegisterPage";
import { useState } from "react";

const AuthPage = () => {
  const [currentPage, setCurrentPage] = useState<boolean>(true);

  const togglePage = () => {
    setCurrentPage((prev) => !prev);
  };

  return (
    <div className="min-h-screen">
      {/* Navigation Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-white rounded-lg shadow-lg p-2 flex space-x-2">
          <button
            onClick={togglePage}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              currentPage === true
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            Login
          </button>
          <button
            onClick={togglePage}
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
