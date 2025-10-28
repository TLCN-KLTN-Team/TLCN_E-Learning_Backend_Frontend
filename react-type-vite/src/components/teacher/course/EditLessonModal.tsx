"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/modal"
import FileUpload from "./FileUpload"
import type { LessonRequest } from "@/services/api/request/lessonRequest"
import type { LessonResponse } from "@/services/api/response/lessonResponse"

const EditLessonModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onUpdate: (data: LessonResponse) => void
  lesson: LessonResponse | null
  sectionId: number
  courseId: number
}> = ({ isOpen, onClose, onUpdate, lesson}) => {
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        description: lesson.description || "",
        content: lesson.content || "",
        videoUrl: lesson.videoUrl || "",
        isPublished: lesson.isPublished || false,
        isFreeLesson: false,
        attachments: lesson.attachments || [],
      })
    }
  }, [lesson, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleFilesChange = (files: string[]) => {
    setFormData((prev) => ({
      ...prev,
      attachments: files,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) {
      setError("Tiêu đề bài học là bắt buộc")
      return
    }

    if (!lesson) return

    setIsLoading(true)
    setError(null)

    try {
      onUpdate({
        ...lesson,
        title: formData.title,
        description: formData.description ?? "",
        content: formData.content ?? "",
        videoUrl: formData.videoUrl ?? "",
        isFreeLesson: false,
        isPublished: formData.isPublished ?? false,
        attachments: formData.attachments ?? [],
      })
      onClose()
    } catch (err) {
      console.error("Lỗi khi cập nhật bài học:", err)
      setError("Không thể cập nhật bài học. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Chỉnh Sửa Bài Học</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Tiêu Đề Bài Học
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Giới thiệu về React Components"
              required
              disabled={isLoading}
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
              className="w-full p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              rows={2}
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
              className="w-full p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              rows={6}
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="videoUrl" className="block text-sm font-medium mb-1">
              URL Video (Tùy chọn)
            </label>
            <Input
              id="videoUrl"
              name="videoUrl"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="VD: https://www.youtube.com/watch?v=..."
              disabled={isLoading}
            />
          </div>

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublished"
              id="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="h-4 w-4"
              disabled={isLoading}
            />
            <label htmlFor="isPublished" className="text-sm">
              Xuất bản bài học này
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Đang cập nhật..." : "Cập Nhật Bài Học"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EditLessonModal