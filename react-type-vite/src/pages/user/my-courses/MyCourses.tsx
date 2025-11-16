import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Clock, BookOpen, PlayCircle, CheckCircle } from "lucide-react";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import MyCoursesService, {
  type EnrolledCourse,
} from "@/services/api/user/myCoursesApi";

const MyCourses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "all" | "inProgress" | "completed"
  >("all");

  useEffect(() => {
    document.title = "Khóa học của tôi - E-Learning Platform";
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);

      // Call API to get enrolled courses
      const data = await MyCoursesService.getEnrolledCourses();
      setCourses(data.courses);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);

      // Fallback to mock data if API fails (for development)
      const mockCourses: EnrolledCourse[] = [
        {
          courseId: 1,
          courseName: "Complete Web Development Bootcamp 2024",
          authorName: "Dr. Sarah Chen",
          rating: 4.8,
          duration: 45,
          progress: 65,
          totalLessons: 120,
          completedLessons: 78,
          lastAccessed: "2 giờ trước",
        },
        {
          courseId: 2,
          courseName: "Advanced React Patterns & Best Practices",
          authorName: "Prof. Michael Johnson",
          rating: 4.9,
          duration: 30,
          progress: 40,
          totalLessons: 80,
          completedLessons: 32,
          lastAccessed: "1 ngày trước",
        },
        {
          courseId: 3,
          courseName: "Machine Learning with Python",
          authorName: "Dr. Emily Rodriguez",
          rating: 4.7,
          duration: 60,
          progress: 90,
          totalLessons: 150,
          completedLessons: 135,
          lastAccessed: "5 giờ trước",
        },
      ];

      setCourses(mockCourses);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter((course) => {
    if (activeTab === "inProgress")
      return course.progress > 0 && course.progress < 100;
    if (activeTab === "completed") return course.progress === 100;
    return true;
  });

  const handleContinueLearning = (courseId: number) => {
    navigate(`/student/courses/${courseId}/learn`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-20 pb-8 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">
              Đang tải khóa học...
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Khóa học của tôi
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Tiếp tục học tập và hoàn thành các khóa học của bạn
            </p>
          </div>

          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab("all")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "all"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Tất cả khóa học ({courses.length})
              </button>
              <button
                onClick={() => setActiveTab("inProgress")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "inProgress"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Đang học (
                {
                  courses.filter((c) => c.progress > 0 && c.progress < 100)
                    .length
                }
                )
              </button>
              <button
                onClick={() => setActiveTab("completed")}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "completed"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                }`}
              >
                Đã hoàn thành (
                {courses.filter((c) => c.progress === 100).length})
              </button>
            </nav>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <Card className="p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Chưa có khóa học nào
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {activeTab === "completed"
                  ? "Bạn chưa hoàn thành khóa học nào"
                  : "Hãy bắt đầu học ngay hôm nay!"}
              </p>
              <Button
                onClick={() => navigate("/courses")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Khám phá khóa học
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <Card
                  key={course.courseId}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleContinueLearning(course.courseId)}
                >
                  {/* Course Thumbnail */}
                  <div className="relative h-40 bg-gradient-to-br from-blue-500 to-purple-600">
                    {course.thumbnailUrl ? (
                      <img
                        src={course.thumbnailUrl}
                        alt={course.courseName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    {course.progress === 100 && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Hoàn thành
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                      {course.courseName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {course.authorName}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{course.rating.toFixed(1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration}h</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {course.completedLessons || 0}/
                          {course.totalLessons || 0} bài học
                        </span>
                        <span className="font-semibold text-blue-600">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${course.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Last Accessed */}
                    {course.lastAccessed && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mb-3">
                        Lần cuối truy cập: {course.lastAccessed}
                      </p>
                    )}

                    {/* Continue Button */}
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleContinueLearning(course.courseId);
                      }}
                    >
                      <PlayCircle className="w-4 h-4 mr-2" />
                      {course.progress === 0
                        ? "Bắt đầu học"
                        : course.progress === 100
                        ? "Xem lại"
                        : "Tiếp tục học"}
                    </Button>
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

export default MyCourses;
