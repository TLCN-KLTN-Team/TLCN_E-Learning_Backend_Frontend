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
  PlayCircle,
  FileQuestion,
  PenTool,
  User,
  History,
  Clock,
  Tag,
  GraduationCap,
  Info,
} from "lucide-react";
import * as expertPublishedCourseApi from "@/services/api/expert/expertPublishedCourseApi";
import type { PublishedCourseResponse } from "@/services/api/response/publishedCourseResponse";
import ReadOnlySectionView from "@/components/expert/course/ReadOnlySectionView";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CourseApprovalDetailPage = () => {
  const { publishedCourseId } = useParams<{ publishedCourseId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [course, setCourse] = useState<PublishedCourseResponse | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Mock educational unit ID
  const educationalUnitId = 10;

  useEffect(() => {
    loadCourseDetails();
  }, [publishedCourseId]);

  const loadCourseDetails = async () => {
    if (!publishedCourseId) return;

    setLoading(true);
    try {
      const data = await expertPublishedCourseApi.getPublishedCourseById(
        educationalUnitId,
        parseInt(publishedCourseId)
      );
      setCourse(data);
    } catch (error) {
      console.error("Error loading course:", error);
      toast.error("Không thể tải thông tin khóa học");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!course || !publishedCourseId) return;

    setProcessing(true);
    try {
      await expertPublishedCourseApi.approvePublishedCourse(
        educationalUnitId,
        parseInt(publishedCourseId)
      );
      toast.success("Đã phê duyệt khóa học thành công");
      setTimeout(() => navigate("/expert/published-courses"), 2000);
    } catch (error) {
      console.error("Error approving course:", error);
      toast.error("Không thể phê duyệt khóa học");
    } finally {
      setProcessing(false);
      setShowApproveDialog(false);
    }
  };

  const handleReject = async () => {
    if (!course || !publishedCourseId) return;

    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }

    setProcessing(true);
    try {
      await expertPublishedCourseApi.rejectPublishedCourse(
        educationalUnitId,
        parseInt(publishedCourseId),
        rejectReason
      );
      toast.success("Đã từ chối khóa học");
      setTimeout(() => navigate("/expert/published-courses"), 2000);
    } catch (error) {
      console.error("Error rejecting course:", error);
      toast.error("Không thể từ chối khóa học");
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

  const getStatusText = (status?: number) => {
    switch (status) {
      case 0: return "Bản nháp";
      case 1: return "Đang chờ duyệt";
      case 2: return "Đã phê duyệt";
      case 3: return "Bị từ chối";
      default: return course?.statusText || "Chưa xác định";
    }
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
            onClick={() => navigate("/expert/published-courses")}
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
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/expert/published-courses")}
            className="mb-4 px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại danh sách
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {course.courseName}
              </h1>
              <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600">
                <span className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 rounded-full">
                  <Calendar className="w-4 h-4" />
                  Gửi: {formatDate(course.createdAt)}
                </span>
                <span className="px-3 py-1.5 bg-green-50 text-green-700 font-medium rounded-full">
                  {formatPrice(course.coursePrice)}
                </span>
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 font-medium rounded-full">
                  {course.courseType.courseTypeName}
                </span>
                <span
                  className={`px-3 py-1.5 font-medium rounded-full ${course.status === 1
                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    : course.status === 2
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                >
                  {getStatusText(course.status)}
                </span>
              </div>
            </div>

            {canApproveOrReject && (
              <div className="flex gap-3 flex-shrink-0 ml-4">
                <button
                  onClick={() => setShowRejectDialog(true)}
                  disabled={processing}
                  className="px-5 py-2.5 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors whitespace-nowrap shadow-sm"
                >
                  <XCircle className="w-5 h-5" />
                  Từ Chối
                </button>
                <button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={processing}
                  className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors whitespace-nowrap shadow-sm"
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          {/* Left Column - Course Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Course Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-shadow hover:shadow-md">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                Thông Tin Khóa Học
              </h2>

              {/* Description */}
              {course.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" /> Mô tả chi tiết
                  </h3>
                  <div className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                    <MarkdownRenderer content={course.description} />
                  </div>
                </div>
              )}

              {/* Introduction */}
              {course.courseIntroduction && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-400" /> Giới thiệu ngắn
                  </h3>
                  <div className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                    <MarkdownRenderer content={course.courseIntroduction} />
                  </div>
                </div>
              )}

              {/* Learner Achievements */}
              {course.learnerAchievements && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-gray-400" /> Kỹ năng đạt được
                  </h3>
                  <div className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                    <MarkdownRenderer content={course.learnerAchievements} />
                  </div>
                </div>
              )}

              {/* Course Learner */}
              {course.courseLearner && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" /> Đối tượng phù hợp
                  </h3>
                  <div className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                    <MarkdownRenderer content={course.courseLearner} />
                  </div>
                </div>
              )}

              {/* Course Targets */}
              {course.courseTarget && course.courseTarget.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-400" /> Mục tiêu khóa học
                  </h3>
                  <ul className="space-y-3 bg-gray-50 p-4 rounded-xl">
                    {course.courseTarget.map((target, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <span>{target}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Media */}
            {(course.courseImage || course.courseVideo) && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-shadow hover:shadow-md">
                <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  Tài Nguyên Media
                </h2>

                {course.courseImage && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <ImageIcon className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-semibold text-gray-800">Ảnh bìa:</h3>
                    </div>
                    <img
                      src={course.courseImage}
                      alt="Course"
                      className="w-full rounded-xl border border-gray-100 shadow-sm object-cover max-h-[400px]"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                {course.courseVideo && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Video className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-semibold text-gray-800">Video giới thiệu:</h3>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 overflow-hidden border border-gray-100">
                      <PlayCircle className="w-8 h-8 text-purple-500 flex-shrink-0" />
                      <a
                        href={course.courseVideo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline text-sm truncate"
                      >
                        {course.courseVideo}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Published Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-shadow hover:shadow-md">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
                Nội Dung Được Xuất Bản
              </h2>

              {course?.publishedSections && course.publishedSections.length > 0 ? (
                <div className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                  <ReadOnlySectionView sections={course.publishedSections} />
                </div>
              ) : (
                <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100 border-dashed">
                  <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Khóa học chưa có nội dung được xuất bản</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-8">
            {/* Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 relative overflow-hidden transition-shadow hover:shadow-md">
              <div className="absolute -top-4 -right-4 p-8 opacity-[0.03]">
                <Target className="w-40 h-40" />
              </div>
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 relative z-10">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                  <Target className="w-4 h-4" />
                </div>
                Tổng Quan
              </h2>
              <div className="space-y-5 relative z-10">
                <div className="flex items-center justify-between group">
                  <span className="text-sm text-gray-600 flex items-center gap-2 transition-colors group-hover:text-gray-900">
                    <PlayCircle className="w-4 h-4 text-blue-500" /> Bài học:
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 font-semibold rounded-full text-sm">
                    {course.totalPublishedLessons || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between group">
                  <span className="text-sm text-gray-600 flex items-center gap-2 transition-colors group-hover:text-gray-900">
                    <FileQuestion className="w-4 h-4 text-yellow-500" /> Bài kiểm tra:
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 font-semibold rounded-full text-sm">
                    {course.totalPublishedQuizzes || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between group">
                  <span className="text-sm text-gray-600 flex items-center gap-2 transition-colors group-hover:text-gray-900">
                    <PenTool className="w-4 h-4 text-green-500" /> Bài tập:
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 font-semibold rounded-full text-sm">
                    {course.totalPublishedAssignments || 0}
                  </span>
                </div>
                <div className="pt-5 mt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-500" /> Giá bán:
                    </span>
                    <span className="text-xl font-bold text-emerald-600">
                      {formatPrice(course.coursePrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-shadow hover:shadow-md">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                  <User className="w-4 h-4" />
                </div>
                Giảng Viên
              </h2>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg flex-shrink-0 shadow-inner">
                  {course.course.teacher ? course.course.teacher.lastName.charAt(0) : "G"}
                </div>
                <div className="overflow-hidden">
                  <p className="font-semibold text-gray-900 truncate">
                    {course.course.teacher
                      ? `${course.course.teacher.firstName} ${course.course.teacher.lastName}`
                      : course.course.idTeacher}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Người tạo khóa học</p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 transition-shadow hover:shadow-md">
              <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-md">
                  <History className="w-4 h-4" />
                </div>
                Lịch Sử
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4 relative">
                  <div className="absolute top-2 bottom-0 left-[7px] w-0.5 bg-gray-100 h-10"></div>
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 border-[3px] border-white ring-1 ring-blue-500 mt-1 relative z-10"></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Tạo khóa học</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(course.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 relative">
                  <div className="flex-shrink-0 w-4 h-4 rounded-full bg-yellow-100 border-[3px] border-white ring-1 ring-yellow-500 mt-1 relative z-10"></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Cập nhật gần nhất</p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(course.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reject Dialog */}
        {showRejectDialog && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectReason("");
              }}
            ></div>
            <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
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

        {/* Approve Dialog */}
        <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận phê duyệt</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc chắn muốn phê duyệt khóa học "{course.courseName}"?
                Sau khi phê duyệt, khóa học sẽ được công khai và sinh viên có thể đăng ký học.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={processing}>Hủy</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  handleApprove();
                }}
                disabled={processing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Phê duyệt ngay
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default CourseApprovalDetailPage;