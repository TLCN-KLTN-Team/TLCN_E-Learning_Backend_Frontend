import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import Header from "../../../components/student/home/Header";
import Footer from "@/components/student/home/Footer";

import PaymentService from "@/services/api/user/paymentApi";
import { CourseApiService } from "@/services/api/user/courseApi";
import type { PublishedCourseDetailResponse } from "@/types/course.types";

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("vnpay");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [courseData, setCourseData] =
    useState<PublishedCourseDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleCompletePayment = async () => {
    if (!selectedCountry || !acceptedTerms) {
      alert(
        "Please complete all required fields and accept terms & conditions"
      );
      return;
    }
    // Handle payment logic here
    const data = await PaymentService.createPayment({
      amount: 5000000,
      orderId: 1000000000,
      currency: "USD",
      paymentType: selectedPayment,
    });
    console.log(data);
    window.location.href = data.paymentUrl;
  };

  useEffect(() => {
    document.title = "Checkout - E-Learning Platform";
    const fetchCourseDetail = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (!courseId) {
          setError(
            "Không tìm thấy thông tin khóa học. Vui lòng chọn khóa học từ danh sách."
          );
          setIsLoading(false);
          return;
        }

        const course = await CourseApiService.getCourseById(courseId);

        if (!course) {
          setError("Không thể tải thông tin khóa học. Vui lòng thử lại sau.");
          setIsLoading(false);
          return;
        }

        setCourseData(course);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError(
          "Đã xảy ra lỗi khi tải thông tin khóa học. Vui lòng thử lại sau."
        );
        setIsLoading(false);
      }
    };
    fetchCourseDetail();
  }, [courseId]);

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
          {!isLoading && !error && courseData && (
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
                    Order Information
                  </h2>

                  <div className="flex items-start gap-4 mb-6">
                    <img
                      src={courseData.thumbnailUrl}
                      alt={courseData.courseName}
                      className="w-20 h-14 object-cover rounded"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {courseData.courseName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {courseData.authorName}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between">
                      <span>Original Price</span>
                      <span>${courseData.coursePrice}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Discount (26% off)</span>
                      <span>-$0</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold border-t pt-3">
                      <span>Total</span>
                      <span className="text-blue-600">
                        ${courseData.coursePrice}
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
                      Order Summary
                    </h2>

                    <div className="mb-4">
                      <span className="text-sm text-gray-600">Course: </span>
                      <span className="font-medium">
                        {courseData.courseName}
                      </span>
                    </div>

                    <div className="mb-6">
                      <span className="text-sm text-gray-600">Price: </span>
                      <span className="text-2xl font-bold">
                        ${courseData.coursePrice}
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
                      Complete Purchase
                    </Button>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
