import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import Header from "../../../components/student/home/Header";
import { handleVNPayPaymentReturn } from "../../../services/api/user/payment.api";

interface PaymentResult {
  success: boolean;
  message: string;
}

const VNPayReturn: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "success" | "failed">(
    "processing"
  );
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processPaymentReturn = async () => {
      try {
        setLoading(true);

        // Convert URLSearchParams to Record<string, string>
        const params: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          params[key] = value;
        });

        // Call API to handle payment return
        const result = await handleVNPayPaymentReturn(params);
        setPaymentResult(result);

        // Set status based on API response
        if (result.success) {
          setStatus("success");
        } else {
          setStatus("failed");
        }
      } catch (error) {
        console.error("Error processing payment return:", error);
        setStatus("failed");
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

  const handleBackToHome = () => {
    navigate("/");
  };

  const handleBackToCourses = () => {
    navigate("/courses");
  };

  const handleViewMyCourses = () => {
    navigate("/my-courses");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[80vh]">
          <Card className="p-8 text-center max-w-md mx-auto">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Đang xử lý kết quả thanh toán...
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
            {status === "success" ? (
              <>
                <div className="mb-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Thanh toán thành công!
                  </h1>
                  <p className="text-lg text-gray-600">
                    {paymentResult?.message ||
                      "Giao dịch của bạn đã được xử lý thành công."}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Thông tin giao dịch
                  </h3>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <strong>Mã giao dịch:</strong>{" "}
                      {searchParams.get("vnp_TransactionNo") || "N/A"}
                    </p>
                    <p>
                      <strong>Mã đơn hàng:</strong>{" "}
                      {searchParams.get("vnp_TxnRef") || "N/A"}
                    </p>
                    <p>
                      <strong>Số tiền:</strong>{" "}
                      {searchParams.get("vnp_Amount")
                        ? new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND",
                          }).format(
                            parseInt(searchParams.get("vnp_Amount")!) / 100
                          )
                        : "N/A"}
                    </p>
                    <p>
                      <strong>Thời gian:</strong>{" "}
                      {searchParams.get("vnp_PayDate")
                        ? new Date(
                            `${searchParams
                              .get("vnp_PayDate")!
                              .slice(0, 4)}-${searchParams
                              .get("vnp_PayDate")!
                              .slice(4, 6)}-${searchParams
                              .get("vnp_PayDate")!
                              .slice(6, 8)} ${searchParams
                              .get("vnp_PayDate")!
                              .slice(8, 10)}:${searchParams
                              .get("vnp_PayDate")!
                              .slice(10, 12)}:${searchParams
                              .get("vnp_PayDate")!
                              .slice(12, 14)}`
                          ).toLocaleString("vi-VN")
                        : "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleViewMyCourses}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Xem khóa học của tôi
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleBackToCourses}
                      variant="outline"
                      className="flex-1"
                    >
                      Tiếp tục mua sắm
                    </Button>
                    <Button
                      onClick={handleBackToHome}
                      variant="outline"
                      className="flex-1"
                    >
                      Về trang chủ
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Thanh toán thất bại!
                  </h1>
                  <p className="text-lg text-gray-600">
                    {paymentResult?.message ||
                      "Có lỗi xảy ra trong quá trình thanh toán."}
                  </p>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-red-800 mb-2">
                    Chi tiết lỗi
                  </h3>
                  <div className="text-sm text-red-700 space-y-1">
                    <p>
                      <strong>Mã lỗi:</strong>{" "}
                      {searchParams.get("vnp_ResponseCode") || "N/A"}
                    </p>
                    <p>
                      <strong>Mã đơn hàng:</strong>{" "}
                      {searchParams.get("vnp_TxnRef") || "N/A"}
                    </p>
                    {searchParams.get("vnp_ResponseCode") === "24" && (
                      <p className="text-red-600 font-medium">
                        Giao dịch bị hủy bởi người dùng
                      </p>
                    )}
                    {searchParams.get("vnp_ResponseCode") === "07" && (
                      <p className="text-red-600 font-medium">
                        Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan
                        tới lừa đảo, giao dịch bất thường)
                      </p>
                    )}
                    {searchParams.get("vnp_ResponseCode") === "09" && (
                      <p className="text-red-600 font-medium">
                        Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ
                        InternetBanking tại ngân hàng
                      </p>
                    )}
                    {searchParams.get("vnp_ResponseCode") === "10" && (
                      <p className="text-red-600 font-medium">
                        Khách hàng xác thực thông tin thẻ/tài khoản không đúng
                        quá 3 lần
                      </p>
                    )}
                    {searchParams.get("vnp_ResponseCode") === "11" && (
                      <p className="text-red-600 font-medium">
                        Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực
                        hiện lại giao dịch
                      </p>
                    )}
                    {searchParams.get("vnp_ResponseCode") === "12" && (
                      <p className="text-red-600 font-medium">
                        Thẻ/Tài khoản của khách hàng bị khóa
                      </p>
                    )}
                    {searchParams.get("vnp_ResponseCode") === "13" && (
                      <p className="text-red-600 font-medium">
                        Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).
                        Xin quý khách vui lòng thực hiện lại giao dịch
                      </p>
                    )}
                    {searchParams.get("vnp_ResponseCode") === "51" && (
                      <p className="text-red-600 font-medium">
                        Tài khoản của quý khách không đủ số dư để thực hiện giao
                        dịch
                      </p>
                    )}
                    {searchParams.get("vnp_ResponseCode") === "65" && (
                      <p className="text-red-600 font-medium">
                        Tài khoản của Quý khách đã vượt quá hạn mức giao dịch
                        trong ngày
                      </p>
                    )}
                    {searchParams.get("vnp_ResponseCode") === "75" && (
                      <p className="text-red-600 font-medium">
                        Ngân hàng thanh toán đang bảo trì
                      </p>
                    )}
                    {![
                      "24",
                      "07",
                      "09",
                      "10",
                      "11",
                      "12",
                      "13",
                      "51",
                      "65",
                      "75",
                    ].includes(searchParams.get("vnp_ResponseCode") || "") && (
                      <p className="text-red-600 font-medium">
                        Giao dịch không thành công do lỗi hệ thống
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => navigate(-1)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Thử lại thanh toán
                  </Button>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleBackToCourses}
                      variant="outline"
                      className="flex-1"
                    >
                      Xem khóa học khác
                    </Button>
                    <Button
                      onClick={handleBackToHome}
                      variant="outline"
                      className="flex-1"
                    >
                      Về trang chủ
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>

          {/* Additional Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>
              Nếu bạn có bất kỳ câu hỏi nào về giao dịch này, vui lòng liên hệ
              với chúng tôi qua email: support@elearning.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VNPayReturn;
