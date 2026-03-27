"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"
import { getQuizVisibility, updateQuizVisibility } from "@/services/api/teacher/contentVisibilityApi"
import { getClassesByCourse } from "@/services/api/teacher/classManagementApi"
import type { CourseClassResponse } from "@/services/api/response/courseClassResponse"

interface QuizVisibilityModalProps {
  isOpen: boolean
  onClose: () => void
  quizId: number
  quizTitle: string
  courseId: number
  educationalUnitId: number
}

const QuizVisibilityModal: React.FC<QuizVisibilityModalProps> = ({
  isOpen,
  onClose,
  quizId,
  quizTitle,
  courseId,
  educationalUnitId,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [classes, setClasses] = useState<CourseClassResponse[]>([])
  const [selectedClassIds, setSelectedClassIds] = useState<number[]>([])
  const [initialClassIds, setInitialClassIds] = useState<number[]>([])

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, quizId, courseId])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Validate educationalUnitId
      if (!educationalUnitId) {
        setError("Thiếu thông tin đơn vị giáo dục. Vui lòng thử lại.")
        setIsLoading(false)
        return
      }

      // Load classes for this course
      const classesResponse = await getClassesByCourse(educationalUnitId, courseId)
      setClasses(classesResponse.content || [])

      // Load current visibility settings
      const visibilityData = await getQuizVisibility(courseId, quizId)
      const visibleIds = visibilityData.classVisibilities
        .filter((cv) => cv.isVisible)
        .map((cv) => cv.classId)

      setSelectedClassIds(visibleIds)
      setInitialClassIds(visibleIds)
    } catch (err) {
      console.error("Error loading quiz visibility data:", err)
      setError("Không thể tải dữ liệu. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleClass = (classId: number) => {
    setSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    )
  }

  const handleSelectAll = () => {
    setSelectedClassIds(classes.map((c) => c.id))
  }

  const handleDeselectAll = () => {
    setSelectedClassIds([])
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      await updateQuizVisibility(quizId, selectedClassIds)
      setSuccessMessage("Cập nhật thành công!")
      setInitialClassIds(selectedClassIds)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      console.error("Error updating quiz visibility:", err)
      setError("Không thể cập nhật. Vui lòng thử lại.")
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges =
    JSON.stringify([...selectedClassIds].sort((a, b) => a - b)) !==
    JSON.stringify([...initialClassIds].sort((a, b) => a - b))
  const isSaveDisabled = isSaving || !hasChanges || isLoading

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Quản Lý Hiển Thị Bài Kiểm Tra</h2>
            <p className="text-sm text-gray-500 mt-1">{quizTitle}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  Chọn các lớp học được xem bài kiểm tra này. Nếu không chọn lớp nào, mặc định tất cả lớp đều được xem.
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAll}>
                  Chọn Tất Cả
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                  Bỏ Chọn Tất Cả
                </Button>
                <div className="ml-auto text-sm text-gray-500 flex items-center">
                  Đã chọn: {selectedClassIds.length}/{classes.length}
                </div>
              </div>

              {classes.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500">Khóa học chưa có lớp học nào.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {classes.map((courseClass) => {
                    const isSelected = selectedClassIds.includes(courseClass.id)
                    return (
                      <div
                        key={courseClass.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${isSelected
                            ? "border-purple-500 bg-purple-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        onClick={() => handleToggleClass(courseClass.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-5 w-5 rounded border-2 flex items-center justify-center ${isSelected
                                  ? "border-purple-600 bg-purple-600"
                                  : "border-gray-300"
                                }`}
                            >
                              {isSelected && (
                                <svg
                                  className="h-3 w-3 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{courseClass.className}</p>
                              <p className="text-xs text-gray-500">
                                {courseClass.currentStudents || 0} học viên
                              </p>
                            </div>
                          </div>
                          {isSelected ? (
                            <Eye className="h-5 w-5 text-purple-600" />
                          ) : (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaveDisabled}
            variant="default"
            className="disabled:!opacity-100"
            style={
              isSaveDisabled
                ? {
                    backgroundColor: "hsl(var(--muted))",
                    color: "hsl(var(--foreground))",
                    border: "1px solid hsl(var(--border))",
                  }
                : {
                    backgroundColor: "var(--bs-primary)",
                    color: "var(--bs-white)",
                  }
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Lưu Thay Đổi"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default QuizVisibilityModal