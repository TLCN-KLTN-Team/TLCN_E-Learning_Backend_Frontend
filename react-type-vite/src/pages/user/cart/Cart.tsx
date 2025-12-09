import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Star } from "lucide-react";

import CartService, { type CartResponse } from "@/services/api/user/cart.api";
import WishListService from "@/services/api/user/wishlist.api";
import { toast } from "react-toastify";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";

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
        const errMsg =
          error instanceof Error ? error.message : "Lỗi không xác định";
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

  const addWishlistItemToCart = async (courseId: number) => {
    try {
      await CartService.addWishlistItemToCart(courseId);
      // Reload cart after adding
      const updatedCart = await CartService.getCart();
      setCartData(updatedCart);
      toast.success("Đã thêm vào giỏ hàng từ danh sách yêu thích!");
    } catch (error) {
      console.error("Error adding wishlist item to cart:", error);
      toast.error("Lỗi khi thêm vào giỏ hàng từ danh sách yêu thích");
    }
  };

  const removeFromWishlist = async (courseId: number) => {
    try {
      await WishListService.removeFromWishlist(courseId);
      const updatedWishlist = await CartService.getCart();
      setCartData(updatedWishlist);
      toast.success("Đã xóa khỏi danh sách yêu thích!");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Lỗi khi xóa khỏi danh sách yêu thích");
    }
  };

  const handleCheckout = () => {
    if (!cartData?.cartCourses || cartData.cartCourses.length === 0) {
      toast.error(
        "Giỏ hàng trống. Vui lòng thêm khóa học trước khi thanh toán."
      );
      return;
    }

    const courseIds = cartData.cartCourses.map((course) => course.courseId);
    // Navigate to payment page with cart items
    navigate("/payment/checkout/express/course", {
      state: {
        courseIds: courseIds,
      },
    });
  };
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Đang tải giỏ hàng...
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />

        <main className="pt-24 pb-12 container">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Giỏ hàng
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2 space-y-8">
              {/* Cart Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {cartData?.cartCourses.length || 0} khóa học trong giỏ hàng
                </h2>

                <div className="space-y-3">
                  {cartData?.cartCourses && cartData.cartCourses.length > 0 ? (
                    cartData.cartCourses.map((course) => (
                      <Card
                        key={course.courseId}
                        className="overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-3 p-3">
                          <div className="w-40 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                              {course.courseName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Bởi {course.authorName}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {course.rating.toFixed(1)}
                                </span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < Math.floor(course.rating)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "fill-gray-300 text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <span>•</span>
                              <span>Tổng số {course.duration} giờ</span>
                              <span>•</span>
                              <span>500 bài giảng</span>
                              <span>•</span>
                              <span>Tất cả các cấp độ</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between flex-shrink-0">
                            <div className="flex gap-2">
                              <button
                                onClick={() => removeFromCart(course.courseId)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm font-medium transition-colors"
                              >
                                Xóa
                              </button>
                            </div>
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
                      <p className="text-gray-500">
                        Giỏ hàng của bạn đang trống
                      </p>
                    </Card>
                  )}
                </div>
              </div>

              {/* Favorites Section */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Gần đây được thêm vào danh sách mong ước
                </h2>

                <div className="space-y-3">
                  {cartData?.favoriteCourses &&
                  cartData.favoriteCourses.length > 0 ? (
                    cartData.favoriteCourses.map((course) => (
                      <Card
                        key={course.courseId}
                        className="overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="flex gap-3 p-3">
                          <div className="w-40 h-24 bg-gradient-to-br from-pink-500 to-red-600 rounded flex items-center justify-center flex-shrink-0">
                            <Heart className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                              {course.courseName}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              Bởi {course.authorName}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold text-gray-900 dark:text-white">
                                  {course.rating.toFixed(1)}
                                </span>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3.5 h-3.5 ${
                                        i < Math.floor(course.rating)
                                          ? "fill-yellow-400 text-yellow-400"
                                          : "fill-gray-300 text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                                <span className="ml-1">
                                  ({Math.floor(course.rating * 10000)} xếp hạng)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                              <span>Tổng số {course.duration} giờ</span>
                              <span>•</span>
                              <span>128 bài giảng</span>
                              <span>•</span>
                              <span>Tất cả các cấp độ</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end justify-between flex-shrink-0">
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  removeFromWishlist(course.courseId)
                                }
                                className="text-red-600 hover:text-red-700 dark:text-red-400 text-sm font-medium transition-colors"
                              >
                                Xóa
                              </button>
                              <button
                                onClick={() =>
                                  addWishlistItemToCart(course.courseId)
                                }
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 text-sm font-medium transition-colors"
                              >
                                Chuyển vào giỏ hàng
                              </button>
                            </div>
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
                      <p className="text-gray-500">
                        Chưa có khóa học yêu thích
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <Card className="p-4 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Tóm tắt
                </h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Giá gốc:</span>
                    <span className="font-medium">
                      {cartData?.originalPrice || "0 ₫"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Giảm giá:</span>
                    <span className="font-medium text-red-500">
                      -{cartData?.discountedPrice || "0 ₫"}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Tổng:
                      </span>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">
                        {cartData?.amount || "0 ₫"}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
                  disabled={
                    !cartData?.cartCourses || cartData.cartCourses.length === 0
                  }
                  onClick={handleCheckout}
                >
                  Thanh toán
                </Button>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
