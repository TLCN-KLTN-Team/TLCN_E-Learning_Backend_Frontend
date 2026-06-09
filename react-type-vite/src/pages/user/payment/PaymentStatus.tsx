import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Check,
  XCircle,
  RefreshCw,
  ShoppingCart,
  MessageCircle,
  ArrowRight,
  GraduationCap,
  Compass,
  ShieldCheck,
  Sparkles,
  Hash,
  CreditCard,
  CalendarDays,
  Mail,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import openEduLight from "@/assets/open-edu-light.png";

export type PaymentStatusType = "success" | "failed";

export interface PaymentStatusProps {
  status: PaymentStatusType;
  orderId?: string;
  amount?: string;
  currency?: string;
  /** Payment gateway used, e.g. "VNPay" | "PayPal" */
  paymentMethod?: string;
  /** Pre-formatted payment time; defaults to the current time in vi-VN */
  paymentDate?: string;
  errorCode?: string;
  message?: string;
  onRetry?: () => void;
  showCartButton?: boolean;
  showSupportButton?: boolean;
}

const formatNow = (): string => {
  try {
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toLocaleString("vi-VN");
  }
};

/**
 * PaymentStatus Component
 *
 * Reusable component for displaying payment success or failure status.
 * Works with any payment gateway (VNPay, PayPal, etc.) and is fully
 * theme-aware (light & dark) via semantic design tokens.
 */
const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  orderId,
  amount,
  currency,
  paymentMethod,
  paymentDate,
  errorCode,
  message,
  onRetry,
  showCartButton = true,
  showSupportButton = true,
}) => {
  const navigate = useNavigate();

  const handleGoToMyCourses = () => navigate("/my-courses");
  const handleContinueExploring = () => navigate("/courses");
  const handleRetry = () => (onRetry ? onRetry() : navigate(-1));
  const handleBackToCart = () => navigate("/cart");
  const handleContactSupport = () => {
    window.location.href = "mailto:support@elearning.com";
  };

  if (status === "success") {
    const displayDate = paymentDate || formatNow();
    const hasAmount = !!amount;

    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Receipt / ticket card */}
          <Card className="relative overflow-hidden border-border/70 p-0 shadow-xl">
            {/* ───── Branded gradient header ───── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-[hsl(var(--success))] px-8 pt-10 pb-14 text-center">
              {/* Decorative glow blobs */}
              <div className="pointer-events-none absolute -top-16 -right-12 h-44 w-44 rounded-full bg-white/15 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[hsl(var(--success)/0.4)] blur-3xl" />

              {/* Brand mark */}
              <div className="relative mb-7 flex items-center justify-center">
                <img
                  src={openEduLight}
                  alt="OpenEdu"
                  className="h-7 w-auto object-contain drop-shadow-sm"
                />
              </div>

              {/* Animated success badge */}
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30 [animation-duration:2s]" />
                <span className="absolute inline-flex h-20 w-20 rounded-full bg-white/20" />
                <span className="relative inline-flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-lg">
                  <Check
                    className="h-9 w-9 text-[hsl(var(--success))] animate-bounce-once"
                    strokeWidth={3.5}
                  />
                </span>
              </div>
            </div>

            {/* ───── Perforated divider (ticket tear) ───── */}
            <div className="relative">
              {/* Side notches use the page background so they read as cut-outs */}
              <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
              <span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
              <div className="mx-6 border-t-2 border-dashed border-border" />
            </div>

            {/* ───── Receipt body ───── */}
            <div className="px-8 pb-8 pt-7 text-center">
              <div className="mb-1.5 inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--success)/0.12)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[hsl(var(--success))]">
                <Sparkles className="h-3.5 w-3.5" />
                Biên nhận điện tử
              </div>

              <h1 className="font-heading text-2xl font-bold text-foreground">
                Thanh toán thành công!
              </h1>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
                {message ||
                  "Cảm ơn bạn đã đồng hành cùng OpenEdu. Khóa học đã sẵn sàng — hãy bắt đầu hành trình học tập của bạn ngay hôm nay!"}
              </p>

              {/* Detail rows */}
              <div className="mt-6 space-y-px overflow-hidden rounded-xl border border-border bg-muted/40 text-left">
                {orderId && (
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Hash className="h-4 w-4 shrink-0 text-primary" />
                      Mã đơn hàng
                    </span>
                    <span className="truncate font-mono text-sm font-semibold text-foreground">
                      {orderId}
                    </span>
                  </div>
                )}

                {paymentMethod && (
                  <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-4 w-4 shrink-0 text-primary" />
                      Phương thức
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {paymentMethod}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 border-t border-border/60 px-4 py-3">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
                    Thời gian
                  </span>
                  <span className="text-sm font-semibold text-foreground">
                    {displayDate}
                  </span>
                </div>

                {hasAmount && (
                  <div className="flex items-center justify-between gap-3 border-t-2 border-dashed border-border bg-[hsl(var(--success)/0.08)] px-4 py-3.5">
                    <span className="text-sm font-semibold text-foreground">
                      Tổng thanh toán
                    </span>
                    <span className="text-lg font-bold text-[hsl(var(--success))]">
                      {amount} {currency || "VND"}
                    </span>
                  </div>
                )}
              </div>

              {/* Email note */}
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                Biên nhận đã được gửi tới email của bạn
              </p>

              {/* Action buttons */}
              <div className="mt-6 space-y-3">
                <Button
                  onClick={handleGoToMyCourses}
                  className="group h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Đến khóa học của tôi
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button
                  onClick={handleContinueExploring}
                  variant="outline"
                  className="h-12 w-full rounded-xl border-border text-base font-medium text-foreground hover:bg-muted"
                >
                  <Compass className="mr-2 h-5 w-5" />
                  Tiếp tục khám phá
                </Button>
              </div>

              {/* Trust footer */}
              <div className="mt-6 flex items-center justify-center gap-1.5 border-t border-border pt-5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--success))]" />
                Giao dịch được bảo mật &amp; mã hóa bởi OpenEdu
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ───── Failed state ─────
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
      <Card className="w-full max-w-md p-8 text-center shadow-xl">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <XCircle className="h-12 w-12 text-destructive" strokeWidth={2.5} />
          </div>

          <h1 className="font-heading text-2xl font-bold text-foreground">
            Thanh toán thất bại
          </h1>

          <p className="mt-3 text-muted-foreground">
            {message ||
              "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại sau."}
          </p>
        </div>

        {/* Error Code */}
        {errorCode && (
          <div className="mb-6 rounded-xl border border-border bg-muted/40 p-4">
            <p className="mb-1 text-sm text-muted-foreground">Mã lỗi</p>
            <p className="font-mono text-lg font-semibold text-foreground">
              {errorCode}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Thử lại
          </Button>

          {showCartButton && (
            <Button
              onClick={handleBackToCart}
              variant="outline"
              className="h-12 w-full rounded-xl border-border text-base font-medium text-foreground hover:bg-muted"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Quay lại giỏ hàng
            </Button>
          )}

          {showSupportButton && (
            <Button
              onClick={handleContactSupport}
              variant="ghost"
              className="h-12 w-full rounded-xl text-base font-medium text-muted-foreground hover:bg-muted"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Liên hệ hỗ trợ
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentStatus;
