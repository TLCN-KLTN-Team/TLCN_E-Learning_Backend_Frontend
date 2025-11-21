import React, { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
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

import PaymentService from "@/services/api/user/paymentApi";
import { CourseApiService } from "@/services/api/user/courseApi";
import type { CartCourse } from "@/services/api/user/cart.api";

interface CheckoutItem {
  courseId: number;
  courseName: string;
  authorName: string;
  price: number;
  originalPrice?: number;
  thumbnailUrl?: string;
}

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { courseId } = useParams<{ courseId: string }>();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("vnpay");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);

  const handleCompletePayment = async () => {
    if (!selectedCountry || !acceptedTerms) {
      alert("Vui lòng hoàn thành tất cả các trường và chấp nhận điều khoản");
      return;
    }

    if (checkoutItems.length === 0) {
      alert("Không có khóa học nào để thanh toán.");
      return;
    }

    // Show payment processing dialog
    setShowPaymentDialog(true);

    try {
      // Calculate total amount from all items
      const totalAmount = checkoutItems.reduce(
        (sum, item) => sum + item.price,
        0
      );

      // Create order items for payment
      const orderItems = checkoutItems.map((item) => ({
        publishedCourseId: item.courseId,
        finishedFee: item.price,
      }));

      // Create payment with actual course data
      const paymentData = {
        amount: Math.round(totalAmount * 100), // Convert to cents/smallest currency unit
        currency: selectedCountry === "vn" ? "VND" : "USD",
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

        // Check if this is cart checkout (data passed via location state)
        const cartItems = location.state?.cartItems as CartCourse[] | undefined;

        if (cartItems && cartItems.length > 0) {
          // Cart checkout with multiple items
          const items: CheckoutItem[] = cartItems.map((item) => ({
            courseId: item.courseId,
            courseName: item.courseName,
            authorName: item.authorName,
            price: parseFloat(item.currentPrice),
            originalPrice: parseFloat(item.originalPrice),
          }));
          setCheckoutItems(items);
          setIsLoading(false);
        } else if (courseId) {
          // Single course checkout
          const course = await CourseApiService.getCourseById(courseId);

          if (!course) {
            setError("Không thể tải thông tin khóa học. Vui lòng thử lại sau.");
            setIsLoading(false);
            return;
          }

          const coursePrice = parseFloat(
            course.coursePrice.replace(/[^0-9.]/g, "")
          );
          setCheckoutItems([
            {
              courseId: parseInt(courseId),
              courseName: course.courseName,
              authorName: course.authorName,
              price: coursePrice,
              thumbnailUrl: course.thumbnailUrl,
            },
          ]);
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
  }, [courseId, location.state]);

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
          {!isLoading && !error && checkoutItems.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Payment Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Country Selection */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-2">Country</h2>
                  <p className="text-gray-600 mb-4">
                    Select your country for billing purposes
                  </p>

                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select your country</option>
                    <option value="vn">Vietnam</option>
                    <option value="us">United States</option>
                    <option value="uk">United Kingdom</option>
                    <option value="jp">Japan</option>
                    <option value="kr">South Korea</option>
                  </select>
                </Card>

                {/* Payment Method */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-2">Payment Method</h2>
                  <p className="text-gray-600 mb-6">
                    Choose your preferred payment method
                  </p>

                  <div className="space-y-4">
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
                            <span className="text-blue-600 font-bold text-sm">
                              VP
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">VNPay</div>
                            <div className="text-sm text-gray-500">
                              Local Vietnamese payment gateway
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* PayPal Option */}
                    <div className="border rounded-lg p-4">
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
                            <span className="text-blue-600 font-bold text-sm">
                              PP
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">PayPal</div>
                            <div className="text-sm text-gray-500">
                              International payment platform
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>
                </Card>

                {/* Order Information */}
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">
                    Thông tin đơn hàng
                  </h2>

                  {/* List of items */}
                  <div className="space-y-4 mb-6">
                    {checkoutItems.map((item) => (
                      <div
                        key={item.courseId}
                        className="flex items-start gap-4 pb-4 border-b last:border-b-0"
                      >
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.courseName}
                            className="w-20 h-14 object-cover rounded"
                          />
                        ) : (
                          <div className="w-20 h-14 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">
                            {item.courseName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {item.authorName}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {new Intl.NumberFormat("vi-VN").format(item.price)}
                            {"  "}₫
                          </div>
                          {item.originalPrice &&
                            item.originalPrice > item.price && (
                              <div className="text-sm text-gray-400 line-through">
                                {new Intl.NumberFormat("vi-VN").format(
                                  item.originalPrice
                                )}{" "}
                                ₫
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pricing Summary */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Tổng giá gốc:</span>
                      <span>
                        {new Intl.NumberFormat("vi-VN").format(
                          checkoutItems.reduce(
                            (sum, item) =>
                              sum + (item.originalPrice || item.price),
                            0
                          )
                        )}{" "}
                        ₫
                      </span>
                    </div>
                    {checkoutItems.some(
                      (item) =>
                        item.originalPrice && item.originalPrice > item.price
                    ) && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá:</span>
                        <span>
                          -
                          {new Intl.NumberFormat("vi-VN").format(
                            checkoutItems.reduce(
                              (sum, item) =>
                                sum +
                                ((item.originalPrice || item.price) -
                                  item.price),
                              0
                            )
                          )}{" "}
                          ₫
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-xl font-bold border-t pt-3">
                      <span>Tổng cộng:</span>
                      <span className="text-blue-600">
                        {new Intl.NumberFormat("vi-VN").format(
                          checkoutItems.reduce(
                            (sum, item) => sum + item.price,
                            0
                          )
                        )}{" "}
                        ₫
                      </span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column - Order Summary (Sticky) */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-6">
                      Tóm tắt đơn hàng
                    </h2>

                    <div className="mb-4">
                      <span className="text-sm text-gray-600">
                        {checkoutItems.length === 1
                          ? "Khóa học:"
                          : "Số khóa học:"}
                      </span>
                      <span className="font-medium ml-2">
                        {checkoutItems.length === 1
                          ? checkoutItems[0].courseName
                          : `${checkoutItems.length} khóa học`}
                      </span>
                    </div>

                    <div className="mb-6">
                      <span className="text-sm text-gray-600">Tổng tiền: </span>
                      <span className="text-2xl font-bold">
                        {new Intl.NumberFormat("vi-VN").format(
                          checkoutItems.reduce(
                            (sum, item) => sum + item.price,
                            0
                          )
                        )}{" "}
                        ₫
                      </span>
                    </div>

                    {/* What you'll get */}
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">What you'll get:</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Lifetime access to course materials</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Certificate of completion</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>Access to course community</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>30-day money-back guarantee</span>
                        </div>
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="mb-6">
                      <h3 className="font-medium mb-3">Terms & Conditions</h3>
                      <div className="text-sm text-gray-600 space-y-2">
                        <p>
                          By completing this purchase, you agree to our Terms of
                          Service and Privacy Policy.
                        </p>
                        <p>
                          All payments are processed securely. Your personal
                          information is encrypted and protected.
                        </p>
                        <p>
                          If you're not satisfied with your purchase, you can
                          request a full refund within 30 days.
                        </p>
                      </div>

                      <label className="flex items-start gap-3 mt-4 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acceptedTerms}
                          onChange={(e) => setAcceptedTerms(e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
                        />
                        <span className="text-sm">
                          I agree to the terms and conditions
                        </span>
                      </label>
                    </div>

                    {/* Complete Purchase Button */}
                    <Button
                      onClick={handleCompletePayment}
                      disabled={!selectedCountry || !acceptedTerms}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Hoàn tất thanh toán
                    </Button>
                  </Card>
                </div>
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
            {/* Loading Spinner */}
            <div className="relative">
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            </div>

            {/* Payment Method Info */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Đang chuyển hướng đến cổng thanh toán
              </p>
              <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-700">
                {selectedPayment === "vnpay" ? (
                  <>
                    <div className="w-8 h-8 bg-blue-200 dark:bg-blue-700 rounded flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-200 font-bold text-xs">
                        VP
                      </span>
                    </div>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      VNPay
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 bg-blue-200 dark:bg-blue-700 rounded flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-200 font-bold text-xs">
                        PP
                      </span>
                    </div>
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      PayPal
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="text-center pt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Tổng thanh toán
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {checkoutItems.reduce((sum, item) => sum + item.price, 0)} ₫
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
