"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Package,
  Calendar,
  BookOpen,
} from "lucide-react";
import * as expertPublishedCourseApi from "@/services/api/expert/expertPublishedCourseApi";
import type { PublishedCourseResponse } from "@/services/api/response/publishedCourseResponse";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import educationUnitApi from "@/services/api/admin/educationUnitApi";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

const PendingCoursesPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<PublishedCourseResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [selectedTab, setSelectedTab] = useState<"pending" | "all">("pending");
  const [, setEducationalUnitLoading] = useState(false);
  const [, setCurrentEducationalUnit] =
    useState<EducationalUnitResponse | null>(null);
  const [educationalUnitId, setEducationalUnitId] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  // Stats state - tính toán từ tất cả khóa học
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const initializeEducationalUnit = async () => {
      try {
        setEducationalUnitLoading(true);
        const educationalUnit = await educationUnitApi.getMyEducationalUnit();
        setCurrentEducationalUnit(educationalUnit);
        setEducationalUnitId(Number(educationalUnit.id));
      } catch (error: any) {
        console.error("Failed to load educationalUnit:", error);
        setError("Không thể tải thông tin đơn vị giáo dục");
      } finally {
        setEducationalUnitLoading(false);
      }
    };

    initializeEducationalUnit();
  }, []);

  useEffect(() => {
    if (educationalUnitId === null) {
      console.warn("educationalUnitId is not loaded yet");
      return;
    }

    loadCourses();
    loadStats(); // Load stats riêng
  }, [educationalUnitId, page, selectedTab]);

  // Load stats từ API "all" courses
  const loadStats = async () => {
    if (educationalUnitId === null) return;

    try {
      // Gọi API để lấy tất cả khóa học (page 0, size lớn để lấy hết)
      const allCoursesResult =
        await expertPublishedCourseApi.getPublishedCourses(
          educationalUnitId,
          undefined,
          0,
          1000 // Lấy tất cả khóa học
        );

      // Tính toán stats từ tất cả khóa học
      const pending = allCoursesResult.content.filter(
        (c) => c.status === 1
      ).length;
      const approved = allCoursesResult.content.filter(
        (c) => c.status === 2
      ).length;
      const rejected = allCoursesResult.content.filter(
        (c) => c.status === 3
      ).length;

      setStats({
        total: allCoursesResult.totalElements,
        pending,
        approved,
        rejected,
      });
    } catch (error: any) {
      console.error("Error loading stats:", error);
      // Không set error ở đây để không ảnh hưởng đến UI chính
    }
  };

  const loadCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      let result;

      if (selectedTab === "pending") {
        result = await expertPublishedCourseApi.getPendingPublishedCourses(
          educationalUnitId!,
          page,
          10
        );
      } else {
        result = await expertPublishedCourseApi.getPublishedCourses(
          educationalUnitId!,
          undefined,
          page,
          10
        );
      }

      setCourses(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error: any) {
      console.error("Error loading courses:", error);
      setError(error?.message || "Lỗi khi tải danh sách khóa học");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: "pending" | "all") => {
    setSelectedTab(tab);
    setPage(0); // Reset to first page when changing tabs
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Quản Lý Khóa Học Thương Mại
            </h1>
          </div>
          <p className="text-gray-600">
            Xem xét và phê duyệt các khóa học được giảng viên gửi lên
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng Khóa Học</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <BookOpen className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Chờ Duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đã Duyệt</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.approved}
                </p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Từ Chối</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.rejected}
                </p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange("pending")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${selectedTab === "pending"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Chờ Duyệt ({stats.pending})
              </button>
              <button
                onClick={() => handleTabChange("all")}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${selectedTab === "all"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
              >
                Tất Cả ({stats.total})
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Courses List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Không có khóa học nào
            </h3>
            <p className="text-gray-600">
              {selectedTab === "pending"
                ? "Chưa có khóa học nào chờ duyệt"
                : "Chưa có khóa học nào được đóng gói"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {course.courseName}
                        </h3>
                        {getStatusBadge(course.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Gửi: {formatDate(course.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          {formatPrice(course.coursePrice)}
                        </span>
                        <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                          {course.courseType.courseTypeName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Course Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bài học</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {course.totalPublishedLessons || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bài kiểm tra</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {course.totalPublishedQuizzes || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Bài tập</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {course.totalPublishedAssignments || 0}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {course.description && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                      <MarkdownRenderer content={course.description} />
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                      Giảng viên:{" "}
                      <span className="font-medium">
                        {course.authorName}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/expert/published-courses/${course.id}`)
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Xem Chi Tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between bg-white px-6 py-4 rounded-lg shadow">
            <div className="text-sm text-gray-700">
              Hiển thị <span className="font-medium">{page * 10 + 1}</span> đến{" "}
              <span className="font-medium">
                {Math.min((page + 1) * 10, totalElements)}
              </span>{" "}
              trong tổng số <span className="font-medium">{totalElements}</span>{" "}
              khóa học
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  function getStatusBadge(status: number) {
    switch (status) {
      case 0:
        return (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case 1:
        return (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Chờ Duyệt
          </span>
        );
      case 2:
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Đã Duyệt
          </span>
        );
      case 3:
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Từ Chối
          </span>
        );
      default:
        return null;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  }
};

export default PendingCoursesPage;
