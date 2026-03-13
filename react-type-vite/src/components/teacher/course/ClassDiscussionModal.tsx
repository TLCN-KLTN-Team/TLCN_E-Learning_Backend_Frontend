import type React from "react"
import { useState, useEffect } from "react"
import { MessageSquare, X, Loader2, AlertCircle, FileText, ClipboardCheck, BookOpen } from "lucide-react"
import Modal from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import DiscussionSection from "../../student/course/DiscussionSection"
import { useAuth } from "@/context/auth-context/useAuth"
import * as quizApi from "@/services/api/student/quizApi"
import assignmentApi from "@/services/api/student/assignmentApi"
import courseEnrollmentApi from "@/services/api/student/courseEnrollmentApi"
import { getUnreadCount } from "@/services/api/quizDiscussionApi"
import { getAssignmentUnreadCount } from "@/services/api/assignmentDiscussionApi"
import { getLessonUnreadCount } from "@/services/api/lessonDiscussionApi"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import type { AssignmentResponse } from "@/services/api/response/assignmentResponse"

interface ClassDiscussionModalProps {
  isOpen: boolean
  onClose: () => void
  classId: number
  className: string
}

interface ItemWithUnread {
  id: number
  title: string
  type: "quiz" | "assignment" | "lesson"
  unreadCount: number
}

const ClassDiscussionModal: React.FC<ClassDiscussionModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
}) => {
  const { user } = useAuth()
  const [items, setItems] = useState<ItemWithUnread[]>([])
  const [selectedItem, setSelectedItem] = useState<ItemWithUnread | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchItems()
    } else {
      setSelectedItem(null)
    }
  }, [isOpen, classId])

  const fetchItems = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Fetch quizzes, assignments, and lessons
      const [quizzes, assignments, sections] = await Promise.all([
        quizApi.getQuizzesByClass(classId).catch(() => []),
        assignmentApi.getAssignmentsByClass(classId).catch(() => []),
        courseEnrollmentApi.getEnrolledCourseContents(classId).catch(() => []),
      ])

      // Extract lessons from sections
      const allLessons = sections.flatMap(section =>
        section.lessons ? Array.from(section.lessons) : []
      )

      // Create items list with unread counts
      const quizItems = await Promise.all(
        (quizzes as QuizResponse[]).map(async (quiz) => {
          const unreadCount = await getUnreadCount(quiz.id).catch(() => 0)
          return {
            id: quiz.id,
            title: quiz.title,
            type: "quiz" as const,
            unreadCount,
          }
        })
      )

      const assignmentItems = await Promise.all(
        (assignments as AssignmentResponse[]).map(async (assignment) => {
          const unreadCount = await getAssignmentUnreadCount(assignment.id).catch(() => 0)
          return {
            id: assignment.id,
            title: assignment.title,
            type: "assignment" as const,
            unreadCount,
          }
        })
      )

      const lessonItems = await Promise.all(
        allLessons.map(async (lesson) => {
          const unreadCount = await getLessonUnreadCount(lesson.id).catch(() => 0)
          return {
            id: lesson.id,
            title: lesson.title,
            type: "lesson" as const,
            unreadCount,
          }
        })
      )

      setItems([...lessonItems, ...quizItems, ...assignmentItems])
    } catch (err) {
      console.error("Error fetching items:", err)
      setError("Không thể tải danh sách bài kiểm tra và bài tập")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectItem = (item: ItemWithUnread) => {
    setSelectedItem(item)
    // Clear unread count for the selected item immediately
    setItems(prevItems =>
      prevItems.map(i =>
        i.id === item.id && i.type === item.type
          ? { ...i, unreadCount: 0 }
          : i
      )
    )
  }

  const handleBackToList = () => {
    setSelectedItem(null)
    // Refresh unread counts
    fetchItems()
  }

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
        <div className="p-8 flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </Modal>
    )
  }

  if (error) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
        <div className="p-8">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <p className="font-medium">{error}</p>
          </div>
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b sticky top-0 bg-white z-10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Thảo luận - {className}
            </h2>
            {selectedItem ? (
              <p className="text-gray-600">{selectedItem.title}</p>
            ) : (
              <p className="text-gray-600">Chọn bài học, bài kiểm tra hoặc bài tập để xem thảo luận</p>
            )}
          </div>
          <button
            onClick={selectedItem ? handleBackToList : onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedItem ? (
            // List view
            <div className="space-y-6">
              {items.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">
                    Chưa có bài học, bài kiểm tra hoặc bài tập nào
                  </p>
                  <p className="text-sm text-gray-500">
                    Tạo nội dung để sinh viên có thể thảo luận
                  </p>
                </div>
              ) : (
                <>
                  {/* Lessons Section */}
                  {items.filter(item => item.type === "lesson").length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-200">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-gray-900">
                          Bài học ({items.filter(item => item.type === "lesson").length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {items.filter(item => item.type === "lesson").map((item) => (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => handleSelectItem(item)}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-300 cursor-pointer transition group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition">
                                <BookOpen className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 group-hover:text-blue-600 transition">
                                  {item.title}
                                </p>
                                <p className="text-sm text-gray-500">Bài học</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.unreadCount > 0 && (
                                <span className="px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                                  {item.unreadCount > 99 ? "99+" : item.unreadCount} mới
                                </span>
                              )}
                              <MessageSquare className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quizzes Section */}
                  {items.filter(item => item.type === "quiz").length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-purple-200">
                        <FileText className="h-5 w-5 text-purple-600" />
                        <h3 className="font-semibold text-gray-900">
                          Bài kiểm tra ({items.filter(item => item.type === "quiz").length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {items.filter(item => item.type === "quiz").map((item) => (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => handleSelectItem(item)}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition">
                                <FileText className="h-5 w-5 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 group-hover:text-purple-600 transition">
                                  {item.title}
                                </p>
                                <p className="text-sm text-gray-500">Bài kiểm tra</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.unreadCount > 0 && (
                                <span className="px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                                  {item.unreadCount > 99 ? "99+" : item.unreadCount} mới
                                </span>
                              )}
                              <MessageSquare className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignments Section */}
                  {items.filter(item => item.type === "assignment").length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-orange-200">
                        <ClipboardCheck className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-gray-900">
                          Bài tập ({items.filter(item => item.type === "assignment").length})
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {items.filter(item => item.type === "assignment").map((item) => (
                          <div
                            key={`${item.type}-${item.id}`}
                            onClick={() => handleSelectItem(item)}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-orange-50 hover:border-orange-300 cursor-pointer transition group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition">
                                <ClipboardCheck className="h-5 w-5 text-orange-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 group-hover:text-orange-600 transition">
                                  {item.title}
                                </p>
                                <p className="text-sm text-gray-500">Bài tập</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {item.unreadCount > 0 && (
                                <span className="px-3 py-1 text-xs font-semibold bg-red-500 text-white rounded-full">
                                  {item.unreadCount > 99 ? "99+" : item.unreadCount} mới
                                </span>
                              )}
                              <MessageSquare className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            // Discussion view
            <div>
              <Button
                variant="outline"
                onClick={handleBackToList}
                className="mb-4"
              >
                ← Quay lại danh sách
              </Button>
              <DiscussionSection
                itemType={selectedItem.type}
                itemId={selectedItem.id}
                itemTitle={selectedItem.title}
                user={user}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ClassDiscussionModal
