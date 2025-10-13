import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  FileText,
  Download,
  Users,
  Calendar,
  Clock,
  BookOpen,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  FileDown,
  Link as LinkIcon,
  Rocket,
  Atom,
  MessagesSquare,
} from "lucide-react";
import "../../../styles/student-dashboard.css";
import Header from "../dashboard/Header";
import Footer from "../dashboard/Footer";

// Types
interface Lesson {
  id: number;
  title: string;
  type: "video" | "document" | "quiz" | "assignment" | "forum" | "link";
  duration?: string;
  completed: boolean;
  url?: string;
  description?: string;
}

interface Module {
  id: number;
  title: string;
  description: string;
  lessons: Lesson[];
  isExpanded: boolean;
}

interface Instructor {
  id: number;
  name: string;
  title: string;
  avatar: string;
  bio: string;
}

interface CourseInfo {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  instructor: Instructor;
  category: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  studentsEnrolled: number;
  rating: number;
  totalRatings: number;
  progress: number;
  modules: Module[];
}

// Mock data cho khóa học chi tiết
const mockCourseDetail: CourseInfo = {
  id: 5,
  title: "Kiem thu phan mem_ Nhom 04CLC",
  subtitle: "2025-2026 HỌC KỲ 1 - ĐẠI HỌC CHÍNH QUY",
  description:
    "Khóa học về kiểm thử phần mềm cung cấp kiến thức toàn diện về các phương pháp, kỹ thuật và công cụ kiểm thử. Học viên sẽ được học về kiểm thử đơn vị, kiểm thử tích hợp, kiểm thử hệ thống và các phương pháp kiểm thử tự động.",
  image: "/src/assets/images/courses/4by3/05.jpg",
  instructor: {
    id: 1,
    name: "TS. Nguyễn Văn A",
    title: "Giảng viên Khoa Công nghệ Thông tin",
    avatar: "/src/assets/images/instructor/01.jpg",
    bio: "Tiến sĩ Công nghệ Thông tin với hơn 10 năm kinh nghiệm trong lĩnh vực kiểm thử phần mềm và đảm bảo chất lượng.",
  },
  category: "Testing",
  startDate: "2025-01-15",
  endDate: "2025-05-15",
  totalHours: 45,
  studentsEnrolled: 35,
  rating: 4.5,
  totalRatings: 128,
  progress: 65,
  modules: [
    {
      id: 1,
      title: "Giới thiệu về Kiểm thử Phần mềm",
      description:
        "Tổng quan về kiểm thử phần mềm, tầm quan trọng và quy trình",
      isExpanded: true,
      lessons: [
        {
          id: 1,
          title: "Forum thảo luận chung",
          type: "forum",
          completed: true,
          description: "Nơi thảo luận các vấn đề chung về khóa học",
        },
        {
          id: 2,
          title: "Giới thiệu về Kiểm thử Phần mềm",
          type: "document",
          completed: true,
          description: "Tài liệu giới thiệu tổng quan về kiểm thử phần mềm",
        },
        {
          id: 3,
          title: "Tầm quan trọng của Kiểm thử",
          type: "video",
          duration: "15 min",
          completed: true,
          description:
            "Video về tầm quan trọng của kiểm thử trong phát triển phần mềm",
        },
        {
          id: 4,
          title: "Quy trình Kiểm thử Phần mềm",
          type: "document",
          completed: false,
          description: "Tài liệu về quy trình kiểm thử phần mềm",
        },
        {
          id: 5,
          title: "Bài tập 1: Phân tích Case Study",
          type: "assignment",
          completed: false,
          description: "Phân tích một case study về kiểm thử phần mềm",
        },
      ],
    },
    {
      id: 2,
      title: "Các loại Kiểm thử và Phương pháp",
      description:
        "Tìm hiểu về các loại kiểm thử khác nhau và phương pháp áp dụng",
      isExpanded: false,
      lessons: [
        {
          id: 6,
          title: "Kiểm thử Đơn vị (Unit Testing)",
          type: "video",
          duration: "25 min",
          completed: true,
          description: "Video hướng dẫn về kiểm thử đơn vị",
        },
        {
          id: 7,
          title: "Kiểm thử Tích hợp (Integration Testing)",
          type: "document",
          completed: false,
          description: "Tài liệu về kiểm thử tích hợp",
        },
        {
          id: 8,
          title: "Kiểm thử Hệ thống (System Testing)",
          type: "video",
          duration: "30 min",
          completed: false,
          description: "Video về kiểm thử hệ thống",
        },
        {
          id: 9,
          title: "Thực hành với JUnit",
          type: "link",
          completed: false,
          url: "https://junit.org/junit5/",
          description: "Link đến tài liệu JUnit để thực hành",
        },
        {
          id: 10,
          title: "Bài tập 2: Viết Test Case",
          type: "assignment",
          completed: false,
          description: "Viết test case cho một ứng dụng mẫu",
        },
      ],
    },
    {
      id: 3,
      title: "Công cụ Kiểm thử Tự động",
      description: "Học về các công cụ kiểm thử tự động phổ biến",
      isExpanded: false,
      lessons: [
        {
          id: 11,
          title: "Selenium WebDriver",
          type: "video",
          duration: "40 min",
          completed: false,
          description: "Video hướng dẫn sử dụng Selenium WebDriver",
        },
        {
          id: 12,
          title: "TestNG Framework",
          type: "document",
          completed: false,
          description: "Tài liệu về TestNG Framework",
        },
        {
          id: 13,
          title: "Cypress Testing Tool",
          type: "video",
          duration: "35 min",
          completed: false,
          description: "Video về công cụ Cypress",
        },
        {
          id: 14,
          title: "Demo: Tạo Test Script",
          type: "video",
          duration: "50 min",
          completed: false,
          description: "Demo tạo test script với Selenium",
        },
        {
          id: 15,
          title: "Bài tập 3: Automation Testing",
          type: "assignment",
          completed: false,
          description: "Tạo bộ test tự động cho một website",
        },
      ],
    },
    {
      id: 4,
      title: "Kiểm thử Hiệu năng và Bảo mật",
      description: "Tìm hiểu về kiểm thử hiệu năng và kiểm thử bảo mật",
      isExpanded: false,
      lessons: [
        {
          id: 16,
          title: "Performance Testing với JMeter",
          type: "video",
          duration: "45 min",
          completed: false,
          description: "Video hướng dẫn kiểm thử hiệu năng với JMeter",
        },
        {
          id: 17,
          title: "Load Testing vs Stress Testing",
          type: "document",
          completed: false,
          description: "Tài liệu phân biệt các loại kiểm thử hiệu năng",
        },
        {
          id: 18,
          title: "Security Testing Fundamentals",
          type: "video",
          duration: "35 min",
          completed: false,
          description: "Video về cơ bản kiểm thử bảo mật",
        },
        {
          id: 19,
          title: "OWASP Top 10 Vulnerabilities",
          type: "link",
          url: "https://owasp.org/Top10/",
          completed: false,
          description: "Link đến OWASP Top 10",
        },
        {
          id: 20,
          title: "Project: Security Assessment",
          type: "assignment",
          completed: false,
          description: "Đánh giá bảo mật cho một ứng dụng web",
        },
      ],
    },
    {
      id: 5,
      title: "Báo cáo và Quản lý Lỗi",
      description: "Học cách báo cáo lỗi và quản lý quy trình kiểm thử",
      isExpanded: false,
      lessons: [
        {
          id: 21,
          title: "Bug Report Best Practices",
          type: "document",
          completed: false,
          description: "Tài liệu về cách viết báo cáo lỗi hiệu quả",
        },
        {
          id: 22,
          title: "JIRA for Bug Tracking",
          type: "video",
          duration: "30 min",
          completed: false,
          description: "Video hướng dẫn sử dụng JIRA",
        },
        {
          id: 23,
          title: "Test Management với TestRail",
          type: "video",
          duration: "25 min",
          completed: false,
          description: "Video về quản lý kiểm thử với TestRail",
        },
        {
          id: 24,
          title: "Final Project: Complete Testing Plan",
          type: "assignment",
          completed: false,
          description: "Tạo kế hoạch kiểm thử hoàn chỉnh cho một dự án",
        },
      ],
    },
  ],
};

const CourseDetail = () => {
  const [course, setCourse] = useState<CourseInfo>(mockCourseDetail);
  const [activeTab, setActiveTab] = useState<
    "content" | "person_assignments" | "quiz" | "score_feedback"
  >("content");

  const toggleModule = (moduleId: number) => {
    setCourse((prev) => ({
      ...prev,
      modules: prev.modules.map((module) =>
        module.id === moduleId
          ? { ...module, isExpanded: !module.isExpanded }
          : module
      ),
    }));
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />;
      case "document":
        return <FileText className="w-4 h-4" />;
      case "quiz":
        return <BookOpen className="w-4 h-4" />;
      case "assignment":
        return <FileDown className="w-4 h-4" />;
      case "forum":
        return <MessageSquare className="w-4 h-4" />;
      case "link":
        return <LinkIcon className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const completedLessons = course.modules.reduce(
    (total, module) =>
      total + module.lessons.filter((lesson) => lesson.completed).length,
    0
  );

  const totalLessons = course.modules.reduce(
    (total, module) => total + module.lessons.length,
    0
  );

  return (
    <div className="student-dashboard student-dashboard-bg">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/student/e-learning"
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Quay lại dashboard
          </Link>
        </div>

        {/* Course Header */}
        <div className="student-dashboard-course-card mb-8">
          <div className="md:flex gap-6">
            <div className="md:w-1/3">
              <img
                src={course.image}
                alt={course.title}
                className="w-full object-cover rounded-lg"
              />
            </div>

            <div className="md:w-2/3 py-4 pr-4">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-2">
                  {course.category}
                </span>
                <h1 className="text-3xl font-bold student-dashboard-course-title mb-2">
                  {course.title}
                </h1>
                <p className="text-lg student-dashboard-course-subtitle mb-4">
                  {course.subtitle}
                </p>
                <p className="student-dashboard-text-muted mb-4">
                  {course.description}
                </p>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="font-semibold">
                      {course.studentsEnrolled}
                    </span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Học viên
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-semibold">{course.totalHours}h</span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Tổng thời gian
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="font-semibold">4 tháng</span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Thời lượng
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    <span className="font-semibold">{course.rating}</span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    ({course.totalRatings} đánh giá)
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Tiến độ học tập</span>
                  <span className="text-sm student-dashboard-progress-text">
                    {completedLessons}/{totalLessons} bài học (
                    {Math.round((completedLessons / totalLessons) * 100)}%)
                  </span>
                </div>
                <div className="w-full student-dashboard-progress-bg rounded-full h-3">
                  <div
                    className="student-dashboard-progress-fill h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${(completedLessons / totalLessons) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: "content", label: "Nội dung khóa học", icon: BookOpen },
                {
                  id: "person_assignments",
                  label: "Bài tập cá nhân",
                  icon: Rocket,
                },
                { id: "quiz", label: "Bài kiểm tra quiz", icon: Atom },
                {
                  id: "score_feedback",
                  label: "Điểm số và phản hồi",
                  icon: MessagesSquare,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | "content"
                        | "person_assignments"
                        | "quiz"
                        | "score_feedback"
                    )
                  }
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-96">
          {activeTab === "content" && (
            <div className="space-y-4">
              {course.modules.map((module) => (
                <div key={module.id} className="student-dashboard-course-card">
                  <div className="p-4">
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <div className="flex items-center gap-3">
                        {module.isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <h3 className="text-lg font-semibold student-dashboard-course-title">
                            {module.title}
                          </h3>
                          <p className="text-sm student-dashboard-text-muted mt-1">
                            {module.description}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm student-dashboard-text-muted">
                        {module.lessons.filter((l) => l.completed).length}/
                        {module.lessons.length} bài
                      </div>
                    </button>

                    {module.isExpanded && (
                      <div className="mt-4 pl-8 space-y-3">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                          >
                            <div className="flex-shrink-0">
                              {lesson.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                              ) : (
                                <Circle className="w-5 h-5 text-gray-400" />
                              )}
                            </div>

                            <div className="flex-shrink-0 text-blue-600">
                              {getLessonIcon(lesson.type)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4
                                className={`font-medium ${
                                  lesson.completed
                                    ? "text-gray-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {lesson.title}
                              </h4>
                              {lesson.description && (
                                <p className="text-sm student-dashboard-text-muted mt-1">
                                  {lesson.description}
                                </p>
                              )}
                            </div>

                            {lesson.duration && (
                              <div className="flex-shrink-0 text-sm student-dashboard-text-muted">
                                {lesson.duration}
                              </div>
                            )}

                            {lesson.type === "document" && (
                              <button className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600">
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "person_assignments" && (
            <div className="student-dashboard-course-card p-6">
              <h3 className="text-xl font-semibold mb-4">Mô tả khóa học</h3>
              <div className="prose max-w-none">
                <p className="mb-4">{course.description}</p>
                <h4 className="text-lg font-semibold mb-3">
                  Mục tiêu khóa học:
                </h4>
                <ul className="list-disc pl-6 space-y-2 mb-4">
                  <li>
                    Hiểu rõ về quy trình kiểm thử phần mềm và tầm quan trọng
                    trong phát triển phần mềm
                  </li>
                  <li>
                    Nắm vững các loại kiểm thử: đơn vị, tích hợp, hệ thống, và
                    kiểm thử chấp nhận
                  </li>
                  <li>
                    Sử dụng thành thạo các công cụ kiểm thử tự động như
                    Selenium, JUnit, TestNG
                  </li>
                  <li>
                    Áp dụng kiểm thử hiệu năng và kiểm thử bảo mật trong thực tế
                  </li>
                  <li>
                    Viết báo cáo lỗi hiệu quả và quản lý quy trình kiểm thử
                  </li>
                </ul>
                <h4 className="text-lg font-semibold mb-3">
                  Yêu cầu tiên quyết:
                </h4>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Kiến thức cơ bản về lập trình (Java hoặc Python)</li>
                  <li>Hiểu biết về phát triển phần mềm</li>
                  <li>Có kinh nghiệm sử dụng máy tính và internet</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="student-dashboard-course-card p-6">
              <div className="flex items-start gap-4">
                <img
                  src={course.instructor.avatar}
                  alt={course.instructor.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">
                    {course.instructor.name}
                  </h3>
                  <p className="text-blue-600 mb-3">
                    {course.instructor.title}
                  </p>
                  <p className="student-dashboard-text-muted mb-4">
                    {course.instructor.bio}
                  </p>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold student-dashboard-course-title">
                        10+
                      </div>
                      <div className="text-sm student-dashboard-text-muted">
                        Năm kinh nghiệm
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold student-dashboard-course-title">
                        500+
                      </div>
                      <div className="text-sm student-dashboard-text-muted">
                        Học viên
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold student-dashboard-course-title">
                        15
                      </div>
                      <div className="text-sm student-dashboard-text-muted">
                        Khóa học
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "score_feedback" && (
            <div className="space-y-6">
              {/* Rating Summary */}
              <div className="student-dashboard-course-card p-6">
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold student-dashboard-course-title">
                      {course.rating}
                    </div>
                    <div className="flex items-center justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= course.rating
                              ? "text-yellow-500 fill-current"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="text-sm student-dashboard-text-muted mt-1">
                      {course.totalRatings} đánh giá
                    </div>
                  </div>

                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div
                        key={rating}
                        className="flex items-center gap-2 mb-1"
                      >
                        <span className="text-sm w-8">{rating}</span>
                        <Star className="w-4 h-4 text-yellow-500" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{ width: `${Math.random() * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sample Reviews */}
              <div className="space-y-4">
                {[
                  {
                    name: "Nguyễn Minh Tuấn",
                    rating: 5,
                    date: "2024-12-01",
                    comment:
                      "Khóa học rất hay và bổ ích. Giảng viên giải thích rất rõ ràng và dễ hiểu.",
                  },
                  {
                    name: "Trần Thu Hằng",
                    rating: 4,
                    date: "2024-11-28",
                    comment:
                      "Nội dung khóa học phong phú, nhiều ví dụ thực tế. Chỉ mong có thêm bài tập thực hành.",
                  },
                  {
                    name: "Lê Văn Nam",
                    rating: 5,
                    date: "2024-11-25",
                    comment:
                      "Tuyệt vời! Sau khóa học tôi đã có thể áp dụng kiểm thử tự động vào công việc.",
                  },
                ].map((review, index) => (
                  <div
                    key={index}
                    className="student-dashboard-course-card p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {review.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{review.name}</h4>
                          <div className="flex items-center">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? "text-yellow-500 fill-current"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm student-dashboard-text-muted">
                            {review.date}
                          </span>
                        </div>
                        <p className="student-dashboard-text-muted">
                          {review.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CourseDetail;
