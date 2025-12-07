import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, ArrowRight, CheckCircle2, Package, AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Lock, Upload, X } from "lucide-react"
import { Editor } from "@tinymce/tinymce-react"
import type { Editor as TinyMCEEditor } from "tinymce"
import type { ContentPublishStatusResponse } from "@/services/api/response/contentPublishStatusResponse"
import type { SectionResponse } from "@/services/api/response/sectionResponse"
import type { CourseCategoryResponse } from "@/services/api/response/courseTypeResponse"
import type { PublishedCourseResponse } from "@/services/api/response/publishedCourseResponse"
import type { PublishCourseRequest } from "@/services/api/request/publishCourseRequest"
import * as coursePackagingApi from "@/services/api/teacher/coursePackagingApi"
import * as courseTypeApi from "@/services/api/superadmin/courseTypeApi"
import * as sectionApi from "@/services/api/teacher/sectionApi"
import type { LessonResponse } from "@/services/api/response/lessonResponse"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import type { AssignmentResponse } from "@/services/api/response/assignmentResponse"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ConvertedSectionData {
  id: number
  courseId: number
  courseName: string
  title: string
  description: string
  orderIndex: number
  isPublished: boolean
  createdAt: Date
  updateAt: Date
  lessons: LessonResponse[]
  quizzes: QuizResponse[]
  assignments: AssignmentResponse[]
}

const CoursePackagingPage = () => {
  const { courseId: courseIdParam } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const courseId = parseInt(courseIdParam || "0", 10)

  const [activeStep, setActiveStep] = useState<"publish" | "details" | "review">("publish")
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
    description?: string
  } | null>(null)
  
  const [publishStatus, setPublishStatus] = useState<ContentPublishStatusResponse | null>(null)
  const [sections, setSections] = useState<SectionResponse[]>([])
  const [courseTypes, setCourseTypes] = useState<CourseCategoryResponse[]>([])
  const [existingPublish, setExistingPublish] = useState<PublishedCourseResponse | null>(null)

  // File states
  const [courseImage, setCourseImage] = useState<File | null>(null)
  const [courseVideo, setCourseVideo] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [videoPreview, setVideoPreview] = useState<string>("")

  const [formData, setFormData] = useState<PublishCourseRequest>({
    courseId: courseId,
    courseTypeId: 1,
    coursePrice: 0,
    description: "",
    courseIntroduction: "",
    courseImage: "",
    courseVideo: "",
    learnerAchievements: "",
    courseLearner: "",
    courseTarget: []
  })

  const [targetInput, setTargetInput] = useState("")
  const [editMode, setEditMode] = useState(false)

  // Computed states
  const isPending = existingPublish?.status === 1;
  const isApproved = existingPublish?.status === 2;
  const isRejected = existingPublish?.status === 3;
  
  const canEdit = !existingPublish || 
                  existingPublish.status === 0 || // Draft
                  existingPublish.status === 3 ||  // Rejected
                  (existingPublish.status === 2 && editMode); // Approved but in edit mode

  useEffect(() => {
    if (courseId > 0) {
      loadInitialData()
    } else {
      showNotification("error", "Lỗi", "ID khóa học không hợp lệ")
      setInitialLoading(false)
    }
  }, [courseId])

  const loadInitialData = async () => {
    setInitialLoading(true)
    try {
      const [status, sectionsData, typesData] = await Promise.all([
        coursePackagingApi.getPublishStatus(courseId),
        sectionApi.getSectionsByCourseId(courseId),
        courseTypeApi.getCourseTypes(0, 100)
      ])

      setPublishStatus(status)
      setSections(sectionsData)
      setCourseTypes(typesData.content)

      try {
        const isPublished = await coursePackagingApi.checkCoursePublished(courseId)
        if (isPublished) {
          const publishedData = await coursePackagingApi.getPublishedCourse(courseId)
          setExistingPublish(publishedData)
          
          setFormData({
            courseId: publishedData.course.id,
            courseTypeId: publishedData.courseType.id,
            coursePrice: publishedData.coursePrice,
            description: publishedData.description || "",
            courseIntroduction: publishedData.courseIntroduction || "",
            courseImage: publishedData.courseImage || "",
            courseVideo: publishedData.courseVideo || "",
            learnerAchievements: publishedData.learnerAchievements || "",
            courseLearner: publishedData.courseLearner || "",
            courseTarget: Array.isArray(publishedData.courseTarget) 
              ? publishedData.courseTarget 
              : []
          })
          
          // Set preview URLs for existing files
          if (publishedData.courseImage) {
            setImagePreview(publishedData.courseImage)
          }
          if (publishedData.courseVideo) {
            setVideoPreview(publishedData.courseVideo)
          }
        }
      } catch (err) {
        console.log("Course not published yet")
      }
    } catch (error: any) {
      showNotification("error", "Lỗi tải dữ liệu", error.message || "Không thể tải dữ liệu khóa học")
    } finally {
      setInitialLoading(false)
    }
  }

  const showNotification = (
    type: "success" | "error",
    message: string,
    description?: string
  ) => {
    setNotification({ type, message, description })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showNotification("error", "File quá lớn", "Kích thước ảnh không được vượt quá 10MB")
        return
      }
      
      if (!file.type.startsWith('image/')) {
        showNotification("error", "File không hợp lệ", "Vui lòng chọn file ảnh")
        return
      }

      setCourseImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        showNotification("error", "File quá lớn", "Kích thước video không được vượt quá 100MB")
        return
      }
      
      if (!file.type.startsWith('video/')) {
        showNotification("error", "File không hợp lệ", "Vui lòng chọn file video")
        return
      }

      setCourseVideo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setVideoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setCourseImage(null);
    setImagePreview("");

    setFormData(prev => ({
      ...prev,
      courseImage: ""
    }));
  };

  const removeVideo = () => {
    setCourseVideo(null);
    setVideoPreview("");

    setFormData(prev => ({
      ...prev,
      courseVideo: ""  // cập nhật trực tiếp
    }));
  };


  const toggleItemPublish = async (
    type: "section" | "lesson" | "quiz" | "assignment",
    id: number,
    currentStatus: boolean
  ) => {
    if (!canEdit) {
      showNotification("error", "Không thể chỉnh sửa", "Khóa học đang chờ duyệt hoặc đã được duyệt")
      return
    }

    setLoading(true)
    try {
      const newStatus = !currentStatus

      switch (type) {
        case "section":
          await coursePackagingApi.toggleSectionPublish(id, newStatus)
          break
        case "lesson":
          await coursePackagingApi.toggleLessonPublish(id, newStatus)
          break
        case "quiz":
          await coursePackagingApi.toggleQuizPublish(id, newStatus)
          break
        case "assignment":
          await coursePackagingApi.toggleAssignmentPublish(id, newStatus)
          break
      }

      const [status, sectionsData] = await Promise.all([
        coursePackagingApi.getPublishStatus(courseId),
        sectionApi.getSectionsByCourseId(courseId),
      ])

      setPublishStatus(status)
      setSections(sectionsData)

      showNotification(
        "success",
        "Đã cập nhật",
        `Đã ${newStatus ? "xuất bản" : "ẩn"} ${
          type === "section"
            ? "chương"
            : type === "lesson"
            ? "bài học"
            : type === "quiz"
            ? "bài kiểm tra"
            : "bài tập"
        }`
      )
    } catch (error: any) {
      showNotification("error", "Lỗi cập nhật", error.message || "Không thể cập nhật trạng thái")
    } finally {
      setLoading(false)
    }
  }

  const handlePublishAll = async () => {
    if (!canEdit) {
      showNotification("error", "Không thể chỉnh sửa", "Khóa học đang chờ duyệt hoặc đã được duyệt")
      return
    }

    setLoading(true)
    try {
      const updatedStatus = await coursePackagingApi.publishAll(courseId, true)
      setPublishStatus(updatedStatus)

      const sectionsData = await sectionApi.getSectionsByCourseId(courseId);
      setSections(sectionsData)

      showNotification("success", "Đã xuất bản tất cả", "Tất cả nội dung đã được xuất bản")
    } catch (error: any) {
      showNotification("error", "Lỗi xuất bản", error.message || "Không thể xuất bản tất cả")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!canEdit) {
      showNotification("error", "Không thể chỉnh sửa", "Khóa học đang chờ duyệt hoặc đã được duyệt")
      return
    }

    setLoading(true)
    try {
      console.log("Saving draft with formData:", formData)
      console.log("Course Image:", courseImage)
      console.log("Course Video:", courseVideo)
      
      const result = await coursePackagingApi.createOrUpdateDraft(
        formData,
        courseImage || undefined,
        courseVideo || undefined
      )
      setExistingPublish(result)
      
      // Update preview URLs if new files were uploaded
      if (result.courseImage) {
        setImagePreview(result.courseImage)
      }
      if (result.courseVideo) {
        setVideoPreview(result.courseVideo)
      }
      
      showNotification("success", "Đã lưu bản nháp", "Thông tin khóa học đã được lưu")
    } catch (error: any) {
      console.error("Error saving draft:", error)
      console.error("Error response:", error.response?.data)
      const errorMessage = error.response?.data?.message || error.message || "Không thể lưu bản nháp"
      showNotification("error", "Lỗi lưu bản nháp", errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApprovedCourse = async () => {
    if (!editMode || !isApproved) {
      showNotification("error", "Không thể lưu", "Chỉ có thể lưu khi đang ở chế độ chỉnh sửa")
      return
    }

    setLoading(true)
    try {
      const result = await coursePackagingApi.createOrUpdateDraft(
        formData,
        courseImage || undefined,
        courseVideo || undefined
      )
      setExistingPublish(result)
      
      // Update preview URLs if new files were uploaded
      if (result.courseImage) {
        setImagePreview(result.courseImage)
      }
      if (result.courseVideo) {
        setVideoPreview(result.courseVideo)
      }
      
      // Exit edit mode after saving
      setEditMode(false)
      
      showNotification("success", "Đã lưu thay đổi", "Thông tin khóa học đã được cập nhật")
    } catch (error: any) {
      showNotification("error", "Lỗi lưu thay đổi", error.message || "Không thể lưu thay đổi")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.description?.trim()) {
      showNotification("error", "Thiếu thông tin", "Vui lòng nhập mô tả khóa học")
      setActiveStep("details")
      return
    }
    if (!formData.courseIntroduction?.trim()) {
      showNotification("error", "Thiếu thông tin", "Vui lòng nhập giới thiệu khóa học")
      setActiveStep("details")
      return
    }
    if (!publishStatus || publishStatus.publishedSections === 0) {
      showNotification("error", "Chưa có nội dung", "Vui lòng xuất bản ít nhất 1 chương")
      setActiveStep("publish")
      return
    }

    setLoading(true)
    try {
      if (!existingPublish || isRejected) {
        await coursePackagingApi.createOrUpdateDraft(
          formData,
          courseImage || undefined,
          courseVideo || undefined
        )
      }

      const result = await coursePackagingApi.submitForApproval(courseId)
      setExistingPublish(result)
      
      showNotification(
        "success",
        "Đã gửi duyệt",
        "Khóa học đã được gửi cho quản trị viên xét duyệt. Bạn sẽ được chuyển về trang danh sách khóa học."
      )

      setTimeout(() => {
        navigate("/teacher/assigned-courses")
      }, 2000)
    } catch (error: any) {
      showNotification("error", "Lỗi gửi duyệt", error.message || "Không thể gửi yêu cầu duyệt")
    } finally {
      setLoading(false)
    }
  }

  const addCourseTarget = () => {
    if (targetInput.trim()) {
      setFormData(prev => ({
        ...prev,
        courseTarget: [...prev.courseTarget, targetInput.trim()]
      }));
      setTargetInput("");
    }
  };

  const removeCourseTarget = (index: number) => {
    setFormData(prev => ({
      ...prev,
      courseTarget: prev.courseTarget.filter((_, i) => i !== index)
    }));
  };

  const convertSectionData = (section: SectionResponse): ConvertedSectionData => {
    return {
      ...section,
      lessons: Array.from(section.lessons || []) as LessonResponse[],
      quizzes: Array.from((section as any).quizs || []) as QuizResponse[],
      assignments: Array.from((section as any).assignments || []) as AssignmentResponse[],
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (!publishStatus) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Không thể tải dữ liệu khóa học</p>
          <button 
            onClick={() => navigate("/teacher/assigned-courses")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {notification && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-start gap-3 ${
              notification.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <h4 className="font-semibold">{notification.message}</h4>
              {notification.description && <p className="text-sm mt-1">{notification.description}</p>}
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={() => navigate("/teacher/assigned-courses")}
              className="px-4 py-2 border rounded-lg hover:bg-gray-100 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="text-blue-600" size={32} />
              Đóng Gói Khóa Học Thương Mại
            </h1>
          </div>
          <p className="text-gray-600">
            Chọn nội dung xuất bản, điền thông tin và gửi duyệt để đưa khóa học lên marketplace
          </p>
          
          {existingPublish && (
            <div className={`mt-4 px-4 py-3 rounded-lg border flex items-center justify-between ${
              isPending ? 'bg-yellow-50 border-yellow-200' :
              isApproved ? 'bg-green-50 border-green-200' :
              isRejected ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {isPending && <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />}
                {isApproved && <CheckCircle className="w-5 h-5 text-green-600" />}
                {isRejected && <AlertCircle className="w-5 h-5 text-red-600" />}
                {!isPending && !isApproved && !isRejected && <Lock className="w-5 h-5 text-blue-600" />}
                <span className="font-semibold">
                  Trạng thái: {existingPublish.statusText}
                </span>
                {editMode && (
                  <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded font-medium">
                    Đang chỉnh sửa
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {isApproved && !editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Chỉnh Sửa
                  </button>
                )}
                {isApproved && editMode && (
                  <button
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition"
                  >
                    Hủy
                  </button>
                )}
                {!editMode && (
                  <span className="text-sm text-gray-600">
                    {isPending && "Đang chờ quản trị viên xét duyệt"}
                    {isApproved && "Khóa học đã được phê duyệt"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 flex gap-2">
          {[
            { key: "publish", label: "Xuất Bản Nội Dung" },
            { key: "details", label: "Thông Tin Chi Tiết" },
            { key: "review", label: "Xem Lại & Gửi" },
          ].map((step, idx) => (
            <button
              key={step.key}
              onClick={() => setActiveStep(step.key as any)}
              disabled={!canEdit && step.key !== "review"}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                activeStep === step.key
                  ? "bg-blue-600 text-white"
                  : "bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              }`}
            >
              {idx + 1}. {step.label}
            </button>
          ))}
        </div>

        {!canEdit && activeStep !== "review" && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800">Không thể chỉnh sửa</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {isPending && "Khóa học đang chờ duyệt. Bạn không thể chỉnh sửa cho đến khi quản trị viên xét duyệt."}
                {isApproved && !editMode && "Vui lòng nhấn nút 'Chỉnh Sửa' để bắt đầu chỉnh sửa khóa học."}
              </p>
            </div>
          </div>
        )}

        {editMode && isApproved && (
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-800">Đang ở chế độ chỉnh sửa</h4>
              <p className="text-sm text-blue-700 mt-1">
                Bạn có thể chỉnh sửa nội dung xuất bản và thông tin chi tiết. Nhớ lưu thay đổi trước khi thoát.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Publish Content - Same as original, trimmed for brevity */}
        {activeStep === "publish" && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Xuất Bản Nội Dung</h2>
              <button
                onClick={handlePublishAll}
                disabled={loading || !canEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Xuất Bản Tất Cả
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Chương</div>
                <div className="text-2xl font-bold text-blue-600">
                  {publishStatus.publishedSections}/{publishStatus.totalSections}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Bài Học</div>
                <div className="text-2xl font-bold text-blue-600">
                  {publishStatus.publishedLessons}/{publishStatus.totalLessons}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Bài Kiểm Tra</div>
                <div className="text-2xl font-bold text-blue-600">
                  {publishStatus.publishedQuizzes}/{publishStatus.totalQuizzes}
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Bài Tập</div>
                <div className="text-2xl font-bold text-blue-600">
                  {publishStatus.publishedAssignments}/{publishStatus.totalAssignments}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Tiến độ xuất bản</span>
                <span className="text-sm font-medium">
                  {publishStatus.publishPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${publishStatus.publishPercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {sections.map((section) => {
                const sectionData = convertSectionData(section)
                return (
                  <div key={section.id} className="border rounded-lg overflow-hidden">
                    <div
                      className={`p-4 flex items-center justify-between ${
                        section.isPublished
                          ? "bg-green-50 border-b border-green-200"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-medium">{section.title}</span>
                        {section.isPublished && (
                          <span className="px-2 py-1 bg-green-600 text-white text-xs rounded">
                            Đã xuất bản
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          toggleItemPublish("section", section.id, section.isPublished)
                        }
                        disabled={loading || !canEdit}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 disabled:cursor-not-allowed ${
                          section.isPublished
                            ? "bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                            : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        }`}
                      >
                        {section.isPublished ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        {section.isPublished ? "Ẩn" : "Xuất bản"}
                      </button>
                    </div>

                    {sectionData.lessons.length > 0 && (
                      <div className="p-4 bg-white border-b">
                        <div className="text-sm font-medium text-gray-600 mb-2">Bài học:</div>
                        <div className="space-y-2">
                          {sectionData.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                            >
                              <span
                                className={
                                  lesson.isPublished ? "text-green-700" : "text-gray-500"
                                }
                              >
                                • {lesson.title}
                              </span>
                              <button
                                onClick={() =>
                                  toggleItemPublish("lesson", lesson.id, lesson.isPublished || false)
                                }
                                disabled={!canEdit}
                                className={`text-xs px-3 py-1 rounded disabled:cursor-not-allowed ${
                                  lesson.isPublished
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {lesson.isPublished ? "✓ Đã xuất bản" : "Ẩn"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sectionData.quizzes.length > 0 && (
                      <div className="p-4 bg-white border-b">
                        <div className="text-sm font-medium text-gray-600 mb-2">Bài kiểm tra:</div>
                        <div className="space-y-2">
                          {sectionData.quizzes.map((quiz) => (
                            <div
                              key={quiz.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                            >
                              <span
                                className={
                                  quiz.isPublished ? "text-green-700" : "text-gray-500"
                                }
                              >
                                • {quiz.title}
                              </span>
                              <button
                                onClick={() =>
                                  toggleItemPublish("quiz", quiz.id, quiz.isPublished)
                                }
                                disabled={!canEdit}
                                className={`text-xs px-3 py-1 rounded disabled:cursor-not-allowed ${
                                  quiz.isPublished
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {quiz.isPublished ? "✓ Đã xuất bản" : "Ẩn"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {sectionData.assignments.length > 0 && (
                      <div className="p-4 bg-white">
                        <div className="text-sm font-medium text-gray-600 mb-2">Bài tập:</div>
                        <div className="space-y-2">
                          {sectionData.assignments.map((assignment) => (
                            <div
                              key={assignment.id}
                              className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                            >
                              <span
                                className={
                                  assignment.isPublished ? "text-green-700" : "text-gray-500"
                                }
                              >
                                • {assignment.title}
                              </span>
                              <button
                                onClick={() =>
                                  toggleItemPublish(
                                    "assignment",
                                    assignment.id,
                                    assignment.isPublished
                                  )
                                }
                                disabled={!canEdit}
                                className={`text-xs px-3 py-1 rounded disabled:cursor-not-allowed ${
                                  assignment.isPublished
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-200 text-gray-700"
                                }`}
                              >
                                {assignment.isPublished ? "✓ Đã xuất bản" : "Ẩn"}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setActiveStep("details")}
                disabled={publishStatus.publishedSections === 0}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Tiếp Theo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Details with File Upload */}
        {activeStep === "details" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Thông Tin Chi Tiết Khóa Học</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Loại Khóa Học *</label>
                  <select
                    className="w-full p-2 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={formData.courseTypeId}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        courseTypeId: Number(e.target.value),
                      }))
                    }
                  >
                    {courseTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.courseTypeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Giá (VNĐ) *</label>
                  <Input
                    type="number"
                    className="w-full p-2 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={formData.coursePrice}
                    disabled={!canEdit}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        coursePrice: Number(e.target.value),
                      }))
                    }
                    min={0}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mô Tả Chi Tiết *</label>
                <Editor
                  apiKey={import.meta.env.VITE_API_KEY_TINY}
                  value={formData.description}
                  disabled={!canEdit}
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                      'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist outdent indent | ' +
                      'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    placeholder: "Nhập mô tả chi tiết về khóa học..."
                  }}
                  onEditorChange={(content) => {
                    setFormData(prev => ({
                      ...prev,
                      description: content
                    }))
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Giới Thiệu Khóa Học *</label>
                <Editor
                  apiKey={import.meta.env.VITE_API_KEY_TINY}
                  value={formData.courseIntroduction}
                  disabled={!canEdit}
                  init={{
                    height: 200,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'charmap',
                      'searchreplace', 'visualblocks', 'code',
                      'insertdatetime', 'table', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist | removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    placeholder: "Giới thiệu ngắn gọn về khóa học..."
                  }}
                  onEditorChange={(content) => {
                    setFormData(prev => ({
                      ...prev,
                      courseIntroduction: content
                    }))
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Thành Tựu Học Viên</label>
                <Editor
                  apiKey={import.meta.env.VITE_API_KEY_TINY}
                  value={formData.learnerAchievements}
                  disabled={!canEdit}
                  init={{
                    height: 200,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'charmap',
                      'searchreplace', 'visualblocks', 'code',
                      'insertdatetime', 'table', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist | removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    placeholder: "Học viên sẽ đạt được gì sau khóa học..."
                  }}
                  onEditorChange={(content) => {
                    setFormData(prev => ({
                      ...prev,
                      learnerAchievements: content
                    }))
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Đối Tượng Học Viên</label>
                <Editor
                  apiKey={import.meta.env.VITE_API_KEY_TINY}
                  value={formData.courseLearner}
                  disabled={!canEdit}
                  init={{
                    height: 200,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'charmap',
                      'searchreplace', 'visualblocks', 'code',
                      'insertdatetime', 'table', 'help', 'wordcount'
                    ],
                    toolbar: 'undo redo | blocks | ' +
                      'bold italic forecolor | alignleft aligncenter ' +
                      'alignright alignjustify | bullist numlist | removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                    placeholder: "Khóa học phù hợp với ai..."
                  }}
                  onEditorChange={(content) => {
                    setFormData(prev => ({
                      ...prev,
                      courseLearner: content
                    }))
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Mục Tiêu Khóa Học</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 p-2 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={targetInput}
                    disabled={!canEdit}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addCourseTarget()}
                    placeholder="Nhập mục tiêu và nhấn Enter..."
                  />
                  <button
                    onClick={addCourseTarget}
                    disabled={!canEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Thêm
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.courseTarget.map((target, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded"
                    >
                      <span>• {target}</span>
                      <button
                        onClick={() => removeCourseTarget(idx)}
                        disabled={!canEdit}
                        className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Ảnh Khóa Học</label>
                <div className="space-y-3">
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img 
                        src={imagePreview} 
                        alt="Course preview" 
                        className="w-64 h-40 object-cover rounded-lg border"
                      />
                      {canEdit && (
                        <Button
                          onClick={removeImage}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-2">
                        Chọn ảnh khóa học (tối đa 10MB)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={!canEdit}
                        className="hidden"
                        id="course-image"
                      />
                      <label
                        htmlFor="course-image"
                        className={`inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${
                          !canEdit ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Chọn Ảnh
                      </label>
                    </div>
                  )}
                  {courseImage && (
                    <p className="text-sm text-green-600">
                      ✓ File đã chọn: {courseImage.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Video Giới Thiệu</label>
                <div className="space-y-3">
                  {videoPreview ? (
                    <div className="relative inline-block">
                      <video 
                        src={videoPreview} 
                        controls 
                        className="w-full max-w-md h-60 rounded-lg border"
                      />
                      {canEdit && (
                        <Button
                          onClick={removeVideo}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600 mb-2">
                        Chọn video giới thiệu (tối đa 100MB)
                      </p>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        disabled={!canEdit}
                        className="hidden"
                        id="course-video"
                      />
                      <label
                        htmlFor="course-video"
                        className={`inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer ${
                          !canEdit ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Chọn Video
                      </label>
                    </div>
                  )}
                  {courseVideo && (
                    <p className="text-sm text-green-600">
                      ✓ File đã chọn: {courseVideo.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setActiveStep("publish")}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay Lại
              </button>
              <div className="flex gap-2">
                {editMode && isApproved ? (
                  <button
                    onClick={handleSaveApprovedCourse}
                    disabled={loading}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    <CheckCircle className="w-4 h-4" />
                    Lưu Thay Đổi
                  </button>
                ) : (
                  <button
                    onClick={handleSaveDraft}
                    disabled={loading || !canEdit}
                    className="px-6 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Lưu Bản Nháp
                  </button>
                )}
                <button
                  onClick={() => setActiveStep("review")}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  Tiếp Theo
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {activeStep === "review" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Xem Lại & Gửi Duyệt</h2>

            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-4">Tóm Tắt</h3>
                <dl className="space-y-2">
                  <div className="flex">
                    <dt className="w-1/3 text-gray-600">Nội dung xuất bản:</dt>
                    <dd className="flex-1 font-medium">
                      {publishStatus.publishPercentage.toFixed(1)}%
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-1/3 text-gray-600">Loại khóa học:</dt>
                    <dd className="flex-1 font-medium">
                      {courseTypes.find((t) => t.id === formData.courseTypeId)?.courseTypeName}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-1/3 text-gray-600">Giá:</dt>
                    <dd className="flex-1 font-medium">
                      {formData.coursePrice.toLocaleString()} VNĐ
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-1/3 text-gray-600">Mục tiêu:</dt>
                    <dd className="flex-1 font-medium">
                      {formData.courseTarget.length} mục tiêu
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-1/3 text-gray-600">Ảnh khóa học:</dt>
                    <dd className="flex-1 font-medium">
                      {courseImage || imagePreview ? "✓ Đã có" : "Chưa có"}
                    </dd>
                  </div>
                  <div className="flex">
                    <dt className="w-1/3 text-gray-600">Video giới thiệu:</dt>
                    <dd className="flex-1 font-medium">
                      {courseVideo || videoPreview ? "✓ Đã có" : "Chưa có"}
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="font-medium mb-2">Nội dung sẽ xuất bản:</h3>
                <div className="border rounded-lg p-4 space-y-2 max-h-96 overflow-y-auto">
                  {sections
                    .filter((s) => s.isPublished)
                    .map((section) => {
                      const sectionData = convertSectionData(section)
                      const publishedLessons = sectionData.lessons.filter((l) => l.isPublished).length
                      const publishedQuizzes = sectionData.quizzes.filter((q) => q.isPublished).length
                      const publishedAssignments = sectionData.assignments.filter(
                        (a) => a.isPublished
                      ).length

                      return (
                        <div key={section.id} className="pb-2 border-b last:border-b-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{section.title}</span>
                          </div>
                          <div className="ml-6 text-sm text-gray-600">
                            {publishedLessons > 0 && (
                              <span className="mr-3">📚 {publishedLessons} bài học</span>
                            )}
                            {publishedQuizzes > 0 && (
                              <span className="mr-3">📝 {publishedQuizzes} bài kiểm tra</span>
                            )}
                            {publishedAssignments > 0 && (
                              <span>📋 {publishedAssignments} bài tập</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Thông tin chi tiết:</h3>
                <div className="border rounded-lg p-4 space-y-3">
                  {formData.description && (
                    <div>
                      <div className="text-sm font-medium text-gray-600">Mô tả:</div>
                      <div className="text-sm mt-1 line-clamp-3">
                        {formData.description}
                      </div>
                    </div>
                  )}
                  {formData.courseIntroduction && (
                    <div>
                      <div className="text-sm font-medium text-gray-600">Giới thiệu:</div>
                      <div className="text-sm mt-1 line-clamp-2">
                        {formData.courseIntroduction}
                      </div>
                    </div>
                  )}
                  {formData.courseTarget.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-600">Mục tiêu:</div>
                      <ul className="text-sm mt-1 space-y-1">
                        {formData.courseTarget.map((target, idx) => (
                          <li key={idx}>• {target}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(imagePreview || courseImage) && (
                    <div>
                      <div className="text-sm font-medium text-gray-600 mb-2">Ảnh khóa học:</div>
                      <img 
                        src={imagePreview} 
                        alt="Course" 
                        className="w-48 h-32 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              </div>

              {(!formData.description?.trim() ||
                !formData.courseIntroduction?.trim() ||
                publishStatus.publishedSections === 0) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Cần hoàn thiện thêm:</h4>
                      <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                        {!formData.description?.trim() && (
                          <li>• Chưa có mô tả chi tiết khóa học</li>
                        )}
                        {!formData.courseIntroduction?.trim() && (
                          <li>• Chưa có giới thiệu khóa học</li>
                        )}
                        {publishStatus.publishedSections === 0 && (
                          <li>• Chưa xuất bản nội dung nào</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-6">
              <button
                onClick={() => setActiveStep("details")}
                className="px-6 py-3 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Quay Lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  loading ||
                  !formData.description?.trim() ||
                  !formData.courseIntroduction?.trim() ||
                  publishStatus.publishedSections === 0 ||
                  !canEdit
                }
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Gửi Duyệt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CoursePackagingPage