"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  ClipboardCheck,
  CheckCircle,
  Clock,
  PlayCircle,
  Menu,
  X,
  ChevronDown,
  Star,
  Search,
  Maximize,
  History as HistoryIcon,
  XCircle,
  Upload,
  Link as LinkIcon,
  Loader2,
  Trash2,
  MessageSquare,
  Bot
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getSectionsByCourseId } from "@/services/api/user/sectionApi"
import { CourseApiService } from "@/services/api/user/courseApi"
import type { SectionResponse } from "@/services/api/response/sectionResponse"
import type { LessonResponse } from "@/services/api/response/lessonResponse"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import type { AssignmentResponse } from "@/services/api/response/assignmentResponse"
import { toast } from "react-toastify"
import UserQuizAttempt from "@/components/user/course/UserQuizAttempt"
import userQuizApi from "@/services/api/user/userQuizApi"
import assignmentApi from "@/services/api/student/assignmentApi"
import * as progressApi from "@/services/api/user/progressApi"
import * as reviewApi from "@/services/api/user/reviewApi"
import type { ProgressStatsResponse } from "@/services/api/response/progressStatsResponse"
import MarkdownRenderer from "@/components/shared/MarkdownRenderer"
import StudentDiscussionPanel from "@/components/user/course/StudentDiscussionPanel"
import { useAuth } from "@/context/auth-context/useAuth"
import { getCourseQuizUnreadCount } from "@/services/api/courseQuizDiscussionApi"
import { getCourseAssignmentUnreadCount } from "@/services/api/courseAssignmentDiscussionApi"
import { getCourseLessonDiscussionUnreadCount } from "@/services/api/courseLessonDiscussionApi"
import * as certificateApi from "@/services/api/user/certificateApi"
import { getUserById } from "@/services/api/userApi"
import type { CertificateResponse } from "@/services/api/response/certificateResponse"
import CertificateModal from "@/components/user/course/CertificateModal"
import { Award } from "lucide-react"
import AIQuizPracticeModeComponent from "@/components/user/course/AIQuizPracticeModeComponent";
import RichTextEditor from "@/components/shared/RichTextEditor";

import { ACTIVE_COURSE_NAVIGATION_CLASS } from "@/constants/couseStyle";

type ContentItem = {
  id: number;
  type: "lesson" | "quiz" | "assignment";
  title: string;
  orderIndex: number;
  sectionId: number;
  sectionTitle: string;
  data: LessonResponse | QuizResponse | AssignmentResponse;
  isCompleted: boolean;
};

const CourseLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [courseName, setCourseName] = useState<string>("");
  const [courseData, setCourseData] = useState<any>(null);
  const [sections, setSections] = useState<SectionResponse[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(
    new Set(),
  );
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "about"
    | "reviews"
    | "discussion"
    | "practice"
  >("overview");
  const [contentDisplayMode, setContentDisplayMode] = useState<
    "normal" | "quiz" | "assignment"
  >("normal");
  const { user } = useAuth();

  // Progress tracking states
  const [progressStats, setProgressStats] =
    useState<ProgressStatsResponse | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    new Set(),
  );
  const [completedQuizzes, setCompletedQuizzes] = useState<Set<number>>(
    new Set(),
  );
  const [completedAssignments, setCompletedAssignments] = useState<Set<number>>(
    new Set(),
  );
  const [isMarkingComplete, setIsMarkingComplete] = useState<Set<number>>(
    new Set(),
  );

  // Assignment submission modal
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submissionLink, setSubmissionLink] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Unread discussion count
  const [unreadDiscussionCount, setUnreadDiscussionCount] = useState<number>(0);

  // AI Study Mode state
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);

  // Certificate
  const [certificate, setCertificate] = useState<CertificateResponse | null>(null)
  const [showCertificateModal, setShowCertificateModal] = useState(false)
  const [isCheckingCertificate, setIsCheckingCertificate] = useState(false)
  const certificatePollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const claimInProgressRef = useRef(false)

  const clearCertificatePolling = () => {
    if (certificatePollRef.current !== null) {
      clearInterval(certificatePollRef.current)
      certificatePollRef.current = null
    }
    // reset optimistic claim state
    claimInProgressRef.current = false
    setIsCheckingCertificate(false)
  }

  useEffect(() => {
    return () => {
      clearCertificatePolling()
    }
  }, [])

  // Current item - must be declared before useEffect hooks
  const currentItem = contentItems[currentItemIndex];

  console.log("RENDER CourseLearning:", { showCertificateModal, certificate });

  // Fetch progress stats
  const fetchProgressStats = async () => {
    if (!courseId) return;

    try {
      const stats = await progressApi.getPublishedCourseProgress(Number(courseId))
      setProgressStats(stats)
      const detail = await progressApi.getPublishedCourseProgressDetail(
        Number(courseId),
      );
      
      const completedLessonIds = new Set(
        detail.lessonProgresses.map((lp) => lp.lessonId),
      );
      setCompletedLessons(completedLessonIds);

      // Fetch completed quizzes and assignments (check from sections which items have attempts/submissions)
      const sectionsData = await getSectionsByCourseId(Number(courseId));

      // Collect all quiz and assignment IDs
      const allQuizIds: number[] = [];
      const allAssignmentIds: number[] = [];

      sectionsData.forEach((section) => {
        if (section.quizs) {
          section.quizs.forEach((quiz) => allQuizIds.push(quiz.id));
        }
        if (section.assignments) {
          section.assignments.forEach((assignment) =>
            allAssignmentIds.push(assignment.id),
          );
        }
      });

      // Fetch all quiz attempts in parallel
      const quizPromises = allQuizIds.map(async (quizId) => {
        try {
          const attempts = await userQuizApi.getQuizAttemptHistory(quizId);
          return attempts && attempts.length > 0 ? quizId : null;
        } catch (error) {
          return null;
        }
      });

      // Fetch all assignment submissions in parallel
      const assignmentPromises = allAssignmentIds.map(async (assignmentId) => {
        try {
          const submission = await assignmentApi.getMySubmission(assignmentId);
          return submission ? assignmentId : null;
        } catch (error) {
          return null;
        }
      });

      const [completedQuizResults, completedAssignmentResults] =
        await Promise.all([
          Promise.all(quizPromises),
          Promise.all(assignmentPromises),
        ]);

      const completedQuizIds = new Set(
        completedQuizResults.filter((id): id is number => id !== null),
      );
      const completedAssignmentIds = new Set(
        completedAssignmentResults.filter((id): id is number => id !== null),
      );

      setCompletedQuizzes(completedQuizIds);
      setCompletedAssignments(completedAssignmentIds)

      // Check for certificate if progress is 100%
      if (stats.overallProgress >= 100) {
        checkCertificate()
      }

    } catch (error) {
      console.error("Error fetching progress stats:", error);
    }
  };

    // Optimistically update progressStats counts to avoid UI flicker
    const optimisticUpdateProgress = (
      type: "lesson" | "quiz" | "assignment",
    ) => {
      setProgressStats((prev) => {
        if (!prev) return prev;
        const next = { ...prev } as ProgressStatsResponse & { overallProgress: number };

        if (type === "lesson") {
          next.completedLessons = (next.completedLessons || 0) + 1;
        } else if (type === "quiz") {
          next.completedQuizzes = (next.completedQuizzes || 0) + 1;
        } else if (type === "assignment") {
          next.completedAssignments = (next.completedAssignments || 0) + 1;
        }

        const total =
          (next.totalLessons || 0) + (next.totalQuizzes || 0) + (next.totalAssignments || 0);
        const completed =
          (next.completedLessons || 0) + (next.completedQuizzes || 0) + (next.completedAssignments || 0);

        next.overallProgress = total > 0 ? (completed / total) * 100 : 0;
        return next;
      });
    };

  const checkCertificate = async () => {
    if (!courseId) return
    setIsCheckingCertificate(true)
    try {
      const cert = await certificateApi.getMyCertificate(Number(courseId))
      setCertificate(cert)
    } catch (e) {
      console.error("Error checking certificate", e)
    } finally {
      setIsCheckingCertificate(false)
    }
  }

  const handleClaimCertificate = async () => {
    if (!courseId) return
    try {
      clearCertificatePolling()
      // If MetaMask available, prefer wallet ownership flow with server challenge
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts: string[] = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
          const wallet = accounts && accounts.length > 0 ? accounts[0] : null;
          if (!wallet) throw new Error('No wallet available')
          // Fetch server challenge bound to user+course
          const challenge = await certificateApi.getClaimChallenge(Number(courseId));
          const message = challenge.message;
          const signature = await (window as any).ethereum.request({ method: 'personal_sign', params: [message, wallet] });
          await certificateApi.claimCertificateWithWallet(Number(courseId), wallet, signature, message);
        } catch (mmErr) {
          console.error('MetaMask signing failed or challenge failed', mmErr);
          toast.error('Không thể xác thực ví. Vui lòng kiểm tra MetaMask và thử lại.')
          return
        }
      } else {
        toast.error('Không tìm thấy MetaMask. Vui lòng cài đặt và đăng nhập để nhận chứng chỉ.')
        return
      }
      toast.success("Đang xử lý cấp chứng chỉ...")

      // Poll until the certificate is issued, failed, or backend remains pending.
      let retries = 12;
      certificatePollRef.current = setInterval(async () => {
        const cert = await certificateApi.getMyCertificate(Number(courseId))
        if (cert) {
          setCertificate(cert)
          if (cert.status === "ISSUED") {
            clearCertificatePolling()
            toast.success("Chứng chỉ đã được cấp thành công!")
          } else if (cert.status === "FAILED") {
            clearCertificatePolling()
            toast.error("Không thể cấp chứng chỉ. Vui lòng thử lại.")
          }
        } else {
          retries--;
          if (retries <= 0) {
            clearCertificatePolling()
            toast.info("Chứng chỉ vẫn đang được xử lý ở backend")
          }
        }
      }, 2000)

    } catch (error) {
      clearCertificatePolling()
      console.error("Error claiming certificate:", error)
      toast.error("Lỗi khi yêu cầu cấp chứng chỉ")
    }
  }


  // Mark lesson as complete
  const handleMarkLessonComplete = async (lessonId: number) => {
    if (!courseId || completedLessons.has(lessonId)) return;

    setIsMarkingComplete((prev) => new Set(prev).add(lessonId));

    try {
      await progressApi.markLessonComplete({
        lessonId,
        publishedCourseId: Number(courseId),
      });

      // Update local state - this will trigger the useEffect to update contentItems
      setCompletedLessons((prev) => {
        const newSet = new Set(prev);
        newSet.add(lessonId);
        return newSet;
      });

      // Optimistically update UI counts so the tick remains visible
      optimisticUpdateProgress("lesson");

      // Refresh progress stats
      await fetchProgressStats();

      toast.success("Đã đánh dấu bài học hoàn thành!");
    } catch (error) {
      console.error("Error marking lesson complete:", error);
      toast.error(
        "Không thể đánh dấu bài học đã hoàn thành. Vui lòng thử lại.",
      );
    } finally {
      setIsMarkingComplete((prev) => {
        const newSet = new Set(prev);
        newSet.delete(lessonId);
        return newSet;
      });
    }
  };

  // Restore contentDisplayMode and currentItemIndex from localStorage on mount
  useEffect(() => {
    if (courseId) {
      const savedState = localStorage.getItem(`course-learning-${courseId}`);
      if (savedState) {
        try {
          const { displayMode, itemIndex, timestamp } = JSON.parse(savedState);
          const elapsed = Date.now() - timestamp;
          // Only restore if within 24 hours (86400000 ms)
          if (elapsed < 86400000) {
            console.log("🔄 Restoring saved state:", {
              displayMode,
              itemIndex,
            });
            setContentDisplayMode(displayMode);
            setCurrentItemIndex(itemIndex);
          } else {
            localStorage.removeItem(`course-learning-${courseId}`);
          }
        } catch (err) {
          console.error("Error restoring state:", err);
        }
      }
    }
    loadCourseData();
    fetchProgressStats();
  }, [courseId]);

  // Fetch unread count for current item
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!currentItem || !courseId) return;

      try {
        let count = 0;
        if (currentItem.type === "quiz") {
          count = await getCourseQuizUnreadCount(
            Number(courseId),
            currentItem.id,
          );
        } else if (currentItem.type === "assignment") {
          count = await getCourseAssignmentUnreadCount(
            Number(courseId),
            currentItem.id,
          );
        } else if (currentItem.type === "lesson") {
          count = await getCourseLessonDiscussionUnreadCount(
            Number(courseId),
            currentItem.id,
          );
        }
        setUnreadDiscussionCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
        setUnreadDiscussionCount(0);
      }
    };

    fetchUnreadCount();
  }, [currentItem, courseId]);

  // Sync completedLessons with contentItems
  useEffect(() => {
    if (contentItems.length > 0) {
      console.log("🔄 Syncing completion status:", {
        lessons: Array.from(completedLessons),
        quizzes: Array.from(completedQuizzes),
        assignments: Array.from(completedAssignments),
        totalItems: contentItems.length,
      });

      let hasChanges = false;
      const updatedItems = contentItems.map((item) => {
        let shouldBeCompleted = false;

        if (item.type === "lesson") {
          shouldBeCompleted = completedLessons.has(item.id);
        } else if (item.type === "quiz") {
          shouldBeCompleted = completedQuizzes.has(item.id);
        } else if (item.type === "assignment") {
          shouldBeCompleted = completedAssignments.has(item.id);
        }

        if (shouldBeCompleted !== item.isCompleted) {
          hasChanges = true;
          console.log(
            `${shouldBeCompleted ? "✅" : "❌"} ${item.type} #${item.id} "${item.title}" completed=${shouldBeCompleted}`,
          );
        }

        return { ...item, isCompleted: shouldBeCompleted };
      });

      if (hasChanges) {
        console.log("📝 Updating contentItems with new completion status");
        setContentItems(updatedItems);
      }
    }
  }, [completedLessons, completedQuizzes, completedAssignments, contentItems]);

  // Auto-hide sidebar when entering quiz/assignment mode and save state to localStorage
  useEffect(() => {
    if (contentDisplayMode === "quiz" || contentDisplayMode === "assignment") {
      setSidebarOpen(false);
      // Save state to localStorage
      if (courseId) {
        const state = {
          displayMode: contentDisplayMode,
          itemIndex: currentItemIndex,
          timestamp: Date.now(),
        };
        localStorage.setItem(
          `course-learning-${courseId}`,
          JSON.stringify(state),
        );
        console.log("💾 Saved state to localStorage:", state);
      }
    } else if (contentDisplayMode === "normal" && courseId) {
      // Clear localStorage when returning to normal mode
      localStorage.removeItem(`course-learning-${courseId}`);
      console.log("🗑️ Cleared saved state from localStorage");
    }
  }, [contentDisplayMode, currentItemIndex, courseId]);

  // Auto-open sidebar and expand all sections when entering practice mode
  useEffect(() => {
    if (activeTab === "practice") {
      setSidebarOpen(true);
      // Expand all sections for easy chapter selection
      const allSectionIds = sections.map((s) => s.id);
      setExpandedSections(new Set(allSectionIds));
    }
  }, [activeTab, sections]);

  const loadCourseData = async () => {
    if (!courseId) return;

    try {
      setLoading(true);

      // Load course basic info
      const courseData = await CourseApiService.getCourseById(courseId);
      if (courseData) {
        setCourseName(courseData.courseName);
        setCourseData(courseData);
      }

      // Load sections with content
      const sectionsData = await getSectionsByCourseId(Number(courseId));
      sectionsData.sort((a, b) => a.orderIndex - b.orderIndex);
      setSections(sectionsData);

      // Flatten all content items
      const items: ContentItem[] = [];

      sectionsData.forEach((section) => {
        // Add lessons
        if (section.lessons) {
          Array.from(section.lessons).forEach((lesson) => {
            items.push({
              id: lesson.id,
              type: "lesson",
              title: lesson.title,
              orderIndex: lesson.numberItem,
              sectionId: section.id,
              sectionTitle: section.title,
              data: lesson,
              isCompleted: false, // TODO: Track from backend
            });
          });
        }

        // Add quizzes
        if (section.quizs) {
          Array.from(section.quizs).forEach((quiz) => {
            items.push({
              id: quiz.id,
              type: "quiz",
              title: quiz.title,
              orderIndex: quiz.numberItem,
              sectionId: section.id,
              sectionTitle: section.title,
              data: quiz,
              isCompleted: false, // TODO: Track from progress
            });
          });
        }

        // Add assignments
        if (section.assignments) {
          Array.from(section.assignments).forEach((assignment) => {
            items.push({
              id: assignment.id,
              type: "assignment",
              title: assignment.title,
              orderIndex: assignment.numberItem,
              sectionId: section.id,
              sectionTitle: section.title,
              data: assignment,
              isCompleted: false, // TODO: Track from progress
            });
          });
        }
      });

      // Sort by section order and item order
      items.sort((a, b) => {
        const sectionA = sectionsData.find((s) => s.id === a.sectionId);
        const sectionB = sectionsData.find((s) => s.id === b.sectionId);
        if (
          sectionA &&
          sectionB &&
          sectionA.orderIndex !== sectionB.orderIndex
        ) {
          return sectionA.orderIndex - sectionB.orderIndex;
        }
        return a.orderIndex - b.orderIndex;
      });

      setContentItems(items);

      // Expand first section by default
      if (sectionsData.length > 0) {
        setExpandedSections(new Set([sectionsData[0].id]));
      }
    } catch (error) {
      console.error("Error loading course data:", error);
      toast.error("Không thể tải nội dung khóa học");
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
      setContentDisplayMode("normal");
    }
  };

  const handleNext = () => {
    if (currentItemIndex < contentItems.length - 1) {
      // Mark current as completed
      const updatedItems = [...contentItems];
      updatedItems[currentItemIndex].isCompleted = true;
      setContentItems(updatedItems);

      setCurrentItemIndex(currentItemIndex + 1);
      setContentDisplayMode("normal");
    }
  };

  const handleItemClick = (index: number) => {
    setCurrentItemIndex(index);
    setContentDisplayMode("normal");
  };

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <PlayCircle className="w-4 h-4" />;
      case "quiz":
        return <ClipboardCheck className="w-4 h-4" />;
      case "assignment":
        return <FileText className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const handleOpenSubmissionModal = () => {
    setShowSubmissionModal(true);
    setSubmissionContent("");
    setSubmissionFiles([]);
    setSubmissionLink("");
  };

  const handleSubmitAssignment = async () => {
    if (!currentItem || currentItem.type !== "assignment") return;

    const assignment = currentItem.data as AssignmentResponse;
    const canSubmitText = ["TEXT", "BOTH"].includes(
      assignment.submissionType || "",
    );
    const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(
      assignment.submissionType || "",
    );
    const canSubmitLink = ["LINK", "BOTH"].includes(
      assignment.submissionType || "",
    );

    try {
      setSubmitting(true);

      // Validate
      const hasContent =
        submissionContent || submissionFiles.length > 0 || submissionLink;
      if (!hasContent) {
        toast.error("Vui lòng nhập nội dung bài làm");
        setSubmitting(false);
        return;
      }

      const submitData = {
        assignmentId: currentItem.id,
        submissionText: canSubmitText ? submissionContent : undefined,
        submissionLink: canSubmitLink ? submissionLink : undefined,
      };

      await assignmentApi.submitAssignment(
        currentItem.id,
        submitData,
        canSubmitFile ? submissionFiles : undefined,
      );

      toast.success("Nộp bài thành công!");
      setShowSubmissionModal(false);

      // Reset form
      setSubmissionContent("");
      setSubmissionFiles([]);
      setSubmissionLink("");

      // Update completed assignments immediately
      setCompletedAssignments((prev) => new Set(prev).add(currentItem.id));
      // Optimistically update UI counts so the tick remains visible
      optimisticUpdateProgress("assignment");

      // Reload assignment data to show new submission
      loadCourseData();

      // Refresh progress stats
      fetchProgressStats();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể nộp bài");
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    // Show Quiz Attempt
    if (contentDisplayMode === "quiz" && currentItem?.type === "quiz") {
      return (
        <UserQuizAttempt
          quizIdProp={currentItem.id}
          onQuizCompleted={() => {
            // Mark quiz as completed
            setCompletedQuizzes((prev) => new Set(prev).add(currentItem.id));
            // Optimistically update UI counts so the tick remains visible
            optimisticUpdateProgress("quiz");
            // Refresh progress stats from backend to reconcile
            fetchProgressStats();
          }}
          onExit={() => {
            setContentDisplayMode("normal");
            if (courseId) {
              localStorage.removeItem(`course-learning-${courseId}`);
            }
          }}
        />
      );
    }
    // Normal content
    if (!currentItem) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              Chọn nội dung từ danh sách bên phải
            </p>
          </div>
        </div>
      );
    }

    switch (currentItem.type) {
      case "lesson":
        return <LessonContent lesson={currentItem.data as LessonResponse} />;
      case "quiz":
        return <QuizContent quiz={currentItem.data as QuizResponse} />;
      case "assignment":
        return (
          <AssignmentContent
            assignment={currentItem.data as AssignmentResponse}
          />
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải khóa học...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* GLOBAL MODAL LOCATION - HIGH Z-INDEX */}
      <CertificateModal
        open={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        certificate={certificate}
        courseName={courseName || "Khóa học"}
        studentName={
          `${user?.lastName || ""} ${user?.firstName || ""}`.trim()
          || user?.username
          || "Học viên"
        }
      />

      {/* Top Navigation Bar - Hide in quiz/assignment mode */}
      {contentDisplayMode === "normal" && (
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="text-white hover:bg-gray-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <h1 className="text-white font-medium text-sm max-w-md truncate">
              {courseName}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-800 gap-2"
              >
                <span className="text-sm">
                  Tiến độ của bạn:{" "}
                  {(progressStats?.overallProgress || 0).toFixed(2)}%
                </span>
                <ChevronDown className="w-4 h-4" />
              </Button>

              {/* Progress Dropdown */}
              {progressStats && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Tiến độ học tập
                    </h3>

                    {/* Overall Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Tổng quan</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {progressStats.overallProgress.toFixed(2)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{
                            width: `${progressStats.overallProgress.toFixed(2)}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-gray-700">Bài học</span>
                        </div>
                        <span className="font-medium">
                          {progressStats.completedLessons}/
                          {progressStats.totalLessons}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className="w-4 h-4 text-purple-600" />
                          <span className="text-gray-700">Bài kiểm tra</span>
                        </div>
                        <span className="font-medium">
                          {progressStats.completedQuizzes}/
                          {progressStats.totalQuizzes}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <span className="text-gray-700">Bài tập</span>
                        </div>
                        <span className="font-medium">
                          {progressStats.completedAssignments}/
                          {progressStats.totalAssignments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Certificate Button Logic */}
            {certificate?.status === "ISSUED" ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-white border-none gap-2"
                onClick={() => {
                  console.log("Certificate Button Clicked! Showing modal...");
                  setShowCertificateModal(true);
                }}
              >
                <Award className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  Chứng chỉ
                </span>
              </Button>
            ) : certificate?.status === "PENDING" ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-yellow-500 text-white border-none gap-2 opacity-90"
                disabled
              >
                <Award className="w-4 h-4" />
                <span className="text-sm font-semibold">Đang xử lý...</span>
              </Button>
            ) : certificate?.status === "FAILED" ? (
              <Button
                variant="outline"
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white border-none gap-2"
                onClick={() => handleClaimCertificate()}
                disabled={isCheckingCertificate}
              >
                <Award className="w-4 h-4" />
                <span className="text-sm font-semibold">Thử cấp lại</span>
              </Button>
            ) : (
              progressStats && progressStats.overallProgress >= 100 && (
                  <Button
                  variant="outline"
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white border-none gap-2 animate-pulse"
                    onClick={() => handleClaimCertificate()}
                  disabled={isCheckingCertificate}
                >
                  <Award className="w-4 h-4" />
                  <span className="text-sm font-semibold">Nhận chứng chỉ</span>
                </Button>
              )
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white hover:bg-gray-800"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col transition-all duration-300">
          <div className="overflow-y-auto h-full">
            {/* Content with fade transition */}
            <div className="animate-fadeIn">
              {/* Quiz/Assignment Display - uses contentDisplayMode */}
              {contentDisplayMode === "quiz" &&
                currentItem?.type === "quiz" && (
                  <div className="bg-white">{renderContent()}</div>
                )}

              {contentDisplayMode === "assignment" &&
                currentItem?.type === "assignment" && (
                  <div className="bg-white">{renderContent()}</div>
                )}

              {/* Normal Content View */}
              {contentDisplayMode === "normal" && (
                <>
                  {/* Video Player Area - Only show for lessons with video */}
                  {currentItem?.type === "lesson" && (
                    <div className="bg-black w-full flex-shrink-0 h-[570px]">
                      <LessonVideoPlayer
                        lesson={currentItem.data as LessonResponse}
                      />
                    </div>
                  )}

                  {/* Quiz Start Card */}
                  {currentItem?.type === "quiz" && (
                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 w-full flex-shrink-0 h-[570px] flex items-center justify-center p-12">
                      <div className="text-center max-w-2xl">
                        <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <ClipboardCheck className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4">
                          {(currentItem.data as QuizResponse).title}
                        </h2>
                        <p className="text-xl text-purple-100 mb-8">
                          Sẵn sàng kiểm tra kiến thức của bạn?
                        </p>
                        <div className="flex items-center justify-center gap-8 mb-8 text-white">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            <span>
                              {
                                Array.from(
                                  (currentItem.data as QuizResponse)
                                    .questions || [],
                                ).length
                              }{" "}
                              câu hỏi
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>
                              {(currentItem.data as QuizResponse).duration} phút
                            </span>
                          </div>
                        </div>
                        <Button
                          size="lg"
                          className="bg-white text-purple-700 hover:bg-purple-50 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl"
                          onClick={() => setContentDisplayMode("quiz")}
                        >
                          <PlayCircle className="w-6 h-6 mr-2" />
                          Bắt đầu làm bài
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Assignment Start Card */}
                  {currentItem?.type === "assignment" && (
                    <div className="bg-gradient-to-br from-green-600 to-green-800 w-full flex-shrink-0 h-[570px] flex items-center justify-center p-12">
                      <div className="text-center max-w-2xl">
                        <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <FileText className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-4xl font-bold text-white mb-4">
                          {(currentItem.data as AssignmentResponse).title}
                        </h2>
                        {(currentItem.data as AssignmentResponse).deadline && (
                          <p className="text-xl text-green-100 mb-8 flex items-center justify-center gap-2">
                            <Clock className="w-5 h-5" />
                            Hạn nộp:{" "}
                            {new Date(
                              (currentItem.data as AssignmentResponse).deadline,
                            ).toLocaleDateString("vi-VN", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        )}
                        <Button
                          size="lg"
                          className="bg-white text-green-700 hover:bg-green-50 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl"
                          onClick={handleOpenSubmissionModal}
                        >
                          <FileText className="w-6 h-6 mr-2" />
                          Xem chi tiết & Nộp bài
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Tabs Navigation */}
                  <div className="border-b bg-white flex-shrink-0 sticky top-0 z-10">
                    <div className="flex gap-8 px-6">
                      <button
                        onClick={() => setActiveTab("overview")}
                        className={`py-4 text-sm font-medium transition-colors ${
                          activeTab === "overview"
                            ? `${ACTIVE_COURSE_NAVIGATION_CLASS}`
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                        
                      >
                        Tổng quan
                      </button>
                      <button
                        onClick={() => setActiveTab("about")}
                        className={`py-4 text-sm font-medium  transition-colors ${
                          activeTab === "about"
                            ? `${ACTIVE_COURSE_NAVIGATION_CLASS}`
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {currentItem?.type === "lesson" && "Về bài giảng này"}
                        {currentItem?.type === "quiz" && "Về bài kiểm tra này"}
                        {currentItem?.type === "assignment" &&
                          "Về bài tập này"}
                      </button>
                      {/* Notes and Announcements tabs removed */}
                      <button
                        onClick={() => setActiveTab("reviews")}
                        className={`py-4 text-sm font-medium transition-colors ${
                          activeTab === "reviews"
                            ? `${ACTIVE_COURSE_NAVIGATION_CLASS}`
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Đánh giá
                      </button>
                      {/* Tools tab removed */}
                      {currentItem && (
                        <button
                          onClick={() => setActiveTab("discussion")}
                          className={`py-4 text-sm font-medium transition-colors relative ${
                            activeTab === "discussion"
                              ? `${ACTIVE_COURSE_NAVIGATION_CLASS}`
                              : "border-transparent text-gray-600 hover:text-gray-900"
                          }`}
                        >
                          <MessageSquare className="w-4 h-4 inline mr-2" />
                          Thảo luận
                          {unreadDiscussionCount > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                              {unreadDiscussionCount}
                            </span>
                          )}
                        </button>
                      )}
                      {/* Chuyển hướng tới Chế độ ôn tập bằng AI */}
                      <button
                        onClick={() => setActiveTab("practice")}
                        className={`flex items-center py-4 text-sm font-medium transition-colors relative ${
                          activeTab === "practice"
                            ? `${ACTIVE_COURSE_NAVIGATION_CLASS}`
                            : "border-transparent text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Bot className="w-4 h-4 inline mr-2" />
                        Chế độ ôn tập bằng AI
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="bg-white">
                    <div className="px-6 py-8">
                      {activeTab === "overview" && courseData && (
                        <CourseOverview course={courseData} />
                      )}
                      {activeTab === "about" && renderContent()}
                      {activeTab === "reviews" && <ReviewsTab />}
                      {activeTab === "discussion" &&
                        currentItem &&
                        courseId && (
                          <StudentDiscussionPanel
                            key={`${currentItem.type}-${currentItem.id}`}
                            itemType={currentItem.type}
                            itemId={currentItem.id}
                            itemTitle={currentItem.title}
                            publishedCourseId={Number(courseId)}
                            user={user}
                          />
                        )}
                      {activeTab === "practice" && courseId && (
                        <AIQuizPracticeModeComponent
                          chapters={sections.map((section) => ({
                            id: section.id.toString(),
                            title: section.title,
                            description: section.description || "",
                            order: section.orderIndex,
                            completed: false,
                          }))}
                          selectedChapterIds={selectedChapterIds}
                          onOpenSidebar={() => setSidebarOpen(true)}
                        />
                      )}
                    </div>
                  </div>

                  {/* Bottom Navigation */}
                  <div className="border-t bg-white px-6 py-3 flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentItemIndex === 0}
                      className="gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Trước
                    </Button>

                    <Button
                      onClick={handleNext}
                      disabled={currentItemIndex === contentItems.length - 1}
                      className="bg-gray-900 hover:bg-gray-800 text-white gap-2"
                    >
                      Tiếp theo
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Course Content - Hide in quiz/assignment mode */}
        {contentDisplayMode === "normal" && (
          <div
            className={`${
              sidebarOpen ? "w-full md:w-[500px]" : "w-0"
            } bg-white border-l overflow-hidden transition-all duration-300 flex-shrink-0`}
          >
            <div className="h-full flex flex-col">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                <div className="flex-1">
                  <h2 className="font-semibold text-base">
                    {activeTab === "practice"
                      ? "Chọn chương để ôn tập"
                      : "Nội dung khóa học"}
                  </h2>
                  {activeTab === "practice" && (
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-gray-500">
                        {selectedChapterIds.length} / {sections.length} chương
                        đã chọn
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setSelectedChapterIds(
                              sections.map((s) => s.id.toString()),
                            )
                          }
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Chọn tất cả
                        </button>
                        <span className="text-xs text-gray-400">|</span>
                        <button
                          onClick={() => setSelectedChapterIds([])}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Bỏ chọn
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8 p-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-y-auto">
                {sections.map((section) => {
                  const sectionItems = contentItems.filter(
                    (item) => item.sectionId === section.id,
                  );
                  const completedCount = sectionItems.filter(
                    (item) => item.isCompleted,
                  ).length;
                  const isExpanded = expandedSections.has(section.id);

                  return (
                    <div key={section.id} className="border-b">
                      {/* Section Header */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left transition-colors"
                      >
                        {activeTab === "practice" && (
                          <input
                            type="checkbox"
                            checked={selectedChapterIds.includes(
                              section.id.toString(),
                            )}
                            onChange={(e) => {
                              e.stopPropagation();
                              const sectionIdStr = section.id.toString();
                              setSelectedChapterIds((prev) =>
                                prev.includes(sectionIdStr)
                                  ? prev.filter((id) => id !== sectionIdStr)
                                  : [...prev, sectionIdStr],
                              );
                            }}
                            className="mr-3 h-4 w-4 rounded border-gray-300 text-primary focus:ring-2 focus:ring-primary flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 pr-2">
                          <h3 className="font-medium text-sm mb-1">
                            {section.title}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {completedCount}/{sectionItems.length} mục
                          </p>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-gray-600 transition-transform flex-shrink-0 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Section Items */}
                      {isExpanded && (
                        <div className="bg-gray-50">
                          {/* Lessons Group */}
                          {sectionItems.filter((item) => item.type === "lesson")
                            .length > 0 && (
                            <div className="mb-2">
                              <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                                Bài học
                              </div>
                              {sectionItems
                                .filter((item) => item.type === "lesson")
                                .map((item) => {
                                  const itemIndex = contentItems.findIndex(
                                    (i) =>
                                      i.id === item.id && i.type === item.type,
                                  );
                                  const isActive =
                                    itemIndex === currentItemIndex;
                                  // Get the actual item from contentItems to ensure we have latest isCompleted
                                  const actualItem =
                                    contentItems[itemIndex] || item;

                                  return (
                                    <div
                                      key={`${item.type}-${item.id}`}
                                      className={`w-full flex items-start gap-3 px-4 py-3 transition-colors group ${
                                        isActive
                                          ? "bg-blue-50 border-l-4 border-blue-600"
                                          : "hover:bg-gray-100 border-l-4 border-transparent"
                                      }`}
                                    >
                                      <div className="flex-shrink-0 pt-0.5">
                                        {actualItem.isCompleted ? (
                                          <CheckCircle className="w-4 h-4 text-blue-600" />
                                        ) : (
                                          <div
                                            className={`w-4 h-4 rounded-full border-2 ${
                                              isActive
                                                ? "border-blue-600"
                                                : "border-gray-400"
                                            }`}
                                          />
                                        )}
                                      </div>
                                      <div
                                        className="flex-1 min-w-0 cursor-pointer"
                                        onClick={() =>
                                          handleItemClick(itemIndex)
                                        }
                                      >
                                        <div className="flex items-center gap-2 mb-1">
                                          <span
                                            className={`text-xs ${isActive ? "text-gray-900" : "text-gray-600"}`}
                                          >
                                            {item.orderIndex}.
                                          </span>
                                          <span
                                            className={`text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}
                                          >
                                            {item.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          {getItemIcon(item.type)}
                                          <span>
                                            {item.type === "lesson"
                                              ? "Bài học"
                                              : item.type === "quiz"
                                                ? "Bài kiểm tra"
                                                : "Bài tập"}
                                          </span>
                                        </div>
                                      </div>
                                      {!actualItem.isCompleted && isActive && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleMarkLessonComplete(item.id);
                                          }}
                                          disabled={isMarkingComplete.has(
                                            item.id,
                                          )}
                                          className="flex-shrink-0 px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          {isMarkingComplete.has(item.id) ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            "✓"
                                          )}
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}
                            </div>
                          )}

                          {/* Quizzes Group */}
                          {sectionItems.filter((item) => item.type === "quiz")
                            .length > 0 && (
                            <div className="mb-2">
                              <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                                Bài kiểm tra
                              </div>
                              {sectionItems
                                .filter((item) => item.type === "quiz")
                                .map((item) => {
                                  const itemIndex = contentItems.findIndex(
                                    (i) =>
                                      i.id === item.id && i.type === item.type,
                                  );
                                  const isActive =
                                    itemIndex === currentItemIndex;
                                  const actualItem =
                                    contentItems[itemIndex] || item;

                                  return (
                                    <button
                                      key={`${item.type}-${item.id}`}
                                      onClick={() => handleItemClick(itemIndex)}
                                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                                        isActive
                                          ? "bg-blue-50 border-l-4 border-blue-600"
                                          : "hover:bg-gray-100 border-l-4 border-transparent"
                                      }`}
                                    >
                                      <div className="flex-shrink-0 pt-0.5">
                                        {actualItem.isCompleted ? (
                                          <CheckCircle className="w-4 h-4 text-purple-600" />
                                        ) : (
                                          <div
                                            className={`w-4 h-4 rounded-full border-2 ${
                                              isActive
                                                ? "border-blue-600"
                                                : "border-gray-400"
                                            }`}
                                          />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span
                                            className={`text-xs ${isActive ? "text-gray-900" : "text-gray-600"}`}
                                          >
                                            {item.orderIndex}.
                                          </span>
                                          <span
                                            className={`text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}
                                          >
                                            {item.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          {getItemIcon(item.type)}
                                          <span>
                                            {item.type === "lesson"
                                              ? "Bài học"
                                              : item.type === "quiz"
                                                ? "Bài kiểm tra"
                                                : "Bài tập"}
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>
                          )}

                          {/* Assignments Group */}
                          {sectionItems.filter(
                            (item) => item.type === "assignment",
                          ).length > 0 && (
                            <div className="mb-2">
                              <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                                Bài tập
                              </div>
                              {sectionItems
                                .filter((item) => item.type === "assignment")
                                .map((item) => {
                                  const itemIndex = contentItems.findIndex(
                                    (i) =>
                                      i.id === item.id && i.type === item.type,
                                  );
                                  const isActive =
                                    itemIndex === currentItemIndex;
                                  const actualItem =
                                    contentItems[itemIndex] || item;

                                  return (
                                    <button
                                      key={`${item.type}-${item.id}`}
                                      onClick={() => handleItemClick(itemIndex)}
                                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                                        isActive
                                          ? "bg-blue-50 border-l-4 border-blue-600"
                                          : "hover:bg-gray-100 border-l-4 border-transparent"
                                      }`}
                                    >
                                      <div className="flex-shrink-0 pt-0.5">
                                        {actualItem.isCompleted ? (
                                          <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                          <div
                                            className={`w-4 h-4 rounded-full border-2 ${
                                              isActive
                                                ? "border-blue-600"
                                                : "border-gray-400"
                                            }`}
                                          />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span
                                            className={`text-xs ${isActive ? "text-gray-900" : "text-gray-600"}`}
                                          >
                                            {item.orderIndex}.
                                          </span>
                                          <span
                                            className={`text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}
                                          >
                                            {item.title}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                          {getItemIcon(item.type)}
                                          <span>
                                            {item.type === "lesson"
                                              ? "Bài học"
                                              : item.type === "quiz"
                                                ? "Bài kiểm tra"
                                                : "Bài tập"}
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Assignment Submission Modal */}
      {showSubmissionModal &&
        currentItem?.type === "assignment" &&
        (() => {
          const assignment = currentItem.data as AssignmentResponse;
          const canSubmitText = ["TEXT", "BOTH"].includes(
            assignment.submissionType || "",
          );
          const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(
            assignment.submissionType || "",
          );
          const canSubmitLink = ["LINK", "BOTH"].includes(
            assignment.submissionType || "",
          );

          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Nộp bài tập
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {assignment.title}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowSubmissionModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                      aria-label="Đóng"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Text Submission */}
                  {canSubmitText && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung bài làm
                      </label>
                      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
                        <RichTextEditor
                          value={submissionContent}
                          onChange={(content) => setSubmissionContent(content)}
                          placeholder="Nhập nội dung bài làm của bạn..."
                        />
                      </div>
                    </div>
                  )}

                  {/* File Upload */}
                  {canSubmitFile && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tệp đính kèm
                      </label>

                      {/* Upload Button */}
                      <div className="mb-3">
                        <label
                          htmlFor="assignment-file-upload"
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                            <Upload className="h-5 w-5 text-gray-600" />
                            <span className="text-sm text-gray-600">
                              Chọn file để upload (Tối đa 10MB/file)
                            </span>
                          </div>
                          <input
                            type="file"
                            multiple
                            onChange={(e) =>
                              setSubmissionFiles(
                                Array.from(e.target.files || []),
                              )
                            }
                            className="hidden"
                            id="assignment-file-upload"
                            disabled={submitting}
                            accept="*/*"
                          />
                        </label>
                      </div>

                      {/* File List */}
                      {submissionFiles.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">
                            File mới:
                          </p>
                          <div className="space-y-2">
                            {submissionFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 border rounded"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {file.size < 1024
                                        ? file.size + " B"
                                        : file.size < 1024 * 1024
                                          ? (file.size / 1024).toFixed(1) +
                                            " KB"
                                          : (file.size / (1024 * 1024)).toFixed(
                                              1,
                                            ) + " MB"}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    setSubmissionFiles(
                                      submissionFiles.filter(
                                        (_, i) => i !== idx,
                                      ),
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded ml-2"
                                  disabled={submitting}
                                  aria-label="Xóa file"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Link Submission */}
                  {canSubmitLink && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link bài làm
                      </label>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={submissionLink}
                          onChange={(e) => setSubmissionLink(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 p-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowSubmissionModal(false)}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleSubmitAssignment}
                    disabled={submitting}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang nộp...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Nộp bài
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

// Course Overview Component
const CourseOverview: React.FC<{ course: any }> = ({ course }) => {
  return (
    <div>
      {/* Course Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{course.courseName}</h1>
        {course.description && (
          <div className="text-xl text-gray-600 leading-relaxed">
            <MarkdownRenderer content={course.description} />
          </div>
        )}
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Cấp độ</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {course.level || "Tất cả"}
          </p>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Thời lượng</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {course.duration || "Chưa cập nhật"}
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Đánh giá</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {course.rating || "5.0"} ⭐
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Học viên</span>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {course.enrolledCount || "0"}
          </p>
        </div>
      </div>

      {/* What You'll Learn */}
      {course.whatYouWillLearn && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Bạn sẽ học được gì</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <MarkdownRenderer content={course.whatYouWillLearn} />
          </div>
        </div>
      )}

      {/* Requirements */}
      {course.requirements && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Yêu cầu</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <MarkdownRenderer content={course.requirements} />
          </div>
        </div>
      )}

      {/* Target Audience */}
      {course.targetAudience && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Khóa học này dành cho ai</h2>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <MarkdownRenderer content={course.targetAudience} />
          </div>
        </div>
      )}

      {/* Teacher Info */}
      {course.instructorName && (
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Giảng viên</h2>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
              {course.instructorName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold">{course.instructorName}</h3>
              <p className="text-gray-600">Giảng viên khóa học</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Notes and Announcements tabs removed */

// Reviews Tab Component
/* eslint-disable react/forbid-dom-props */
const ReviewsTab: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userReview, setUserReview] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ rate: 5, content: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteReviewConfirm, setShowDeleteReviewConfirm] = useState(false);
  const [userDetails, setUserDetails] = useState<Record<string, { name: string; avatar?: string }>>({});

  useEffect(() => {
    loadReviews();
  }, [courseId]);

  useEffect(() => {
    const fetchUnknownUsers = async () => {
      const unknownUserIds = [...new Set(reviews.map(r => r.createdById))].filter(
        id => id && !userDetails[id]
      );
      
      if (unknownUserIds.length === 0) return;

      const newDetails = { ...userDetails };
      let updated = false;

      await Promise.all(unknownUserIds.map(async (id) => {
        try {
          const userData = await getUserById(id);
          if (userData) {
            newDetails[id] = {
              name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username || "Người dùng",
              avatar: userData.avatarUrl || (userData as any).profilePicture
            };
            updated = true;
          }
        } catch (error) {
          console.error(`Failed to fetch user ${id}`, error);
          newDetails[id] = { name: "Người dùng" };
          updated = true;
        }
      }));

      if (updated) {
        setUserDetails(newDetails);
      }
    };

    fetchUnknownUsers();
  }, [reviews, userDetails]);

  const loadReviews = async () => {
    if (!courseId) return;

    try {
      setLoading(true);

      // Load reviews and stats in parallel
      const [reviewsData, statsData, userReviewData] = await Promise.all([
        reviewApi.getCourseReviews(Number(courseId)),
        reviewApi.getCourseReviewStats(Number(courseId)),
        reviewApi.getUserReviewForCourse(Number(courseId)),
      ]);

      setReviews(reviewsData);
      setReviewStats(statsData);
      setUserReview(userReviewData);
    } catch (error) {
      console.error("Error loading reviews:", error);
      toast.error("Không thể tải đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!courseId || !reviewForm.content.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    if (reviewForm.content.trim().length < 3) {
      toast.error("Nội dung đánh giá phải có ít nhất 3 ký tự");
      return;
    }

    if (reviewForm.content.trim().length > 1000) {
      toast.error("Nội dung đánh giá không được vượt quá 1000 ký tự");
      return;
    }

    try {
      setSubmitting(true);

      if (userReview) {
        // Update existing review
        console.log("Updating review:", userReview.id, reviewForm);
        await reviewApi.updateReview(userReview.id, {
          rate: reviewForm.rate,
          content: reviewForm.content.trim(),
        });
        toast.success("Cập nhật đánh giá thành công!");
      } else {
        // Create new review
        console.log("Creating new review for course:", courseId, reviewForm);
        await reviewApi.createReview({
          courseId: Number(courseId),
          rate: reviewForm.rate,
          content: reviewForm.content.trim(),
        });
        toast.success("Gửi đánh giá thành công!");
      }

      setShowReviewForm(false);
      setReviewForm({ rate: 5, content: "" });
      await loadReviews();
    } catch (error: any) {
      console.error("Submit review error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể gửi đánh giá";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!userReview) return;

    try {
      console.log("Deleting review with ID:", userReview.id);
      await reviewApi.deleteReview(userReview.id);
      toast.success("Đã xóa đánh giá thành công!");
      setShowReviewForm(false);
      setReviewForm({ rate: 5, content: "" });
      await loadReviews();
    } catch (error: any) {
      console.error("Delete review error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể xóa đánh giá";
      toast.error(errorMessage);
    }
  };

  const handleEditReview = () => {
    if (userReview) {
      setReviewForm({
        rate: userReview.rate,
        content: userReview.content,
      });
      setShowReviewForm(true);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.createdByName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating =
      filterRating === "all" || review.rate === Number(filterRating);
    return matchesSearch && matchesRating;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const averageRating = reviewStats?.averageRating || 0;
  const totalReviews = reviewStats?.totalReviews || 0;
  const distribution = reviewStats?.ratingDistribution || {
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0,
  };

  return (
    <div>
      {/* User Review Section - Create/Edit */}
      {!userReview && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-lg mb-4">Đánh giá khóa học này</h3>
          {!showReviewForm ? (
            <Button
              onClick={() => setShowReviewForm(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <Star className="w-4 h-4 mr-2" />
              Viết đánh giá
            </Button>
          ) : (
            <div className="space-y-4">
              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Đánh giá của bạn
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rate: star })
                      }
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewForm.rate
                            ? "fill-orange-500 text-orange-500"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nội dung đánh giá
                </label>
                <textarea
                  value={reviewForm.content}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, content: e.target.value })
                  }
                  rows={4}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Chia sẻ trải nghiệm của bạn về khóa học này..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewForm.content.trim()}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    "Gửi đánh giá"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewForm({ rate: 5, content: "" });
                  }}
                  disabled={submitting}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User's Existing Review */}
      {userReview && (
        <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h3 className="font-semibold text-lg">Đánh giá của bạn</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleEditReview}
                className="text-blue-600"
              >
                Sửa
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowDeleteReviewConfirm(true)}
                className="text-red-600"
              >
                Xóa
              </Button>
            </div>
          </div>

          <div className="flex gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= userReview.rate
                    ? "fill-orange-500 text-orange-500"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>

          <p className="text-gray-700">{userReview.content}</p>
          <p className="text-sm text-gray-500 mt-2">
            {new Date(userReview.createdAt).toLocaleDateString("vi-VN")}
          </p>

          {/* Edit Form */}
          {showReviewForm && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Rating Stars */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Đánh giá
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() =>
                        setReviewForm({ ...reviewForm, rate: star })
                      }
                      className="focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= reviewForm.rate
                            ? "fill-orange-500 text-orange-500"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nội dung
                </label>
                <textarea
                  value={reviewForm.content}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, content: e.target.value })
                  }
                  rows={4}
                  className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewForm.content.trim()}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Cập nhật"
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewForm({
                      rate: userReview.rate,
                      content: userReview.content,
                    });
                  }}
                  disabled={submitting}
                >
                  Hủy
                </Button>
              </div>
            </div>
          )}

          <AlertDialog
            open={showDeleteReviewConfirm}
            onOpenChange={setShowDeleteReviewConfirm}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa đánh giá?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    handleDeleteReview();
                    setShowDeleteReviewConfirm(false);
                  }}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Xóa
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Student Feedback Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Phản hồi từ học viên</h2>

        <div className="flex gap-8 items-start mb-8">
          {/* Rating Score */}
          <div className="text-center">
            <div className="text-6xl font-bold text-orange-500 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex gap-1 justify-center mb-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i <= Math.round(averageRating)
                      ? "fill-orange-500 text-orange-500"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-orange-500 font-medium">
              {totalReviews} đánh giá
            </div>
          </div>

          {/* Rating Bars */}
          <div className="flex-1 space-y-2">
            {[
              { stars: 5, count: distribution.fiveStar },
              { stars: 4, count: distribution.fourStar },
              { stars: 3, count: distribution.threeStar },
              { stars: 2, count: distribution.twoStar },
              { stars: 1, count: distribution.oneStar },
            ].map(({ stars, count }) => {
              const percentage =
                totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      {...({ style: { width: `${percentage}%` } } as any)}
                    />
                  </div>
                  <div className="flex gap-1">
                    {[...Array(stars)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-3 h-3 fill-orange-500 text-orange-500"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 font-medium w-16">
                    {percentage.toFixed(0)}% ({count})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          Đánh giá ({filteredReviews.length})
        </h2>

        {/* Search and Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đánh giá"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Lọc theo số sao"
          >
            <option value="all">Tất cả mức đánh giá</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>

        {/* Reviews List */}
        {filteredReviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Chưa có đánh giá nào</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredReviews.map((review) => {
              const displayName = userDetails[review.createdById]?.name || review.createdByName || "Người dùng";
              const displayAvatar = userDetails[review.createdById]?.avatar || review.createdByAvatar;

              return (
              <div key={review.id} className="border-b pb-6">
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0 overflow-hidden">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      displayName.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="flex-1">
                    {/* Header */}
                    <div className="mb-2">
                      <h3 className="font-semibold">{displayName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rate
                                  ? "fill-orange-500 text-orange-500"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <p className="text-gray-700">{review.content}</p>
                  </div>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
};

// Lesson Video Player Component (just video, no other content)
const LessonVideoPlayer: React.FC<{ lesson: LessonResponse }> = ({
  lesson,
}) => {
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = () => {
    if (videoContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoContainerRef.current.requestFullscreen();
      }
    }
  };

  if (!lesson.videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <PlayCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <p className="text-white text-lg">Không có video</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={videoContainerRef} className="w-full h-full relative group">
      <iframe
        src={lesson.videoUrl.replace("watch?v=", "embed/")}
        title={lesson.title}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>

      {/* Fullscreen Button */}
      <button
        onClick={handleFullscreen}
        className="absolute bottom-4 right-4 bg-black bg-opacity-70 hover:bg-opacity-90 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Bật/tắt toàn màn hình"
      >
        <Maximize className="w-5 h-5" />
      </button>
    </div>
  );
};

// Lesson Content Component (for Overview tab)
const LessonContent: React.FC<{ lesson: LessonResponse }> = ({ lesson }) => {
  return (
    <div>
      {/* Lesson Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">{lesson.title}</h1>

        {lesson.description && (
          <p className="text-lg text-gray-600 leading-relaxed">
            {lesson.description}
          </p>
        )}

        {/* Lesson Meta Info */}
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            <span>Bài học</span>
          </div>
          {lesson.videoUrl && (
            <div className="flex items-center gap-1">
              <PlayCircle className="w-4 h-4" />
              <span>Video</span>
            </div>
          )}
        </div>
      </div>

      {/* Lesson Content */}
      {lesson.content && (
        <div className="mb-8">
          <div className="border-l-4 border-blue-500 pl-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Nội dung bài học
            </h2>
            <div className="prose prose-lg max-w-none">
              <MarkdownRenderer content={lesson.content} />
            </div>
          </div>
        </div>
      )}
      {/* Video Info */}
      {lesson.videoUrl && (
        <div className="mb-8 bg-gray-50 border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-blue-600" />
            Thông tin video
          </h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p>Video bài học đã được phát ở phía trên</p>
            <a
              href={lesson.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1"
            >
              Xem trên YouTube
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}

      {/* Attachments */}
      {lesson.attachments && lesson.attachments.length > 0 && (
        <div className="border-t pt-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Tài liệu đính kèm
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lesson.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-blue-600">
                    Tài liệu {index + 1}
                  </p>
                  <p className="text-xs text-gray-500">Nhấn để tải xuống</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Learning Tips */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Gợi ý học tập</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Xem video nhiều lần nếu cần để hiểu rõ nội dung</li>
          <li>• Ghi chú những điểm quan trọng vào phần Ghi chú</li>
          <li>• Thực hành ngay sau khi học để củng cố kiến thức</li>
          <li>• Tải xuống tài liệu đính kèm để tham khảo thêm</li>
        </ul>
      </div>
    </div>
  );
};

// Quiz Content Component
const QuizContent: React.FC<{ quiz: QuizResponse }> = ({ quiz }) => {
  const [quizHistory, setQuizHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await userQuizApi.getQuizAttemptHistory(quiz.id);
        setQuizHistory(history);
      } catch (error) {
        console.error("Error loading quiz history:", error);
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [quiz.id]);

  return (
    <div>
      {/* Quiz Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            {quiz.description}
          </p>
        )}
      </div>

      {/* Quiz Details */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-900">
          Thông tin bài kiểm tra
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Số câu hỏi</p>
              <p className="text-xl font-bold text-gray-900">
                {Array.from(quiz.questions || []).length} câu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Thời gian làm bài</p>
              <p className="text-xl font-bold text-gray-900">
                {quiz.duration} phút
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Điểm đạt yêu cầu</p>
              <p className="text-xl font-bold text-gray-900">
                {quiz.passingScore}%
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Số lần làm bài</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingHistory
                  ? "..."
                  : `${quizHistory.length}`}{" "}
                lần
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          Hướng dẫn làm bài
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Đọc kỹ từng câu hỏi trước khi trả lời</li>
          <li>• Bạn có {quiz.attemptLimit} lần làm bài kiểm tra này</li>
          <li>• Cần đạt tối thiểu {quiz.passingScore}% để vượt qua</li>
          <li>• Thời gian làm bài: {quiz.duration} phút</li>
          <li>• Nhấn vào nút "Làm bài ngay" ở phía trên để bắt đầu</li>
        </ul>
      </div>

      {/* Quiz History */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <HistoryIcon className="w-5 h-5 text-purple-600" />
          Lịch sử làm bài
        </h3>
        {loadingHistory ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          </div>
        ) : quizHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Chưa có lịch sử làm bài
          </p>
        ) : (
          <div className="space-y-3">
            {quizHistory.map((attempt: any, index: number) => (
              <div
                key={attempt.id}
                className={`p-4 rounded-lg border-l-4 ${
                  attempt.isPassed
                    ? "bg-green-50 border-green-500"
                    : "bg-red-50 border-red-500"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      Lần {quizHistory.length - index}
                    </span>
                    {attempt.isPassed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Đạt
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        <XCircle className="w-3 h-3" />
                        Không đạt
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(attempt.submittedAt).toLocaleString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-700">
                    Điểm:{" "}
                    <strong>
                      {attempt.score}/{attempt.totalScore}
                    </strong>
                  </span>
                  <span className="text-gray-700">
                    Thời gian:{" "}
                    <strong>
                      {Math.floor(attempt.timeSpent / 60)}:
                      {String(attempt.timeSpent % 60).padStart(2, "0")}
                    </strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Assignment Content Component
const AssignmentContent: React.FC<{ assignment: AssignmentResponse }> = ({
  assignment,
}) => {
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [submissionLink, setSubmissionLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteSubmissionConfirm, setShowDeleteSubmissionConfirm] =
    useState(false);

  useEffect(() => {
    loadSubmission();
  }, [assignment.id]);

  const loadSubmission = async () => {
    try {
      setLoading(true);
      const data = await assignmentApi.getMySubmission(assignment.id);
      setSubmission(data);

      // Pre-fill form if editing
      if (data) {
        setSubmissionContent(data.submissionText || "");
        setSubmissionLink(data.submissionLink || "");
      }
    } catch (error) {
      console.error("Error loading submission:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!submission) return;
    try {
      setSubmitting(true);
      await assignmentApi.deleteSubmission(submission.id);
      setSubmission(null);
    } catch (err) {
      console.error("Error deleting submission:", err);
    } finally {
      setSubmitting(false);
      setShowDeleteSubmissionConfirm(false);
    }
  };

  const handleUpdate = async () => {
    try {
      setSubmitting(true);

      const canSubmitText = ["TEXT", "BOTH"].includes(assignment.submissionType || "");
      const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(assignment.submissionType || "");
      const canSubmitLink = ["LINK", "BOTH"].includes(assignment.submissionType || "");

      const hasContent = (canSubmitText ? submissionContent : "") || (canSubmitFile ? submissionFiles.length > 0 : false) || (submission && submission.submissionFiles && submission.submissionFiles.length > 0) || (canSubmitLink ? submissionLink : "");

      if (!hasContent) {
        // nothing to update
        setSubmitting(false);
        return;
      }

      if (submission) {
        const updateData = {
          assignmentId: assignment.id,
          submissionText: canSubmitText ? submissionContent : undefined,
          submissionLink: canSubmitLink ? submissionLink : undefined,
        };

        await assignmentApi.updateSubmission(
          submission.id,
          updateData,
          canSubmitFile ? submissionFiles : undefined,
          canSubmitFile ? submission.submissionFiles || [] : undefined
        );

        // reload submission
        await loadSubmission();
        setShowEditModal(false);
      }
    } catch (err) {
      console.error("Error updating submission:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    if (submission) {
      setSubmissionContent(submission.submissionText || "");
      setSubmissionLink(submission.submissionLink || "");
      setSubmissionFiles([]);
    }
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Assignment Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{assignment.title}</h1>
        {assignment.deadline && (
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-300 px-4 py-2 rounded-lg mb-4">
            <Clock className="w-5 h-5 text-orange-600" />
            <span className="font-semibold text-orange-900">
              Hạn nộp:{" "}
              {new Date(assignment.deadline).toLocaleDateString("vi-VN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Submission Status (if exists) */}
      {submission && (
        <div className="mb-8 bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-green-900 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Bài làm
            </h2>
            <div className="flex items-center gap-3">
              {submission.score !== null && (
                <div className="flex items-center gap-2 bg-blue-100 px-3 py-1.5 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Điểm: {submission.score}/{assignment.maxScore}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="border-green-600 text-green-700 hover:bg-green-50"
              >
                <FileText className="w-4 h-4 mr-1" />
                Chỉnh sửa bài làm
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteSubmissionConfirm(true)}
                className="text-red-600 hover:bg-red-50"
              >
                Xóa
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Content */}
            {submission.submissionText && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Nội dung:
                </h3>
                <div className="bg-white border border-green-300 rounded-lg p-4 overflow-x-auto">
                  <div
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: submission.submissionText }}
                  />
                </div>
              </div>
            )}

            {/* Files */}
            {submission.submissionFiles &&
              submission.submissionFiles.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">
                    File đính kèm:
                  </h3>
                  <div className="bg-green-100 border border-green-300 rounded-lg p-3 space-y-2">
                    {submission.submissionFiles.map(
                      (file: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-gray-700"
                        >
                          <FileText className="w-4 h-4 text-green-600" />
                          <a
                            href={file}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {file.split("/").pop() || `File ${idx + 1}`}
                          </a>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Link */}
            {submission.submissionLink && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Link:
                </h3>
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                  <a
                    href={submission.submissionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-2"
                  >
                    <LinkIcon className="w-4 h-4" />
                    {submission.submissionLink}
                  </a>
                </div>
              </div>
            )}

            {/* Submission time */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>
                Nộp lúc:{" "}
                {new Date(submission.submittedAt).toLocaleString("vi-VN")}
              </span>
            </div>

            {/* Feedback if graded */}
            {submission.feedback && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  Nhận xét của giảng viên:
                </h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {submission.feedback}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      {assignment.description && (
        <div className="mb-8">
          <div className="border-l-4 border-green-500 pl-6">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">
              Mô tả bài tập
            </h2>
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg">
                {assignment.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Info */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-green-900">
          Thông tin nộp bài
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Loại nộp bài</p>
              <p className="text-lg font-semibold text-gray-900">
                {assignment.submissionType === "UPLOAD_FILE" && "Tải file lên"}
                {assignment.submissionType === "TEXT" && "Nhập văn bản"}
                {assignment.submissionType === "LINK" && "Gửi liên kết"}
                {assignment.submissionType === "BOTH" && "File hoặc văn bản"}
              </p>
            </div>
          </div>
          {assignment.maxScore && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Điểm tối đa</p>
                <p className="text-lg font-semibold text-gray-900">
                  {assignment.maxScore} điểm
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Files */}
      {assignment.assignmentFiles && assignment.assignmentFiles.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Tài liệu đính kèm
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {assignment.assignmentFiles.map((file, index) => (
              <a
                key={index}
                href={file}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 group-hover:text-blue-600">
                    Tài liệu {index + 1}
                  </p>
                  <p className="text-xs text-gray-500">Nhấn để tải xuống</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5" />
          Lưu ý khi làm bài
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• Đọc kỹ yêu cầu bài tập trước khi làm</li>
          <li>• Tải xuống và xem tài liệu đính kèm (nếu có)</li>
          <li>• Kiểm tra kỹ bài làm trước khi nộp</li>
          <li>• Nộp bài trước hạn để tránh bị trễ deadline</li>
          <li>
            • Nhấn vào nút "Xem chi tiết & Nộp bài" ở phía trên để bắt đầu
          </li>
        </ul>
      </div>

      {/* Edit Modal */}
      <AlertDialog
        open={showDeleteSubmissionConfirm}
        onOpenChange={setShowDeleteSubmissionConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài nộp?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa bài nộp này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDelete();
                setShowDeleteSubmissionConfirm(false);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showEditModal &&
        (() => {
          const canSubmitText = ["TEXT", "BOTH"].includes(
            assignment.submissionType || "",
          );
          const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(
            assignment.submissionType || "",
          );
          const canSubmitLink = ["LINK", "BOTH"].includes(
            assignment.submissionType || "",
          );

          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Chỉnh sửa bài nộp
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {assignment.title}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="p-2 hover:bg-gray-100 rounded-full"
                      aria-label="Đóng"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {canSubmitText && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nội dung bài làm
                      </label>
                      <RichTextEditor
                        value={submissionContent}
                        onChange={(content) => setSubmissionContent(content)}
                        placeholder="Nhập nội dung bài làm của bạn..."
                      />
                    </div>
                  )}

                  {canSubmitFile && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tệp đính kèm
                      </label>
                      <div className="mb-3">
                        <label
                          htmlFor="edit-file-upload"
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                            <Upload className="h-5 w-5 text-gray-600" />
                            <span className="text-sm text-gray-600">
                              Chọn file để upload (Tối đa 10MB/file)
                            </span>
                          </div>
                          <input
                            type="file"
                            multiple
                            onChange={(e) =>
                              setSubmissionFiles(
                                Array.from(e.target.files || []),
                              )
                            }
                            className="hidden"
                            id="edit-file-upload"
                            disabled={submitting}
                            accept="*/*"
                          />
                        </label>
                      </div>

                      {submissionFiles.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-2">
                            File mới:
                          </p>
                          <div className="space-y-2">
                            {submissionFiles.map((file, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 border rounded"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">
                                      {file.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {file.size < 1024
                                        ? file.size + " B"
                                        : file.size < 1024 * 1024
                                          ? (file.size / 1024).toFixed(1) +
                                            " KB"
                                          : (file.size / (1024 * 1024)).toFixed(
                                              1,
                                            ) + " MB"}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    setSubmissionFiles(
                                      submissionFiles.filter(
                                        (_, i) => i !== idx,
                                      ),
                                    )
                                  }
                                  className="p-1 hover:bg-gray-200 rounded ml-2"
                                  disabled={submitting}
                                  aria-label="Xóa file"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {canSubmitLink && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link bài làm
                      </label>
                      <div className="flex items-center gap-2">
                        <LinkIcon className="h-5 w-5 text-gray-400" />
                        <input
                          type="url"
                          value={submissionLink}
                          onChange={(e) => setSubmissionLink(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 p-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    disabled={submitting}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={submitting}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Cập nhật
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default CourseLearning;