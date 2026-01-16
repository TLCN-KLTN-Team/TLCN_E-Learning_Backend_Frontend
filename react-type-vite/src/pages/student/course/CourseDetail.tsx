import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  FileText,
  Users,
  Clock,
  BookOpen,
  Star,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Circle,
  Loader2,
  AlertCircle,
  X,
  Download,
  ExternalLink,
  CheckCircle,
  CheckCircle2,
} from "lucide-react";
import "../../../styles/student-dashboard.css";
import Header from "../dashboard/Header";
import Footer from "../dashboard/Footer";

import { course_tabs } from "../data/CourseDetailData";
import courseEnrollmentApi from "@/services/api/student/courseEnrollmentApi";
import type { SectionResponse } from "@/services/api/response/sectionResponse";
import type { CourseClassResponse } from "@/services/api/response/courseClassResponse";
import QuizDetailModal from "@/components/student/course/QuizDetailModal";
import AssignmentDetailModal from "@/components/student/course/AssignmentDetailModal";
import LessonDiscussionModal from "@/components/student/course/LessonDiscussionModal";
import type { ProgressStatsResponse } from "@/services/api/response/progressStatsResponse";
import progressApi from "@/services/api/student/progressApi";
import {
  fixCloudinaryVideoUrl,
  isYouTubeUrl,
  getYouTubeEmbedUrl,
} from "@/utils/videoUrlHelper";
import MarkdownRenderer from "@/components/shared/MarkdownRenderer";

const CourseDetail = () => {
  const [courseClass, setCourseClass] = useState<CourseClassResponse>();
  const [sections, setSections] = useState<SectionResponse[]>([]);
  const [isLoadingSections, setIsLoadingSections] = useState(false);
  const [sectionsError, setSectionsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("content");

  // Progress states
  const [progressStats, setProgressStats] =
    useState<ProgressStatsResponse | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    new Set()
  );
  const [isMarkingComplete, setIsMarkingComplete] = useState<Set<number>>(
    new Set()
  );

  // Quiz modal state
  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);

  // Assignment modal state
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<
    number | null
  >(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);

  // Lesson detail state
  const [expandedLessonId, setExpandedLessonId] = useState<number | null>(null);

  // Lesson discussion modal state
  const [selectedLessonForDiscussion, setSelectedLessonForDiscussion] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [isLessonDiscussionModalOpen, setIsLessonDiscussionModalOpen] = useState(false);

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

  const toggleLessonDetail = (lessonId: number) => {
    setExpandedLessonId((prev) => (prev === lessonId ? null : lessonId));
  };

  // Fetch progress stats
  const fetchProgressStats = async () => {
    if (!id) return;

    try {
      const stats = await progressApi.getClassProgress(Number(id));
      setProgressStats(stats);
      console.log("📊 Progress stats:", stats);

      // Fetch completed lessons
      const detail = await progressApi.getCourseProgressDetail(Number(id));
      console.log("📝 Course progress detail:", detail);
      console.log("📚 Lesson progresses:", detail?.courseProgress?.lessonProgresses);

      const completedLessonIds = new Set(
        detail?.courseProgress?.lessonProgresses
          ?.filter((lp: any) => {
            console.log(`Lesson ${lp.lessonId}: completed=${lp.completed}`);
            return lp.completed === true; // Use 'completed' instead of 'isCompleted'
          })
          ?.map((lp: any) => lp.lessonId) || []
      );

      console.log("✅ Completed lesson IDs:", Array.from(completedLessonIds));
      setCompletedLessons(completedLessonIds);
    } catch (error) {
      console.error("Error fetching progress stats:", error);
    }
  };

  // Fetch sections and contents
  const fetchFilteredSections = async () => {
    if (!id) return;

    try {
      setIsLoadingSections(true);
      setSectionsError(null);

      const filteredSections =
        await courseEnrollmentApi.getEnrolledCourseContents(Number(id));

      console.log("📚 Sections data:", filteredSections);

      // Log quiz and assignment data for debugging
      filteredSections.forEach(section => {
        if (section.quizs) {
          console.log(`📝 Section "${section.title}" - Quizzes:`, Array.from(section.quizs).map(q => ({
            id: q.id,
            title: q.title,
            attemptsCount: q.attemptsCount
          })));
        }
        if (section.assignments) {
          console.log(`📋 Section "${section.title}" - Assignments:`, Array.from(section.assignments).map(a => ({
            id: a.id,
            title: a.title,
            submissionsCount: a.submissionsCount
          })));
        }
      });

      setSections(filteredSections);

      if (filteredSections.length > 0) {
        setExpandedSections(new Set([filteredSections[0].id]));
      }
    } catch (error) {
      console.error("Error fetching filtered sections:", error);
      setSectionsError("Đã xảy ra lỗi khi tải nội dung khóa học");
    } finally {
      setIsLoadingSections(false);
    }
  };

  // Mark lesson as complete
  const handleMarkLessonComplete = async (lessonId: number) => {
    if (!id || completedLessons.has(lessonId)) return;

    setIsMarkingComplete((prev) => new Set(prev).add(lessonId));

    try {
      await progressApi.markLessonComplete({
        lessonId,
        classId: Number(id),
      });

      // Update local state immediately - this ensures UI updates right away
      setCompletedLessons((prev) => {
        const newSet = new Set(prev);
        newSet.add(lessonId);
        return newSet;
      });

      console.log("Lesson marked as complete!");

      // Refresh progress stats in background (don't affect completedLessons state)
      setTimeout(async () => {
        try {
          const stats = await progressApi.getClassProgress(Number(id));
          setProgressStats(stats);
        } catch (error) {
          console.error("Error refreshing progress stats:", error);
        }
      }, 500);

    } catch (error) {
      console.error("Error marking lesson complete:", error);
      alert("Không thể đánh dấu bài học đã hoàn thành. Vui lòng thử lại.");
      // Revert local state on error
      setCompletedLessons((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
    } finally {
      setIsMarkingComplete((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
    }
  };

  useEffect(() => {
    const fetchCourseContent = async () => {
      try {
        if (id) {
          const data = await courseEnrollmentApi.getClassById(Number(id));
          setCourseClass(data);
        }
      } catch (error) {
        console.error("Error fetching course content:", error);
      }
    };

    fetchCourseContent();
  }, [id]);

  useEffect(() => {
    if (activeTab === "content") {
      fetchFilteredSections();
    }
  }, [id, activeTab]);

  // Fetch progress when component mounts
  useEffect(() => {
    if (id) {
      fetchProgressStats();
    }
  }, [id]);

  return (
    <div className="student-dashboard student-dashboard-bg">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Link
            to="/student/dashboard"
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
                src="https://res.cloudinary.com/dm7wobbxu/image/upload/v1766208954/pngtree-people-studying-and-learning-in-room-couch-banner-graphic-vector-png-image_52216108_pigaoq.jpg"
                alt={courseClass?.courseName || "Course"}
                className="w-full object-cover rounded-lg"
              />
            </div>

            <div className="md:w-2/3 py-4 pr-4">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-2">
                  Khóa học
                </span>
                <h1 className="text-3xl font-bold student-dashboard-course-title mb-2">
                  {courseClass?.courseName || "Loading..."}
                </h1>
                <p className="text-lg student-dashboard-course-subtitle mb-4">
                  {courseClass?.className || "Loading..."}
                </p>
                <p className="student-dashboard-text-muted mb-4">
                  {courseClass?.description || ""}
                </p>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="w-4 h-4 mr-1" />
                    <span className="font-semibold">
                      {courseClass?.currentStudents || ""}
                    </span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Học viên
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-semibold">
                      {courseClass?.startDate
                        ? new Date(courseClass?.startDate).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Thời gian bắt đầu
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="font-semibold">
                      {courseClass?.endDate
                        ? new Date(courseClass?.endDate).toLocaleDateString()
                        : ""}
                    </span>
                  </div>
                  <span className="text-sm student-dashboard-text-muted">
                    Thời gian kết thúc
                  </span>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span className="font-semibold">
                      {sections.length || 0}
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
                    {progressStats
                      ? `${progressStats.overallProgress.toFixed(1)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="w-full student-dashboard-progress-bg rounded-full h-3">
                  <div
                    className="student-dashboard-progress-fill h-3 rounded-full transition-all duration-300"
                    style={{
                      width: `${progressStats?.overallProgress || 0}%`,
                    }}
                  ></div>
                </div>

                {/* Progress Details */}
                {progressStats && (
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      <span>
                        {progressStats.completedLessons}/
                        {progressStats.totalLessons} bài học
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>
                        {progressStats.completedQuizzes}/
                        {progressStats.totalQuizzes} quiz
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>
                        {progressStats.completedAssignments}/
                        {progressStats.totalAssignments} bài tập
                      </span>
                    </div>
                  </div>
                )}
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
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
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
              {/* Loading State */}
              {isLoadingSections && (
                <div className="student-dashboard-course-card p-8">
                  <div className="flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-600">
                      Đang tải nội dung khóa học...
                    </p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {!isLoadingSections && sectionsError && (
                <div className="student-dashboard-course-card p-6">
                  <div className="flex items-start gap-3 text-red-600">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Lỗi tải dữ liệu</p>
                      <p className="text-sm">{sectionsError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Content */}
              {!isLoadingSections && !sectionsError && sections.length > 0 && (
                <>
                  {sections
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((section) => {
                      const lessonsArray = section.lessons
                        ? Array.from(section.lessons)
                        : [];
                      const quizzesArray = section.quizs
                        ? Array.from(section.quizs)
                        : [];
                      const assignmentsArray = section.assignments
                        ? Array.from(section.assignments)
                        : [];

                      const sortedLessons = lessonsArray.sort(
                        (a, b) => a.numberItem - b.numberItem
                      );
                      const sortedQuizzes = quizzesArray.sort(
                        (a, b) => a.numberItem - b.numberItem
                      );
                      const sortedAssignments = assignmentsArray.sort(
                        (a, b) => a.numberItem - b.numberItem
                      );

                      return (
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
                                    {section.orderIndex}. {section.title}
                                  </h3>
                                  {section.description &&
                                    !expandedSections.has(section.id) && (
                                      <p className="text-sm text-gray-500 mt-1">
                                        {section.description}
                                      </p>
                                    )}
                                </div>
                              </div>
                              <div className="text-sm student-dashboard-text-muted">
                                {lessonsArray.length +
                                  quizzesArray.length +
                                  assignmentsArray.length}{" "}
                                nội dung
                              </div>
                            </button>

                            {expandedSections.has(section.id) && (
                              <div className="mt-4 pl-4 space-y-4">
                                {section.description && (
                                  <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                                    <p className="text-sm text-gray-700">
                                      {section.description}
                                    </p>
                                  </div>
                                )}

                                {/* Lessons */}
                                {sortedLessons.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                      📚 Bài học ({sortedLessons.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {sortedLessons.map((lesson) => {
                                        const isCompleted =
                                          completedLessons.has(lesson.id);
                                        const isMarking = isMarkingComplete.has(
                                          lesson.id
                                        );

                                        return (
                                          <div
                                            key={lesson.id}
                                            className="space-y-2"
                                          >
                                            {/* Lesson Header */}
                                            <div
                                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${expandedLessonId === lesson.id
                                                  ? "bg-blue-100 border-blue-400 shadow-md"
                                                  : "hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm"
                                                } ${isCompleted
                                                  ? "border-green-400 bg-green-50"
                                                  : ""
                                                }`}
                                            >
                                              <div className="flex-shrink-0">
                                                {isCompleted ? (
                                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                ) : (
                                                  <Circle
                                                    className={`w-5 h-5 ${expandedLessonId ===
                                                        lesson.id
                                                        ? "text-blue-600"
                                                        : "text-gray-400"
                                                      }`}
                                                  />
                                                )}
                                              </div>

                                              <div
                                                className="flex-shrink-0 text-blue-600 cursor-pointer"
                                                onClick={() =>
                                                  toggleLessonDetail(lesson.id)
                                                }
                                              >
                                                {lesson.videoUrl ? (
                                                  <Play className="w-4 h-4" />
                                                ) : (
                                                  <FileText className="w-4 h-4" />
                                                )}
                                              </div>

                                              <div
                                                className="flex-1 min-w-0 space-y-1 cursor-pointer"
                                                onClick={() =>
                                                  toggleLessonDetail(lesson.id)
                                                }
                                              >
                                                <h5 className="font-medium text-gray-700">
                                                  #{lesson.numberItem}{" "}
                                                  {lesson.title}
                                                </h5>
                                                {lesson.videoUrl && (
                                                  <div className="flex items-center gap-2">
                                                    <Play className="w-3 h-3 text-red-500" />
                                                    <span className="text-xs text-gray-500">
                                                      Video bài học
                                                    </span>
                                                  </div>
                                                )}

                                                {lesson.description &&
                                                  !expandedLessonId && (
                                                    <p className="text-sm student-dashboard-text-muted mt-1 line-clamp-2">
                                                      {lesson.description}
                                                    </p>
                                                  )}
                                              </div>

                                              <div className="flex items-center gap-2">
                                                {!isCompleted && (
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleMarkLessonComplete(
                                                        lesson.id
                                                      );
                                                    }}
                                                    disabled={isMarking}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm rounded flex items-center gap-1 transition-colors"
                                                  >
                                                    {isMarking ? (
                                                      <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        Đang lưu...
                                                      </>
                                                    ) : (
                                                      <>
                                                        <CheckCircle className="w-3 h-3" />
                                                        Hoàn thành
                                                      </>
                                                    )}
                                                  </button>
                                                )}

                                                {isCompleted && (
                                                  <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm rounded flex items-center gap-1">
                                                    <CheckCircle2 className="w-3 h-3" />
                                                    Đã hoàn thành
                                                  </span>
                                                )}

                                                <div
                                                  className="flex-shrink-0 cursor-pointer"
                                                  onClick={() =>
                                                    toggleLessonDetail(
                                                      lesson.id
                                                    )
                                                  }
                                                >
                                                  {expandedLessonId ===
                                                    lesson.id ? (
                                                    <ChevronDown className="w-5 h-5 text-blue-600" />
                                                  ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                                  )}
                                                </div>
                                              </div>
                                            </div>

                                            {/* Lesson Detail Content - Inline */}
                                            {expandedLessonId === lesson.id && (
                                              <div className="ml-8 bg-white border border-blue-200 rounded-lg p-6 shadow-lg animate-in slide-in-from-top-2">
                                                <div className="space-y-6">
                                                  {/* Header */}
                                                  <div className="flex items-start justify-between border-b pb-4">
                                                    <div className="flex-1">
                                                      <h3 className="text-xl font-bold text-gray-800 mb-2">
                                                        {lesson.title}
                                                      </h3>
                                                      <div className="flex items-center gap-4 text-sm text-gray-600">
                                                        <span className="flex items-center gap-1">
                                                          <BookOpen className="w-4 h-4" />
                                                          Bài học #
                                                          {lesson.numberItem}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                          <Clock className="w-4 h-4" />
                                                          {new Date(
                                                            lesson.createdAt
                                                          ).toLocaleDateString(
                                                            "vi-VN"
                                                          )}
                                                        </span>
                                                        {isCompleted && (
                                                          <span className="flex items-center gap-1 text-green-600 font-medium">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                            Đã hoàn thành
                                                          </span>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setExpandedLessonId(
                                                          null
                                                        );
                                                      }}
                                                      className="text-gray-400 hover:text-gray-600"
                                                    >
                                                      <X className="w-5 h-5" />
                                                    </button>
                                                  </div>

                                                  {/* Description */}
                                                  {lesson.description && (
                                                    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                                                      <p className="text-sm text-gray-700">
                                                        {lesson.description}
                                                      </p>
                                                    </div>
                                                  )}

                                                  {/* Video */}
                                                  {lesson.videoUrl && (
                                                    <div className="space-y-2">
                                                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                                        <Play className="w-5 h-5 text-red-500" />
                                                        Video bài học
                                                      </h4>
                                                      <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                                        {isYouTubeUrl(
                                                          lesson.videoUrl
                                                        ) ? (
                                                          // YouTube iframe
                                                          <iframe
                                                            src={
                                                              getYouTubeEmbedUrl(
                                                                lesson.videoUrl
                                                              ) || ""
                                                            }
                                                            className="w-full h-full"
                                                            frameBorder="0"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                            title={lesson.title}
                                                            onLoad={() => {
                                                              console.log(
                                                                "✅ YouTube iframe loaded successfully!"
                                                              );
                                                            }}
                                                            onError={(e) => {
                                                              console.error(
                                                                "❌ YouTube iframe load error:",
                                                                e
                                                              );
                                                            }}
                                                          />
                                                        ) : (
                                                          // Regular video file (Cloudinary, direct URL, etc.)
                                                          <video
                                                            src={fixCloudinaryVideoUrl(
                                                              lesson.videoUrl
                                                            )}
                                                            controls
                                                            controlsList="nodownload"
                                                            className="w-full h-full"
                                                            onError={(e) => {
                                                              console.error(
                                                                "❌ Video load error:",
                                                                e
                                                              );
                                                              console.error(
                                                                "Video src:",
                                                                (
                                                                  e.target as HTMLVideoElement
                                                                ).src
                                                              );
                                                              const videoElement =
                                                                e.target as HTMLVideoElement;
                                                              console.error(
                                                                "Error details:",
                                                                {
                                                                  error:
                                                                    videoElement.error,
                                                                  networkState:
                                                                    videoElement.networkState,
                                                                  readyState:
                                                                    videoElement.readyState,
                                                                }
                                                              );
                                                            }}
                                                            onLoadedMetadata={() => {
                                                              console.log(
                                                                "✅ Video loaded successfully!"
                                                              );
                                                            }}
                                                          >
                                                            Trình duyệt của bạn
                                                            không hỗ trợ video.
                                                          </video>
                                                        )}
                                                      </div>
                                                    </div>
                                                  )}

                                                  {/* Content */}
                                                  {lesson.content && (
                                                    <div className="space-y-2">
                                                      <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                                        <FileText className="w-5 h-5 text-blue-500" />
                                                        Nội dung bài học
                                                      </h4>
                                                      <div className="bg-gray-50 p-4 rounded-lg">
                                                        <MarkdownRenderer
                                                          content={
                                                            lesson.content
                                                          }
                                                        />
                                                      </div>
                                                    </div>
                                                  )}

                                                  {/* Attachments */}
                                                  {lesson.attachments &&
                                                    lesson.attachments.length >
                                                    0 && (
                                                      <div className="space-y-2">
                                                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                                                          <Download className="w-5 h-5 text-green-500" />
                                                          Tài liệu đính kèm (
                                                          {
                                                            lesson.attachments
                                                              .length
                                                          }
                                                          )
                                                        </h4>
                                                        <div className="space-y-2">
                                                          {lesson.attachments.map(
                                                            (
                                                              attachment,
                                                              index
                                                            ) => (
                                                              <a
                                                                key={index}
                                                                href={
                                                                  attachment
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                                              >
                                                                <FileText className="w-5 h-5 text-gray-600" />
                                                                <span className="flex-1 text-sm text-gray-700">
                                                                  Tài liệu{" "}
                                                                  {index + 1}
                                                                </span>
                                                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                                              </a>
                                                            )
                                                          )}
                                                        </div>
                                                      </div>
                                                    )}

                                                  {/* Discussion Button */}
                                                  <div className="pt-4 border-t">
                                                    <button
                                                      onClick={() => {
                                                        setSelectedLessonForDiscussion({
                                                          id: lesson.id,
                                                          title: lesson.title,
                                                        });
                                                        setIsLessonDiscussionModalOpen(true);
                                                      }}
                                                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                                                    >
                                                      <MessageSquare className="w-5 h-5" />
                                                      Thảo luận về bài học này
                                                    </button>
                                                  </div>

                                                  {/* Section Info */}
                                                  <div className="pt-4 border-t text-sm text-gray-500">
                                                    <p>
                                                      Thuộc chương:{" "}
                                                      <span className="font-medium text-gray-700">
                                                        {lesson.sectionName}
                                                      </span>
                                                    </p>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Quizzes */}
                                {sortedQuizzes.length > 0 && (
                                  <div className="pt-3 border-t">
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                      📝 Bài kiểm tra ({sortedQuizzes.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {sortedQuizzes.map((quiz) => {
                                        const isCompleted =
                                          (quiz.attemptsCount || 0) > 0;

                                        console.log(`🎯 Quiz "${quiz.title}":`, {
                                          id: quiz.id,
                                          attemptsCount: quiz.attemptsCount,
                                          isCompleted
                                        });

                                        return (
                                          <div
                                            key={quiz.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${isCompleted
                                                ? "border-green-400 bg-green-50"
                                                : "border-purple-200 bg-purple-50 hover:bg-purple-100"
                                              }`}
                                          >
                                            <div className="flex-shrink-0">
                                              {isCompleted ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                              ) : (
                                                <Circle className="w-5 h-5 text-purple-600" />
                                              )}
                                            </div>
                                            <div className="flex-shrink-0 text-purple-600">
                                              <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                              <h5 className="font-medium text-gray-700">
                                                #{quiz.numberItem} {quiz.title}
                                              </h5>
                                              <p className="text-sm text-gray-500">
                                                {quiz.duration} phút •{" "}
                                                {quiz.attemptLimit} lần làm •
                                                Điểm đạt: {quiz.passingScore}%
                                                {isCompleted &&
                                                  ` • Đã làm ${quiz.attemptsCount} lần`}
                                              </p>
                                            </div>
                                            <button
                                              className={`px-3 py-1.5 text-sm rounded flex items-center gap-1 transition-colors ${isCompleted
                                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                  : "bg-purple-600 text-white hover:bg-purple-700"
                                                }`}
                                              onClick={() => {
                                                setSelectedQuizId(quiz.id);
                                                setIsQuizModalOpen(true);
                                              }}
                                            >
                                              {isCompleted ? (
                                                <>
                                                  <CheckCircle2 className="w-3 h-3" />
                                                  Xem chi tiết
                                                </>
                                              ) : (
                                                "Làm bài"
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Assignments */}
                                {sortedAssignments.length > 0 && (
                                  <div className="pt-3 border-t">
                                    <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                      📋 Bài tập ({sortedAssignments.length})
                                    </h4>
                                    <div className="space-y-2">
                                      {sortedAssignments.map((assignment) => {
                                        const isCompleted =
                                          (assignment.submissionsCount || 0) >
                                          0;

                                        console.log(`📝 Assignment "${assignment.title}":`, {
                                          id: assignment.id,
                                          submissionsCount: assignment.submissionsCount,
                                          isCompleted
                                        });

                                        return (
                                          <div
                                            key={assignment.id}
                                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${isCompleted
                                                ? "border-green-400 bg-green-50"
                                                : "border-orange-200 bg-orange-50 hover:bg-orange-100"
                                              }`}
                                          >
                                            <div className="flex-shrink-0">
                                              {isCompleted ? (
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                              ) : (
                                                <Circle className="w-5 h-5 text-orange-600" />
                                              )}
                                            </div>
                                            <div className="flex-shrink-0 text-orange-600">
                                              <FileText className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                              <h5 className="font-medium text-gray-700">
                                                #{assignment.numberItem}{" "}
                                                {assignment.title}
                                              </h5>
                                              <p className="text-sm text-gray-500">
                                                Hạn:{" "}
                                                {new Date(
                                                  assignment.deadline
                                                ).toLocaleDateString(
                                                  "vi-VN"
                                                )}{" "}
                                                •{assignment.submissionType}
                                                {isCompleted && ` • Đã nộp`}
                                              </p>
                                            </div>
                                            <button
                                              className={`px-3 py-1.5 text-sm rounded flex items-center gap-1 transition-colors ${isCompleted
                                                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                  : "bg-orange-600 text-white hover:bg-orange-700"
                                                }`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedAssignmentId(
                                                  assignment.id
                                                );
                                                setIsAssignmentModalOpen(
                                                  true
                                                );
                                              }}
                                            >
                                              {isCompleted ? (
                                                <>
                                                  <CheckCircle2 className="w-3 h-3" />
                                                  Xem chi tiết
                                                </>
                                              ) : (
                                                "Nộp bài"
                                              )}
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </>
              )}

              {/* Empty State */}
              {!isLoadingSections &&
                !sectionsError &&
                sections.length === 0 && (
                  <div className="student-dashboard-course-card p-6">
                    <p className="text-center student-dashboard-text-muted">
                      Chưa có nội dung khóa học nào được công bố cho lớp của
                      bạn.
                    </p>
                  </div>
                )}
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

      {/* Modals */}
      <QuizDetailModal
        isOpen={isQuizModalOpen}
        onClose={() => {
          setIsQuizModalOpen(false);
          setSelectedQuizId(null);
          // Refresh progress and sections after quiz submission
          fetchProgressStats();
          fetchFilteredSections();
        }}
        quizId={selectedQuizId || 0}
        returnPath={`/student/dashboard/course/classes/${id}`}
      />

      <AssignmentDetailModal
        isOpen={isAssignmentModalOpen}
        onClose={() => {
          setIsAssignmentModalOpen(false);
          setSelectedAssignmentId(null);
          // Refresh progress and sections after assignment submission
          fetchProgressStats();
          fetchFilteredSections();
        }}
        assignmentId={selectedAssignmentId || 0}
      />

      <LessonDiscussionModal
        isOpen={isLessonDiscussionModalOpen}
        onClose={() => {
          setIsLessonDiscussionModalOpen(false);
          setSelectedLessonForDiscussion(null);
        }}
        lessonId={selectedLessonForDiscussion?.id || 0}
        lessonTitle={selectedLessonForDiscussion?.title || ""}
      />
    </div>
  );
};

export default CourseDetail;
