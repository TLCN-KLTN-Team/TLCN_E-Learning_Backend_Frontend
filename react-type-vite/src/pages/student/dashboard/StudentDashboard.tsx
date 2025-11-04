import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import "../../../styles/student-dashboard.css";

import CourseCard from "../../../components/student/dashboard/CourseCard";
import Header from "./Header";
import Footer from "./Footer";
import courseEnrollmentApi, {
  type EnrolledCoursesResponse,
} from "@/services/api/student/courseEnrollmentApi";
import { toast } from "react-toastify";

interface Course {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  progress: number | null;
  category: string;
}

// Mock data cho courses
const mockCourses: Course[] = [
  {
    id: 1,
    title: "Bao mat web_ Nhom 01CLC",
    subtitle: "2025-2026 HỌC KỲ 1 - ĐẠI HỌC CHÍNH QUY",
    image: "/src/assets/images/courses/4by3/01.jpg",
    progress: null,
    category: "Web Security",
  },
  {
    id: 2,
    title: "Cac cong nghe phan mem moi_ Nhom 01CLC",
    subtitle: "2024-2025 HỌC KỲ 3",
    image: "/src/assets/images/courses/4by3/02.jpg",
    progress: null,
    category: "Software Engineering",
  },
  {
    id: 3,
    title: "Chuyen de Doanh nghiep_ Nhom 02CLC",
    subtitle: "2025-2026 HỌC KỲ 1 - ĐẠI HỌC CHÍNH QUY",
    image: "/src/assets/images/courses/4by3/03.jpg",
    progress: null,
    category: "Business",
  },
  {
    id: 4,
    title: 'Cuoc thi Trac nghiem truc tuyen "Ty hao Viet Nam"',
    subtitle: "NGOẠI KHOA",
    image: "/src/assets/images/courses/4by3/04.jpg",
    progress: 0,
    category: "Contest",
  },
  {
    id: 5,
    title: "Kiem thu phan mem_ Nhom 04CLC",
    subtitle: "2025-2026 HỌC KỲ 1 - ĐẠI HỌC CHÍNH QUY",
    image: "/src/assets/images/courses/4by3/05.jpg",
    progress: 50,
    category: "Testing",
  },
  {
    id: 6,
    title: "Thuc tap tot nghiep_ Nhom 44CLC",
    subtitle: "2025-2026 HỌC KỲ 1 - ĐẠI HỌC CHÍNH QUY",
    image: "/src/assets/images/courses/4by3/06.jpg",
    progress: null,
    category: "Internship",
  },
];

export const StudentDashboard = () => {
  const [courses, setCourses] = useState<EnrolledCoursesResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("course_name");
  const [filterBy, setFilterBy] = useState("all");
  const [pageNumber, setPageNumber] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Filter courses based on search and filter
  const filteredCourses = courses.filter((course: EnrolledCoursesResponse) => {
    const matchesSearch = course.courseName
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      try {
        const data = await courseEnrollmentApi.getCatalogEnrolledCourses(
          pageNumber,
          pageSize,
          searchTerm
        );
        setCourses(data.content);
        console.log("Enrolled courses fetched:", data.content);
        toast.success("Khóa học đã được tải thành công!");
      } catch (error) {
        const msgErr = error as { message: string };
        toast.error(msgErr.message || "Lỗi khi tải khóa học!");
      }
    };

    fetchEnrolledCourses();
  }, [pageNumber, pageSize, searchTerm]);

  return (
    <div className="student-dashboard student-dashboard-bg">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 student-dashboard-main">
        {/* Welcome Message */}
        <div className="mb-8 student-dashboard-welcome">
          <h1 className="text-2xl font-bold mb-2">
            Chào mừng quay trở lại, Tran Trung! 👋
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
              {/* All Filter */}
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="student-dashboard-select px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="web security">Web Security</option>
                <option value="software engineering">
                  Software Engineering
                </option>
                <option value="business">Business</option>
                <option value="contest">Contest</option>
                <option value="testing">Testing</option>
                <option value="internship">Internship</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="student-dashboard-select px-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="course_name">Sort by course name</option>
                <option value="progress">Sort by progress</option>
                <option value="category">Sort by category</option>
              </select>
            </div>

            {/* Search - Moved to the right */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="student-dashboard-input pl-10 pr-4 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
              />
            </div>
          </div>

          {/* Course Grid */}
          <div
            className={"grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}
          >
            {filteredCourses.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </div>

          {/* Load More */}
          <div className="mt-8 text-center">
            <button className="student-dashboard-button px-6 py-2 rounded-lg text-sm">
              Tất cả
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default StudentDashboard;
