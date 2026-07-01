import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Heart,
  Star,
  ShoppingCart,
  Clock,
  ArrowRight,
  X,
} from "lucide-react";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";

import WishlistService, {
  type WishlistCourse,
} from "@/services/api/user/wishlist.api";
import CartService from "@/services/api/user/cart.api";
import { toast } from "react-toastify";

const Wishlist = () => {
  const navigate = useNavigate();
  const [wishlistCourses, setWishlistCourses] = useState<WishlistCourse[]>([]);
  const [loading, setLoading] = useState(true);

  // Load wishlist data from API
  useEffect(() => {
    const loadWishlist = async () => {
      try {
        setLoading(true);
        const data = await WishlistService.getWishlist();
        setWishlistCourses(data.courses || []);
        toast.success("Danh sách yêu thích đã được tải thành công!");
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : "Unknown error";
        toast.error(`Lỗi khi tải danh sách yêu thích: ${errMsg}`);
        console.error("Error loading wishlist:", error);
      } finally {
        setLoading(false);
      }
    };

    loadWishlist();
  }, []);

  const removeFromWishlist = async (courseId: number) => {
    try {
      await WishlistService.removeFromWishlist(courseId);
      // Reload wishlist after removing
      const updatedWishlist = await WishlistService.getWishlist();
      setWishlistCourses(updatedWishlist.courses || []);
      toast.success("Đã xóa khỏi danh sách yêu thích!");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error("Lỗi khi xóa khóa học");
    }
  };

  const moveToCart = async (courseId: number) => {
    try {
      // Add to cart and remove from wishlist
      await CartService.addToCart(courseId);
      await WishlistService.removeFromWishlist(courseId);

      // Reload wishlist
      const updatedWishlist = await WishlistService.getWishlist();
      setWishlistCourses(updatedWishlist.courses || []);

      toast.success("Đã chuyển vào giỏ hàng!");
    } catch (error) {
      console.error("Error moving to cart:", error);
      toast.error("Lỗi khi chuyển vào giỏ hàng");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="pt-20 pb-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Đang tải danh sách yêu thích...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6">
          {/* Page heading */}
          <div className="flex items-center gap-3 mb-8">
            <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-rose-500/10 text-rose-500">
              <Heart className="w-6 h-6 fill-current" />
            </span>
            <div>
              <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-foreground">
                Danh sách yêu thích
                <span className="inline-flex items-center justify-center min-w-7 h-7 px-2.5 rounded-full bg-rose-500 text-white text-sm font-bold">
                  {wishlistCourses.length}
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                {wishlistCourses.length} khóa học đã lưu để học sau
              </p>
            </div>
          </div>

          {wishlistCourses.length === 0 ? (
            <Card className="items-center text-center py-16 px-6 border-dashed">
              <span className="flex items-center justify-center w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 mb-4">
                <Heart className="w-8 h-8" />
              </span>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Danh sách yêu thích trống
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                Lưu lại những khóa học bạn quan tâm để dễ dàng quay lại học sau.
              </p>
              <Button onClick={() => navigate("/courses")} size="lg">
                Khám phá khóa học
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistCourses.map((course) => (
                <Card
                  key={course.courseId}
                  className="group gap-0 p-0 overflow-hidden border-border transition-all hover:border-primary/40 hover:shadow-md"
                >
                  {/* Course Thumbnail */}
                  <div
                    className="relative h-40 bg-gradient-to-br from-primary to-primary/60 cursor-pointer overflow-hidden"
                    onClick={() =>
                      navigate(`/courses/course/${course.courseId}`)
                    }
                  >
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.courseName}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Heart className="w-14 h-14 text-primary-foreground/40" />
                      </div>
                    )}

                    {/* Remove from Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(course.courseId);
                      }}
                      className="absolute top-2 right-2 p-2 rounded-full bg-card/90 text-muted-foreground backdrop-blur-sm shadow-sm hover:bg-card hover:text-destructive transition-colors"
                      aria-label="Xóa khỏi danh sách yêu thích"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Course Info */}
                  <div className="flex flex-col flex-1 p-4">
                    <h3
                      className="font-semibold text-foreground mb-1 line-clamp-2 cursor-pointer transition-colors hover:text-primary"
                      onClick={() =>
                        navigate(`/courses/course/${course.courseId}`)
                      }
                    >
                      {course.courseName}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {course.authorName}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                      <span className="inline-flex items-center gap-1">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-foreground">
                          {course.rating.toFixed(1)}
                        </span>
                      </span>
                      <span className="text-border">|</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.duration} giờ
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-2 mb-4 mt-auto">
                      <span className="inline-flex items-center rounded-lg bg-primary/10 px-2.5 py-1 text-lg font-bold text-primary">
                        {course.currentPrice}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => moveToCart(course.courseId)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Chuyển vào giỏ hàng
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          navigate(`/courses/${course.courseId}`)
                        }
                      >
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
