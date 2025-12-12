import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Users, Clock, CheckCircle, User, Heart } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { LoadingDots } from "../../../components/ui/LoadingDots";
import type { PublishedCourseDetailResponse } from "../../../types/course.types";
import PublishedCourseService from "@/services/api/anonymous/course.api";
import Header from "../../../components/student/home/Header";
import Footer from "../../../components/student/home/Footer";
import { decodeHTMLEntities } from "@/utils/htmlCleaner";

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
  const [hoursLeft] = useState(5);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const expandAllSections = () => {
    if (course?.sections) {
      setExpandedSections(new Set(course.sections.map((s) => s.id)));
    }
  };

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
  }, [courseId, user]);
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
    navigate(`/payment/checkout/express/course`, {
      state: { courseIds: [Number(courseId)] },
    });
  };

  const handleLearnNow = () => {
    // Navigate to course learning page
    console.log("Learning course:", course?.courseName);
    navigate(`/course/${courseId}/learn`);
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

      {/* Course Header Section - Dark Background like Udemy */}
      <div className="bg-gray-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-blue-400 mb-4">
            <span className="hover:text-blue-300 cursor-pointer">
              Development
            </span>
            <span className="text-gray-500">›</span>
            <span className="hover:text-blue-300 cursor-pointer">
              Data Science
            </span>
            <span className="text-gray-500">›</span>
            <span className="hover:text-blue-300 cursor-pointer">
              {course.category}
            </span>
          </div>

          {/* Course Title */}
          <h1 className="text-3xl lg:text-4xl font-bold mb-4 text-white max-w-3xl">
            {course.courseName}
          </h1>

          {/* Course Subtitle */}
          <div
            className="text-lg text-gray-300 mb-4 max-w-3xl"
            dangerouslySetInnerHTML={{
              __html: decodeHTMLEntities(course.courseIntroduction || ""),
            }}
          />

          {/* Course Stats */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-300 mb-4">
            <span className="px-2 py-1 bg-yellow-400 text-gray-900 text-xs font-bold rounded">
              Bestseller
            </span>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 font-bold">{course.rating}</span>
              <div className="flex items-center">
                {renderStars(course.rating)}
              </div>
              <span className="font-medium">{course.rating}</span>
              <span className="text-gray-500">(0 reviews)</span>
            </div>

            {/* <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
            </div>

              <span>{course.studentCount.toLocaleString()} students</span>
            </div> */}

            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{course.duration}</span>
            </div>
            <span>167,760 students</span>
          </div>

          {/* Creator and Updated Info */}
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <span>
              Created by{" "}
              <span className="text-blue-400 underline">
                {course.authorName}
              </span>
            </span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Last updated 11/2025</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🌐</span>
              <span>English [Auto], Arabic [Auto], +20 more</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Card and Main Content Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Content - Main Course Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* What you'll learn */}
            <Card className="p-6 border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">Mục tiêu khóa học</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {course.courseTarget && course.courseTarget.length > 0 ? (
                  course.courseTarget.map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-gray-900 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{item}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 col-span-2">
                    No learning objectives available
                  </p>
                )}
              </div>
            </Card>

            {/* Course Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Nội dung khóa học</h2>
              <p className="text-sm text-gray-600">
                {course.sections?.length || 0} phần học •{" "}
                {course.sections?.reduce(
                  (total, s) =>
                    total +
                    (s.lessons?.length || 0) +
                    (s.quizzes?.length || 0) +
                    (s.assignments?.length || 0),
                  0
                ) || 0}{" "}
                nội dung
              </p>

              {course.sections && course.sections.length > 0 ? (
                <div className="space-y-2">
                  <Button
                    variant="link"
                    className="text-blue-600 p-0 h-auto font-normal mb-2"
                    onClick={expandAllSections}
                  >
                    Mở rộng tất cả các phần học
                  </Button>

                  {course.sections
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((section) => {
                      const totalItems =
                        (section.lessons?.length || 0) +
                        (section.quizzes?.length || 0) +
                        (section.assignments?.length || 0);
                      const isExpanded = expandedSections.has(section.id);

                      return (
                        <Card
                          key={section.id}
                          className="border border-gray-200"
                        >
                          <div
                            className="p-4 border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
                            onClick={() => toggleSection(section.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-400">
                                  {isExpanded ? "▼" : "▶"}
                                </span>
                                <span className="font-medium">
                                  {section.title}
                                </span>
                              </div>
                              <span className="text-sm text-gray-600">
                                {totalItems} items
                              </span>
                            </div>
                            {section.description && (
                              <p className="text-sm text-gray-600 mt-2 ml-6">
                                {section.description}
                              </p>
                            )}
                          </div>

                          {isExpanded && (
                            <div className="p-4 space-y-2">
                              {/* Lessons */}
                              {section.lessons
                                ?.sort((a, b) => a.numberItem - b.numberItem)
                                .map((lesson) => (
                                  <div
                                    key={`lesson-${lesson.id}`}
                                    className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded"
                                  >
                                    <div className="flex items-center gap-3">
                                      <svg
                                        className="w-5 h-5 text-gray-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                        />
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {lesson.title}
                                        </p>
                                        {lesson.isFreeLesson && (
                                          <span className="text-xs text-blue-600">
                                            Free Preview
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {lesson.duration || "5min"}
                                    </span>
                                  </div>
                                ))}

                              {/* Quizzes */}
                              {section.quizzes
                                ?.sort((a, b) => a.numberItem - b.numberItem)
                                .map((quiz) => (
                                  <div
                                    key={`quiz-${quiz.id}`}
                                    className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded"
                                  >
                                    <div className="flex items-center gap-3">
                                      <svg
                                        className="w-5 h-5 text-gray-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                        />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {quiz.title}
                                        </p>
                                        {quiz.questionCount && (
                                          <span className="text-xs text-gray-500">
                                            {quiz.questionCount} questions
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {quiz.duration
                                        ? `${quiz.duration}min`
                                        : "Quiz"}
                                    </span>
                                  </div>
                                ))}

                              {/* Assignments */}
                              {section.assignments
                                ?.sort((a, b) => a.numberItem - b.numberItem)
                                .map((assignment) => (
                                  <div
                                    key={`assignment-${assignment.id}`}
                                    className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 rounded"
                                  >
                                    <div className="flex items-center gap-3">
                                      <svg
                                        className="w-5 h-5 text-gray-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                      </svg>
                                      <div>
                                        <p className="text-sm font-medium">
                                          {assignment.title}
                                        </p>
                                        {assignment.dueDate && (
                                          <span className="text-xs text-gray-500">
                                            Due:{" "}
                                            {new Date(
                                              assignment.dueDate
                                            ).toLocaleDateString()}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      Assignment
                                    </span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                </div>
              ) : (
                <Card className="border border-gray-200">
                  <div className="p-4 text-sm text-gray-600">
                    <p>
                      Course content details will be available after enrollment.
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Requirements */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Thành tích đạt được</h2>
              <div
                className="text-sm text-gray-700 space-y-2"
                dangerouslySetInnerHTML={{
                  __html: decodeHTMLEntities(course.learnerAchievements || ""),
                }}
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Mô tả khóa học</h2>
              <div
                className="text-sm text-gray-700 space-y-3"
                dangerouslySetInnerHTML={{
                  __html: decodeHTMLEntities(course.description || ""),
                }}
              />
            </div>

            {/* Target Audience */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Đối tượng tham gia</h2>
              <div
                className="text-sm text-gray-700"
                dangerouslySetInnerHTML={{
                  __html: decodeHTMLEntities(course.courseLearner || ""),
                }}
              />
            </div>

            {/* Instructor */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Giảng viên</h2>

              <div className="space-y-4">
                {/* Instructor Name Link */}
                <a
                  href="#"
                  className="text-purple-600 font-semibold text-lg hover:underline"
                >
                  {course.instructorInfo?.instructorName ||
                    course.authorName ||
                    "Jobskillshare Community"}
                </a>
                <p className="text-gray-600 text-sm">
                  {course.instructorInfo?.instructorTagline ||
                    "Learn IT, Practice IT, Do IT"}
                </p>

                {/* Instructor Avatar and Stats */}
                <div className="flex gap-6">
                  {/* Avatar */}
                  <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {course.instructorInfo?.instructorAvatar ? (
                      <img
                        src={course.instructorInfo.instructorAvatar}
                        alt={course.instructorInfo.instructorName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl font-bold text-gray-700">
                        {course.instructorInfo?.instructorName
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2) || "JSS"}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex-1 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      <span className="font-medium">
                        {course.instructorInfo?.instructorRating?.toFixed(1) ||
                          "0.0"}{" "}
                        Instructor Rating
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                      <span className="font-medium">
                        {course.instructorInfo?.totalReviews?.toLocaleString() ||
                          "0"}{" "}
                        Reviews
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">
                        {course.instructorInfo?.totalStudents?.toLocaleString() ||
                          "0"}{" "}
                        Students
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">
                        {course.instructorInfo?.totalCourses || "0"} Courses
                      </span>
                    </div>
                  </div>
                </div>

                {/* Instructor Bio */}
                {course.instructorInfo?.instructorBio && (
                  <div className="text-sm text-gray-700 space-y-3">
                    <p>{course.instructorInfo.instructorBio}</p>
                  </div>
                )}

                {/* Social URL Link */}
                {course.instructorInfo?.socialUrl && (
                  <div className="pt-2">
                    <a
                      href={course.instructorInfo.socialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline text-sm font-medium"
                    >
                      Visit Instructor Website →
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Student Reviews */}
            <div className="space-y-6">
              {/* Header with rating */}
              <div className="flex items-center gap-4">
                <Star className="w-8 h-8 text-yellow-400 fill-current" />
                <div>
                  <h2
                    className="tex
                  t-2xl font-bold"
                  >
                    {course.rating} xếp hạng khóa học
                  </h2>
                  <p className="text-gray-600">5K ratings</p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {[
                  {
                    id: "1",
                    initial: "DT",
                    studentName: "DATTA T.",
                    rating: 5,
                    comment:
                      "this is one of the best course out there thank you Daqche IT and i am saying you are the best teacher for people must purchase this course it covers all the things which needs for",
                    date: "a week ago",
                  },
                  {
                    id: "2",
                    initial: "HR",
                    studentName: "Hareesh R.",
                    rating: 4,
                    comment:
                      "Good teaching and give a good resources to learn from basics",
                    date: "a week ago",
                  },
                  {
                    id: "3",
                    initial: "BM",
                    studentName: "Bradley M.",
                    rating: 4,
                    comment:
                      "Course was a good overview of a VARIETY of topics, some of which I had not worked with so it was gratifying to get some new information. Appreciated the concise format allowing us to",
                    date: "3 weeks ago",
                  },
                  {
                    id: "4",
                    initial: "AS",
                    studentName: "Ashley S.",
                    rating: 3,
                    comment:
                      "Annoying audio volume fluctuations throughoutEXTREME perspective - it would have been better if it had gone through the content first even from the live classes only",
                    date: "2 months ago",
                  },
                ].map((review) => (
                  <div key={review.id} className="space-y-3">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm font-bold">
                          {review.initial}
                        </span>
                      </div>

                      {/* Review Content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-sm">
                            {review.studentName}
                          </h4>
                          <button className="text-gray-400 hover:text-gray-600">
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </button>
                        </div>

                        {/* Rating and Date */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-xs text-gray-500">
                            {review.date}
                          </span>
                        </div>

                        {/* Comment */}
                        <p className="text-sm text-gray-700 mb-3">
                          {review.comment}
                        </p>

                        {/* Show more button */}
                        <button className="text-sm font-semibold text-gray-700 hover:text-gray-900 mb-3">
                          Show more
                        </button>

                        {/* Helpful buttons */}
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-600">Helpful?</span>
                          <button className="flex items-center gap-1 hover:text-purple-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                              />
                            </svg>
                          </button>
                          <button className="flex items-center gap-1 hover:text-purple-600">
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Show all reviews button */}
              <Button
                variant="outline"
                className="w-auto border-gray-900 font-semibold"
              >
                Show all reviews
              </Button>
            </div>
          </div>

          {/* Right Sidebar - Course Card */}
          <div className="lg:col-span-1">
            <Card className="p-0 bg-white shadow-xl lg:sticky lg:top-24 overflow-hidden">
              {/* Video Preview */}
              <div className="relative group cursor-pointer">
                {course.courseVideo ? (
                  /* Real video player */
                  <video
                    className="w-full h-52 object-cover"
                    poster={course.thumbnailUrl}
                    controls
                    preload="metadata"
                  >
                    <source src={course.courseVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  /* Fallback to thumbnail with play button */
                  <>
                    <img
                      src={course.thumbnailUrl}
                      alt={`${course.courseName}: Master the Fundamentals`}
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-gray-900 border-b-8 border-b-transparent ml-1"></div>
                      </div>
                    </div>
                  </>
                )}
                <span className="absolute top-3 left-3 bg-white px-2 py-1 text-xs font-medium rounded">
                  Preview this course
                </span>
              </div>

              {/* Pricing Section */}
              <div className="p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl font-bold text-gray-900">
                      {course.coursePrice}
                    </span>
                    <span className="text-lg text-gray-400 line-through">
                      {(() => {
                        // Extract number from formatted price string (e.g., "₫1,000,000" -> 1000000)
                        const priceNumber = parseFloat(
                          course.coursePrice.replace(/[^0-9.]/g, "")
                        );
                        if (!isNaN(priceNumber)) {
                          return `₫${(priceNumber * 1.32).toLocaleString(
                            "vi-VN"
                          )}`;
                        }
                        return course.coursePrice;
                      })()}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      24% off
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-red-600 text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    <span>{hoursLeft} hours left at this price!</span>
                  </div>
                </div>

                <div className="space-y-3 mb-6 w-full">
                  {/* Main Action Button */}
                  {!course.purchaserStatus ? (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
                      onClick={handleCartAction}
                    >
                      {isInCart ? "To cart" : "Add to cart"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg font-semibold"
                      onClick={handleLearnNow}
                    >
                      Bắt đầu học
                    </Button>
                  )}

                  {/* Buy Now Button */}
                  {!course.purchaserStatus ? (
                    <Button
                      variant="outline"
                      className="w-full border-2 border-gray-900 hover:bg-gray-50 py-6 text-lg font-semibold"
                      onClick={handleEnrollNow}
                    >
                      Mua ngay
                    </Button>
                  ) : null}

                  {/* 30-Day Money-Back Guarantee */}
                  <p className="text-center text-xs text-gray-600">
                    30-Day Money-Back Guarantee
                  </p>
                </div>

                {/* Share and Coupon */}
                <div className="mb-6 flex items-center">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <button className="text-sm font-medium hover:text-blue-600">
                        Share
                      </button>
                      <button className="text-sm font-medium hover:text-blue-600">
                        Gift this course
                      </button>
                      <button className="text-sm font-medium hover:text-blue-600">
                        Apply Coupon
                      </button>
                    </div>
                    {!course.purchaserStatus && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-gray-100"
                        onClick={handleAddToWishlist}
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            isInWishlist
                              ? "fill-red-600 text-red-600"
                              : "text-gray-900"
                          }`}
                        />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Subscription Promo */}
                <div className="border-t pt-4">
                  <p className="text-xs font-bold mb-2">
                    Subscribe to Udemy's top courses
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    Get this course, plus 26,000+ of our top-rated courses, with
                    Personal Plan.{" "}
                    <a href="#" className="text-blue-600 underline">
                      Learn more
                    </a>
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-gray-900 hover:bg-gray-50 font-semibold"
                  >
                    Start subscription
                  </Button>
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Starting at ₫280,000 per month
                    <br />
                    Cancel anytime
                  </p>
                </div>

                {/* Course Info */}
                <div className="space-y-3 text-sm pt-6 border-t mt-6">
                  <h3 className="font-bold text-base mb-4">
                    This course includes:
                  </h3>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span>{course.duration} on-demand video</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>10 articles</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    <span>67 downloadable resources</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Access on mobile and TV</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                    <span>Certificate of completion</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CourseDetail;
