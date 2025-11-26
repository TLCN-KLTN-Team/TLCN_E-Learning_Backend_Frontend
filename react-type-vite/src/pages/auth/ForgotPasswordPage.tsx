"use client";

import type React from "react";
import { useState } from "react";

import AuthLayout from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import * as forgotPasswordApi from "@/services/api/emailApi";
import OtpVerification from "@/components/auth/OtpVerification";
import ResetPassword from "@/components/auth/ResetPassword";
import { useNavigate } from "react-router-dom";

type Step = "email" | "otp" | "reset" | "success";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Send email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await forgotPasswordApi.sendResetPasswordEmail({ email: email.trim() });
      setCurrentStep("otp");
    } catch (error: any) {
      const errorCode = error?.response?.data?.code;
      const message =
        error?.response?.data?.message ||
        "Không thể gửi email. Vui lòng thử lại.";

      if (errorCode === "OTP_1027" || message.includes("không tồn tại")) {
        setError(
          "Email không tồn tại trong hệ thống. Vui lòng kiểm tra lại email của bạn."
        );
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (otpCode: string) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await forgotPasswordApi.verifyOtp(email, otpCode);
      if (response.success && response.resetToken) {
        setResetToken(response.resetToken);
        setCurrentStep("reset");
      } else {
        const error = new Error("Mã OTP không hợp lệ hoặc đã hết hạn");
        throw error;
      }
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
      await forgotPasswordApi.resendOtp(email);
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

  // Step 3: Reset password
  const handleResetPassword = async (
    newPassword: string,
    confirmPassword: string
  ) => {
    if (newPassword !== confirmPassword) {
      setError(
        "Mật khẩu và nhập lại mật khẩu không trùng nhau. Vui lòng nhập lại"
      );
      return;
    }

    // Frontend validation to match backend
    const passwordRegex =
      /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\S+$).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "Mật khẩu phải có ít nhất 6 ký tự, bao gồm: chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=!)"
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Sending reset password request with token:", resetToken);
      await forgotPasswordApi.resetPassword({
        token: resetToken,
        newPassword,
        confirmPassword,
      });
      setCurrentStep("success");
    } catch (error: any) {
      console.error("Reset password error:", error);
      console.error("Error response:", error?.response?.data);

      const errorCode = error?.response?.data?.code;
      let message = error?.response?.data?.message || error?.message;

      // Custom error messages
      if (
        errorCode === "CREDENTIAL_2003" ||
        message?.includes("không đủ mạnh")
      ) {
        message =
          "Mật khẩu phải có ít nhất 6 ký tự, bao gồm: chữ hoa, chữ thường, số và ký tự đặc biệt (@#$%^&+=!)";
      } else if (!message) {
        message = "Không thể đặt lại mật khẩu. Vui lòng thử lại.";
      }

      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Back to previous step
  const handleBack = () => {
    setError("");
    switch (currentStep) {
      case "otp":
        setCurrentStep("email");
        break;
      case "reset":
        setCurrentStep("otp");
        break;
      default:
        navigate("/login");
    }
  };

  const renderContent = () => {
    switch (currentStep) {
      case "email":
        return (
          <form onSubmit={handleSendEmail} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-black"
              >
                Email <span>*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="
                  w-full px-4 py-3 
                  bg-background border border-border rounded-lg
                  text-foreground placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-bs-primary/20 focus:border-bs-primary
                  transition-all duration-200
                  text-black
                "
                placeholder="Nhập địa chỉ email của bạn"
              />
            </div>

            {error && (
              <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="
                w-full px-6 py-3 
                bg-bs-primary text-white font-medium rounded-lg
                hover:bg-bs-primary-dark focus:outline-none focus:ring-2 focus:ring-bs-primary/20
                transition-all duration-200
                no-hover-effect
              "
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Đang gửi...
                </div>
              ) : (
                "Gửi mã xác thực"
              )}
            </button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/login")}
                disabled={isLoading}
                className="
                  text-sm text-bs-primary hover:text-bs-primary-dark 
                  transition-colors duration-200 no-hover-effect
                "
              >
                Quay lại đăng nhập
              </Button>
            </div>
          </form>
        );

      case "otp":
        return (
          <OtpVerification
            email={email}
            onVerify={handleVerifyOtp}
            onBack={handleBack}
            onResend={handleResendOtp}
            isLoading={isLoading}
            error={error}
          />
        );

      case "reset":
        return (
          <ResetPassword
            onReset={handleResetPassword}
            onBack={handleBack}
            isLoading={isLoading}
            error={error}
          />
        );

      case "success":
        return (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Đặt lại mật khẩu thành công!
              </h2>
              <p className="text-muted-foreground text-sm">
                Mật khẩu của bạn đã được cập nhật. Bạn có thể đăng nhập với mật
                khẩu mới.
              </p>
            </div>
            <Button onClick={() => navigate("/login")} className="w-full">
              Đăng nhập ngay
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (currentStep) {
      case "email":
        return "Quên mật khẩu";
      case "otp":
        return "Xác thực OTP";
      case "reset":
        return "Đặt lại mật khẩu";
      case "success":
        return "Hoàn thành";
      default:
        return "Quên mật khẩu";
    }
  };

  const getSubtitle = () => {
    switch (currentStep) {
      case "email":
        return "Nhập email của bạn để nhận mã xác thực";
      case "otp":
        return "Nhập mã OTP được gửi đến email của bạn";
      case "reset":
        return "Tạo mật khẩu mới cho tài khoản của bạn";
      case "success":
        return "Mật khẩu đã được đặt lại thành công";
      default:
        return "";
    }
  };

  return (
    <AuthLayout title={getTitle()} subtitle={getSubtitle()}>
      {renderContent()}
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
