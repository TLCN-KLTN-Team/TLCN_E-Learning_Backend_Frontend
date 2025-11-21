import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Calendar,
  BookOpen,
  FileText,
  Image as ImageIcon,
  Video,
  Target,
} from "lucide-react";
import * as adminPublishedCourseApi from "@/services/api/admin/adminPublishedCourseApi";
import type { PublishedCourseResponse } from "@/services/api/response/publishedCourseResponse";
import ReadOnlySectionView from "@/components/admin/course/ReadOnlySectionView";

const CourseApprovalDetailPage = () => {
  const { publishedCourseId } = useParams<{ publishedCourseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [course, setCourse] = useState<PublishedCourseResponse | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Mock educational unit ID
  const educationalUnitId = 10;

  useEffect(() => {
    loadCourseDetails();
  }, [publishedCourseId]);

  const loadCourseDetails = async () => {
    if (!publishedCourseId) return;

    setLoading(true);
    try {
      const data = await adminPublishedCourseApi.getPublishedCourseById(
        educationalUnitId,
        parseInt(publishedCourseId)
      );
      setCourse(data);
    } catch (error) {
      console.error("Error loading course:", error);
      showNotification("error", "Không thể tải thông tin khóa học");
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleApprove = async () => {
    if (!course || !publishedCourseId) return;

    if (!confirm("Bạn có chắc chắn muốn phê duyệt khóa học này?")) {
      return;
    }

    setProcessing(true);
    try {
      await adminPublishedCourseApi.approvePublishedCourse(
        educationalUnitId,
        parseInt(publishedCourseId)
      );
      showNotification("success", "Đã phê duyệt khóa học thành công");
      setTimeout(() => navigate("/admin/published-courses"), 2000);
    } catch (error) {
      console.error("Error approving course:", error);
      showNotification("error", "Không thể phê duyệt khóa học");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!course || !publishedCourseId) return;

    if (!rejectReason.trim()) {
      showNotification("error", "Vui lòng nhập lý do từ chối");
      return;
    }

    setProcessing(true);
    try {
      await adminPublishedCourseApi.rejectPublishedCourse(
        educationalUnitId,
        parseInt(publishedCourseId),
        rejectReason
      );
      showNotification("success", "Đã từ chối khóa học");
      setTimeout(() => navigate("/admin/published-courses"), 2000);
    } catch (error) {
      console.error("Error rejecting course:", error);
      showNotification("error", "Không thể từ chối khóa học");
    } finally {
      setProcessing(false);
      setShowRejectDialog(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Không tìm thấy khóa học</h2>
          <button
            onClick={() => navigate("/admin/published-courses")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const canApproveOrReject = course.status === 1; // Pending status

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Notification */}
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
              notification.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5" />
            )}
            <p className="font-medium">{notification.message}</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/published-courses")}
            className="mb-4 px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.course.courseName}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Gửi: {formatDate(course.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  {formatPrice(course.coursePrice)}
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {course.courseType.courseTypeName}
                </span>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    course.status === 1
                      ? "bg-yellow-100 text-yellow-700"
                      : course.status === 2
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {course.statusText}
                </span>
              </div>
            </div>

            {canApproveOrReject && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={processing}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  Từ Chối
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {processing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                  Phê Duyệt
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Course Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Thông Tin Khóa Học
              </h2>

              {/* Description */}
              {course.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Mô tả:</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {course.description}
                  </p>
                </div>
              )}

              {/* Introduction */}
              {course.courseIntroduction && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Giới thiệu:</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {course.courseIntroduction}
                  </p>
                </div>
              )}

              {/* Learner Achievements */}
              {course.learnerAchievements && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Thành tựu học viên:
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {course.learnerAchievements}
                  </p>
                </div>
              )}

              {/* Course Learner */}
              {course.courseLearner && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Đối tượng học viên:
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {course.courseLearner}
                  </p>
                </div>
              )}

              {/* Course Targets */}
              {course.courseTarget && course.courseTarget.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Mục tiêu khóa học:
                  </h3>
                  <ul className="space-y-2">
                    {course.courseTarget.map((target, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{target}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Media */}
            {(course.courseImage || course.courseVideo) && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Media</h2>

                {course.courseImage && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ImageIcon className="w-4 h-4 text-gray-600" />
                      <h3 className="text-sm font-medium text-gray-700">Ảnh khóa học:</h3>
                    </div>
                    <img
                      src={course.courseImage}
                      alt="Course"
                      className="w-full rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {course.courseVideo && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-4 h-4 text-gray-600" />
                      <h3 className="text-sm font-medium text-gray-700">Video giới thiệu:</h3>
                    </div>
                    <a
                      href={course.courseVideo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm break-all"
                    >
                      {course.courseVideo}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Published Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Nội Dung Được Xuất Bản
              </h2>

              {course?.publishedSections && course.publishedSections.length > 0 ? (
                <ReadOnlySectionView sections={course.publishedSections} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Khóa học chưa có nội dung được xuất bản</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Thống Kê</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tổng bài học:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {course.totalPublishedLessons || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bài kiểm tra:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {course.totalPublishedQuizzes || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bài tập:</span>
                  <span className="text-lg font-semibold text-gray-900">
                    {course.totalPublishedAssignments || 0}
                  </span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Giá bán:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatPrice(course.coursePrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Giảng Viên</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Tên giảng viên: <span className="font-medium text-gray-900">
                    {course.course.teacher 
                      ? `${course.course.teacher.firstName} ${course.course.teacher.lastName}` 
                      : course.course.idTeacher}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Khóa học: <span className="font-medium text-gray-900">{course.course.courseName}</span>
                </p>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Lịch Sử</h2>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Tạo khóa học</p>
                    <p className="text-xs text-gray-600">{formatDate(course.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-yellow-600 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Cập nhật gần nhất</p>
                    <p className="text-xs text-gray-600">{formatDate(course.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold mb-4">Từ Chối Khóa Học</h3>
              <p className="text-gray-600 mb-4">
                Vui lòng nhập lý do từ chối để giảng viên có thể cải thiện khóa học:
              </p>
              <textarea
                className="w-full p-3 border rounded-lg mb-4"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Nội dung chưa đầy đủ, cần bổ sung thêm bài tập thực hành..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowRejectDialog(false);
                    setRejectReason("");
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim() || processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xác Nhận Từ Chối
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseApprovalDetailPage;