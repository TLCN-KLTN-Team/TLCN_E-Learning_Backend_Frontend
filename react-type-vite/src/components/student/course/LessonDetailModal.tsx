import { useEffect, useState } from "react";
import { X, Play, FileText, Download, Loader2, AlertCircle, Calendar, Clock } from "lucide-react";
import type { LessonResponse } from "@/services/api/response/lessonResponse";

interface LessonDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId?: number;
  lesson?: LessonResponse | null;
}

const LessonDetailModal = ({ isOpen, onClose, lessonId, lesson: initialLesson }: LessonDetailModalProps) => {
  const [lesson, setLesson] = useState<LessonResponse | null>(initialLesson || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      if (lessonId && !initialLesson) {
        fetchLessonDetail();
      }
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, lessonId]);

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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {lesson.videoUrl ? (
                  <Play className="w-6 h-6 text-blue-600 flex-shrink-0" />
                ) : (
                  <FileText className="w-6 h-6 text-blue-600 flex-shrink-0" />
                )}
                <h2 className="text-2xl font-bold text-gray-900">
                  {lesson.title}
                </h2>
              </div>
              <p className="text-sm text-gray-500 ml-9">
                Bài #{lesson.numberItem} • {lesson.sectionName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>

          {/* Lesson Info Summary */}
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
              <div className="bg-gray-50 border rounded-lg p-4">
                <div
                  className="prose max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
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

          {/* Actions */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDetailModal;