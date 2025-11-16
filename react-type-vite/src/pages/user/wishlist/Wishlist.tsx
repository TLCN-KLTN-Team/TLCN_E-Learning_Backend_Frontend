import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Star, ShoppingCart } from "lucide-react";
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
        setWishlistCourses(data.wishlistCourses || []);
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
      setWishlistCourses(updatedWishlist.wishlistCourses || []);
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
      setWishlistCourses(updatedWishlist.wishlistCourses || []);

      toast.success("Đã chuyển vào giỏ hàng!");
    } catch (error) {
      console.error("Error moving to cart:", error);
      toast.error("Lỗi khi chuyển vào giỏ hàng");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-20 pb-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Đang tải danh sách yêu thích...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />

      <main className="pt-20 pb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Danh sách yêu thích
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {wishlistCourses.length} khóa học trong danh sách yêu thích
          </p>

          {wishlistCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Danh sách yêu thích trống
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Thêm khóa học yêu thích để học sau
              </p>
              <Button
                onClick={() => navigate("/courses")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Khám phá khóa học
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistCourses.map((course) => (
                <Card
                  key={course.courseId}
                  className="overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Course Thumbnail */}
                  <div
                    className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600 cursor-pointer"
                    onClick={() =>
                      navigate(`/courses/course/${course.courseId}`)
                    }
                  >
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.courseName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Heart className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}

                    {/* Remove from Wishlist Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromWishlist(course.courseId);
                      }}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white p-2 rounded-full transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                    </button>
                  </div>

                  {/* Course Info */}
                  <div className="p-4">
                    <h3
                      className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 cursor-pointer hover:text-blue-600"
                      onClick={() =>
                        navigate(`/courses/course/${course.courseId}`)
                      }
                    >
                      {course.courseName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {course.authorName}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating.toFixed(1)}</span>
                      </div>
                      <span>•</span>
                      <span>{course.duration} giờ</span>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {course.currentPrice}
                      </div>
                      {course.originalPrice !== course.currentPrice && (
                        <div className="text-sm text-gray-400 line-through">
                          {course.originalPrice}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => moveToCart(course.courseId)}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Chuyển vào giỏ hàng
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          navigate(`/courses/course/${course.courseId}`)
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
