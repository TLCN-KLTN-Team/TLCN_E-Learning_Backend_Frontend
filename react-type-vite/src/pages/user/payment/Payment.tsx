import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  ShoppingCart,
  Loader2,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import Header from "../../../components/student/home/Header";
import Footer from "@/components/student/home/Footer";

import vnpayLogo from "@/assets/payment/vnpay.svg";
import paypalLogo from "@/assets/payment/paypal.svg";

import PaymentService, {
  type OrderPreviewResponse,
} from "@/services/api/user/payment.api";

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("vnpay");
  const [orderPreview, setOrderPreview] = useState<OrderPreviewResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleCompletePayment = async () => {
    if (!selectedCountry) {
      alert("Vui lòng hoàn thành tất cả các trường và chấp nhận điều khoản");
      return;
    }

    if (!orderPreview || orderPreview.items.length === 0) {
      alert("Không có khóa học nào để thanh toán.");
      return;
    }

    setShowPaymentDialog(true);

    try {
      // Create order items from orderPreview.items
      const orderItems = orderPreview.items.map((item) => ({
        publishedCourseId: item.id,
        finishedFee: item.amount,
      }));

      const paymentData = {
        amount: orderPreview.amount,
        currency: selectedCountry,
        paymentType: selectedPayment,
        orderItems: orderItems,
      };

      console.log("Creating payment with data:", paymentData);
      const response = await PaymentService.createPayment(paymentData);

      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        alert("Không thể tạo thanh toán. Vui lòng thử lại.");
        setShowPaymentDialog(false);
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      setShowPaymentDialog(false);
      alert("Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    document.title = "Checkout - E-Learning Platform";

    const loadCheckoutData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const courseIds = location.state?.courseIds as number[] | undefined;

        if (courseIds && courseIds.length > 0) {
          const preview = await PaymentService.getOrderPreview({
            courseIds,
            currency: "VND",
          });
          setOrderPreview(preview);
          console.log("Order preview data:", preview);
          setIsLoading(false);
        } else {
          setError(
            "Không tìm thấy thông tin khóa học. Vui lòng chọn khóa học từ danh sách."
          );
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Error loading checkout data:", err);
        setError("Đã xảy ra lỗi khi tải thông tin. Vui lòng thử lại sau.");
        setIsLoading(false);
      }
    };

    loadCheckoutData();
  }, [location.state]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="pt-20 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-700 hover:bg-gray-100 mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Course
          </Button>

          {/* Page Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải thông tin khóa học...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="p-8 text-center max-w-2xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Không tìm thấy thông tin khóa học
                </h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button
                  onClick={() => navigate("/courses")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Quay về danh sách khóa học
                </Button>
              </div>
            </Card>
          )}

          {/* Payment Form - Only show when data is loaded */}
          {!isLoading &&
            !error &&
            orderPreview &&
            orderPreview.items.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column - Payment Form */}
                <div className="lg:col-span-2 space-y-2">
                  {/* Country Selection */}
                  <Card className="p-4">
                    <h2 className="text-xl font-semibold">Quốc gia</h2>
                    <p className="text-gray-600">
                      Chọn quốc gia của bạn để phục vụ mục đích thanh toán
                    </p>

                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select your country</option>
                      {selectedPayment === "vnpay" && (
                        <option value="vn">Vietnam</option>
                      )}
                      {selectedPayment === "paypal" && (
                        <>
                          <option value="USD">United States</option>
                          <option value="EUR">Eurozone</option>
                          <option value="GBP">United Kingdom</option>
                          <option value="JPY">Japan</option>
                          <option value="KRW">South Korea</option>
                        </>
                      )}
                    </select>
                  </Card>

                  {/* Payment Method */}
                  <Card className="p-4">
                    <h2 className="text-xl font-semibold">
                      Phương thức thanh toán
                    </h2>
                    <p className="text-gray-600">Chọn phương thức thanh toán</p>

                    <div className="space-y-2">
                      {/* VNPay Option */}
                      <div className="border rounded-lg p-4">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="payment"
                            value="vnpay"
                            checked={selectedPayment === "vnpay"}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          <div className="ml-3 flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center mr-3">
                              <img src={vnpayLogo} alt="VNPay" />
                            </div>
                            <div>
                              <div className="font-medium">VNPay</div>
                              <div className="text-sm text-gray-500">
                                Cổng thanh toán phổ biến tại Việt Nam
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* PayPal Option */}
                      <div className="border rounded-lg p-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            name="payment"
                            value="paypal"
                            checked={selectedPayment === "paypal"}
                            onChange={(e) => setSelectedPayment(e.target.value)}
                            className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                          />
                          <div className="ml-3 flex items-center">
                            <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center mr-3">
                              <img src={paypalLogo} alt="PayPal" />
                            </div>
                            <div>
                              <div className="font-medium">PayPal</div>
                              <div className="text-sm text-gray-500">
                                Thanh toán quốc tế an toàn và nhanh chóng
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </Card>

                  {/* Order Information */}
                  <Card className="p-4">
                    <h2 className="text-xl font-semibold">
                      Thông tin đơn hàng
                    </h2>

                    {/* List of items */}
                    <div className="space-y-1">
                      {orderPreview.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-2 border-b last:border-b-0"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.courseName}
                            className="w-20 h-14 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                          <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded items-center justify-center hidden">
                            <ShoppingCart className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {item.courseName}
                            </h3>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">
                              {item.price}
                            </div>
                            <div className="text-sm text-gray-400 line-through">
                              {item.discountedPrice}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Right Column - Order Summary (Sticky) */}
                <div className="lg:col-span-1">
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold">Tóm tắt đơn đặt hàng</h2>

                    {/* Giá gốc */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Giá gốc:</span>
                      <span className="">{orderPreview.originalPrice}</span>
                    </div>

                    {/* Chiết khấu */}
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <span className="text-gray-600">
                        Chiết khấu (Giảm giá):
                      </span>
                      <span className="">{orderPreview.discountedPrice}</span>
                    </div>

                    {/* Tổng tiền */}
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-bold text-xl">
                        Tổng tiền ({orderPreview.items.length} khóa học):
                      </span>
                      <span className="text-2xl font-bold">
                        {orderPreview.totalPrice}
                      </span>
                    </div>

                    {/* Terms notice */}
                    <div className="mb-4">
                      <label className="flex items-start gap-2 cursor-pointer">
                        <span className="text-sm text-gray-600">
                          Bằng việc hoàn tất giao dịch mua, bạn đồng ý với các{" "}
                          <a href="#" className="text-blue-600 hover:underline">
                            Điều khoản dịch vụ này
                          </a>
                          .
                        </span>
                      </label>
                    </div>

                    {/* Complete Purchase Button */}
                    <Button
                      onClick={handleCompletePayment}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 disabled:bg-gray-300 disabled:cursor-not-allowed mb-4"
                    >
                      Tiếp tục
                    </Button>

                    {/* Money back guarantee */}
                    <div className="text-center pt-4 border-t border-gray-200">
                      <h3 className="font-semibold mb-2">
                        Đảm bảo hoàn tiền trong 30 ngày
                      </h3>
                      <p className="text-sm text-gray-600">
                        Bạn không hài lòng? Nhận lại toàn bộ tiền hoàn lại trong
                        vòng 30 ngày. Đơn giản và dễ hiểu!
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            )}
        </div>
      </main>

      <Footer />

      {/* Payment Processing Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent
          showCloseButton={false}
          className="sm:max-w-md bg-white dark:bg-gray-800"
        >
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-gray-900 dark:text-white">
              Đang xử lý thanh toán
            </DialogTitle>
            <DialogDescription className="text-center pt-2 text-gray-600 dark:text-gray-300">
              Vui lòng đợi trong giây lát...
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4 bg-white dark:bg-gray-800">
            {/* Payment Method Logo */}
            <div className="relative">
              <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <img
                  src={selectedPayment === "vnpay" ? vnpayLogo : paypalLogo}
                  alt={selectedPayment === "vnpay" ? "VNPay" : "PayPal"}
                  className="w-16 h-16 object-contain"
                />
              </div>
              <div className="absolute -bottom-2 -right-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>

            {/* Payment Method Info */}
            <div className="text-center space-y-2">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                Đang chuyển hướng đến{" "}
                {selectedPayment === "vnpay" ? "VNPay" : "PayPal"}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Vui lòng đợi trong giây lát...
              </p>
            </div>

            {/* Amount */}
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Tổng thanh toán
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {orderPreview?.amount || "0 ₫"}
              </p>
            </div>

            {/* Security Notice */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 max-w-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <p>
                Giao dịch của bạn được bảo mật và mã hóa. Bạn sẽ được chuyển đến
                trang thanh toán an toàn.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payment;
