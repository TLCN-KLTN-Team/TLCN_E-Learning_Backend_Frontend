import { useState } from "react";
import { Button } from "../../components/ui/button";
import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "@/context/auth-context/useAuth";
import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { RegisterData } from "@/context/auth-context/types";
import { toast } from "react-toastify";
import {
  Eye,
  EyeClosed,
  Loader2,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import GoogleButton from "@/components/shared/button/GoogleButton";
import FacebookButton from "@/components/shared/button/FacebookButton";
import OtpVerification from "@/components/auth/OtpVerification";

import { emailApi } from "@/services/api/index";

// Interface for form errors
interface FormErrors {
  firstName: string;
  lastName?: string;
  email: string;
  username: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms?: string;
}

const RegisterPage = () => {
  const [formData, setFormData] = useState<RegisterData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({} as FormErrors);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<string>("register");
  const [isRegistering, setIsRegistering] = useState<boolean>(false);

  const { user, register } = useAuth();
  const [emailToVerify, setEmailToVerify] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const navigate = useNavigate();

  // Validation functions
  const validateField = (name: string, value: unknown): string | undefined => {
    switch (name) {
      case "firstName":
        if (!value || (typeof value === "string" && value.trim().length < 2)) {
          return "First name phải ít nhất 2 ký tự";
        }
        break;
      case "phoneNumber":
        if (!value) {
          return "Phone number là bắt buộc";
        }
        break;
      case "email":
        if (!value) {
          return "Email là bắt buộc";
        }
        if (
          typeof value === "string" &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ) {
          return "Please nhập một email hợp lệ";
        }
        break;
      case "password":
        if (!value) {
          return "Password là bắt buộc";
        }
        if (
          typeof value === "string" &&
          !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(
            value
          )
        ) {
          return "Password phải chứa ít nhất một chữ IN HOA, một chữ thường, một số, và một ký tự đặc biệt";
        }
        if (typeof value === "string" && value.length < 6) {
          return "Password phải ít nhất 6 ký tự";
        }
        break;
      case "confirmPassword":
        if (!value) {
          return "Vui lòng xác nhận mật khẩu của bạn";
        }
        if (value !== formData.password) {
          return "Mật khẩu không khớp, vui lòng thử lại";
        }
        break;
      case "agreeToTerms":
        if (!value) {
          return "Bạn phải đồng ý với các điều khoản và điều kiện để đăng ký";
        }
        break;
    }
    return undefined;
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouchedFields((prev) => new Set(prev).add(fieldName));
    const error = validateField(
      fieldName,
      formData[fieldName as keyof RegisterData]
    );
    setErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Real-time validation
    if (touchedFields.has(name)) {
      const error = validateField(name, newValue);
      setErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {} as FormErrors;
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof RegisterData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);

    // Đánh dấu tất cả field là đã chạm để hiển thị lỗi
    setTouchedFields(new Set(Object.keys(formData)));

    // Chặn submit nếu còn lỗi
    if (Object.keys(newErrors).length > 0) {
      toast.error("Vui lòng kiểm tra lại thông tin đã nhập");
      return;
    }

    if (user) {
      navigate("/");
      return;
    }

    // Trim all text fields before submission
    const trimmedData = {
      ...formData,
      firstName: formData.firstName.trim(),
      lastName: formData.lastName?.trim() || "",
      email: formData.email.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      password: formData.password.trim(),
      confirmPassword: formData.confirmPassword.trim(),
      roles: ["STUDENT"],
    };

    // Step 2: Register user and send verification code
    setIsRegistering(true);
    register(trimmedData)
      .then((email: string) => {
        setEmailToVerify(email);
        setCurrentStep("verify-account");
        toast.success("Cần xác minh OTP đã được gửi đến email của bạn");
      })
      .catch((error) => {
        console.error("Đăng ký thất bại:", error);
        toast.error(error.message || "Đăng ký thất bại");
      })
      .finally(() => {
        setIsRegistering(false);
      });
  };

  //

  const verifyAccountRender = () => {
    // Step 2: Verify account with OTP
    const handleVerifyOtp = async (otpCode: string) => {
      setIsLoading(true);
      setError("");

      try {
        await emailApi.verifyAccount(emailToVerify, otpCode);
        toast.success(
          "Xác minh tài khoản thành công! Đang chuyển hướng đến trang đăng nhập..."
        );
        // Delay để người dùng thấy thông báo thành công trước khi chuyển hướng
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } catch (error: any) {
        const errorCode = error?.response?.data?.code;
        const message =
          error?.response?.data?.message ||
          "Mã OTP không hợp lệ. Vui lòng thử lại.";

        // Set error for display
        setError(message);

        // OTP expired
        if (errorCode === "OTP_1019") {
          setError(
            "Mã OTP đã hết hạn (sau 1 phút 30 giây). Vui lòng nhấn 'Gửi lại mã xác nhận'"
          );
        }
        // Throw error so OtpVerification can clear inputs
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    // Resend OTP
    const handleResendOtp = async () => {
      setIsLoading(true);
      setError("");

      try {
        await emailApi.resendOtp(emailToVerify);
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
          setError(
            "Bạn đã gửi lại mã xác nhận quá 3 lần. Vui lòng thử lại sau 5 phút"
          );
        } else {
          setError(message);
        }
        throw error;
      } finally {
        setIsLoading(false);
      }
    };
    const handleBack = () => {
      setError("");
      switch (currentStep) {
        case "verify-account":
          setCurrentStep("register");
          break;
        default:
          navigate("/login");
      }
    };
    return (
      <OtpVerification
        email={emailToVerify}
        onVerify={handleVerifyOtp}
        onBack={handleBack}
        onResend={handleResendOtp}
        isLoading={isLoading}
        error={error}
      />
    );
  };

  const registerRender = () => {
    const container = {
      hidden: {},
      show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
    };
    const item = {
      hidden: { opacity: 0, y: 14 },
      show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: "easeOut" },
      },
    } as const;
    return (
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div
          variants={item}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* First Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-semibold text-gray-900"
            >
              Tên
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UserRound className="w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-600" />
              </div>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("firstName")}
                className={cn(
                  "auth-input text-gray-700 w-full pl-10 pr-3 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white text-sm placeholder-gray-400 transition-all duration-200",
                  errors.firstName
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
                )}
                placeholder="Nhập tên"
              />
            </div>
            {errors.firstName && (
              <p className="text-sm text-red-400 font-medium">
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Last Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="block text-sm font-semibold text-gray-900"
            >
              Họ
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UserRound className="w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-600" />
              </div>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("lastName")}
                className={cn(
                  "auth-input text-gray-700 w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 transition-all",
                  errors.lastName
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
                )}
                placeholder="Nhập họ"
              />
            </div>
            {errors.lastName && (
              <p className="text-sm text-red-400 font-medium">
                {errors.lastName}
              </p>
            )}
          </div>
          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-900"
            >
              Địa chỉ Email
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-600" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("email")}
                className={cn(
                  "auth-input text-gray-700 w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 transition-all",
                  errors.email
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
                )}
                placeholder="Nhập e-mail"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-400 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Phone number Field */}
          <div className="space-y-2">
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-semibold text-gray-900"
            >
              Số điện thoại
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <UserRound className="w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-600" />
              </div>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="number"
                required
                value={formData.phoneNumber}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("phoneNumber")}
                className={cn(
                  "auth-input text-gray-700 w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 transition-all",
                  errors.phoneNumber
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
                )}
                placeholder="Nhập số điện thoại"
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-sm text-red-400 font-medium">
                {errors.phoneNumber}
              </p>
            )}
          </div>
        </motion.div>

        {/* Password Fields */}
        <motion.div
          variants={item}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-900"
            >
              Mật khẩu
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <LockKeyhole className="w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-600" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("password")}
                className={cn(
                  "auth-input text-gray-700 w-full pl-10 pr-12 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white text-sm placeholder-gray-400 transition-all duration-200",
                  errors.password
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
                )}
                placeholder="Nhập mật khẩu"
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
            </div>
            {errors.password && (
              <p className="text-sm text-red-400 font-medium">
                {errors.password}
              </p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-semibold text-gray-900"
            >
              Xác nhận mật khẩu
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <LockKeyhole className="w-4 h-4 text-gray-400 transition-colors duration-200 group-focus-within:text-blue-600" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("confirmPassword")}
                className={cn(
                  "auth-input text-gray-700 w-full pl-10 pr-12 py-2.5 bg-slate-50 border rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:bg-white text-sm placeholder-gray-400 transition-all duration-200",
                  errors.confirmPassword
                    ? "border-red-300 focus:border-red-500"
                    : "border-slate-200 hover:border-slate-300 focus:border-blue-500"
                )}
                placeholder="Nhập lại mật khẩu"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-r-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset group z-10"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeClosed className="w-5 h-5 transition-transform duration-200" />
                ) : (
                  <Eye className="w-5 h-5 transition-transform duration-200" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-400 font-medium">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </motion.div>

        {/* Terms Agreement */}
        <motion.div variants={item} className="space-y-2">
          <div className="flex items-start space-x-2">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur("agreeToTerms")}
              className="text-gray-700 mt-1 w-4 h-4 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="agreeToTerms" className="body-small text-gray-700">
              Tôi đồng ý với{" "}
              <a href="#" className="link-primary">
                Điều khoản & Điều kiện
              </a>{" "}
              và{" "}
              <a href="#" className="link-primary">
                Chính sách bảo mật
              </a>
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="text-sm text-red-400 font-medium">
              {errors.agreeToTerms}
            </p>
          )}
        </motion.div>

        {/* Register Button */}
        <motion.div variants={item}>
        <Button
          type="submit"
          disabled={!formData.agreeToTerms || isRegistering}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
        >
          {isRegistering ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang xử lý...
            </span>
          ) : (
            "Tạo tài khoản"
          )}
        </Button>
        </motion.div>

        {/* Divider */}
        <motion.div variants={item} className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 body-small">
              Hoặc tiếp tục với
            </span>
          </div>
        </motion.div>

        {/* Social Login Buttons */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <GoogleButton />
          <FacebookButton />
        </motion.div>

        {/* Sign In Link */}
        <motion.div variants={item} className="text-center pt-4">
          <p className="text-sm text-gray-600">
            Bạn đã có tài khoản?{" "}
            <NavLink
              to="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Đăng nhập ngay
            </NavLink>
          </p>
        </motion.div>
      </motion.form>
    );
  };

  const contentRender = () => {
    switch (currentStep) {
      case "register":
        return registerRender();
      case "verify-account":
        return verifyAccountRender();
      default:
        return registerRender();
    }
  };

  return (
    <AuthLayout
      title="Welcome to OpenEdu!"
      subtitle="Tạo tài khoản của bạn để bắt đầu hành trình học tập."
      isRegister={true}
    >
      {contentRender()}
    </AuthLayout>
  );
};

export default RegisterPage;
