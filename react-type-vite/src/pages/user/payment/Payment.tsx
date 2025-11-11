import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import Header from "../../../components/student/home/Header";
import Footer from "@/components/student/home/Footer";

import PaymentService from "@/services/api/user/paymentApi";

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("vnpay");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Mock course data - this would typically come from props or context
  const courseData = {
    title: "Web Development Course 1: Master the Fundamentals",
    instructor: "John Doe",
    originalPrice: 206,
    discount: 54,
    finalPrice: 152,
    thumbnail: "/api/placeholder/300/200",
  };

  const handleCompletePayment = async () => {
    if (!selectedCountry || !acceptedTerms) {
      alert(
        "Please complete all required fields and accept terms & conditions"
      );
      return;
    }
    // Handle payment logic here
    const data = await PaymentService.createVNPayPayment({
      amount: 5000000,
      orderId: 1000000000,
    });
    console.log(data);
    window.location.href = data.paymentUrl;
  };

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
                    src={courseData.thumbnail}
                    alt={courseData.title}
                    className="w-20 h-14 object-cover rounded"
                  />
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {courseData.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {courseData.instructor}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between">
                    <span>Original Price</span>
                    <span>${courseData.originalPrice}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Discount (26% off)</span>
                    <span>-${courseData.discount}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold border-t pt-3">
                    <span>Total</span>
                    <span className="text-blue-600">
                      ${courseData.finalPrice}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Order Summary (Sticky) */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Course: </span>
                    <span className="font-medium">{courseData.title}</span>
                  </div>

                  <div className="mb-6">
                    <span className="text-sm text-gray-600">Price: </span>
                    <span className="text-2xl font-bold">
                      ${courseData.finalPrice}
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Payment;
