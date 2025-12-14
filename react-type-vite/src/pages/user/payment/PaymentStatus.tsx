import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export type PaymentStatusType = "success" | "failed";

export interface PaymentStatusProps {
  status: PaymentStatusType;
  orderId?: string;
  amount?: string;
  currency?: string;
  errorCode?: string;
  message?: string;
  onRetry?: () => void;
  showCartButton?: boolean;
  showSupportButton?: boolean;
}

/**
 * PaymentStatus Component
 *
 * Reusable component for displaying payment success or failure status.
 * Can be used with any payment gateway (VNPay, PayPal, etc.)
 *
 * @param status - "success" or "failed"
 * @param orderId - Order ID to display
 * @param errorCode - Error code for failed payments
 * @param message - Custom message to display
 * @param onRetry - Callback for retry action
 * @param showCartButton - Show "Back to cart" button
 * @param showSupportButton - Show "Contact support" button
 */
const PaymentStatus: React.FC<PaymentStatusProps> = ({
  status,
  orderId,
  amount,
  currency,
  errorCode,
  message,
  onRetry,
  showCartButton = true,
  showSupportButton = true,
}) => {
  const navigate = useNavigate();

  const handleGoToMyCourses = () => {
    navigate("/my-courses");
  };

  const handleContinueExploring = () => {
    navigate("/courses");
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      navigate(-1);
    }
  };

  const handleBackToCart = () => {
    navigate("/cart");
  };

  const handleContactSupport = () => {
    // You can replace this with your support page or contact modal
    window.location.href = "mailto:support@elearning.com";
  };

  if (status === "success") {
    return (
      <div className="flex items-center justify-center min-h-[80vh] px-4">
        <Card className="w-full max-w-md p-8 text-center shadow-lg">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100">
              <CheckCircle
                className="w-12 h-12 text-green-600"
                strokeWidth={2.5}
              />
            </div>

            {/* Success Title */}
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              Thanh toán thành công!
            </h1>

            {/* Success Message */}
            <p className="text-gray-600">
              {message ||
                "Cảm ơn bạn đã đăng ký khóa học. Bạn có thể bắt đầu học ngay bây giờ."}
            </p>
          </div>

          {/* Order ID */}
          {orderId && (
            <div className="bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Mã đơn hàng</p>
              <p className="text-lg font-semibold text-gray-900">{orderId}</p>
            </div>
          )}

          {/* Payment Amount */}
          {amount && (
            <div className="bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Số tiền thanh toán</p>
              <p className="text-lg font-semibold text-gray-900">
                {amount} {currency || "VND"}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoToMyCourses}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium rounded-lg"
            >
              Đến khóa học của tôi
            </Button>
            <Button
              onClick={handleContinueExploring}
              variant="outline"
              className="w-full h-12 text-base font-medium rounded-lg border-gray-300 hover:bg-gray-50"
            >
              Tiếp tục khám phá
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Failed State
  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <Card className="w-full max-w-md p-8 text-center shadow-lg">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
            <XCircle className="w-12 h-12 text-red-600" strokeWidth={2.5} />
          </div>

          {/* Error Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Thanh toán thất bại
          </h1>

          {/* Error Message */}
          <p className="text-gray-600 mb-6">
            {message ||
              "Đã xảy ra lỗi trong quá trình thanh toán. Vui lòng thử lại sau."}
          </p>
        </div>

        {/* Error Code */}
        {errorCode && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500 mb-1">Mã lỗi</p>
            <p className="text-lg font-semibold text-gray-900">{errorCode}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-medium rounded-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Thử lại
          </Button>

          {showCartButton && (
            <Button
              onClick={handleBackToCart}
              variant="outline"
              className="w-full h-12 text-base font-medium rounded-lg border-gray-300 hover:bg-gray-50"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Quay lại giỏ hàng
            </Button>
          )}

          {showSupportButton && (
            <Button
              onClick={handleContactSupport}
              variant="ghost"
              className="w-full h-12 text-base font-medium rounded-lg hover:bg-gray-50"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Liên hệ hỗ trợ
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PaymentStatus;
