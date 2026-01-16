import { useEffect, useState } from "react";
import { X, Play, FileText, Download, Loader2, AlertCircle, Calendar, Clock, MessageSquare, BookOpen } from "lucide-react";
import type { LessonResponse } from "@/services/api/response/lessonResponse";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";
import DiscussionSection from "./DiscussionSection";
import { useAuth } from "@/context/auth-context/useAuth";
import { getUnreadCount, markDiscussionAsRead } from "@/services/api/lessonDiscussionApi";

interface LessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId?: number;
  lesson?: LessonResponse | null;
}

const LessonDetailModal = ({ isOpen, onClose, lessonId, lesson: initialLesson }: LessonDetailModalProps) => {
  const { user } = useAuth();
  const [lesson] = useState<LessonResponse | null>(initialLesson || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "discussion">("info");
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (lessonId && !initialLesson) {
        fetchLessonDetail();
      }
      // Fetch unread count
      if (lessonId) {
        fetchUnreadCount();
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, lessonId]);

  // Mark discussion as read when switching to discussion tab
  const handleTabChange = async (tab: "info" | "discussion") => {
    setActiveTab(tab);
    if (tab === "discussion" && lessonId) {
      try {
        await markDiscussionAsRead(lessonId);
        setUnreadCount(0);
      } catch (err) {
        console.error("Error marking discussion as read:", err);
      }
    }
  };

  const fetchUnreadCount = async () => {
    if (!lessonId) return;
    try {
      const count = await getUnreadCount(lessonId);
      setUnreadCount(count);
    } catch (err) {
      console.error("Error fetching unread count:", err);
      setUnreadCount(0);
    }
  };

  const fetchLessonDetail = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Replace with your actual API call
      // const lessonData = await lessonApi.getLessonDetail(lessonId);
      // setLesson(lessonData);
    } catch (err) {
      console.error("Error fetching lesson detail:", err);
      setError("Không thể tải thông tin bài học");
    } finally {
      setIsLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-8">
          <div className="flex flex-col items-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Đang tải thông tin bài học...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-8">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <p className="font-medium">{error || "Không tìm thấy bài học"}</p>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const videoId = lesson.videoUrl ? getYouTubeVideoId(lesson.videoUrl) : null;
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between p-6 pb-0 border-b">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">
                  {lesson.title}
                </h2>
              </div>
              {lesson.description && (
                <p className="text-gray-600 mt-2">{lesson.description}</p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  Bài học #{lesson.numberItem}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b px-6">
            <nav className="flex -mb-px">
              <button
                onClick={() => handleTabChange("info")}
                className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === "info"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <FileText className="w-4 h-4" />
                Nội dung bài học
              </button>
              <button
                onClick={() => handleTabChange("discussion")}
                className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                  activeTab === "discussion"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Thảo luận
                {unreadCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "info" && (
              <div className="space-y-6">{/* Lesson Info Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Thông tin bài học</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Ngày tạo</p>
                  <p className="font-medium">
                    {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Cập nhật</p>
                  <p className="font-medium">
                    {new Date(lesson.updateAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
                  {lesson.isPublished ? (
                    <span className="text-green-600 text-lg">✓</span>
                  ) : (
                    <span className="text-orange-600 text-lg">⏳</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Trạng thái</p>
                  <p className="font-medium">
                    {lesson.isPublished ? "Đã công bố" : "Chưa công bố"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 flex items-center justify-center flex-shrink-0">
                  {lesson.isFreeLesson ? (
                    <span className="text-green-600 text-lg">✓</span>
                  ) : (
                    <span className="text-gray-600 text-lg">✗</span>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bài học miễn phí</p>
                  <p className="font-medium">
                    {lesson.isFreeLesson ? "Có" : "Không"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {lesson.description && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Mô tả</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-gray-700 whitespace-pre-wrap">{lesson.description}</p>
              </div>
            </div>
          )}

          {/* Video Section */}
          {lesson.videoUrl && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Play className="w-5 h-5 text-red-600" />
                Video bài học
              </h3>
              {embedUrl ? (
                <div className="relative w-full rounded-lg overflow-hidden" style={{ paddingBottom: "56.25%" }}>
                  <iframe
                    src={embedUrl}
                    title={lesson.title}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline break-all"
                  >
                    {lesson.videoUrl}
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Content */}
          {lesson.content && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Nội dung bài học</h3>
              <div className="bg-gray-50 border rounded-lg p-6">
                <MarkdownRenderer 
                  content={lesson.content} 
                  className="text-gray-700"
                />
              </div>
            </div>
          )}

          {/* Attachments */}
          {lesson.attachments && lesson.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Tài liệu đính kèm ({lesson.attachments.length})
              </h3>
              <div className="space-y-2">
                {lesson.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <span className="text-gray-700 break-all">{attachment}</span>
                    </div>
                    <a
                      href={attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors ml-3 flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Tải xuống
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
              </div>
            )}

            {/* Discussion Tab */}
            {activeTab === "discussion" && lessonId && (
              <DiscussionSection
                itemType="lesson"
                itemId={lessonId}
                itemTitle={lesson.title}
                user={user}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetailModal;