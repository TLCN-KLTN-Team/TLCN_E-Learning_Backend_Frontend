import { useState } from "react";
import { Button } from "../../../components/ui/button";
import AuthLayout from "../../../components/student/auth/AuthLayout";
import { useAuth } from "@/context/auth-context/useAuth";
import { useNavigate } from "react-router-dom";
import type { RegisterData } from "@/context/auth-context/types";
import { toast } from "react-toastify";
import { isAfter } from "date-fns";
import { Eye, EyeClosed, LockKeyhole, Mail, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import GoogleButton from "@/components/shared/button/GoogleButton";
import FacebookButton from "@/components/shared/button/FacebookButton";
import OtpVerification from "@/components/student/auth/OtpVerification";

import { emailApi } from "@/services/api/index";

// Interface for form errors
interface FormErrors {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  dob?: string;
  agreeToTerms?: string;
}

const RegisterPage = () => {
  const [formData, setFormData] = useState<RegisterData>({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    dob: undefined,
    agreeToTerms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [currentStep, setCurrentStep] = useState<string>("register");

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
      case "username":
        if (!value || (typeof value === "string" && value.trim().length < 3)) {
          return "Username phải ít nhất 3 ký tự";
        }
        if (typeof value === "string" && !/^[a-zA-Z0-9_]+$/.test(value)) {
          return "Username chỉ có thể chứa chữ cái, số và dấu gạch dưới (_)";
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
      case "dob": {
        if (!value) {
          return "Vui lòng chọn ngày sinh của bạn";
        }
        const today = new Date();
        const birthDate = new Date(value as string);
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 13) {
          return "Yêu cầu từ 13 tuổi trở lên để đăng ký";
        }
        if (isAfter(birthDate, today)) {
          return "Ngày sinh không thể trong tương lai";
        }
        break;
      }
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
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof RegisterData]);
      if (error) {
        newErrors[key as keyof FormErrors] = error;
      }
    });

    setErrors(newErrors);

    if (user) {
      navigate("/");
    }

    // Step 1: Register user and send verification code
    register(formData)
      .then((email: string) => {
        setEmailToVerify(email);
        setCurrentStep("verify-account");
        toast.success("Cần xác minh OTP đã được gửi đến email của bạn");
      })
      .catch((error) => {
        console.error("Đăng ký thất bại:", error);
        toast.error(error.message || "Đăng ký thất bại");
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
          "Xác minh tài khoản thành công! Bạn có thể đăng nhập ngay bây giờ."
        );
        navigate("/login");
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
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username and Email Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* First Name Field */}
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-semibold text-gray-900"
            >
              First Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserRound className="w-4 h-4 text-gray-400" />
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
                  "auth-input text-gray-700 w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 transition-all",
                  errors.firstName
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                )}
                placeholder="Nhập first name"
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
              Last Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserRound className="w-4 h-4 text-gray-400" />
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
                    : "border-gray-300 focus:border-blue-500"
                )}
                placeholder="Nhập last name"
              />
            </div>
            {errors.lastName && (
              <p className="text-sm text-red-400 font-medium">
                {errors.lastName}
              </p>
            )}
          </div>
          {/* Username Field */}
          <div className="space-y-2">
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-900"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserRound className="w-4 h-4 text-gray-400" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur("username")}
                className={cn(
                  "auth-input text-gray-700 w-full pl-9 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 transition-all",
                  errors.username
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                )}
                placeholder="Nhập username"
              />
            </div>
            {errors.username && (
              <p className="text-sm text-red-400 font-medium">
                {errors.username}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-900"
            >
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-gray-400" />
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
                    : "border-gray-300 focus:border-blue-500"
                )}
                placeholder="Nhập e-mail"
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-400 font-medium">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Password Fields */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Password Field */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-900"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockKeyhole className="w-4 h-4 text-gray-400" />
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
                  "auth-input text-gray-700 w-full pl-9 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 transition-all",
                  errors.password
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                )}
                placeholder="Nhập password"
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
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockKeyhole className="w-4 h-4 text-gray-400" />
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
                  "auth-input text-gray-700 w-full pl-9 pr-12 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm placeholder-gray-400 transition-all",
                  errors.confirmPassword
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                )}
                placeholder="Nhập confirm password"
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
        </div>

        {/* Terms Agreement */}
        <div className="space-y-2">
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
        </div>

        {/* Register Button */}
        <Button
          type="submit"
          disabled={!formData.agreeToTerms}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 focus:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md hover:shadow-lg"
        >
          Tạo tài khoản
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 body-small">
              Hoặc tiếp tục với
            </span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <GoogleButton />
          <FacebookButton />
        </div>

        {/* Sign In Link */}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-600">
            Bạn đã có tài khoản?{" "}
            <a
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Đăng nhập ngay
            </a>
          </p>
        </div>
      </form>
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
