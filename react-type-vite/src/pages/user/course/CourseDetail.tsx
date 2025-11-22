import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  Users,
  Clock,
  CheckCircle,
  User,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { LoadingDots } from "../../../components/ui/LoadingDots";
import type { PublishedCourseDetailResponse } from "../../../types/course.types";
import PublishedCourseService from "@/services/api/anonymous/course.api";
import Header from "../../../components/student/home/Header";
import Footer from "../../../components/student/home/Footer";

import CartService from "@/services/api/user/cart.api";
import WishlistService from "@/services/api/user/wishlist.api";
import { toast } from "react-toastify";
import { useAuth } from "@/context/auth-context/useAuth";

const CourseDetail: React.FC = () => {
  const { user } = useAuth();
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<PublishedCourseDetailResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isInCart, setIsInCart] = useState(false);

  useEffect(() => {
    const fetchCourseDetail = async () => {
      setLoading(true);
      try {
        if (courseId) {
          // Get course data and check cart/wishlist status in parallel
          const courseData =
            await PublishedCourseService.getPublishedCourseDetails(courseId);
          setCourse(courseData);
          console.log("Course Data:", courseData);
          // call if user signed in
          if (user) {
            const [inCart, inWishlist] = await Promise.all([
              CartService.checkPublishedCourseInCart(Number(courseId)),
              WishlistService.checkPublishedCourseInWishlist(Number(courseId)),
            ]);

            setIsInCart(inCart);
            setIsInWishlist(inWishlist);
          }
        }
      } catch (error) {
        console.error("Error fetching course detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetail();
  }, [courseId]);
  const renderStars = (rating: number, size: "sm" | "md" = "sm") => {
    const starSize = size === "sm" ? "w-4 h-4" : "w-5 h-5";
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${starSize} ${
          i < Math.floor(rating)
            ? "text-yellow-400 fill-current"
            : "text-gray-300"
        }`}
      />
    ));
  };

  const handleEnrollNow = () => {
    // Navigate to payment page for quick purchase
    console.log("Enrolling in course:", course?.courseName);
    navigate(`/payment/checkout/express/course/${courseId}`);
  };

  const handleLearnNow = () => {
    // Navigate to course learning page
    console.log("Learning course:", course?.courseName);
    navigate(`/user/course/${courseId}/learn`);
  };

  const handleAddToWishlist = async () => {
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await WishlistService.removeFromWishlist(Number(courseId));
        setIsInWishlist(false);
        toast.success("Đã xóa khỏi danh sách yêu thích!");
      } else {
        // Add to wishlist
        await WishlistService.addToWishlist(Number(courseId));
        setIsInWishlist(true);
        toast.success("Đã thêm vào danh sách yêu thích!");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  const handleCartAction = async () => {
    try {
      if (isInCart) {
        // Navigate to cart page
        navigate("/cart");
      } else {
        // Add to cart
        await CartService.addToCart(Number(courseId));
        setIsInCart(true);
        toast.success("Đã thêm vào giỏ hàng!");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Không thể thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingDots />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Course not found
          </h2>
          <p className="text-gray-600 mb-4">
            The course you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/courses")}>Back to Courses</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Site Header */}
      <Header />

      {/* Course Header Section */}
      <div className="bg-white pt-20 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-700 hover:bg-gray-100 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to courses
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content */}
            <div className="lg:col-span-2">
              <div className="mb-2">
                <span className="text-purple-600 text-sm font-medium">
                  {course.category}
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-gray-900">
                {course.courseName}: Master the Fundamentals
              </h1>

              <p className="text-lg text-gray-600 mb-6">{course.description}</p>

              {/* Course Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-700">
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {renderStars(course.rating)}
                  </div>
                  <span className="font-medium">{course.rating}</span>
                  <span className="text-gray-500">(0 reviews)</span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{course.studentCount.toLocaleString()} students</span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
              </div>

              {/* Instructor */}
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-purple-200">Created by</p>
                  <p className="font-medium">{course.authorName}</p>
                </div>
              </div>
            </div>

            {/* Right Sidebar - Course Card */}
            <div className="lg:col-span-1">
              <Card className="p-6 bg-white shadow-xl sticky top-4">
                <img
                  src={course.thumbnailUrl}
                  alt={`${course.courseName}: Master the Fundamentals`}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />

                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {course.coursePrice}
                    </span>
                    <span className="text-lg text-gray-500 line-through">
                      $219
                    </span>
                  </div>
                </div>

                <div className="space-y-3 mb-6 w-full">
                  {/* Hàng trên: Nút "Chuyển đến giỏ hàng" và icon Wishlist */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                      onClick={handleCartAction}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {isInCart ? "Chuyển đến giỏ hàng" : "Thêm vào giỏ hàng"}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className={`border-blue-600 ${
                        isInWishlist
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "hover:bg-blue-50"
                      }`}
                      onClick={handleAddToWishlist}
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          isInWishlist
                            ? "fill-white text-white"
                            : "text-blue-600"
                        }`}
                      />
                    </Button>
                  </div>
                  {/* Hàng dưới: Nút "Mua ngay" */}
                  {!course.purchaserStatus ? (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold"
                      onClick={handleEnrollNow}
                    >
                      Mua ngay
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold"
                      onClick={handleLearnNow}
                    >
                      Bắt đầu học
                    </Button>
                  )}
                </div>

                {/* Course Info */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Level</span>
                    <span className="font-medium">{course.level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium">{course.duration}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Audience</span>
                    <span className="font-medium">{course.targetAudience}</span>
                  </div>
                  {course.isHandsOn && (
                    <div className="flex items-center gap-2 text-green-600 font-medium">
                      <CheckCircle className="w-4 h-4" />
                      <span>Hands-On Practice</span>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* What you'll learn */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">What you'll learn</h2>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{course.whatYouWillLearn}</span>
              </div>
            </Card>

            {/* Course Content */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-2">Course content</h2>
              <p className="text-gray-600 mb-6">
                Duration: {course.duration} hours • Level: {course.level}
              </p>
              <div className="text-gray-700">
                <p>
                  Course content details will be available after enrollment.
                </p>
              </div>
            </Card>
          </div>

          {/* Right Sidebar - Empty for now, can add related courses */}
          <div className="lg:col-span-1">
            {/* This space can be used for related courses, course progress, etc. */}
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="mt-8 space-y-8">
          {/* Target Audience */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Target Audience</h2>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
              <span className="text-gray-700">{course.targetAudience}</span>
            </div>
          </Card>

          {/* Instructor */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Instructor</h2>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-8 h-8 text-gray-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {course.authorName}
                </h3>
                <p className="text-gray-600">
                  Expert instructor with years of experience in{" "}
                  {course.category}.
                </p>
              </div>
            </div>
          </Card>

          {/* Student Reviews */}
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Student reviews</h2>
            <div className="space-y-6">
              {/* Mock reviews data */}
              {[
                {
                  id: "1",
                  studentName: "John Doe",
                  rating: 5,
                  comment:
                    "Excellent course! Very comprehensive and well-explained.",
                  date: "2 weeks ago",
                },
                {
                  id: "2",
                  studentName: "Jane Smith",
                  rating: 4,
                  comment:
                    "Great content and practical examples. Highly recommended!",
                  date: "1 month ago",
                },
                {
                  id: "3",
                  studentName: "Mike Johnson",
                  rating: 5,
                  comment:
                    "Perfect for beginners. The instructor explains everything clearly.",
                  date: "2 months ago",
                },
              ].map((review) => (
                <div
                  key={review.id}
                  className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{review.studentName}</h4>
                        <span className="text-sm text-gray-500">
                          {review.date}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CourseDetail;
