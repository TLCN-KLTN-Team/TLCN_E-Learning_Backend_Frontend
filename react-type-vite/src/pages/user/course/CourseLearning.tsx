"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
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
  Share2,
  ChevronDown,
  Star,
  Search,
  Plus,
  Maximize,
  History as HistoryIcon,
  XCircle,
  Upload,
  Link as LinkIcon,
  Loader2,
  Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import progressApi from "@/services/api/user/progressApi"
import type { ProgressStatsResponse } from "@/services/api/response/progressStatsResponse"

type ContentItem = {
  id: number
  type: "lesson" | "quiz" | "assignment"
  title: string
  orderIndex: number
  sectionId: number
  sectionTitle: string
  data: LessonResponse | QuizResponse | AssignmentResponse
  isCompleted: boolean
}

const CourseLearning: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  
  const [courseName, setCourseName] = useState<string>("")
  const [courseData, setCourseData] = useState<any>(null)
  const [sections, setSections] = useState<SectionResponse[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<"overview" | "about" | "notes" | "announcements" | "reviews" | "tools">("overview")
  const [contentDisplayMode, setContentDisplayMode] = useState<'normal' | 'quiz' | 'assignment'>('normal')
  
  // Progress tracking states
  const [progressStats, setProgressStats] = useState<ProgressStatsResponse | null>(null)
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(new Set())
  const [isMarkingComplete, setIsMarkingComplete] = useState<Set<number>>(new Set())
  
  // Assignment submission modal
  const [showSubmissionModal, setShowSubmissionModal] = useState(false)
  const [submissionContent, setSubmissionContent] = useState('')
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([])
  const [submissionLink, setSubmissionLink] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Fetch progress stats
  const fetchProgressStats = async () => {
    if (!courseId) return

    try {
      const stats = await progressApi.getPublishedCourseProgress(Number(courseId))
      setProgressStats(stats)

      // Fetch completed lessons detail
      const detail = await progressApi.getPublishedCourseProgressDetail(Number(courseId))
      const completedLessonIds = new Set(
        detail.courseProgress.lessonProgresses
          .filter(lp => lp.isCompleted)
          .map(lp => lp.lessonId)
      )
      setCompletedLessons(completedLessonIds)
    } catch (error) {
      console.error("Error fetching progress stats:", error)
    }
  }

  // Mark lesson as complete
  const handleMarkLessonComplete = async (lessonId: number) => {
    if (!courseId || completedLessons.has(lessonId)) return

    setIsMarkingComplete(prev => new Set(prev).add(lessonId))

    try {
      await progressApi.markLessonComplete({
        lessonId,
        publishedCourseId: Number(courseId),
      })

      // Update local state
      setCompletedLessons(prev => new Set(prev).add(lessonId))

      // Update content items
      const updatedItems = [...contentItems]
      const itemIndex = updatedItems.findIndex(
        item => item.type === "lesson" && item.id === lessonId
      )
      if (itemIndex !== -1) {
        updatedItems[itemIndex].isCompleted = true
        setContentItems(updatedItems)
      }

      // Refresh progress stats
      await fetchProgressStats()

      toast.success("Đã đánh dấu bài học hoàn thành!")
    } catch (error) {
      console.error("Error marking lesson complete:", error)
      toast.error("Không thể đánh dấu bài học đã hoàn thành. Vui lòng thử lại.")
    } finally {
      setIsMarkingComplete(prev => {
        const newSet = new Set(prev)
        newSet.delete(lessonId)
        return newSet
      })
    }
  }

  useEffect(() => {
    loadCourseData()
    fetchProgressStats()
  }, [courseId])

  // Auto-hide sidebar when entering quiz/assignment mode
  useEffect(() => {
    if (contentDisplayMode === 'quiz' || contentDisplayMode === 'assignment') {
      setSidebarOpen(false)
    }
  }, [contentDisplayMode])

  const loadCourseData = async () => {
    if (!courseId) return

    try {
      setLoading(true)

      // Load course basic info
      const courseData = await CourseApiService.getCourseById(courseId)
      if (courseData) {
        setCourseName(courseData.courseName)
        setCourseData(courseData)
      }

      // Load sections with content
      const sectionsData = await getSectionsByCourseId(Number(courseId))
      setSections(sectionsData)

      // Flatten all content items
      const items: ContentItem[] = []
      
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
            })
          })
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
            })
          })
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
            })
          })
        }
      })

      // Sort by section order and item order
      items.sort((a, b) => {
        const sectionA = sectionsData.find(s => s.id === a.sectionId)
        const sectionB = sectionsData.find(s => s.id === b.sectionId)
        if (sectionA && sectionB && sectionA.orderIndex !== sectionB.orderIndex) {
          return sectionA.orderIndex - sectionB.orderIndex
        }
        return a.orderIndex - b.orderIndex
      })

      setContentItems(items)
      
      // Expand first section by default
      if (sectionsData.length > 0) {
        setExpandedSections(new Set([sectionsData[0].id]))
      }

    } catch (error) {
      console.error("Error loading course data:", error)
      toast.error("Không thể tải nội dung khóa học")
    } finally {
      setLoading(false)
    }
  }

  const currentItem = contentItems[currentItemIndex]

  const handlePrevious = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1)
      setContentDisplayMode('normal')
    }
  }

  const handleNext = () => {
    if (currentItemIndex < contentItems.length - 1) {
      // Mark current as completed
      const updatedItems = [...contentItems]
      updatedItems[currentItemIndex].isCompleted = true
      setContentItems(updatedItems)
      
      setCurrentItemIndex(currentItemIndex + 1)
      setContentDisplayMode('normal')
    }
  }

  const handleItemClick = (index: number) => {
    setCurrentItemIndex(index)
    setContentDisplayMode('normal')
  }

  const toggleSection = (sectionId: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case "lesson":
        return <PlayCircle className="w-4 h-4" />
      case "quiz":
        return <ClipboardCheck className="w-4 h-4" />
      case "assignment":
        return <FileText className="w-4 h-4" />
      default:
        return <BookOpen className="w-4 h-4" />
    }
  }

  const handleOpenSubmissionModal = () => {
    setShowSubmissionModal(true)
    setSubmissionContent('')
    setSubmissionFiles([])
    setSubmissionLink('')
  }

  const handleSubmitAssignment = async () => {
    if (!currentItem || currentItem.type !== 'assignment') return
    
    const assignment = currentItem.data as AssignmentResponse
    const canSubmitText = ["TEXT", "BOTH"].includes(assignment.submissionType || "")
    const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(assignment.submissionType || "")
    const canSubmitLink = ["LINK", "BOTH"].includes(assignment.submissionType || "")
    
    try {
      setSubmitting(true)
      
      // Validate
      const hasContent = submissionContent || submissionFiles.length > 0 || submissionLink
      if (!hasContent) {
        toast.error('Vui lòng nhập nội dung bài làm')
        setSubmitting(false)
        return
      }
      
      const submitData = {
        assignmentId: currentItem.id,
        submissionText: canSubmitText ? submissionContent : undefined,
        submissionLink: canSubmitLink ? submissionLink : undefined,
      }
      
      await assignmentApi.submitAssignment(
        currentItem.id,
        submitData,
        canSubmitFile ? submissionFiles : undefined
      )
      
      toast.success('Nộp bài thành công!')
      setShowSubmissionModal(false)
      
      // Reset form
      setSubmissionContent('')
      setSubmissionFiles([])
      setSubmissionLink('')
      
      // Reload assignment data to show new submission
      loadCourseData()
      
      // Refresh progress stats
      fetchProgressStats()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể nộp bài')
    } finally {
      setSubmitting(false)
    }
  }

  const renderContent = () => {
    // Show Quiz Attempt
    if (contentDisplayMode === 'quiz' && currentItem?.type === 'quiz') {
      return <UserQuizAttempt quizIdProp={currentItem.id} />
    }
    // Normal content
    if (!currentItem) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Chọn nội dung từ danh sách bên phải</p>
          </div>
        </div>
      )
    }

    switch (currentItem.type) {
      case "lesson":
        return <LessonContent lesson={currentItem.data as LessonResponse} />
      case "quiz":
        return <QuizContent quiz={currentItem.data as QuizResponse} />
      case "assignment":
        return <AssignmentContent assignment={currentItem.data as AssignmentResponse} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải khóa học...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Top Navigation Bar - Hide in quiz/assignment mode */}
      {contentDisplayMode === 'normal' && (
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
          
          <h1 className="text-white font-medium text-sm max-w-md truncate">{courseName}</h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-gray-800 gap-2"
            >
              <span className="text-sm">Your progress: {progressStats?.overallProgress || 0}%</span>
              <ChevronDown className="w-4 h-4" />
            </Button>
            
            {/* Progress Dropdown */}
            {progressStats && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Tiến độ học tập</h3>
                  
                  {/* Overall Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Tổng quan</span>
                      <span className="text-sm font-semibold text-blue-600">{progressStats.overallProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressStats.overallProgress}%` }}
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
                        {progressStats.completedLessons}/{progressStats.totalLessons}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <ClipboardCheck className="w-4 h-4 text-purple-600" />
                        <span className="text-gray-700">Bài kiểm tra</span>
                      </div>
                      <span className="font-medium">
                        {progressStats.completedQuizzes}/{progressStats.totalQuizzes}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700">Bài tập</span>
                      </div>
                      <span className="font-medium">
                        {progressStats.completedAssignments}/{progressStats.totalAssignments}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-white hover:bg-gray-800 gap-2"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </Button>

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
            {contentDisplayMode === 'quiz' && currentItem?.type === "quiz" && (
              <div className="bg-white">
                {renderContent()}
              </div>
            )}

            {contentDisplayMode === 'assignment' && currentItem?.type === "assignment" && (
              <div className="bg-white">
                {renderContent()}
              </div>
            )}

            {/* Normal Content View */}
            {contentDisplayMode === 'normal' && (
            <>
            {/* Video Player Area - Only show for lessons with video */}
            {currentItem?.type === "lesson" && (
              <div className="bg-black w-full flex-shrink-0 h-[570px]">
                <LessonVideoPlayer lesson={currentItem.data as LessonResponse} />
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
                      <span>{Array.from((currentItem.data as QuizResponse).questions || []).length} câu hỏi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>{(currentItem.data as QuizResponse).duration} phút</span>
                    </div>
                  </div>
                  <Button 
                    size="lg"
                    className="bg-white text-purple-700 hover:bg-purple-50 px-8 py-6 text-lg font-semibold rounded-xl shadow-xl"
                    onClick={() => setContentDisplayMode('quiz')}
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
                      Hạn nộp: {new Date((currentItem.data as AssignmentResponse).deadline).toLocaleDateString("vi-VN", {
                        year: 'numeric',
                        month: 'long', 
                        day: 'numeric'
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
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "overview"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab("about")}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "about"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {currentItem?.type === "lesson" && "About this lecture"}
                  {currentItem?.type === "quiz" && "About this quiz"}
                  {currentItem?.type === "assignment" && "About this assignment"}
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "notes"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Notes
                </button>
                <button
                  onClick={() => setActiveTab("announcements")}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "announcements"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Announcements
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "reviews"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Reviews
                </button>
                <button
                  onClick={() => setActiveTab("tools")}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === "tools"
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Learning tools
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white">
              <div className="max-w-4xl mx-auto px-6 py-8">
                {activeTab === "overview" && courseData && <CourseOverview course={courseData} />}
                {activeTab === "about" && renderContent()}
                {activeTab === "notes" && <NotesTab />}
                {activeTab === "announcements" && <AnnouncementsTab />}
                {activeTab === "reviews" && <ReviewsTab />}
                {activeTab === "tools" && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Công cụ học tập đang phát triển</p>
                  </div>
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
                Previous
              </Button>

              <Button
                onClick={handleNext}
                disabled={currentItemIndex === contentItems.length - 1}
                className="bg-gray-900 hover:bg-gray-800 text-white gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            </>
            )}
            </div>
          </div>
        </div>

        {/* Sidebar - Course Content - Hide in quiz/assignment mode */}
        {contentDisplayMode === 'normal' && (
        <div
          className={`${
            sidebarOpen ? "w-full md:w-[500px]" : "w-0"
          } bg-white border-l overflow-hidden transition-all duration-300 flex-shrink-0`}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="font-semibold text-base">Course content</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {sections.map((section) => {
                const sectionItems = contentItems.filter(item => item.sectionId === section.id)
                const completedCount = sectionItems.filter(item => item.isCompleted).length
                const isExpanded = expandedSections.has(section.id)
                const totalMinutes = sectionItems.reduce((sum) => sum + 3, 0) // Mock duration

                return (
                  <div key={section.id} className="border-b">
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 text-left transition-colors"
                    >
                      <div className="flex-1 pr-2">
                        <h3 className="font-medium text-sm mb-1">{section.title}</h3>
                        <p className="text-xs text-gray-600">
                          {completedCount}/{sectionItems.length} | {totalMinutes}min
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
                        {sectionItems.filter(item => item.type === "lesson").length > 0 && (
                          <div className="mb-2">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                              Lessons
                            </div>
                            {sectionItems
                              .filter(item => item.type === "lesson")
                              .map((item) => {
                                const itemIndex = contentItems.findIndex(i => i.id === item.id && i.type === item.type)
                                const isActive = itemIndex === currentItemIndex

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
                                      {item.isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-blue-600" />
                                      ) : (
                                        <div className={`w-4 h-4 rounded-full border-2 ${
                                          isActive ? "border-blue-600" : "border-gray-400"
                                        }`} />
                                      )}
                                    </div>
                                    <div 
                                      className="flex-1 min-w-0 cursor-pointer"
                                      onClick={() => handleItemClick(itemIndex)}
                                    >
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs ${isActive ? "text-gray-900" : "text-gray-600"}`}>
                                          {item.orderIndex}.
                                        </span>
                                        <span className={`text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                                          {item.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {getItemIcon(item.type)}
                                        <span>3min</span>
                                      </div>
                                    </div>
                                    {!item.isCompleted && isActive && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleMarkLessonComplete(item.id)
                                        }}
                                        disabled={isMarkingComplete.has(item.id)}
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
                                )
                              })}
                          </div>
                        )}

                        {/* Quizzes Group */}
                        {sectionItems.filter(item => item.type === "quiz").length > 0 && (
                          <div className="mb-2">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                              Quizzes
                            </div>
                            {sectionItems
                              .filter(item => item.type === "quiz")
                              .map((item) => {
                                const itemIndex = contentItems.findIndex(i => i.id === item.id && i.type === item.type)
                                const isActive = itemIndex === currentItemIndex

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
                                      {item.isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-purple-600" />
                                      ) : (
                                        <div className={`w-4 h-4 rounded-full border-2 ${
                                          isActive ? "border-blue-600" : "border-gray-400"
                                        }`} />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs ${isActive ? "text-gray-900" : "text-gray-600"}`}>
                                          {item.orderIndex}.
                                        </span>
                                        <span className={`text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                                          {item.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {getItemIcon(item.type)}
                                        <span>3min</span>
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        )}

                        {/* Assignments Group */}
                        {sectionItems.filter(item => item.type === "assignment").length > 0 && (
                          <div className="mb-2">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase">
                              Assignments
                            </div>
                            {sectionItems
                              .filter(item => item.type === "assignment")
                              .map((item) => {
                                const itemIndex = contentItems.findIndex(i => i.id === item.id && i.type === item.type)
                                const isActive = itemIndex === currentItemIndex

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
                                      {item.isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <div className={`w-4 h-4 rounded-full border-2 ${
                                          isActive ? "border-blue-600" : "border-gray-400"
                                        }`} />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs ${isActive ? "text-gray-900" : "text-gray-600"}`}>
                                          {item.orderIndex}.
                                        </span>
                                        <span className={`text-sm ${isActive ? "text-gray-900 font-medium" : "text-gray-700"}`}>
                                          {item.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-500">
                                        {getItemIcon(item.type)}
                                        <span>3min</span>
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Assignment Submission Modal */}
      {showSubmissionModal && currentItem?.type === 'assignment' && (() => {
        const assignment = currentItem.data as AssignmentResponse
        const canSubmitText = ["TEXT", "BOTH"].includes(assignment.submissionType || "")
        const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(assignment.submissionType || "")
        const canSubmitLink = ["LINK", "BOTH"].includes(assignment.submissionType || "")
        
        return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Nộp bài tập</h3>
                  <p className="text-sm text-gray-600 mt-1">{assignment.title}</p>
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
                <textarea
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập nội dung bài làm của bạn..."
                />
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
                  <label htmlFor="assignment-file-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                      <Upload className="h-5 w-5 text-gray-600" />
                      <span className="text-sm text-gray-600">
                        Chọn file để upload (Tối đa 10MB/file)
                      </span>
                    </div>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => setSubmissionFiles(Array.from(e.target.files || []))}
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
                    <p className="text-xs text-gray-500 mb-2">File mới:</p>
                    <div className="space-y-2">
                      {submissionFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 border rounded"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {file.size < 1024 ? file.size + ' B'
                                  : file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB'
                                  : (file.size / (1024 * 1024)).toFixed(1) + ' MB'}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setSubmissionFiles(submissionFiles.filter((_, i) => i !== idx))}
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
              <Button variant="outline" onClick={() => setShowSubmissionModal(false)} disabled={submitting}>
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
        )
      })()}
    </div>
  )
}

// Course Overview Component
const CourseOverview: React.FC<{ course: any }> = ({ course }) => {
  return (
    <div>
      {/* Course Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{course.courseName}</h1>
        <p className="text-xl text-gray-600 leading-relaxed">{course.description}</p>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-600">Cấp độ</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{course.level || "Tất cả"}</p>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-600">Thời lượng</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{course.duration || "N/A"}</p>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-600">Đánh giá</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{course.rating || "5.0"} ⭐</p>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-600">Học viên</span>
          </div>
          <p className="text-lg font-bold text-gray-900">{course.enrolledCount || "0"}</p>
        </div>
      </div>

      {/* What You'll Learn */}
      {course.whatYouWillLearn && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Bạn sẽ học được gì</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{course.whatYouWillLearn}</p>
          </div>
        </div>
      )}

      {/* Requirements */}
      {course.requirements && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Yêu cầu</h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{course.requirements}</p>
          </div>
        </div>
      )}

      {/* Target Audience */}
      {course.targetAudience && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Khóa học này dành cho ai</h2>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{course.targetAudience}</p>
          </div>
        </div>
      )}

      {/* Instructor Info */}
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
  )
}

// Notes Tab Component
const NotesTab: React.FC = () => {
  const [selectedLecture, setSelectedLecture] = useState("all")
  const [sortBy, setSortBy] = useState("recent")

  return (
    <div>
      {/* Create Note Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Create a new note at 0:00"
            className="w-full border rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Add note"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={selectedLecture}
          onChange={(e) => setSelectedLecture(e.target.value)}
          className="border rounded px-4 py-2 text-sm text-purple-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          aria-label="Filter by lecture"
        >
          <option value="all">All lectures</option>
          <option value="1">Lecture 1</option>
          <option value="2">Lecture 2</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded px-4 py-2 text-sm text-purple-600 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          aria-label="Sort notes"
        >
          <option value="recent">Sort by most recent</option>
          <option value="oldest">Sort by oldest</option>
        </select>
      </div>

      {/* Empty State */}
      <div className="text-center py-12">
        <p className="text-gray-600">
          Click the "Create a new note" box, the "+" button, or press "B" to make your first note.
        </p>
      </div>
    </div>
  )
}

// Announcements Tab Component
const AnnouncementsTab: React.FC = () => {
  return (
    <div className="text-center py-12">
      <h2 className="text-2xl font-bold mb-4">No announcements posted yet</h2>
      <p className="text-gray-600 max-w-2xl mx-auto">
        The instructor hasn't added any announcements to this course yet. Announcements are used to inform you of updates or additions to the course.
      </p>
    </div>
  )
}

// Reviews Tab Component  
/* eslint-disable react/forbid-dom-props */
const ReviewsTab: React.FC = () => {
  const mockReviews = [
    {
      id: 1,
      author: "Dusan",
      rating: 4,
      date: "2 weeks ago",
      content: "The course offers many useful tips, often explained through metaphors that make the concepts easy to understand. It covers all the key areas of public speaking but doesn't go too deeply into any specific topic. It's up to you to identify your weaker areas and work on improving them further.",
      helpful: 12
    },
    {
      id: 2,
      author: "Nguyễn Văn A",
      rating: 5,
      date: "1 month ago",
      content: "Khóa học rất hay và bổ ích. Giảng viên giải thích rất dễ hiểu, các ví dụ thực tế giúp tôi áp dụng ngay vào công việc. Rất đáng để đầu tư thời gian học.",
      helpful: 8
    },
    {
      id: 3,
      author: "Trần Thị B",
      rating: 5,
      date: "2 months ago",
      content: "Nội dung khóa học được tổ chức khoa học, từ cơ bản đến nâng cao. Video chất lượng cao, âm thanh rõ ràng. Tôi đã học được rất nhiều kỹ năng mới.",
      helpful: 15
    }
  ]

  return (
    <div>
      {/* Student Feedback Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Student feedback</h2>
        
        <div className="flex gap-8 items-start mb-8">
          {/* Rating Score */}
          <div className="text-center">
            <div className="text-6xl font-bold text-orange-500 mb-2">4.4</div>
            <div className="flex gap-1 justify-center mb-2">
              {[1, 2, 3, 4].map(i => (
                <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
              ))}
              <Star className="w-4 h-4 fill-orange-500 text-orange-500 opacity-50" />
            </div>
            <div className="text-sm text-orange-500 font-medium">Tutorial rating</div>
          </div>

          {/* Rating Bars */}
          <div className="flex-1 space-y-2">
            {[
              { stars: 5, percentage: 44 },
              { stars: 4, percentage: 37 },
              { stars: 3, percentage: 15 },
              { stars: 2, percentage: 3 },
              { stars: 1, percentage: 1 }
            ].map(({ stars, percentage }) => (
              <div key={stars} className="flex items-center gap-3">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500"
                    {...({ style: { width: `${percentage}%` } } as any)}
                  />
                </div>
                <div className="flex gap-1">
                  {[...Array(stars)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-orange-500 text-orange-500" />
                  ))}
                </div>
                <span className="text-sm text-purple-600 font-medium">{percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Reviews</h2>

        {/* Search and Filter */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews"
              className="w-full border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
          
          <select 
            className="border rounded-lg px-4 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Filter ratings"
          >
            <option value="all">All ratings</option>
            <option value="5">5 stars</option>
            <option value="4">4 stars</option>
            <option value="3">3 stars</option>
            <option value="2">2 stars</option>
            <option value="1">1 star</option>
          </select>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {mockReviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center font-semibold text-lg flex-shrink-0">
                  {review.author.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1">
                  {/* Header */}
                  <div className="mb-2">
                    <h3 className="font-semibold">{review.author}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${
                              i < review.rating 
                                ? 'fill-orange-500 text-orange-500' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">{review.date}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-gray-700 mb-3">{review.content}</p>

                  {/* Helpful */}
                  <div className="flex items-center gap-4 text-sm">
                    <button className="text-gray-600 hover:text-gray-900">
                      Helpful? <span className="font-medium">Yes ({review.helpful})</span>
                    </button>
                    <button className="text-gray-600 hover:text-gray-900">Report</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Lesson Video Player Component (just video, no other content)
const LessonVideoPlayer: React.FC<{ lesson: LessonResponse }> = ({ lesson }) => {
  const videoContainerRef = useRef<HTMLDivElement>(null)

  const handleFullscreen = () => {
    if (videoContainerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        videoContainerRef.current.requestFullscreen()
      }
    }
  }

  if (!lesson.videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <PlayCircle className="w-16 h-16 text-white mx-auto mb-4" />
          <p className="text-white text-lg">Không có video</p>
        </div>
      </div>
    )
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
        aria-label="Toggle fullscreen"
      >
        <Maximize className="w-5 h-5" />
      </button>
    </div>
  )
}

// Lesson Content Component (for Overview tab)
const LessonContent: React.FC<{ lesson: LessonResponse }> = ({ lesson }) => {
  return (
    <div>
      {/* Lesson Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">{lesson.title}</h1>
        
        {lesson.description && (
          <p className="text-lg text-gray-600 leading-relaxed">{lesson.description}</p>
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
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Nội dung bài học</h2>
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed">{lesson.content}</p>
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
                  <p className="text-xs text-gray-500">Click để tải xuống</p>
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
          <li>• Ghi chú những điểm quan trọng vào phần Notes</li>
          <li>• Thực hành ngay sau khi học để củng cố kiến thức</li>
          <li>• Tải xuống tài liệu đính kèm để tham khảo thêm</li>
        </ul>
      </div>
    </div>
  )
}

// Quiz Content Component
const QuizContent: React.FC<{ quiz: QuizResponse }> = ({ quiz }) => {
  const [quizHistory, setQuizHistory] = useState<any[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const history = await userQuizApi.getQuizAttemptHistory(quiz.id)
        setQuizHistory(history)
      } catch (error) {
        console.error('Error loading quiz history:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [quiz.id])

  return (
    <div>
      {/* Quiz Info */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{quiz.title}</h1>
        {quiz.description && (
          <p className="text-lg text-gray-600 leading-relaxed mb-6">{quiz.description}</p>
        )}
      </div>

      {/* Quiz Details */}
      <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-900">Thông tin bài kiểm tra</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Số câu hỏi</p>
              <p className="text-xl font-bold text-gray-900">{Array.from(quiz.questions || []).length} câu</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Thời gian làm bài</p>
              <p className="text-xl font-bold text-gray-900">{quiz.duration} phút</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Điểm đạt yêu cầu</p>
              <p className="text-xl font-bold text-gray-900">{quiz.passingScore}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Số lần làm bài</p>
              <p className="text-xl font-bold text-gray-900">
                {loadingHistory ? '...' : `${quizHistory.length}/${quiz.attemptLimit}`} lần
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
          <p className="text-gray-500 text-center py-4">Chưa có lịch sử làm bài</p>
        ) : (
          <div className="space-y-3">
            {quizHistory.map((attempt: any, index: number) => (
              <div
                key={attempt.id}
                className={`p-4 rounded-lg border-l-4 ${
                  attempt.isPassed
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">Lần {quizHistory.length - index}</span>
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
                    {new Date(attempt.submittedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-700">Điểm: <strong>{attempt.score}/{attempt.totalScore}</strong></span>
                  <span className="text-gray-700">Thời gian: <strong>{Math.floor(attempt.timeSpent / 60)}:{String(attempt.timeSpent % 60).padStart(2, '0')}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Assignment Content Component
const AssignmentContent: React.FC<{ assignment: AssignmentResponse }> = ({ assignment }) => {
  const [submission, setSubmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [submissionContent, setSubmissionContent] = useState('')
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([])
  const [submissionLink, setSubmissionLink] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadSubmission()
  }, [assignment.id])

  const loadSubmission = async () => {
    try {
      setLoading(true)
      const data = await assignmentApi.getMySubmission(assignment.id)
      setSubmission(data)
      
      // Pre-fill form if editing
      if (data) {
        setSubmissionContent(data.submissionText || '')
        setSubmissionLink(data.submissionLink || '')
      }
    } catch (error) {
      console.error('Error loading submission:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (submission) {
      setSubmissionContent(submission.submissionText || '')
      setSubmissionLink(submission.submissionLink || '')
      setSubmissionFiles([])
    }
    setShowEditModal(true)
  }

  const handleDelete = async () => {
    if (!submission || !window.confirm('Bạn có chắc chắn muốn xóa bài nộp này?')) return
    
    try {
      await assignmentApi.deleteSubmission(submission.id)
      toast.success('Đã xóa bài nộp')
      loadSubmission()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa bài nộp')
    }
  }

  const handleUpdate = async () => {
    if (!submission) return
    
    const canSubmitText = ["TEXT", "BOTH"].includes(assignment.submissionType || "")
    const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(assignment.submissionType || "")
    const canSubmitLink = ["LINK", "BOTH"].includes(assignment.submissionType || "")
    
    try {
      setSubmitting(true)
      
      const hasContent = submissionContent || submissionFiles.length > 0 || submissionLink
      if (!hasContent) {
        toast.error('Vui lòng nhập nội dung bài làm')
        setSubmitting(false)
        return
      }
      
      const updateData = {
        assignmentId: assignment.id,
        submissionText: canSubmitText ? submissionContent : undefined,
        submissionLink: canSubmitLink ? submissionLink : undefined,
      }
      
      const existingFiles = submission.submissionFiles || []
      
      await assignmentApi.updateSubmission(
        submission.id,
        updateData,
        canSubmitFile ? submissionFiles : undefined,
        canSubmitFile ? existingFiles : undefined
      )
      
      toast.success('Đã cập nhật bài nộp')
      setShowEditModal(false)
      setSubmissionFiles([])
      loadSubmission()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật bài nộp')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    )
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
              Hạn nộp: {new Date(assignment.deadline).toLocaleDateString("vi-VN", { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
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
                  <span className="text-sm font-medium text-blue-900">Điểm: {submission.score}/{assignment.maxScore}</span>
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
                onClick={handleDelete}
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
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Nội dung:</h3>
                <div className="bg-white border border-green-300 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{submission.submissionText}</p>
                </div>
              </div>
            )}
            
            {/* Files */}
            {submission.submissionFiles && submission.submissionFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">File đính kèm:</h3>
                <div className="bg-green-100 border border-green-300 rounded-lg p-3 space-y-2">
                  {submission.submissionFiles.map((file: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                      <FileText className="w-4 h-4 text-green-600" />
                      <a href={file} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {file.split('/').pop() || `File ${idx + 1}`}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Link */}
            {submission.submissionLink && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Link:</h3>
                <div className="bg-blue-100 border border-blue-300 rounded-lg p-3">
                  <a href={submission.submissionLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" />
                    {submission.submissionLink}
                  </a>
                </div>
              </div>
            )}

            {/* Submission time */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Nộp lúc: {new Date(submission.submittedAt).toLocaleString('vi-VN')}</span>
            </div>
            
            {/* Feedback if graded */}
            {submission.feedback && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Nhận xét của giảng viên:</h3>
                <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
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
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Mô tả bài tập</h2>
            <div className="prose prose-lg max-w-none">
              <p className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg">{assignment.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Info */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-green-900">Thông tin nộp bài</h2>
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
                <p className="text-lg font-semibold text-gray-900">{assignment.maxScore} điểm</p>
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
                  <p className="text-xs text-gray-500">Click để tải xuống</p>
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
          <li>• Nhấn vào nút "Xem chi tiết & Nộp bài" ở phía trên để bắt đầu</li>
        </ul>
      </div>

      {/* Edit Modal */}
      {showEditModal && (() => {
        const canSubmitText = ["TEXT", "BOTH"].includes(assignment.submissionType || "")
        const canSubmitFile = ["UPLOAD_FILE", "BOTH"].includes(assignment.submissionType || "")
        const canSubmitLink = ["LINK", "BOTH"].includes(assignment.submissionType || "")
        
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa bài nộp</h3>
                    <p className="text-sm text-gray-600 mt-1">{assignment.title}</p>
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
                    <textarea
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <label htmlFor="edit-file-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition border-gray-300 hover:border-blue-500 hover:bg-blue-50">
                          <Upload className="h-5 w-5 text-gray-600" />
                          <span className="text-sm text-gray-600">
                            Chọn file để upload (Tối đa 10MB/file)
                          </span>
                        </div>
                        <input
                          type="file"
                          multiple
                          onChange={(e) => setSubmissionFiles(Array.from(e.target.files || []))}
                          className="hidden"
                          id="edit-file-upload"
                          disabled={submitting}
                          accept="*/*"
                        />
                      </label>
                    </div>

                    {submissionFiles.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">File mới:</p>
                        <div className="space-y-2">
                          {submissionFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border rounded">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {file.size < 1024 ? file.size + ' B'
                                      : file.size < 1024 * 1024 ? (file.size / 1024).toFixed(1) + ' KB'
                                      : (file.size / (1024 * 1024)).toFixed(1) + ' MB'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setSubmissionFiles(submissionFiles.filter((_, i) => i !== idx))}
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
                <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={submitting}>
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
        )
      })()}
    </div>
  )
}

export default CourseLearning
