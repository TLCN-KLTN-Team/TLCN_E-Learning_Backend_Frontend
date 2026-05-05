import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import "../../../styles/student-dashboard.css";

import CourseCard from "../../../components/student/dashboard/CourseCard";
import Header from "./Header";
import Footer from "./Footer";
import { toast } from "react-toastify";
import type { EnrolledCoursesResponse } from "@/services/api/student/courseEnrollmentApi";
import { getCatalogEnrolledCourses } from "@/services/api/student/courseEnrollmentApi";
import { useAuth } from "@/context/auth-context/useAuth";

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCoursesResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("course_name");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Compute page range for numeric buttons
  const getPageRange = () => {
    const total = totalPages || 1;
    const maxButtons = 5;
    let start = Math.max(0, pageNumber - Math.floor(maxButtons / 2));
    let end = start + maxButtons - 1;
    if (end > total - 1) {
      end = total - 1;
      start = Math.max(0, end - (maxButtons - 1));
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      setIsLoading(true);
      try {
        const data = await getCatalogEnrolledCourses(
          pageNumber,
          pageSize,
          searchTerm?.trim() || "",
          sortBy
        );
        setCourses(data.content);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? 0);
        console.log("Enrolled courses fetched:", data.content);
      } catch (error) {
        const msgErr = error as { message: string };
        toast.error(msgErr.message || "Lỗi khi tải khóa học!");
      } finally {
        setIsLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [pageNumber, pageSize, searchTerm, sortBy]);

  // Debounce user input before applying searchTerm (to reduce API calls)
  useEffect(() => {
    const handle = setTimeout(() => {
      setSearchTerm(searchInput.trim());
      setPageNumber(0);
    }, 400);

    return () => clearTimeout(handle);
  }, [searchInput]);

  return (
    <div className="student-dashboard student-dashboard-bg min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 student-dashboard-main">
        {/* Welcome Message */}
        <div className="mb-8 student-dashboard-welcome">
          <h1 className="text-2xl font-bold mb-2">
            Chào mừng quay trở lại, {user ? `${user.firstName} ${user.lastName}` : 'Bạn'}! 👋
          </h1>
        </div>

        {/* Course Overview Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold student-dashboard-section-title mb-6">
            Tổng quan về khóa học
          </h2>

          {/* Filters and Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex flex-wrap items-center gap-3">

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sắp xếp khóa học"
                className="student-dashboard-select px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="course_name">Theo tên khóa học</option>
                <option value="progress">Theo tiến độ</option>
              </select>

              {/* Page Size */}
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(0);
                }}
                aria-label="Số mục mỗi trang"
                className="student-dashboard-select px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5 / trang</option>
                <option value={10}>10 / trang</option>
                <option value={20}>20 / trang</option>
                <option value={50}>50 / trang</option>
              </select>
            </div>

            {/* Search - Moved to the right */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="student-dashboard-input pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          {/* Course Grid */}
          {isLoading ? (
            <div className="mt-10 py-12 text-center rounded-xl border border-dashed border-gray-300 bg-white/60">
              <p className="text-lg font-semibold text-gray-700">Đang tải khóa học...</p>
              <p className="mt-2 text-sm text-gray-500">Vui lòng chờ trong giây lát.</p>
            </div>
          ) : courses.length > 0 ? (
            <>
              <div
                className={"grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}
              >
                {courses.map((course) => (
                  <CourseCard key={course.courseId} course={course} />
                ))}
              </div>

              {/* Pagination Controls */}
              <div className="mt-8 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPageNumber((p) => Math.max(0, p - 1))}
                  disabled={pageNumber <= 0}
                  className="student-dashboard-button px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  « Prev
                </button>

                <div className="flex items-center gap-2">
                  {getPageRange().map((p) => (
                    <button
                      key={p}
                      onClick={() => setPageNumber(p)}
                      className={`px-3 py-1 rounded-lg text-sm ${p === pageNumber ? 'bg-blue-600 text-white' : 'bg-white border'}`}
                    >
                      {p + 1}
                    </button>
                  ))}
                </div>

                <div className="text-sm text-gray-700">
                  Trang {pageNumber + 1} / {totalPages || 1} — {totalElements} kết quả
                </div>

                <button
                  onClick={() => setPageNumber((p) => Math.min((totalPages || 1) - 1, p + 1))}
                  disabled={pageNumber >= (totalPages || 1) - 1}
                  className="student-dashboard-button px-4 py-2 rounded-lg text-sm disabled:opacity-50"
                >
                  Next »
                </button>
              </div>
            </>
          ) : (
            <div className="mt-10 py-12 text-center rounded-xl border border-dashed border-gray-300 bg-white/60">
              <p className="text-lg font-semibold text-gray-700">Chưa có khóa học nào</p>
              <p className="mt-2 text-sm text-gray-500">Khi bạn được ghi danh vào lớp đang hoạt động, khóa học sẽ hiển thị ở đây.</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default StudentDashboard;
