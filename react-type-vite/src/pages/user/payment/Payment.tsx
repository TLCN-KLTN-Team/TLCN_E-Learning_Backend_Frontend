import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  AlertCircle,
  ShoppingCart,
  Loader2,
  Lock,
  ShieldCheck,
  Check,
  BadgeCheck,
} from "lucide-react";
import { toast } from "react-toastify";
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

const PAYMENT_METHODS = [
  {
    id: "vnpay",
    name: "VNPay",
    description: "Cổng thanh toán phổ biến tại Việt Nam",
    logo: vnpayLogo,
  },
  {
    id: "paypal",
    name: "PayPal",
    description: "Thanh toán quốc tế an toàn và nhanh chóng",
    logo: paypalLogo,
  },
] as const;

const COUNTRY_OPTIONS: Record<string, { value: string; label: string }[]> = {
  vnpay: [{ value: "vn", label: "Việt Nam" }],
  paypal: [
    { value: "USD", label: "Hoa Kỳ (USD)" },
    { value: "EUR", label: "Khu vực đồng Euro (EUR)" },
    { value: "GBP", label: "Vương quốc Anh (GBP)" },
    { value: "JPY", label: "Nhật Bản (JPY)" },
    { value: "KRW", label: "Hàn Quốc (KRW)" },
  ],
};

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("vnpay");
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [orderPreview, setOrderPreview] = useState<OrderPreviewResponse | null>(
    null
  );
  const [courseIds, setCourseIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Map country code to currency code
  const getCurrencyCode = (countryCode: string): string => {
    const currencyMap: Record<string, string> = {
      vn: "VND",
      USD: "USD",
      EUR: "EUR",
      GBP: "GBP",
      JPY: "JPY",
      KRW: "KRW",
    };
    return currencyMap[countryCode] || "VND";
  };

  const canSubmit =
    !!selectedCountry &&
    agreedTerms &&
    !!orderPreview &&
    orderPreview.items.length > 0 &&
    !isPriceUpdating;

  const handleCompletePayment = async () => {
    if (!selectedCountry) {
      toast.error("Vui lòng chọn quốc gia / khu vực thanh toán.");
      return;
    }

    if (!agreedTerms) {
      toast.error("Vui lòng đồng ý với Điều khoản dịch vụ trước khi tiếp tục.");
      return;
    }

    if (!orderPreview || orderPreview.items.length === 0) {
      toast.error("Không có khóa học nào để thanh toán.");
      return;
    }

    setShowPaymentDialog(true);
    setIsProcessing(true);

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

      const response = await PaymentService.createPayment(paymentData);

      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      } else {
        toast.error("Không thể tạo thanh toán. Vui lòng thử lại.");
        setShowPaymentDialog(false);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error("Payment creation error:", error);
      setShowPaymentDialog(false);
      setIsProcessing(false);
      toast.error("Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng thử lại.");
    }
  };

  useEffect(() => {
    document.title = "Thanh toán - E-Learning Platform";

    const loadCheckoutData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const courseIds = location.state?.courseIds as number[] | undefined;

        if (courseIds && courseIds.length > 0) {
          setCourseIds(courseIds);
          const preview = await PaymentService.getOrderPreview({
            courseIds,
            currency: "VND",
          });
          setOrderPreview(preview);
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

  // Reset country when payment method changes (VNPay defaults to Vietnam)
  useEffect(() => {
    setSelectedCountry(selectedPayment === "vnpay" ? "vn" : "");
  }, [selectedPayment]);

  // Reload order preview when currency changes (local loading, no full-page flash)
  useEffect(() => {
    const reloadOrderPreview = async () => {
      if (!selectedCountry || courseIds.length === 0) return;

      try {
        setIsPriceUpdating(true);
        const currency = getCurrencyCode(selectedCountry);
        const preview = await PaymentService.getOrderPreview({
          courseIds,
          currency,
        });
        setOrderPreview(preview);
      } catch (err) {
        console.error("Error reloading order preview:", err);
        toast.error("Đã xảy ra lỗi khi cập nhật giá. Vui lòng thử lại.");
      } finally {
        setIsPriceUpdating(false);
      }
    };

    reloadOrderPreview();
  }, [selectedCountry, courseIds]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-foreground hover:bg-muted mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>

          {/* Page Title */}
          <h1 className="text-3xl font-bold text-foreground mb-1">Thanh toán</h1>
          <p className="text-sm text-muted-foreground mb-8 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Giao dịch của bạn được bảo mật và mã hóa
          </p>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Đang tải thông tin khóa học...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <Card className="p-8 text-center max-w-2xl mx-auto">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  Không tìm thấy thông tin khóa học
                </h2>
                <p className="text-muted-foreground mb-6">{error}</p>
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
                <div className="lg:col-span-2 space-y-6">
                  {/* Payment Method */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Phương thức thanh toán
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Chọn phương thức thanh toán phù hợp với bạn
                    </p>

                    <div className="space-y-3">
                      {PAYMENT_METHODS.map((method) => {
                        const isSelected = selectedPayment === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`flex items-center gap-3 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                              isSelected
                                ? "border-blue-600 bg-muted"
                                : "border-border hover:border-muted-foreground/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name="payment"
                              value={method.id}
                              checked={isSelected}
                              onChange={(e) =>
                                setSelectedPayment(e.target.value)
                              }
                              className="w-4 h-4 text-blue-600 border-border focus:ring-blue-500"
                            />
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1.5 shadow-sm">
                              <img
                                src={method.logo}
                                alt={method.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-foreground">
                                {method.name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {method.description}
                              </div>
                            </div>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Country / Currency Selection */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Quốc gia / Khu vực
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Chọn quốc gia của bạn để xác định loại tiền tệ thanh toán
                    </p>

                    <select
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      className="w-full p-3 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Chọn quốc gia / khu vực</option>
                      {COUNTRY_OPTIONS[selectedPayment]?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </Card>

                  {/* Order Information */}
                  <Card className="p-6">
                    <h2 className="text-lg font-semibold text-foreground mb-4">
                      Thông tin đơn hàng
                    </h2>

                    {/* List of items */}
                    <div className="space-y-3">
                      {orderPreview.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-start gap-3 pb-3 border-b border-border last:border-b-0 last:pb-0"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.courseName}
                            className="w-24 h-16 object-cover rounded-md flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              e.currentTarget.nextElementSibling?.classList.remove(
                                "hidden"
                              );
                            }}
                          />
                          <div className="w-24 h-16 bg-muted rounded-md items-center justify-center hidden flex-shrink-0">
                            <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-foreground line-clamp-2">
                              {item.courseName}
                            </h3>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-base font-semibold text-foreground">
                              {item.price}
                            </div>
                            {item.discountedPrice &&
                              item.discountedPrice !== item.price && (
                                <div className="text-xs text-muted-foreground line-through">
                                  {item.discountedPrice}
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Right Column - Order Summary (Sticky) */}
                <div className="lg:col-span-1">
                  <Card className="p-6 sticky top-24">
                    <h2 className="text-xl font-bold text-foreground mb-4">
                      Tóm tắt đơn hàng
                    </h2>

                    {/* Price breakdown */}
                    <div className="space-y-3 mb-4 pb-4 border-b border-border">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Tạm tính ({orderPreview.items.length} khóa học)
                        </span>
                        <span className="text-foreground font-medium">
                          {orderPreview.totalPrice}
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-base font-semibold text-foreground">
                        Tổng cộng
                      </span>
                      <span className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                        {isPriceUpdating && (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        )}
                        {orderPreview.totalPrice}
                      </span>
                    </div>

                    {/* Terms checkbox */}
                    <label className="flex items-start gap-2.5 cursor-pointer mb-4">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(e) => setAgreedTerms(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-blue-600 border-border rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-muted-foreground">
                        Bằng việc hoàn tất giao dịch, bạn đồng ý với{" "}
                        <a
                          href="#"
                          className="text-blue-600 hover:underline font-medium"
                        >
                          Điều khoản dịch vụ
                        </a>{" "}
                        của chúng tôi.
                      </span>
                    </label>

                    {/* Complete Purchase Button */}
                    <Button
                      onClick={handleCompletePayment}
                      disabled={!canSubmit}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      Thanh toán an toàn
                    </Button>

                    {/* Accepted payment logos */}
                    <div className="flex items-center justify-center gap-3 mb-4">
                      <span className="text-xs text-muted-foreground">
                        Chấp nhận:
                      </span>
                      {PAYMENT_METHODS.map((m) => (
                        <div
                          key={m.id}
                          className="h-6 px-2 bg-white rounded flex items-center shadow-sm border border-border"
                        >
                          <img
                            src={m.logo}
                            alt={m.name}
                            className="max-h-4 object-contain"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Trust signals */}
                    <div className="space-y-3 pt-4 border-t border-border">
                      <div className="flex items-start gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Đảm bảo hoàn tiền trong 30 ngày
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Không hài lòng? Nhận lại toàn bộ tiền trong vòng 30
                            ngày, đơn giản và dễ dàng.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <BadgeCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Truy cập trọn đời
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Học mọi lúc, mọi nơi sau khi thanh toán thành công.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
        </div>
      </main>

      <Footer />

      {/* Payment Processing Dialog */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          // Prevent closing while a payment is being processed
          if (!isProcessing) setShowPaymentDialog(open);
        }}
      >
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl text-foreground">
              Đang xử lý thanh toán
            </DialogTitle>
            <DialogDescription className="text-center pt-2 text-muted-foreground">
              Vui lòng đợi trong giây lát...
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            {/* Payment Method Logo */}
            <div className="relative">
              <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center">
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
              <p className="text-base font-semibold text-foreground">
                Đang chuyển hướng đến{" "}
                {selectedPayment === "vnpay" ? "VNPay" : "PayPal"}
              </p>
              <p className="text-sm text-muted-foreground">
                Vui lòng đợi trong giây lát...
              </p>
            </div>

            {/* Amount */}
            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                Tổng thanh toán
              </p>
              <p className="text-3xl font-bold text-foreground">
                {orderPreview?.totalPrice || "0"}
              </p>
            </div>

            {/* Security Notice */}
            <div className="text-center text-xs text-muted-foreground max-w-sm bg-muted p-3 rounded-lg">
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
