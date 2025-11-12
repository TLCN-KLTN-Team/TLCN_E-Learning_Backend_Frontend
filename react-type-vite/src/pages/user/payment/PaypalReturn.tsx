import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import Header from "../../../components/student/home/Header";
import { capturePaypalOrder } from "../../../services/api/user/paymentApi";

interface PaypalPaymentResult {
  orderId: string;
  status: string;
}

const PaypalReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<
    "processing" | "success" | "failed"
  >("processing");
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
        // PayerID is available but not needed for capture
        // const payerId = searchParams.get("PayerID");

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

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleBackToCourses = () => {
    navigate("/courses");
  };

  const handleViewMyCourses = () => {
    navigate("/student/my-courses");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[80vh]">
          <Card className="p-8 text-center max-w-md mx-auto">
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="pt-20 pb-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-8 text-center">
            {paymentStatus === "success" ? (
              <>
                <div className="mb-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Thanh toán thành công!
                  </h1>
                  <p className="text-gray-600 mb-4">
                    Cảm ơn bạn đã thanh toán qua PayPal. Giao dịch của bạn đã
                    được xử lý thành công.
                  </p>
                  {paymentResult && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-600">Mã đơn hàng:</div>
                        <div className="font-semibold text-gray-900">
                          {paymentResult.orderId}
                        </div>
                        <div className="text-gray-600">Trạng thái:</div>
                        <div className="font-semibold text-green-600">
                          {paymentResult.status}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleViewMyCourses}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Xem khóa học của tôi
                  </Button>
                  <Button
                    onClick={handleBackToCourses}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Khám phá thêm khóa học
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Thanh toán không thành công
                  </h1>
                  <p className="text-gray-600 mb-4">
                    {errorMessage ||
                      "Đã có lỗi xảy ra trong quá trình xử lý thanh toán PayPal của bạn."}
                  </p>
                  {paymentResult && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {paymentResult.orderId && (
                          <>
                            <div className="text-gray-600">Mã đơn hàng:</div>
                            <div className="font-semibold text-gray-900">
                              {paymentResult.orderId}
                            </div>
                          </>
                        )}
                        <div className="text-gray-600">Trạng thái:</div>
                        <div className="font-semibold text-red-600">
                          {paymentResult.status || "Thất bại"}
                        </div>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-500 mb-6">
                    Vui lòng thử lại hoặc liên hệ với bộ phận hỗ trợ nếu vấn đề
                    vẫn tiếp tục.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleBackToCourses}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Quay lại khóa học
                  </Button>
                  <Button
                    onClick={handleBackToHome}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Về trang chủ
                  </Button>
                </div>
              </>
            )}
          </Card>

          {/* Additional Information */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về giao dịch này, vui lòng{" "}
              <a href="/contact" className="text-blue-600 hover:underline">
                liên hệ với chúng tôi
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaypalReturn;
