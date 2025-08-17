import { useState } from "react";
import { Lock, Eye, EyeOff, Shield } from "lucide-react";
import { useTheme } from "@/context/theme-context/useTheme";
import type { ChangePasswordData } from "@/types/profile.types";

interface ChangePasswordProps {
  onChangePassword: (data: ChangePasswordData) => void;
  isLoading?: boolean;
}

const ChangePassword = ({
  onChangePassword,
  isLoading = false,
}: ChangePasswordProps) => {
  const { resolvedTheme } = useTheme();
  const [formData, setFormData] = useState<ChangePasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push("ít nhất 8 ký tự");
    if (!/[A-Z]/.test(password)) errors.push("ít nhất 1 chữ hoa");
    if (!/[a-z]/.test(password)) errors.push("ít nhất 1 chữ thường");
    if (!/[0-9]/.test(password)) errors.push("ít nhất 1 số");
    if (!/[!@#$%^&*]/.test(password)) errors.push("ít nhất 1 ký tự đặc biệt");
    return errors;
  };

  const handleInputChange = (
    field: keyof ChangePasswordData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    // Validate current password
    if (!formData.currentPassword) {
      newErrors.currentPassword = "Vui lòng nhập mật khẩu hiện tại";
    }

    // Validate new password
    if (!formData.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else {
      const passwordErrors = validatePassword(formData.newPassword);
      if (passwordErrors.length > 0) {
        newErrors.newPassword = `Mật khẩu phải có ${passwordErrors.join(", ")}`;
      }
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    // Check if new password is same as current
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu hiện tại";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      onChangePassword(formData);
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const passwordStrength = validatePassword(formData.newPassword);

  return (
    <div
      className={`p-6 rounded-lg shadow-lg ${
        resolvedTheme === "dark"
          ? "bg-slate-800 border border-slate-700"
          : "bg-white border border-slate-200"
      }`}
    >
      <div className="flex items-center space-x-2 mb-6">
        <Shield className="w-6 h-6 text-red-600" />
        <h2
          className={`text-2xl font-bold ${
            resolvedTheme === "dark" ? "text-white" : "text-slate-900"
          }`}
        >
          Đổi mật khẩu
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              resolvedTheme === "dark" ? "text-slate-300" : "text-slate-700"
            }`}
          >
            Mật khẩu hiện tại
          </label>
          <div className="relative">
            <input
              type={showPasswords.current ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) =>
                handleInputChange("currentPassword", e.target.value)
              }
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                errors.currentPassword
                  ? "border-red-500"
                  : resolvedTheme === "dark"
                  ? "border-slate-600 bg-slate-700 text-white placeholder-slate-400"
                  : "border-slate-300 bg-white text-slate-900"
              }`}
              placeholder="Nhập mật khẩu hiện tại"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("current")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPasswords.current ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.currentPassword}
            </p>
          )}
        </div>

        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              type={showPasswords.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => handleInputChange("newPassword", e.target.value)}
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.newPassword
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Nhập mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("new")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPasswords.new ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Password strength indicator */}
          {formData.newPassword && (
            <div className="mt-2">
              <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                Độ mạnh mật khẩu:
              </div>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded ${
                      passwordStrength.length <= 5 - level
                        ? level <= 2
                          ? "bg-red-500"
                          : level <= 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {errors.newPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.newPassword}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) =>
                handleInputChange("confirmPassword", e.target.value)
              }
              className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${
                errors.confirmPassword
                  ? "border-red-500 dark:border-red-500"
                  : "border-gray-300 dark:border-gray-600"
              }`}
              placeholder="Xác nhận mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility("confirm")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPasswords.confirm ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center space-x-2 w-full md:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Lock className="w-5 h-5" />
            <span>{isLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;
