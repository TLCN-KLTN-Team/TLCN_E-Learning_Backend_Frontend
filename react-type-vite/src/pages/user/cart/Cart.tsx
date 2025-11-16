import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Star, Trash2 } from "lucide-react";

import CartService, { type CartResponse } from "@/services/api/user/cart.api";
import { toast } from "react-toastify";

const Cart = () => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Load cart data from API
  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);
        const data = await CartService.getCart();
        setCartData(data);
        toast.success("Giỏ hàng đã được tải thành công!");
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Lỗi khi tải giỏ hàng: ${errMsg}`);
        console.error("Error loading cart:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  const removeFromCart = async (courseId: number) => {
    try {
      await CartService.removeFromCart(courseId);
      // Reload cart after removing
      const updatedCart = await CartService.getCart();
      setCartData(updatedCart);
      toast.success("Đã xóa khỏi giỏ hàng!");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Lỗi khi xóa khóa học");
    }
  };

  const addToCart = async (courseId: number) => {
    try {
      await CartService.addToCart(courseId);
      // Reload cart after adding
      const updatedCart = await CartService.getCart();
      setCartData(updatedCart);
      toast.success("Đã thêm vào giỏ hàng!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Lỗi khi thêm vào giỏ hàng");
    }
  };

  const handleCheckout = () => {
    if (!cartData?.cartCourses || cartData.cartCourses.length === 0) {
      toast.error(
        "Giỏ hàng trống. Vui lòng thêm khóa học trước khi thanh toán."
      );
      return;
    }

    // Navigate to payment page with cart items
    navigate("/payment/checkout/cart", {
      state: {
        cartItems: cartData.cartCourses,
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Đang tải giỏ hàng...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Giỏ hàng của bạn
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {cartData?.cartCourses.length || 0} khóa học trong giỏ hàng
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="w-6 h-6 text-gray-900 dark:text-white" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Khóa học trong giỏ hàng
                </h2>
              </div>

              <div className="space-y-4">
                {cartData?.cartCourses && cartData.cartCourses.length > 0 ? (
                  cartData.cartCourses.map((course) => (
                    <Card key={course.courseId} className="p-4">
                      <div className="flex gap-4">
                        <div className="w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-8 h-8 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {course.courseName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {course.authorName}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{course.rating.toFixed(1)}</span>
                            </div>
                            <span>•</span>
                            <span>{course.duration} giờ</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeFromCart(course.courseId)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                            aria-label="Remove from cart"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {course.currentPrice}
                            </div>
                            <div className="text-sm text-gray-400 line-through">
                              {course.originalPrice}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Giỏ hàng của bạn đang trống</p>
                  </Card>
                )}
              </div>
            </div>

            {/* Favorites Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Khóa học yêu thích
                </h2>
              </div>

              <div className="space-y-4">
                {cartData?.favoriteCourses &&
                cartData.favoriteCourses.length > 0 ? (
                  cartData.favoriteCourses.map((course) => (
                    <Card key={course.courseId} className="p-4">
                      <div className="flex gap-4">
                        <div className="w-32 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <Heart className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                            {course.courseName}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {course.authorName}
                          </p>
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span>{course.rating.toFixed(1)}</span>
                            </div>
                            <span>•</span>
                            <span>{course.duration} giờ</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end justify-between">
                          <Button
                            onClick={() => addToCart(course.courseId)}
                            variant="outline"
                            size="sm"
                            className="text-sm"
                          >
                            Thêm vào giỏ
                          </Button>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {course.currentPrice}
                            </div>
                            <div className="text-sm text-gray-400 line-through">
                              {course.originalPrice}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="p-8 text-center">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có khóa học yêu thích</p>
                  </Card>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Giá gốc:</span>
                  <span>{cartData?.originalPrice || "0 ₫"}</span>
                </div>
                <div className="flex justify-between text-red-500 font-medium">
                  <span>Giảm giá:</span>
                  <span>-{cartData?.discountedPrice || "0 ₫"}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex justify-between text-lg font-bold text-blue-600 dark:text-blue-400">
                    <span>Tổng cộng:</span>
                    <span>{cartData?.amount || "0 ₫"}</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
                disabled={
                  !cartData?.cartCourses || cartData.cartCourses.length === 0
                }
                onClick={handleCheckout}
              >
                Thanh toán
              </Button>

              <div className="mt-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Điều khoản và chính sách
                </h3>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Truy cập trọn đời sau khi mua</li>
                  <li>Hoàn tiền trong 30 ngày nếu không hài lòng</li>
                  <li>Chứng chỉ hoàn thành khóa học</li>
                  <li>Hỗ trợ từ giảng viên 24/7</li>
                </ul>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Bằng việc thanh toán, bạn đồng ý với{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Điều khoản dịch vụ
                  </a>{" "}
                  và{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Chính sách bảo mật
                  </a>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
