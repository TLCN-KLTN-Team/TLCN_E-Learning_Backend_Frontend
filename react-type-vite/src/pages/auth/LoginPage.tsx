import { useState } from "react";
import { Button } from "../../components/ui/button";
import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "@/context/auth-context/useAuth";
import { toast } from "react-toastify";
import { NavLink, useNavigate } from "react-router-dom";
import GoogleButton from "@/components/shared/button/GoogleButton";
import FacebookButton from "@/components/shared/button/FacebookButton";
import { Eye, EyeClosed, LockKeyhole, Mail, Loader2 } from "lucide-react";
import { getAuthInfo } from "@/utils/auth.utils";
import { getRoleBasedRedirectPath } from "@/utils/roleUtils";
import OtpVerification from "@/components/auth/OtpVerification";
import { emailApi } from "@/services/api/index";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [emailToVerify, setEmailToVerify] = useState("");
  const [otpError, setOtpError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Gửi lại OTP khi phát hiện tài khoản chưa xác thực
  const handleResendOtpFromLogin = async () => {
    try {
      await emailApi.resendOtp(formData.username);
      toast.success("Mã OTP đã được gửi đến email của bạn");
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      const errorMessage =
        error?.response?.data?.message || "Không thể gửi mã OTP";
      setOtpError(errorMessage);
    }
  };

  // Xác thực OTP
  const handleVerifyOtp = async (otpCode: string) => {
    setIsLoading(true);
    setOtpError("");

    try {
      await emailApi.verifyAccount(emailToVerify, otpCode);
      toast.success(
        "Xác minh tài khoản thành công! Đang chuyển hướng đến trang đăng nhập..."
      );
      // Delay để người dùng thấy thông báo thành công
      setTimeout(() => {
        setShowOtpVerification(false);
        setEmailToVerify("");
        // Tự động đăng nhập sau khi xác thực thành công
        login(formData.username, formData.password)
          .then(() => {
            const auth = getAuthInfo();
            if (auth) {
              const url = getRoleBasedRedirectPath(auth.role);
              navigate(url, { replace: true });
            }
            toast.success("Đăng nhập thành công!");
          })
          .catch(() => {
            toast.info("Vui lòng đăng nhập lại");
          });
      }, 1500);
    } catch (error: any) {
      const errorCode = error?.response?.data?.code;
      const message =
        error?.response?.data?.message ||
        "Mã OTP không hợp lệ. Vui lòng thử lại.";

      setOtpError(message);

      // OTP expired
      if (errorCode === "OTP_1019") {
        setOtpError(
          "Mã OTP đã hết hạn (sau 1 phút 30 giây). Vui lòng nhấn 'Gửi lại mã xác nhận'"
        );
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Gửi lại OTP
  const handleResendOtp = async () => {
    setIsLoading(true);
    setOtpError("");

    try {
      await emailApi.resendOtp(emailToVerify);
      toast.success("Mã OTP mới đã được gửi đến email của bạn");
    } catch (error: any) {
      const errorCode = error?.response?.data?.code;
      const message =
        error?.response?.data?.message ||
        "Không thể gửi lại mã OTP. Vui lòng thử lại.";

      if (
        errorCode === "OTP_1026" ||
        message.includes("3 lần") ||
        message.includes("5 phút")
      ) {
        setOtpError(
          "Bạn đã gửi lại mã xác nhận quá 3 lần. Vui lòng thử lại sau 5 phút"
        );
      } else {
        setOtpError(message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Quay lại form đăng nhập
  const handleBackToLogin = () => {
    setShowOtpVerification(false);
    setEmailToVerify("");
    setOtpError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Trim username and password before submission
    const trimmedUsername = formData.username.trim();
    const trimmedPassword = formData.password.trim();

    login(trimmedUsername, trimmedPassword)
      .then(() => {
        const auth = getAuthInfo();
        if (auth) {
          const url = getRoleBasedRedirectPath(auth.role);
          navigate(url, { replace: true });
        }

        toast.success("Đăng nhập thành công!");
      })
      .catch((error) => {
        console.log("Login error:", error);
        const errorMessage = error.message || "Đăng nhập thất bại";

        // Kiểm tra nếu tài khoản chưa được xác thực
        if (
          errorMessage.includes("Tài khoản chưa được xác thực") ||
          errorMessage.includes("chưa được xác thực") ||
          errorMessage.includes("not verified")
        ) {
          // Lưu email và chuyển sang form OTP
          setEmailToVerify(trimmedUsername);
          setShowOtpVerification(true);
          // Tự động gửi lại OTP
          handleResendOtpFromLogin();
          toast.info(
            "Tài khoản chưa được xác thực. Vui lòng xác thực tài khoản."
          );
        } else {
          toast.error(errorMessage);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Nếu cần xác thực OTP, hiển thị form OTP
  if (showOtpVerification) {
    return (
      <AuthLayout
        title="Xác thực tài khoản"
        subtitle="Vui lòng xác thực tài khoản của bạn để tiếp tục."
      >
        <OtpVerification
          email={emailToVerify}
          onVerify={handleVerifyOtp}
          onBack={handleBackToLogin}
          onResend={handleResendOtp}
          isLoading={isLoading}
          error={otpError}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Welcome back!"
      subtitle="Nhập thông tin tài khoản của bạn để đăng nhập."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username Field */}
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="block text-sm font-semibold text-gray-900"
          >
            Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="devzeus || devzeus@gmail.com"
              aria-describedby="username-description"
            />
            <span id="username-description" className="sr-only">
              Nhập email của bạn
            </span>
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-900"
            >
              Password
            </label>
            <NavLink
              to="/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              tabIndex={-1}
            >
              Forgot password?
            </NavLink>
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <LockKeyhole className="w-5 h-5 text-gray-400" />
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              className="w-full h-12 pl-10 pr-12 border border-gray-300 rounded-lg focus:border-transparent text-gray-900 placeholder-gray-500 transition-all duration-200 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="••••••••"
              aria-describedby="password-description"
              style={{
                letterSpacing: showPassword ? "normal" : "0.2em",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-r-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset group z-10"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeClosed className="w-5 h-5 transition-transform duration-200" />
              ) : (
                <Eye className="w-5 h-5 transition-transform duration-200" />
              )}
            </button>
            <span id="password-description" className="sr-only">
              Nhập mật khẩu ở đây
            </span>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center justify-start">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={formData.rememberMe}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="rememberMe" className="ml-3 text-sm text-gray-700">
            Ghi nhớ đăng nhập
          </label>
        </div>

        {/* Login Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang đăng nhập...
            </span>
          ) : (
            "Đăng nhập"
          )}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-600 font-medium">
              Hoặc đăng nhập với
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <GoogleButton disabled={isLoading} />
          <FacebookButton disabled={isLoading} />
        </div>

        {/* Sign Up Link */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            Bạn chưa có tài khoản?{" "}
            <a
              href="/register"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Đăng ký tại đây
            </a>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
