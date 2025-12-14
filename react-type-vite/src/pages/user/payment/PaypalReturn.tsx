import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card } from "../../../components/ui/card";
import Header from "../../../components/student/home/Header";
import { capturePaypalOrder } from "../../../services/api/user/payment.api";
import PaymentStatus from "./PaymentStatus";
import type { PaymentStatusType } from "./PaymentStatus";

interface PaypalPaymentResult {
  orderId: string;
  status: string;
  amount?: string;
  currency?: string;
}

const PaypalReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusType | null>(
    null
  );
  const [paymentResult, setPaymentResult] =
    useState<PaypalPaymentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const processPaypalReturn = async () => {
      try {
        setLoading(true);

        // Get token from URL parameters
        const token = searchParams.get("token");

        if (!token) {
          setPaymentStatus("failed");
          setErrorMessage("Không tìm thấy thông tin giao dịch PayPal");
          setLoading(false);
          return;
        }

        // Call API to capture PayPal order
        const result = await capturePaypalOrder(token);
        setPaymentResult(result);

        // Set status based on API response
        if (result.status === "COMPLETED" || result.status === "SUCCESS") {
          setPaymentStatus("success");
        } else {
          setPaymentStatus("failed");
          setErrorMessage(
            `Trạng thái thanh toán: ${result.status || "Không xác định"}`
          );
        }
      } catch (error) {
        console.error("Error processing PayPal payment return:", error);
        setPaymentStatus("failed");
        const err = error as { response?: { data?: { message?: string } } };
        setErrorMessage(
          err?.response?.data?.message ||
            "Có lỗi xảy ra khi xử lý kết quả thanh toán PayPal"
        );
      } finally {
        setLoading(false);
      }
    };

    processPaypalReturn();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[80vh]">
          <Card className="p-8 text-center max-w-md mx-auto shadow-lg">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Đang xử lý kết quả thanh toán PayPal...
            </h2>
            <p className="text-gray-600">Vui lòng đợi trong giây lát</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!paymentStatus) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-20 pb-8">
        <PaymentStatus
          status={paymentStatus}
          amount={paymentResult?.amount}
          currency={paymentResult?.currency}
          orderId={paymentResult?.orderId}
          errorCode={paymentResult?.status}
          message={
            paymentStatus === "success"
              ? "Cảm ơn bạn đã thanh toán qua PayPal. Giao dịch của bạn đã được xử lý thành công."
              : errorMessage
          }
        />
      </div>
    </div>
  );
};

export default PaypalReturn;
