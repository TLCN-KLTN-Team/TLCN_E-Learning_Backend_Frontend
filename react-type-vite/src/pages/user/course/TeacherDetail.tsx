import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Mail, Phone, Users, BookOpen, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingDots } from "@/components/ui/LoadingDots";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import TeacherApiService, {
  type TeacherDetailResponse,
  type TeacherCoursesResponse,
} from "@/services/api/anonymous/teacherApi";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

const TeacherDetail: React.FC = () => {
  const { teacherId } = useParams<{ teacherId: string }>();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<TeacherDetailResponse | null>(null);
  const [courses, setCourses] = useState<TeacherCoursesResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(6);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchTeacherDetail = async () => {
      if (!teacherId) return;

      setLoading(true);
      try {
        const teacherData = await TeacherApiService.getTeacherDetail(teacherId);
        setTeacher(teacherData);
      } catch (error) {
        console.error("Error fetching teacher detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherDetail();
  }, [teacherId]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!teacherId) return;

      setCoursesLoading(true);
      try {
        const coursesData = await TeacherApiService.getTeacherCourses(
          teacherId,
          currentPage,
          pageSize
        );
        setCourses(coursesData.content || []);
        setTotalPages(coursesData.totalPages || 0);
      } catch (error) {
        console.error("Error fetching teacher courses:", error);
      } finally {
        setCoursesLoading(false);
      }
    };

    fetchCourses();
  }, [teacherId, currentPage, pageSize]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <LoadingDots />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Teacher not found
          </h2>
          <p className="text-gray-600 mb-4">
            The teacher you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Site Header */}
      <Header />

      {/* Back Button */}
      <div className="pt-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Teacher Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-40 h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center overflow-hidden">
                {teacher.avatar ? (
                  <img
                    src={teacher.avatar}
                    alt={teacher.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-6xl font-bold text-white">
                    {(teacher.name ?? "")
                      .split(" ")
                      .filter(Boolean)
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase() || "TV"}
                  </span>
                )}
              </div>
            </div>

            {/* Teacher Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {teacher.name}
              </h1>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Khóa học</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {teacher.totalPublishedCourses}
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Học viên</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(teacher.totalStudents ?? 0).toLocaleString()}
                  </p>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <span className="text-sm text-gray-600">Đánh giá</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {(teacher.averageRating ?? 0).toFixed(1)}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Liên hệ</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {teacher.email}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-3 text-gray-700">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <a
                    href={`mailto:${teacher.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {teacher.email}
                  </a>
                </div>
                {teacher.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <a
                      href={`tel:${teacher.phone}`}
                      className="text-blue-600 hover:underline"
                    >
                      {teacher.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bio */}
          {teacher.bio && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sơ yếu lý lịch
              </h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {teacher.bio}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        {teacher.description && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mô tả</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {teacher.description}
            </p>
          </div>
        )}

        {/* Department and Educational Unit */}
        {(teacher.department || teacher.educationalUnit) && (
          <div className="bg-white rounded-xl shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Thông tin đơn vị
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {teacher.department && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Khoa
                  </h3>
                  <p className="text-lg font-bold text-gray-900">
                    {teacher.department.name}
                  </p>
                  {teacher.department.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {teacher.department.description}
                    </p>
                  )}
                </div>
              )}
              {teacher.educationalUnit && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">
                    Đơn vị đào tạo
                  </h3>
                  <p className="text-lg font-bold text-gray-900">
                    {teacher.educationalUnit.name}
                  </p>
                  {teacher.educationalUnit.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {teacher.educationalUnit.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teacher's Courses */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Các khóa học của giảng viên
          </h2>

          {coursesLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingDots />
            </div>
          ) : courses.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/course/${course.id}`)}
                  >
                    {/* Course Thumbnail */}
                    <div className="relative h-40 bg-gradient-to-br from-blue-400 to-purple-500 overflow-hidden">
                      {course.thumbnailUrl ? (
                        <img
                          src={course.thumbnailUrl}
                          alt={course.courseName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-white opacity-50" />
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">
                        {course.courseName}
                      </h3>

                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        <MarkdownRenderer content={course.description ?? ""} />
                      </p>

                      {/* Stats */}
                      <div className="space-y-2 mb-4 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="font-medium text-gray-900">
                              {course.rating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-gray-500">
                            {course.enrolledCount} học viên
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-xl font-bold text-gray-900">
                          {course.coursePrice}
                        </span>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Xem khóa học
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12">
                  <Button
                    variant="outline"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  >
                    Trang trước
                  </Button>

                  {Array.from({ length: totalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={currentPage === i ? "default" : "outline"}
                      onClick={() => setCurrentPage(i)}
                      size="sm"
                    >
                      {i + 1}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    disabled={currentPage === totalPages - 1}
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages - 1, currentPage + 1))
                    }
                  >
                    Trang sau
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg p-8 text-center">
              <p className="text-gray-500 text-lg">
                Giảng viên chưa công bố khóa học nào.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default TeacherDetail;
