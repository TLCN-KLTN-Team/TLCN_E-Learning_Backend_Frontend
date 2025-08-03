import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Loader2, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import { LoadingDots } from "../../../components/ui/LoadingDots";
import "../../../styles/authenticate.css";

const Authenticate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        console.log("Authenticating with Google OAuth...");
        console.log("Current URL:", window.location.href);

        const code = new URLSearchParams(window.location.search).get("code");

        if (!code) {
          setError(
            "Không tìm thấy mã xác thực từ Google. Vui lòng thử đăng nhập lại."
          );
          setLoading(false);
          return;
        }

        console.log("Authorization code received:", code);

        const response = await fetch(
          `http://localhost:8888/api/v1/identity/auth/outbound/authenticate?code=${code}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Lỗi xác thực: ${response.status} - ${response.statusText}`
          );
        }

        const data = await response.json();
        console.log("Authentication response:", data);

        if (data.result?.accessToken) {
          // Lưu tất cả tokens vào localStorage
          localStorage.setItem("jwt", data.result.accessToken);
          if (data.result.refreshToken) {
            localStorage.setItem("refreshToken", data.result.refreshToken);
          }
          if (data.result.expiryTime) {
            localStorage.setItem(
              "tokenExpiry",
              data.result.expiryTime.toString()
            );
          }
          if (data.result.refreshExpiryTime) {
            localStorage.setItem(
              "refreshTokenExpiry",
              data.result.refreshExpiryTime.toString()
            );
          }

          setSuccess(true);
          toast.success("Đăng nhập Google thành công!");

          // Bắt đầu countdown để redirect
          const countdownInterval = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(countdownInterval);
                navigate("/", { replace: true });
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        } else if (data.result?.token) {
          // Fallback cho trường hợp backend trả về token thay vì accessToken
          localStorage.setItem("jwt", data.result.token);
          setSuccess(true);
          toast.success("Đăng nhập Google thành công!");

          setTimeout(() => {
            navigate("/", { replace: true });
          }, 3000);
        } else {
          throw new Error("Không nhận được access token từ server");
        }
      } catch (err) {
        console.error("Authentication error:", err);
        toast.error("Đăng nhập Google thất bại. Vui lòng thử lại.");
        setError(
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi không xác định trong quá trình xác thực"
        );
      } finally {
        setLoading(false);
      }
    };

    authenticateUser();
  }, [navigate]);

  const handleRetry = () => {
    navigate("/login", { replace: true });
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 transform transition-all duration-500 hover:shadow-2xl">
        <div className="text-center">
          {/* Logo hoặc Icon với animation */}
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 shadow-inner transform transition-all duration-300">
            {loading && (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            )}
            {success && (
              <CheckCircle className="w-8 h-8 text-green-600 animate-pulse" />
            )}
            {error && (
              <XCircle className="w-8 h-8 text-red-600 animate-pulse" />
            )}
          </div>

          {/* Title với animation */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 transition-all duration-300">
            {loading && "Đang xác thực..."}
            {success && "Thành công! 🎉"}
            {error && "Oops! Có lỗi xảy ra"}
          </h1>

          {/* Description */}
          <p className="text-gray-600 mb-8 leading-relaxed">
            {loading &&
              "Vui lòng đợi trong giây lát, chúng tôi đang xử lý thông tin đăng nhập Google của bạn."}
            {success &&
              `Chào mừng bạn! Đang chuyển hướng về trang chủ trong ${countdown} giây...`}
            {error &&
              "Đã xảy ra lỗi trong quá trình xác thực với Google. Đừng lo lắng, hãy thử lại nhé!"}
          </p>

          {/* Content based on state */}
          {loading && (
            <div className="space-y-6">
              <LoadingDots className="w-3 h-3 bg-blue-600" />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm font-medium">
                  🔐 Đang kết nối an toàn với Google OAuth
                </p>
              </div>
            </div>
          )}

          {success && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                  <p className="text-green-800 font-semibold">
                    Đăng nhập thành công!
                  </p>
                </div>
                <p className="text-green-600 text-sm">
                  Bạn đã được xác thực thành công qua Google. Chào mừng bạn quay
                  trở lại! 👋
                </p>
              </div>

              <button
                onClick={handleGoHome}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Đi đến trang chủ ngay</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <div className="text-center bg-gray-50 rounded-lg p-3">
                <div className="inline-flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>
                    Tự động chuyển hướng trong <strong>{countdown}</strong> giây
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-center mb-3">
                  <XCircle className="w-6 h-6 text-red-600 mr-2" />
                  <p className="text-red-800 font-semibold">Lỗi xác thực</p>
                </div>
                <p className="text-red-700 text-sm leading-relaxed">{error}</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-lg"
                >
                  🔄 Thử lại đăng nhập Google
                </button>

                <button
                  onClick={handleGoHome}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:shadow-md"
                >
                  🏠 Về trang chủ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Authenticate;
