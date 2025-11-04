import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  FileText,
  Users,
  Calendar,
  Clock,
  BookOpen,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Circle,
} from "lucide-react";
import "../../../styles/student-dashboard.css";
import Header from "../dashboard/Header";
import Footer from "../dashboard/Footer";

import { course_tabs } from "../data/CourseDetailData";
import type { EnrolledCourseContentResponse } from "@/services/api/student/courseEnrollmentApi";
import courseEnrollmentApi from "@/services/api/student/courseEnrollmentApi";

const CourseDetail = () => {
  const [course, setCourse] = useState<EnrolledCourseContentResponse>();
  const [activeTab, setActiveTab] = useState<string>("content");
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set()
  );
  const { id } = useParams<{ id: string }>();

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

  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        if (id) {
          const data = await courseEnrollmentApi.getEnrolledCourseContents(
            Number(id)
          );
          setCourse(data);

          // Mở section đầu tiên mặc định
          if (data.sections && data.sections.size > 0) {
            const firstSection = Array.from(data.sections)[0];
            setExpandedSections(new Set([firstSection.id]));
          }
        }
      } catch (error) {
        console.error("Error fetching course content:", error);
      }
    };

    fetchCourseContent();
  }, [id]);

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
                src="/src/assets/images/courses/4by3/05.jpg"
                alt={course?.courseName || "Course"}
                className="w-full object-cover rounded-lg"
              />
            </div>

            <div className="md:w-2/3 py-4 pr-4">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-2">
                  Khóa học
                </span>
                <h1 className="text-3xl font-bold student-dashboard-course-title mb-2">
                  {course?.courseName || "Loading..."}
                </h1>
                <p className="text-lg student-dashboard-course-subtitle mb-4">
                  Năm học: {course?.schoolYear}
                </p>
                <p className="student-dashboard-text-muted mb-4">
                  {course?.description || ""}
                </p>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="font-semibold">N/A</span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Học viên
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-semibold">N/A</span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Tổng thời gian
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="font-semibold">
                      Năm {course?.schoolYear}
                    </span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Năm học
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span className="font-semibold">
                      {course?.sections?.size || 0}
                    </span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Chương học
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Tiến độ học tập</span>
                  <span className="text-sm student-dashboard-progress-text">
                    {course?.progressPercentage || 0}%
                  </span>
                </div>
                <div className="w-full student-dashboard-progress-bg rounded-full h-3">
                  <div
                    className="student-dashboard-progress-fill h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${course?.progressPercentage || 0}%`,
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
              {course_tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(
                      tab.id as
                        | "content"
                        | "personal_assignments"
                        | "group_assignments"
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
              {course &&
                course.sections &&
                Array.from(course.sections).map((section) => (
                  <div
                    key={section.id}
                    className="student-dashboard-course-card"
                  >
                    <div className="p-4">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="flex items-center justify-between w-full text-left hover:bg-gray-50 rounded-lg p-2 -m-2"
                      >
                        <div className="flex items-center gap-3">
                          {expandedSections.has(section.id) ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          )}
                          <div>
                            <h3 className="text-lg font-semibold student-dashboard-course-title">
                              {section.title}
                            </h3>
                          </div>
                        </div>
                        <div className="text-sm student-dashboard-text-muted">
                          {section.lessons
                            ? Array.from(section.lessons).length
                            : 0}{" "}
                          bài
                        </div>
                      </button>

                      {expandedSections.has(section.id) && (
                        <div className="mt-4 pl-4 space-y-3">
                          {section.lessons &&
                            Array.from(section.lessons).map((lesson) => (
                              <div
                                key={lesson.id}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border"
                              >
                                <div className="flex-shrink-0">
                                  <Circle className="w-5 h-5 text-gray-400" />
                                </div>

                                <div className="flex-shrink-0 text-blue-600">
                                  {lesson.videoUrl ? (
                                    <Play className="w-4 h-4" />
                                  ) : (
                                    <FileText className="w-4 h-4" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 space-y-1">
                                  <h4 className="font-medium text-gray-700">
                                    {lesson.title}
                                  </h4>
                                  {lesson.videoUrl && (
                                    <div className="flex space-x-1">
                                      <p className="font-medium text-gray-700">
                                        Video:{" "}
                                      </p>
                                      <a
                                        href={lesson.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:underline text-red-500"
                                      >
                                        {lesson.videoUrl}
                                      </a>
                                      <hr className="my-2 border-gray-200" />
                                    </div>
                                  )}

                                  {lesson.description && (
                                    <p className="text-sm student-dashboard-text-muted mt-1">
                                      {lesson.description}
                                    </p>
                                  )}
                                </div>

                                {lesson.videoUrl && (
                                  <div className="flex-shrink-0 text-sm student-dashboard-text-muted">
                                    Video
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

              {(!course || !course.sections || course.sections.size === 0) && (
                <div className="student-dashboard-course-card p-6">
                  <p className="text-center student-dashboard-text-muted">
                    Chưa có nội dung khóa học nào được tải lên.
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "personal_assignments" && (
            <div className="student-dashboard-course-card p-6">
              <h3 className="text-xl font-semibold mb-4">Mô tả khóa học</h3>
              <div className="prose max-w-none">
                <p className="mb-4">
                  {course?.description || "Chưa có mô tả khóa học."}
                </p>
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

          {/* person assignment */}
          {activeTab === "group_assignments" && (
            <div className="student-dashboard-course-card p-6">
              <h3 className="text-xl font-semibold mb-4">Bài tập nhóm</h3>
              <p className="student-dashboard-text-muted">
                Chưa có bài tập nhóm nào được giao cho khóa học này.
              </p>
            </div>
          )}

          {activeTab === "quiz" && (
            <div className="student-dashboard-course-card p-6">
              <div className="flex items-start gap-4">
                <img
                  src="/src/assets/images/instructor/01.jpg"
                  alt="Giảng viên"
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">
                    Giảng viên khóa học
                  </h3>
                  <p className="text-blue-600 mb-3">
                    Thông tin sẽ được cập nhật sau
                  </p>
                  <p className="student-dashboard-text-muted mb-4">
                    Thông tin chi tiết về giảng viên sẽ được cập nhật trong thời
                    gian sớm nhất.
                  </p>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold student-dashboard-course-title">
                        N/A
                      </div>
                      <div className="text-sm student-dashboard-text-muted">
                        Năm kinh nghiệm
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold student-dashboard-course-title">
                        N/A
                      </div>
                      <div className="text-sm student-dashboard-text-muted">
                        Học viên
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold student-dashboard-course-title">
                        N/A
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
                      N/A
                    </div>
                    <div className="flex items-center justify-center mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-5 h-5 text-gray-300" />
                      ))}
                    </div>
                    <div className="text-sm student-dashboard-text-muted mt-1">
                      Chưa có đánh giá
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
                            className="bg-gray-300 h-2 rounded-full"
                            style={{ width: "0%" }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* No Reviews Message */}
              <div className="student-dashboard-course-card p-6">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    Chưa có đánh giá nào
                  </h3>
                  <p className="student-dashboard-text-muted">
                    Các đánh giá và phản hồi từ học viên sẽ được hiển thị tại
                    đây.
                  </p>
                </div>
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
