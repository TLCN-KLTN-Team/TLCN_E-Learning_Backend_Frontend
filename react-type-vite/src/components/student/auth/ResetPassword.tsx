"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Eye, EyeOff, CheckCircle } from "lucide-react"

interface ResetPasswordProps {
  onReset: (newPassword: string, confirmPassword: string) => Promise<void>
  onBack: () => void
  isLoading: boolean
  error?: string
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ onReset, onBack, isLoading, error }) => {
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  })
  const [validations, setValidations] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
    passwordsMatch: false,
  })

  const validatePassword = (password: string, confirmPassword: string) => {
    const newValidations = {
      minLength: password.length >= 6,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      passwordsMatch: password === confirmPassword && password.length > 0,
    }
    setValidations(newValidations)
    return Object.values(newValidations).every(Boolean)
  }

  const handleChange = (field: "newPassword" | "confirmPassword", value: string) => {
    const newFormData = { ...formData, [field]: value }
    setFormData(newFormData)
    validatePassword(newFormData.newPassword, newFormData.confirmPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (validatePassword(formData.newPassword, formData.confirmPassword)) {
      await onReset(formData.newPassword, formData.confirmPassword)
    }
  }

  const isFormValid = Object.values(validations).every(Boolean)

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-sm ${isValid ? "text-green-600" : "text-muted-foreground"}`}>
      <CheckCircle className={`w-4 h-4 ${isValid ? "text-green-600" : "text-gray-300"}`} />
      {text}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* New Password Field */}
        <div className="space-y-2">
          <label htmlFor="newPassword" className="block text-sm font-medium text-black">
            Mật khẩu mới <span>*</span>
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showPassword.new ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              disabled={isLoading}
              className="
                w-full px-4 py-3 pr-12
                bg-background border border-border rounded-lg
                text-foreground placeholder:text-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-bs-primary/20 focus:border-bs-primary
                transition-all duration-200
                text-black
              "
              placeholder="Nhập mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => ({ ...prev, new: !prev.new }))}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword.new ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-black">
            Xác nhận mật khẩu <span>*</span>
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showPassword.confirm ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              disabled={isLoading}
              className="
                w-full px-4 py-3 pr-12
                bg-background border border-border rounded-lg
                text-foreground placeholder:text-muted-foreground
                focus:outline-none focus:ring-2 focus:ring-bs-primary/20 focus:border-bs-primary
                transition-all duration-200
                text-black
              "
              placeholder="Nhập lại mật khẩu mới"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => ({ ...prev, confirm: !prev.confirm }))}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword.confirm ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Password Requirements */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <p className="text-sm font-medium text-black mb-3">Yêu cầu mật khẩu:</p>
        <div className="grid grid-cols-1 gap-2">
          <ValidationItem isValid={validations.minLength} text="Ít nhất 6 ký tự" />
          <ValidationItem isValid={validations.hasUppercase} text="Có chữ hoa (A-Z)" />
          <ValidationItem isValid={validations.hasLowercase} text="Có chữ thường (a-z)" />
          <ValidationItem isValid={validations.hasNumber} text="Có số (0-9)" />
          <ValidationItem isValid={validations.hasSpecialChar} text="Có ký tự đặc biệt (!@#$%^&*)" />
          <ValidationItem isValid={validations.passwordsMatch} text="Mật khẩu khớp nhau" />
        </div>
      </div>

      {error && (
        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isFormValid || isLoading}
        className="
          w-full px-6 py-3 
          bg-bs-primary text-white font-medium rounded-lg
          hover:bg-bs-primary-dark focus:outline-none focus:ring-2 focus:ring-bs-primary/20
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          no-hover-effect
        "
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            Đang đặt lại...
          </div>
        ) : (
          "Đặt lại mật khẩu"
        )}
      </button>

      <div className="text-center">
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="
            text-sm text-bs-primary hover:text-bs-primary-dark 
            transition-colors duration-200 no-hover-effect
          "
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>
    </div>
  )
}

export default ResetPassword