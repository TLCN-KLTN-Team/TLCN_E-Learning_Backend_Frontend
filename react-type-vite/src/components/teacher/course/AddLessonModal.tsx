"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/modal"
import { AlertCircle, Loader2, Save } from "lucide-react"
import FileUpload from "./FileUpload"
import type { LessonRequest } from "@/services/api/request/lessonRequest"
import type { SectionRequest } from "@/services/api/request/sectionRequest"
import { getNextLessonNumberItem } from "@/utils/orderIndexUtils"
import { validateLesson, type ValidationError } from "@/utils/validationUtils"

const AddLessonModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onAddLesson: (data: Omit<LessonRequest, "id">) => void
  sectionId: number
  courseId: number
  existingSection: SectionRequest
}> = ({ isOpen, onClose, onAddLesson, existingSection }) => {
  const [formData, setFormData] = useState<Omit<LessonRequest, "id" | "sectionId">>({
    title: "",
    description: "",
    content: "",
    videoUrl: "",
    isFreeLesson: false,
    isPublished: false,
    attachments: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }))
    setErrors((prev) => prev.filter((err) => err.field !== name))
  }

  const handleFilesChange = (files: string[]) => {
    setFormData((prev) => ({
      ...prev,
      attachments: files,
    }))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const validationErrors = validateLesson(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      const existingLessons = existingSection.lessons || []
      const nextNumberItem = getNextLessonNumberItem(existingLessons)

      const newLesson: LessonRequest = {
        title: formData.title,
        description: formData.description,
        content: formData.content,
        videoUrl: formData.videoUrl,
        isFreeLesson: false,
        isPublished: false,
        attachments: formData.attachments,
        numberItem: nextNumberItem,
      }

      onAddLesson(newLesson)

      // Reset form
      setFormData({
        title: "",
        description: "",
        content: "",
        videoUrl: "",
        isFreeLesson: false,
        isPublished: false,
        attachments: [],
      })

      onClose()
    } catch (err) {
      console.error("Lỗi khi tạo bài học:", err)
      setErrors([{ field: "general", message: "Không thể tạo bài học. Vui lòng thử lại." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Tạo Bài Học Mới</h2>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-2">
              {errors.map((error, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error.message}</p>
                </div>
              ))}
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Tiêu Đề Bài Học
            </label>
            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Giới thiệu về React Components"
              required
              autoFocus
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.some((e) => e.field === "title") ? "border-red-500 focus:border-red-500": "border-gray-300 focus:border-blue-500" }`}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Mô Tả Bài Học
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn gọn về những gì học viên sẽ học được"
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-1">
              Nội Dung Bài Học
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Nhập nội dung bài học (hỗ trợ định dạng Markdown)"
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              rows={6}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium mb-1">
              URL Video (Tùy chọn)
            </label>
            <input
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="VD: https://www.youtube.com/watch?v=..."
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.some((e) => e.field === "videoUrl") ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
            />
          </div>

          {/* File Upload Section */}
          <FileUpload
            files={formData.attachments || []}
            onFilesChange={handleFilesChange}
            title="Tài Liệu Đính Kèm"
            description="Tải lên tài liệu hỗ trợ cho bài học này"
            acceptedTypes={[
              ".pdf",
              ".doc",
              ".docx",
              ".ppt",
              ".pptx",
              ".txt",
              ".jpg",
              ".jpeg",
              ".png",
              ".mp4",
              ".mov",
              ".zip",
            ]}
            maxFileSize={100}
            maxFiles={10}
          />

          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-700">
              💡 <strong>Mẹo:</strong> Bài học sẽ được thêm vào cuối phần này. Bạn có thể kéo và thả để sắp xếp lại 
              bài học sau. Tất cả thay đổi sẽ được lưu khi bạn nhấn "Lưu & Xuất Bản".
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu Bài Học
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AddLessonModal