import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserPlus,
  BookOpen,
  School,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  X,
  Calendar,
  FileText,
  Hash,
  GraduationCap,
} from "lucide-react";
import { toast } from "react-toastify";
import CourseFormModal from "@/components/expert/course/CourseFormModal";
import AssignTeacherModal from "@/components/expert/course/AssignTeacherModal";
import CourseObjectiveModal from "@/components/expert/course/CourseObjectiveModal";
import ClassManagementModal from "@/components/expert/course/ClassManagementModal";
import * as expertCourseApi from "@/services/api/expert/expertCourseApi";
import * as educationUnitApi from "@/services/api/admin/educationUnitApi";
import * as expertClassApi from "@/services/api/expert/expertClassApi";
import type { CourseResponse } from "@/services/api/response/courseResponse";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";

const CourseListPage: React.FC = () => {
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showAssignTeacher, setShowAssignTeacher] = useState(false);
  const [showCloManagement, setShowCloManagement] = useState(false);
  const [showClassManagement, setShowClassManagement] = useState(false);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [educationalUnitLoading, setEducationalUnitLoading] = useState(true);
  const [currentEducationalUnit, setCurrentEducationalUnit] =
    useState<EducationalUnitResponse | null>(null);
  const [educationalUnitId, setEducationalUnitId] = useState<number | null>(
    null
  );
  const [classStats, setClassStats] = useState<
    Record<
      number,
      {
        totalClasses: number;
        totalStudents: number;
        activeClasses: number;
        capacity: number;
      }
    >
  >({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    const initializeEducationalUnit = async () => {
      try {
        setEducationalUnitLoading(true);
        const educationalUnit = await educationUnitApi.getMyEducationalUnit();
        setCurrentEducationalUnit(educationalUnit);
        setEducationalUnitId(educationalUnit.id);
      } catch (error: any) {
        console.error("Failed to load educationalUnit:", error);
        toast.error("Không thể tải dữ liệu cơ sở giáo dục");
      } finally {
        setEducationalUnitLoading(false);
      }
    };

    initializeEducationalUnit();
  }, []);

  const loadCourses = async (search?: string) => {
    if (!educationalUnitId) return;

    try {
      setLoading(true);
      const response: PaginatedResponse<CourseResponse> =
        await expertCourseApi.getCourses(educationalUnitId, currentPage, pageSize, search);

      const coursesData = response.content || [];
      setCourses(coursesData);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);

      await loadClassStats(coursesData);
    } catch (error: any) {
      console.error("Error loading courses:", error);
      toast.error("Không thể tải danh sách khóa học");
    } finally {
      setLoading(false);
    }
  };

  const loadClassStats = async (coursesData: CourseResponse[]) => {
    const stats: Record<
      number,
      {
        totalClasses: number;
        totalStudents: number;
        activeClasses: number;
        capacity: number;
      }
    > = {};

    for (const course of coursesData) {
      try {
        const classResponse = await expertClassApi.getClassesByCourse(
          educationalUnitId!,
          course.id
        );
        const classes = classResponse.content || [];

        stats[course.id] = {
          totalClasses: classes.length,
          totalStudents: classes.reduce(
            (sum, cls) => sum + (cls.currentStudents || 0),
            0
          ),
          activeClasses: classes.filter((cls) => cls.status === "ACTIVE")
            .length,
          capacity: classes.reduce((sum, cls) => sum + cls.maxStudents, 0),
        };
      } catch (error) {
        console.error(
          `Error loading class stats for course ${course.id}:`,
          error
        );
        stats[course.id] = {
          totalClasses: 0,
          totalStudents: 0,
          activeClasses: 0,
          capacity: 0,
        };
      }
    }

    setClassStats(stats);
  };

  useEffect(() => {
    if (educationalUnitId) {
      loadCourses();
    }
  }, [educationalUnitId, currentPage, pageSize]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (educationalUnitId) {
        setCurrentPage(0);
        loadCourses(searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSuccess = () => {
    loadCourses();
    setSelectedCourse(null);
  };

  const handleViewDetail = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowCourseDetail(true);
  };

  const handleEditCourse = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowEditModal(true);
  };

  const handleAssignTeacher = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowAssignTeacher(true);
  };

  const handleManageClasses = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowClassManagement(true);
  };

  const handleManageClo = (course: CourseResponse) => {
    setSelectedCourse(course);
    setShowCloManagement(true);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const getCapacityColor = (current: number, max: number) => {
    if (max === 0) return "text-gray-500";
    const ratio = current / max;
    if (ratio >= 0.9) return "text-red-600 font-semibold";
    if (ratio >= 0.7) return "text-orange-600 font-medium";
    return "text-green-600";
  };

  const getCapacityBadge = (current: number, max: number) => {
    if (max === 0) return { color: "gray", text: "Không có sức chứa" };
    const ratio = current / max;
    if (ratio >= 1) return { color: "red", text: "Đầy" };
    if (ratio >= 0.9) return { color: "orange", text: "Gần đầy" };
    if (ratio >= 0.7) return { color: "yellow", text: "Đông" };
    return { color: "green", text: "Còn chỗ" };
  };

  if (educationalUnitLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!educationalUnitId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Không tìm thấy cơ sở giáo dục
          </h3>
          <p className="text-red-700">
            Không thể tải dữ liệu cơ sở giáo dục. Vui lòng thử làm mới trang.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalClasses = Object.values(classStats).reduce(
    (sum, stat) => sum + stat.totalClasses,
    0
  );
  const totalStudents = Object.values(classStats).reduce(
    (sum, stat) => sum + stat.totalStudents,
    0
  );
  const totalCapacity = Object.values(classStats).reduce(
    (sum, stat) => sum + stat.capacity,
    0
  );
  const activeClasses = Object.values(classStats).reduce(
    (sum, stat) => sum + stat.activeClasses,
    0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpen className="mr-3 text-blue-600" size={32} />
            Quản lý Khóa học
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý khóa học và lớp học cho{" "}
            {currentEducationalUnit?.name || "cơ sở giáo dục của bạn"}
          </p>
        </div>
        <Button
          onClick={() => setShowCourseModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          <BookOpen className="mr-2" size={18} />
          Tạo Khóa học Mới
        </Button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm khóa học theo tên, mô tả, giảng viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {searchTerm ? (
              <X
                className="cursor-pointer hover:text-gray-600"
                size={20}
                onClick={() => setSearchTerm("")}
              />
            ) : (
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng Khóa học</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalElements}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="text-green-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Có Giảng viên</p>
              <p className="text-2xl font-bold text-gray-900">
                {courses.filter((c) => c.teacher).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <School className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Lớp Đang hoạt động
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {activeClasses}
              </p>
              <p className="text-xs text-gray-500">trên {totalClasses} tổng</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserPlus className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Sinh viên Đã đăng ký
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {totalStudents}
              </p>
              <p className="text-xs text-gray-500">
                trên {totalCapacity} sức chứa
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <TrendingUp className="text-cyan-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tỷ lệ Sử dụng</p>
              <p className="text-2xl font-bold text-gray-900">
                {totalCapacity > 0
                  ? Math.round((totalStudents / totalCapacity) * 100)
                  : 0}
                %
              </p>
              <p className="text-xs text-gray-500">sức chứa tổng thể</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {courses.length === 0 ? (
          <div className="p-12 text-center">
            <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy khóa học nào
            </h3>
            <p className="text-gray-500 mb-4">
              Bắt đầu bằng cách tạo khóa học đầu tiên của bạn
            </p>
            <Button
              onClick={() => setShowCourseModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
            >
              <BookOpen className="mr-2" size={16} />
              Tạo Khóa học
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Chi tiết Khóa học
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giảng viên
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lớp học & Trạng thái
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Đăng ký
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tín chỉ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {courses.map((course) => {
                    const stats = classStats[course.id] || {
                      totalClasses: 0,
                      totalStudents: 0,
                      activeClasses: 0,
                      capacity: 0,
                    };
                    const capacityBadge = getCapacityBadge(
                      stats.totalStudents,
                      stats.capacity
                    );

                    return (
                      <tr
                        key={course.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <button
                              onClick={() => handleViewDetail(course)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                            >
                              {course.courseName}
                              {stats.totalClasses === 0 && (
                                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                  Không có lớp
                                </span>
                              )}
                            </button>
                            {course.description && (
                              <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                                {course.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {course.teacher ? (
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-blue-600 font-medium text-sm">
                                  {course.teacher.firstName[0]}
                                  {course.teacher.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {course.teacher.firstName}{" "}
                                  {course.teacher.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  ID: {course.teacher.teacherId}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                                <Users className="w-4 h-4 text-gray-400" />
                              </div>
                              <span className="text-sm text-gray-500 italic">
                                Chưa phân công giảng viên
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              {stats.totalClasses} lớp
                            </span>
                            {stats.activeClasses < stats.totalClasses && (
                              <span className="text-xs text-gray-500">
                                ({stats.activeClasses} đang hoạt động)
                              </span>
                            )}
                          </div>
                          <div className="flex items-center mt-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${capacityBadge.color === "red"
                                ? "bg-red-100 text-red-800"
                                : capacityBadge.color === "orange"
                                  ? "bg-orange-100 text-orange-800"
                                  : capacityBadge.color === "yellow"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : capacityBadge.color === "green"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                            >
                              {capacityBadge.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <span
                              className={`text-sm font-medium ${getCapacityColor(
                                stats.totalStudents,
                                stats.capacity
                              )}`}
                            >
                              {stats.totalStudents}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              /{stats.capacity}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {stats.capacity === 0
                              ? "Chưa thiết lập sức chứa"
                              : `${stats.capacity - stats.totalStudents
                              } chỗ còn trống`}
                          </div>
                          {stats.capacity > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                              <div
                                className={`h-1.5 rounded-full ${stats.totalStudents >= stats.capacity
                                  ? "bg-red-600"
                                  : stats.totalStudents / stats.capacity >=
                                    0.9
                                    ? "bg-orange-500"
                                    : stats.totalStudents / stats.capacity >=
                                      0.7
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                  }`}
                                style={{
                                  width: `${Math.min(
                                    (stats.totalStudents / stats.capacity) *
                                    100,
                                    100
                                  )}%`,
                                }}
                              ></div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {course.credits || 0} tín chỉ
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCourse(course)}
                              className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                              <Edit2 size={14} className="mr-1" />
                              Sửa
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAssignTeacher(course)}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Users size={14} className="mr-1" />
                              GV
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManageClo(course)}
                              className="text-violet-600 border-violet-200 hover:bg-violet-50"
                            >
                              <GraduationCap size={14} className="mr-1" />
                              CĐR
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManageClasses(course)}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <School size={14} className="mr-1" />
                              Lớp
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">Hiển thị</span>

                  <select
                    aria-label="Items per page"
                    value={pageSize}
                    onChange={(e) =>
                      handlePageSizeChange(Number(e.target.value))
                    }
                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-700">
                    khóa học mỗi trang
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Trang {currentPage + 1} / {totalPages || 1} - Tổng{" "}
                    {totalElements} khóa học
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                    Trước
                  </Button>

                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx;
                    } else if (currentPage < 3) {
                      pageNum = idx;
                    } else if (currentPage > totalPages - 3) {
                      pageNum = totalPages - 5 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={
                          currentPage === pageNum ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className={
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : ""
                        }
                      >
                        {pageNum + 1}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1}
                    className="disabled:opacity-50"
                  >
                    Sau
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Course Detail Modal */}
      {showCourseDetail && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCourseDetail(false)}
          ></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Chi tiết Khóa học
                    </h2>
                    <p className="text-blue-100 text-sm mt-1">
                      Thông tin đầy đủ về khóa học
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCourseDetail(false)}
                  className="text-white hover:bg-white/20 h-10 w-10 p-0"
                >
                  <X size={20} />
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Course Name */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <BookOpen size={16} className="mr-2 text-blue-600" />
                    Tên Khóa học
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedCourse.courseName}
                  </p>
                </div>

                {/* Course Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Hash size={16} className="mr-2 text-green-600" />
                      Mã Khóa học
                    </h3>
                    <p className="text-lg font-medium text-gray-900">
                      #{selectedCourse.id}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Calendar size={16} className="mr-2 text-purple-600" />
                      Số Tín chỉ
                    </h3>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedCourse.credits || 0} tín chỉ
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Users size={16} className="mr-2 text-orange-600" />
                      Sĩ số Tối đa
                    </h3>
                    <p className="text-lg font-medium text-gray-900">
                      {selectedCourse.maxStudents || 0} sinh viên
                    </p>
                  </div>

                  <div className="bg-cyan-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <School size={16} className="mr-2 text-cyan-600" />
                      Tổng số Lớp
                    </h3>
                    <p className="text-lg font-medium text-gray-900">
                      {classStats[selectedCourse.id]?.totalClasses || 0} lớp học
                    </p>
                  </div>
                </div>

                {/* Teacher Info */}
                {selectedCourse.teacher ? (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                      <Users size={16} className="mr-2 text-blue-600" />
                      Giảng viên Phụ trách
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                        {selectedCourse.teacher.firstName[0]}
                        {selectedCourse.teacher.lastName[0]}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-xl">
                          {selectedCourse.teacher.firstName}{" "}
                          {selectedCourse.teacher.lastName}
                        </h4>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 font-medium">
                            Mã: {selectedCourse.teacher.teacherId}
                          </span>
                          {selectedCourse.teacher.department && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 font-medium">
                              {selectedCourse.teacher.department.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Users size={16} className="mr-2 text-gray-600" />
                      Giảng viên Phụ trách
                    </h3>
                    <p className="text-gray-500 italic">
                      Chưa phân công giảng viên
                    </p>
                  </div>
                )}

                {/* Description */}
                {selectedCourse.description && (
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <FileText size={16} className="mr-2 text-yellow-600" />
                      Mô tả Khóa học
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedCourse.description}
                    </p>
                  </div>
                )}

                {/* Class Statistics */}
                {classStats[selectedCourse.id] && (
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                      <TrendingUp size={16} className="mr-2 text-green-600" />
                      Thống kê Lớp học
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {classStats[selectedCourse.id].totalClasses}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Tổng số lớp
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {classStats[selectedCourse.id].activeClasses}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Lớp hoạt động
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {classStats[selectedCourse.id].totalStudents}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Sinh viên</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {classStats[selectedCourse.id].capacity}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">Sức chứa</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t bg-gray-50 px-6 py-4 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCourseDetail(false)}
                  className="px-6 py-2"
                >
                  Đóng
                </Button>
                <Button
                  onClick={() => {
                    setShowCourseDetail(false);
                    handleEditCourse(selectedCourse);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  <Edit2 size={16} className="mr-2" />
                  Chỉnh sửa
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CourseFormModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        educationalUnitId={educationalUnitId}
        onSuccess={handleSuccess}
      />

      {showEditModal && selectedCourse && (
        <EditCourseModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCourse(null);
          }}
          course={selectedCourse}
          educationalUnitId={educationalUnitId}
          onSuccess={handleSuccess}
        />
      )}

      <AssignTeacherModal
        isOpen={showAssignTeacher}
        onClose={() => setShowAssignTeacher(false)}
        course={selectedCourse}
        educationalUnitId={educationalUnitId}
        onSuccess={handleSuccess}
      />

      <CourseObjectiveModal
        isOpen={showCloManagement}
        onClose={() => setShowCloManagement(false)}
        course={selectedCourse}
        educationalUnitId={educationalUnitId}
        onSuccess={handleSuccess}
      />

      <ClassManagementModal
        isOpen={showClassManagement}
        onClose={() => setShowClassManagement(false)}
        course={selectedCourse}
        educationalUnitId={educationalUnitId}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

// Edit Course Modal Component
interface EditCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseResponse;
  educationalUnitId: number;
  onSuccess?: () => void;
}

const EditCourseModal: React.FC<EditCourseModalProps> = ({
  isOpen,
  onClose,
  course,
  educationalUnitId,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    courseName: course.courseName,
    credits: course.credits || 3,
    maxStudents: course.maxStudents || 30,
    description: course.description || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.courseName.trim()) {
      newErrors.courseName = "Tên khóa học là bắt buộc";
    }
    if (!form.credits || form.credits < 1) {
      newErrors.credits = "Số tín chỉ phải ít nhất là 1";
    }
    if (!form.maxStudents || form.maxStudents < 1) {
      newErrors.maxStudents = "Số sinh viên tối đa phải ít nhất là 1";
    }
    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setForm({
      ...form,
      [name]: type === "number" ? Number(value) : value,
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsLoading(true);
      await expertCourseApi.createCourse(educationalUnitId, form);
      toast.success("Cập nhật khóa học thành công!");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error updating course:", error);
      toast.error("Không thể cập nhật khóa học");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Edit2 className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                Chỉnh sửa Khóa học
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 h-8 w-8 p-0"
            >
              <X size={18} />
            </Button>
          </div>
          <p className="text-purple-100 text-sm mt-2">
            Cập nhật thông tin khóa học
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-[calc(90vh-120px)]"
        >
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <BookOpen size={16} className="mr-2" />
                  Thông tin Khóa học
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <BookOpen size={14} className="mr-2 text-blue-600" />
                      Tên Khóa học
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      name="courseName"
                      placeholder="VD: Nhập môn Khoa học Máy tính"
                      value={form.courseName}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.courseName
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-blue-500"
                        }`}
                    />
                    {errors.courseName && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.courseName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <Users size={16} className="mr-2" />
                  Chi tiết Khóa học
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Calendar size={14} className="mr-2 text-green-600" />
                      Số Tín chỉ
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      name="credits"
                      type="number"
                      placeholder="3"
                      value={form.credits || ""}
                      onChange={handleChange}
                      min="1"
                      max="10"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.credits
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-green-500"
                        }`}
                    />
                    {errors.credits && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.credits}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <Users size={14} className="mr-2 text-green-600" />
                      Số Sinh viên Tối đa
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      name="maxStudents"
                      type="number"
                      placeholder="30"
                      value={form.maxStudents || ""}
                      onChange={handleChange}
                      min="1"
                      max="500"
                      className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.maxStudents
                        ? "border-red-500 focus:border-red-500"
                        : "border-gray-300 focus:border-green-500"
                        }`}
                    />
                    {errors.maxStudents && (
                      <p className="text-red-500 text-xs flex items-center mt-1">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-2"></span>
                        {errors.maxStudents}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                  <FileText size={16} className="mr-2" />
                  Thông tin Bổ sung
                  <span className="text-gray-400 ml-2 text-xs">
                    (Không bắt buộc)
                  </span>
                </h3>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FileText size={14} className="mr-2 text-orange-600" />
                    Mô tả
                  </label>
                  <textarea
                    name="description"
                    placeholder="Cung cấp mô tả ngắn gọn về nội dung và mục tiêu của khóa học..."
                    value={form.description || ""}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:border-orange-500 focus:outline-none transition-colors"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t bg-gray-50 px-6 py-4 mt-auto">
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                disabled={isLoading}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Đang cập nhật...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Edit2 size={16} className="mr-2" />
                    Cập nhật Khóa học
                  </div>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseListPage;
