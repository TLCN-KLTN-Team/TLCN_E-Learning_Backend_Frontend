import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Heart,
  Star,
  Trash2,
  Clock,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import CartService, {
  type CartCourse,
  type CartResponse,
} from "@/services/api/user/cart.api";
import WishListService from "@/services/api/user/wishlist.api";
import { toast } from "react-toastify";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";

/** Hàng sao đánh giá — màu amber dùng chung cho cả light/dark. */
const RatingStars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
    <div className="flex">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-3.5 h-3.5 ${
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-muted-foreground/25 text-muted-foreground/25"
          }`}
        />
      ))}
    </div>
  </div>
);

/**
 * Thumbnail khóa học: hiển thị ảnh thật nếu có, ngược lại dùng gradient + icon
 * làm placeholder. `variant` chọn tông màu placeholder cho giỏ / yêu thích.
 */
const CourseThumbnail = ({
  src,
  alt,
  variant = "cart",
}: {
  src?: string;
  alt: string;
  variant?: "cart" | "favorite";
}) => {
  const fallback =
    variant === "favorite"
      ? "bg-gradient-to-br from-rose-400 to-rose-500"
      : "bg-gradient-to-br from-primary to-primary/60";
  const Icon = variant === "favorite" ? Heart : ShoppingCart;

  return (
    <div className="w-32 sm:w-44 h-24 sm:h-28 rounded-lg overflow-hidden flex-shrink-0">
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full flex items-center justify-center ${fallback}`}>
          <Icon className="w-7 h-7 text-white/90" />
        </div>
      )}
    </div>
  );
};

/** Chip giá nổi bật — dùng để làm rõ thông tin quan trọng nhất của mỗi dòng. */
const PriceTag = ({ price }: { price: string }) => (
  <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-base sm:text-lg font-bold text-primary whitespace-nowrap">
    {price}
  </span>
);

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
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Đang tải giỏ hàng...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const cartCourses = cartData?.cartCourses ?? [];
  const favoriteCourses = cartData?.favoriteCourses ?? [];
  const hasItems = cartCourses.length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Page heading */}
        <div className="flex items-center gap-3 mb-8">
          <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 text-primary">
            <ShoppingCart className="w-6 h-6" />
          </span>
          <div>
            <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-foreground">
              Giỏ hàng
              <span className="inline-flex items-center justify-center min-w-7 h-7 px-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {cartCourses.length}
              </span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {cartCourses.length} khóa học đang chờ thanh toán
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-10">
            {/* Cart Section */}
            <section>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                Khóa học trong giỏ
                <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {cartCourses.length}
                </span>
              </h2>

              <div className="space-y-3">
                {hasItems ? (
                  cartCourses.map((course) => (
                    <Card
                      key={course.courseId}
                      className="group flex-row gap-0 p-3 sm:p-4 overflow-hidden border-border transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="flex gap-4 w-full">
                        <CourseThumbnail
                          src={course.thumbnail}
                          alt={course.courseName}
                          variant="cart"
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                            {course.courseName}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Bởi {course.authorName}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {course.rating > 0 && (
                              <RatingStars rating={course.rating} />
                            )}
                            {course.duration > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {course.duration} giờ
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between flex-shrink-0">
                          <button
                            onClick={() => removeFromCart(course.courseId)}
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive text-sm font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Xóa</span>
                          </button>
                          <PriceTag price={course.currentPrice} />
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <Card className="items-center text-center py-12 px-6 border-dashed">
                    <span className="flex items-center justify-center w-16 h-16 rounded-full bg-muted text-muted-foreground mb-4">
                      <ShoppingCart className="w-8 h-8" />
                    </span>
                    <p className="font-medium text-foreground mb-1">
                      Giỏ hàng của bạn đang trống
                    </p>
                    <p className="text-sm text-muted-foreground mb-5">
                      Khám phá các khóa học và thêm vào giỏ để bắt đầu học.
                    </p>
                    <Button onClick={() => navigate("/courses")}>
                      Khám phá khóa học
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Card>
                )}
              </div>
            </section>

            {/* Favorites Section */}
            {favoriteCourses.length > 0 && (
              <section>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground mb-4">
                  <Heart className="w-5 h-5 text-rose-500" />
                  Từ danh sách yêu thích
                  <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full bg-rose-500 text-white text-xs font-bold">
                    {favoriteCourses.length}
                  </span>
                </h2>

                <div className="space-y-3">
                  {favoriteCourses.map((course: CartCourse) => (
                    <Card
                      key={course.courseId}
                      className="group flex-row gap-0 p-3 sm:p-4 overflow-hidden border-border transition-all hover:border-primary/40 hover:shadow-md"
                    >
                      <div className="flex gap-4 w-full">
                        <CourseThumbnail
                          src={course.thumbnail}
                          alt={course.courseName}
                          variant="favorite"
                        />

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">
                            {course.courseName}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            Bởi {course.authorName}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {course.rating > 0 && (
                              <RatingStars rating={course.rating} />
                            )}
                            {course.duration > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {course.duration} giờ
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between flex-shrink-0 gap-2">
                          <button
                            onClick={() => removeFromWishlist(course.courseId)}
                            className="inline-flex items-center gap-1 text-muted-foreground hover:text-destructive text-sm font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Xóa</span>
                          </button>
                          <div className="flex flex-col items-end gap-1.5">
                            <PriceTag price={course.currentPrice} />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                addWishlistItemToCart(course.courseId)
                              }
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              Thêm vào giỏ
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="gap-0 p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                Tóm tắt đơn hàng
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>{cartCourses.length} khóa học</span>
                  <span className="text-foreground">
                    {cartData?.amount || "0 ₫"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-baseline rounded-xl bg-primary/5 mt-4 px-3 py-3">
                <span className="font-semibold text-foreground">Tổng cộng</span>
                <span className="text-2xl font-bold text-primary">
                  {cartData?.amount || "0 ₫"}
                </span>
              </div>

              <Button
                className="w-full mt-5"
                size="lg"
                disabled={!hasItems}
                onClick={handleCheckout}
              >
                Thanh toán
                <ArrowRight className="w-4 h-4" />
              </Button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                Thanh toán an toàn & bảo mật
              </p>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Cart;
