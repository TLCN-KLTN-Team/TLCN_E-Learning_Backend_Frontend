import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth-context/useAuth";
import { getAuthInfo } from "@/utils/auth.utils";
import { getRoleBasedRedirectPath } from "@/utils/roleUtils";

const Authenticate = () => {
  const { socialLogin } = useAuth();
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        const increment = Math.random() * 4 + 1;
        return Math.min(prev + increment, 90);
      });
    }, 300);

    const authenticateUser = async () => {
      try {
        // Đảm bảo page đã load hoàn toàn trước khi lấy URL params
        if (document.readyState !== "complete") {
          await new Promise((resolve) => {
            if (document.readyState === "complete") {
              resolve(null);
            } else {
              window.addEventListener("load", () => resolve(null), {
                once: true,
              });
            }
          });
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
        // Retry logic để đợi authorization code từ URL
        const code = new URLSearchParams(window.location.search).get("code");
        if (!code) {
          toast.error("Không tìm thấy mã xác thực từ Google.");
        } else {
          socialLogin(code, "google")
            .then(() => {
              const auth = getAuthInfo();
              if (auth) {
                const url = getRoleBasedRedirectPath(auth.role);
                navigate(url, { replace: true });
              }
              toast.success("Đăng nhập bằng Google thành công!");
            })
            .catch((error) => {
              toast.error(error.message || "Đăng nhập bằng Google thất bại");
            });
        }
      } catch (err: unknown) {
        let errorMessage = "Đăng nhập Google thất bại. Vui lòng thử lại.";
        // Handle axios errors
        if (err && typeof err === "object" && "code" in err) {
          if (err.code === "ECONNABORTED") {
            errorMessage =
              "Kết nối bị timeout. Vui lòng kiểm tra mạng và thử lại.";
          }
        }

        if (err && typeof err === "object" && "response" in err) {
          // Server responded with error status
          const axiosError = err as {
            response: { status: number; statusText: string };
          };
          errorMessage = `Lỗi xác thực: ${axiosError.response.status} - ${axiosError.response.statusText}`;
        } else if (err && typeof err === "object" && "request" in err) {
          // Network error
          errorMessage =
            "Không thể kết nối tới server. Vui lòng kiểm tra mạng.";
        }

        setError(errorMessage);
        toast.error(errorMessage, {
          position: "top-right",
          autoClose: 5000,
        });
      }
    };

    authenticateUser();

    return () => {
      clearInterval(progressInterval);
    };
  }, [navigate]);

  const handleRetry = () => {
    navigate("/login", { replace: true });
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Có lỗi xảy ra
            </h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Thử lại đăng nhập Google
              </button>
              <button
                onClick={handleGoHome}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200"
              >
                Về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Google Logo Spinning với 4 màu */}
          <div className="flex items-center justify-center mb-8">
            <div className="relative">
              {/* Logo Google xoay với 4 màu */}
              <div
                className="w-16 h-16 relative animate-spin"
                style={{ animationDuration: "2s" }}
              >
                {/* Ring với 4 màu Google */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(from 0deg, #4285f4 0deg 90deg, #ea4335 90deg 180deg, #fbbc04 180deg 270deg, #34a853 270deg 360deg)`,
                    padding: "3px",
                  }}
                >
                  <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center">
                    {/* G Letter */}
                    <span className="text-2xl font-bold text-white">G</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Google Authentication
          </h2>
          <p className="text-gray-300 mb-8">Đang xác thực tài khoản</p>

          {/* Progress Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-300">
                Tiến trình xác thực
              </span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-green-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-red-500 rounded-full animate-pulse"
                  style={{ animationDelay: "0.6s" }}
                ></div>
              </div>
            </div>

            {/* Dynamic Progress Bar giống như trong ảnh */}
            <div className="w-full bg-gray-700 rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, 
                    #4285f4 0%, 
                    #34a853 25%, 
                    #fbbc04 50%, 
                    #ea4335 75%, 
                    #4285f4 100%)`,
                }}
              ></div>
            </div>

            {/* Progress percentage */}
            <div className="text-center">
              <span className="text-sm font-medium text-gray-400">
                {Math.round(progress)}% hoàn thành
              </span>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-center justify-center text-sm text-gray-400 bg-gray-700 rounded-lg p-3">
            <svg
              className="w-4 h-4 mr-2 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            Kết nối an toàn với máy chủ Google
          </div>
        </div>
      </div>
    </div>
  );
};

export default Authenticate;
