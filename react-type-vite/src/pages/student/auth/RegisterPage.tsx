import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import AuthLayout from "../../../components/student/auth/AuthLayout";
import { useAuth } from "@/context/auth-context/useAuth";
import { useNavigate } from "react-router-dom";
import type { RegisterData } from "@/context/auth-context/types";
import { toast } from "react-toastify";
import { isAfter } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import GoogleButton from "@/components/student/shared/GoogleButton";
import FacebookButton from "@/components/student/shared/FacebookButton";

// Utility functions for date formatting
function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

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
  const [dobOpen, setDobOpen] = useState(false);
  const [dobMonth, setDobMonth] = useState<Date | undefined>(undefined);
  const [dobValue, setDobValue] = useState("");

  const { user, register } = useAuth();

  const navigate = useNavigate();

  // Sync dobValue with formData.dob
  useEffect(() => {
    if (formData.dob) {
      setDobValue(formatDate(formData.dob));
      setDobMonth(formData.dob);
    }
  }, [formData.dob]);

  // Validation functions
  const validateField = (name: string, value: unknown): string | undefined => {
    switch (name) {
      case "firstName":
        if (!value || (typeof value === "string" && value.trim().length < 2)) {
          return "First name phải ít nhất 2 ký tự";
        }
        break;
      case "lastName":
        if (!value || (typeof value === "string" && value.trim().length < 2)) {
          return "Last name phải ít nhất 2 ký tự";
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

  const handleDateSelect = (date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      dob: date,
    }));
    setDobValue(formatDate(date));
    setDobMonth(date);
    setDobOpen(false);

    // Validate date
    const error = validateField("dob", date);
    setErrors((prev) => ({
      ...prev,
      dob: error,
    }));
  };

  const handleDateInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDobValue(value);

    const date = new Date(value);
    if (isValidDate(date)) {
      setFormData((prev) => ({
        ...prev,
        dob: date,
      }));
      setDobMonth(date);

      // Validate date
      const error = validateField("dob", date);
      setErrors((prev) => ({
        ...prev,
        dob: error,
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

    // Check if there are any errors
    if (Object.keys(newErrors).length > 0) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    // call register
    if (user) {
      navigate("/");
    }

    register(formData)
      .then(() => {
        toast.success("Đăng ký thành công! Bạn có thể đăng nhập ngay bây giờ.");
        navigate("/login");
      })
      .catch((error) => {
        console.error("Đăng ký thất bại:", error);
        toast.error(error.message || "Đăng ký thất bại");
      });
  };

  return (
    <AuthLayout
      title="Đăng ký vào OpenEdu!"
      subtitle="Tham gia cộng đồng học tập của chúng tôi ngay hôm nay!"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name Field */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label htmlFor="firstName" className="label-base text-gray-700">
              First Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
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
                  "auth-input text-gray-700 w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 body-base placeholder-gray-400",
                  errors.firstName
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                )}
                placeholder="First Name"
              />
            </div>
            {errors.firstName && (
              <p className="text-sm text-red-400 font-medium">
                {errors.firstName}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <label htmlFor="lastName" className="label-base text-gray-700">
              Last Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
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
                  "auth-input text-gray-700 w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 body-base placeholder-gray-400",
                  errors.lastName
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300 focus:border-blue-500"
                )}
                placeholder="Last Name"
              />
            </div>
            {errors.lastName && (
              <p className="text-sm text-red-400 font-medium">
                {errors.lastName}
              </p>
            )}
          </div>
        </div>

        {/* Username Field */}
        <div className="space-y-2">
          <label htmlFor="username" className="label-base text-gray-700">
            Username *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
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
                "auth-input text-gray-700 w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 body-base placeholder-gray-400",
                errors.username
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              )}
              placeholder="Username"
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
          <label htmlFor="email" className="label-base text-gray-700">
            Email address *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
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
                "auth-input text-gray-700 w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 body-base placeholder-gray-400",
                errors.email
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              )}
              placeholder="E-mail"
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-400 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="label-base text-gray-700">
            Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
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
                "auth-input text-gray-700 w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 body-base placeholder-gray-400",
                errors.password
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              )}
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500 hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                {showPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                )}
              </svg>
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
          <label htmlFor="confirmPassword" className="label-base text-gray-700">
            Confirm Password *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
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
                "auth-input text-gray-700 w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 body-base placeholder-gray-400",
                errors.confirmPassword
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              )}
              placeholder="Confirm Password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-blue-50 rounded-r-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500 hover:text-blue-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                {showConfirmPassword ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.639 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.639 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                )}
              </svg>
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-400 font-medium">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Date of Birth Field */}
        <div className="space-y-2">
          <label htmlFor="dob" className="label-base text-gray-700">
            Date of Birth *
          </label>
          <div className="relative flex gap-2">
            <Input
              id="dob"
              value={dobValue}
              placeholder="June 01, 2000"
              className={cn(
                "bg-background text-gray-700 pr-10 py-6 border rounded-lg focus:ring-2 focus:ring-blue-500 body-base placeholder-gray-400 w-full",
                errors.dob
                  ? "border-red-300 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              )}
              onChange={handleDateInputChange}
              onBlur={() => handleFieldBlur("dob")}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setDobOpen(true);
                }
              }}
            />
            <Popover open={dobOpen} onOpenChange={setDobOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date-picker"
                  variant="ghost"
                  className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                >
                  <CalendarIcon className="size-3.5" />
                  <span className="sr-only">Select date</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0 z-[9999] bg-white shadow-xl border rounded-md"
                align="end"
                alignOffset={-8}
                sideOffset={10}
                style={{
                  zIndex: 9999,
                }}
              >
                <Calendar
                  mode="single"
                  selected={formData.dob}
                  captionLayout="dropdown"
                  month={dobMonth}
                  onMonthChange={setDobMonth}
                  onSelect={handleDateSelect}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                />
              </PopoverContent>
            </Popover>
          </div>
          {errors.dob && (
            <p className="text-sm text-red-400 font-medium">{errors.dob}</p>
          )}
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
          disabled={
            Object.keys(errors).some(
              (key) => errors[key as keyof FormErrors]
            ) || !formData.agreeToTerms
          }
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg btn-text transition-colors"
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
        <div className="text-center">
          <p className="body-small text-gray-600">
            Đã có tài khoản?
            <a href="/login" className="link-primary ml-1">
              Đăng nhập ngay!
            </a>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
