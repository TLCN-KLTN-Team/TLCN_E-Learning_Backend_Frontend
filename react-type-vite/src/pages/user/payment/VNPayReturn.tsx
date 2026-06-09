import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card } from "../../../components/ui/card";
import Header from "../../../components/student/home/Header";
import { handleVNPayPaymentReturn } from "../../../services/api/user/payment.api";
import PaymentStatus from "./PaymentStatus";
import type { PaymentStatusType } from "./PaymentStatus";

interface PaymentResult {
  success: boolean;
  message: string;
  amount?: string;
  currency?: string;
}

// VNPay error code descriptions
const VNPAY_ERROR_MESSAGES: Record<string, string> = {
  "24": "Giao dịch bị hủy bởi người dùng",
  "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường)",
  "09": "Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng",
  "10": "Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
  "11": "Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch",
  "12": "Thẻ/Tài khoản của khách hàng bị khóa",
  "13": "Quý khách nhập sai mật khẩu xác thực giao dịch (OTP). Xin quý khách vui lòng thực hiện lại giao dịch",
  "51": "Tài khoản của quý khách không đủ số dư để thực hiện giao dịch",
  "65": "Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày",
  "75": "Ngân hàng thanh toán đang bảo trì",
  UNKNOWN: "Giao dịch không thành công do lỗi hệ thống",
};

const VNPayReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PaymentStatusType | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [orderId, setOrderId] = useState<string>("");
  const [errorCode, setErrorCode] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        setLoading(true);

        // Convert URLSearchParams to Record<string, string>
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        // Get order ID from params
        const txnRef = searchParams.get("vnp_TxnRef") || "";
        setOrderId(txnRef);

        // Call API to handle payment return
        const result = await handleVNPayPaymentReturn(params);
        setPaymentResult(result);

        // Set status based on API response
        if (result.success) {
          setStatus("success");
        } else {
          setStatus("failed");

          // Get error code and message
          const responseCode =
            searchParams.get("vnp_ResponseCode") || "UNKNOWN";
          setErrorCode(responseCode);
          setErrorMessage(
            VNPAY_ERROR_MESSAGES[responseCode] ||
              result.message ||
              VNPAY_ERROR_MESSAGES["UNKNOWN"]
          );
        }
      } catch (error) {
        console.error("Error processing payment return:", error);
        setStatus("failed");
        setErrorCode("UNKNOWN");
        setErrorMessage("Có lỗi xảy ra khi xử lý kết quả thanh toán");
        setPaymentResult({
          success: false,
          message: "Có lỗi xảy ra khi xử lý kết quả thanh toán",
        });
      } finally {
        setLoading(false);
      }
    };

    processPaymentReturn();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[80vh]">
          <Card className="p-8 text-center max-w-md mx-auto shadow-lg">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-foreground">
              Đang xử lý kết quả thanh toán...
            </h2>
            <p className="text-muted-foreground">Vui lòng đợi trong giây lát</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!status) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-20 pb-8">
        <PaymentStatus
          status={status}
          amount={paymentResult?.amount}
          currency={paymentResult?.currency}
          orderId={orderId}
          paymentMethod="VNPay"
          errorCode={errorCode}
          message={status === "success" ? paymentResult?.message : errorMessage}
        />
      </div>
    </div>
  );
};

export default VNPayReturn;
