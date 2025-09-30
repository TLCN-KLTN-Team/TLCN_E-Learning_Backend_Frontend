"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, AlertCircle } from "lucide-react"

interface OtpVerificationProps {
  email: string
  onVerify: (otpCode: string) => Promise<void>
  onBack: () => void
  onResend: () => Promise<void>
  isLoading: boolean
  error?: string
}

const OtpVerification: React.FC<OtpVerificationProps> = ({ email, onVerify, onBack, onResend, isLoading, error }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [resendCooldown, setResendCooldown] = useState(90)
  const [resendCount, setResendCount] = useState(0)
  const [resendLockTime, setResendLockTime] = useState(0)
  const [wrongAttempts, setWrongAttempts] = useState(0)
  const [isMaxAttemptsExceeded, setIsMaxAttemptsExceeded] = useState(false)
  const [backendError, setBackendError] = useState<string>("")
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [isOtpExpired, setIsOtpExpired] = useState(false)

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
        if (resendCooldown === 1) {
          setIsOtpExpired(true)
        }
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  useEffect(() => {
    if (resendLockTime > 0) {
      const timer = setTimeout(() => setResendLockTime(resendLockTime - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendLockTime])

  const handleChange = (index: number, value: string) => {
    if (isMaxAttemptsExceeded || isOtpExpired || resendLockTime > 0) return

    if (value && !/^\d$/.test(value)) return

    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (isMaxAttemptsExceeded || isOtpExpired || resendLockTime > 0) return

    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (isMaxAttemptsExceeded || isOtpExpired || resendLockTime > 0) return

    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    const newOtp = [...otp]

    for (let i = 0; i < pastedData.length && i < 6; i++) {
      if (/^\d$/.test(pastedData[i])) {
        newOtp[i] = pastedData[i]
      }
    }

    setOtp(newOtp)

    // Focus the next empty input or the last input
    const nextEmptyIndex = newOtp.findIndex((digit) => digit === "")
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex
    inputRefs.current[focusIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isMaxAttemptsExceeded || isOtpExpired || resendLockTime > 0) return

    const otpCode = otp.join("")
    if (otpCode.length === 6) {
      try {
        await onVerify(otpCode)
        // Reset wrong attempts on success
        setWrongAttempts(0)
        setIsMaxAttemptsExceeded(false)
        setBackendError("")
        setIsOtpExpired(false)
      } catch (error: any) {
        // Xóa OTP inputs ngay lập tức
        setOtp(["", "", "", "", "", ""])
        // Focus về ô đầu tiên
        setTimeout(() => {
          inputRefs.current[0]?.focus()
        }, 0)

        const newAttempts = wrongAttempts + 1
        setWrongAttempts(newAttempts)

        // Get error details
        const errorMessage = error?.response?.data?.message || error?.message || ""
        const errorCode = error?.response?.data?.code || ""

        // Set backend error message
        if (errorMessage) {
          setBackendError(errorMessage)
        }

        // Check if max attempts exceeded (5 times)
        if (
          errorCode === "OTP_1021" ||
          errorMessage.includes("5 lần") ||
          errorMessage.includes("gửi lại email") ||
          newAttempts >= 5
        ) {
          setIsMaxAttemptsExceeded(true)
          setWrongAttempts(5)
        }
      }
    }
  }

  const handleResend = async () => {
    if (resendLockTime > 0) {
      return
    }

    try {
      await onResend()
      const newResendCount = resendCount + 1
      setResendCount(newResendCount)

      // Reset cooldown to 90 seconds
      setResendCooldown(90)

      setOtp(["", "", "", "", "", ""])
      setWrongAttempts(0)
      setIsMaxAttemptsExceeded(false)
      setBackendError("")
      setIsOtpExpired(false)

      if (newResendCount >= 3) {
        setResendLockTime(300) // 5 minutes = 300 seconds
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || ""
      setBackendError(errorMessage)
      // Check if error is about resend limit
      if (errorMessage.includes("3 lần") || errorMessage.includes("5 phút")) {
        setResendLockTime(300)
      }
    }
  }

  const isComplete = otp.every((digit) => digit !== "")

  const formatLockTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const shouldDisableInput = isLoading || isMaxAttemptsExceeded || isOtpExpired || resendLockTime > 0

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <p className="text-muted-foreground text-sm mb-1">Chúng tôi đã gửi mã xác thực 6 chữ số đến</p>
        <p className="text-black font-medium text-sm flex items-center justify-center gap-1">
          <Mail className="w-4 h-4" />
          {email}
        </p>
        <p className="text-muted-foreground text-xs mt-2">
          {resendCooldown > 0 ? (
            <span>
              Mã OTP có hiệu lực trong <span className="font-semibold text-bs-primary">{resendCooldown}s</span>
            </span>
          ) : (
            <span className="text-destructive">Mã OTP đã hết hạn. Vui lòng gửi lại</span>
          )}
        </p>
      </div>

      {isMaxAttemptsExceeded && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="text-sm font-semibold text-destructive">
                {backendError || "Bạn đã nhập sai mã OTP quá 5 lần"}
              </p>
              <p className="text-xs text-muted-foreground">
                Mã OTP hiện tại đã bị xóa. Vui lòng nhấn "Gửi lại mã OTP" để nhận mã mới.
              </p>
            </div>
          </div>
        </div>
      )}

      {resendLockTime > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Đã vượt quá số lần gửi lại</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bạn đã gửi lại mã OTP quá 3 lần. Vui lòng thử lại sau{" "}
                <span className="font-semibold text-destructive">{formatLockTime(resendLockTime)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-black text-center">
          Mã OTP <span>*</span>
        </label>
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => void (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={shouldDisableInput}
              className={`
                w-12 h-12 text-center text-lg font-semibold
                bg-background border rounded-lg
                text-black
                focus:outline-none focus:ring-2 focus:ring-bs-primary/20 focus:border-bs-primary
                transition-all duration-200
                ${shouldDisableInput ? "border-muted bg-muted/30 cursor-not-allowed opacity-60" : "border-border"}
              `}
            />
          ))}
        </div>
        {wrongAttempts > 0 && wrongAttempts < 5 && !isMaxAttemptsExceeded && (
          <p className="text-center text-sm text-muted-foreground">
            Số lần thử còn lại: <span className="font-semibold text-destructive">{5 - wrongAttempts}/5</span>
          </p>
        )}
      </div>

      {(backendError || error) && !isMaxAttemptsExceeded && resendLockTime === 0 && (
        <div className="text-destructive text-sm text-center bg-destructive/10 p-3 rounded-lg">
          {backendError || error}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isComplete || shouldDisableInput}
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
            Đang xác thực...
          </div>
        ) : (
          "Xác thực OTP"
        )}
      </button>

      <div className="text-center space-y-3">
        <p className="text-muted-foreground text-sm">Không nhận được mã?</p>
        {resendLockTime > 0 ? (
          <p className="text-sm text-destructive">
            Vui lòng thử lại sau <span className="font-semibold">{formatLockTime(resendLockTime)}</span>
          </p>
        ) : (
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={resendCooldown > 0 || isLoading}
              className="
                text-sm text-bs-primary hover:text-bs-primary-dark 
                transition-colors duration-200 no-hover-effect
              "
            >
              {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : "Gửi lại mã OTP"}
            </Button>
            {resendCount > 0 && resendCount < 3 && (
              <p className="text-xs text-muted-foreground">Đã gửi lại: {resendCount}/3 lần</p>
            )}
          </>
        )}
      </div>

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

export default OtpVerification
