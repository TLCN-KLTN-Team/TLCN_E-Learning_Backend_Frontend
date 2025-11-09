"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/modal"
import FileUpload from "./FileUpload"
import { Paperclip, Trash, ExternalLink, Loader2, Save } from "lucide-react"
import type { LessonRequest } from "@/services/api/request/lessonRequest"
import type { LessonResponse } from "@/services/api/response/lessonResponse"

const EditLessonModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onUpdate: (data: LessonResponse) => void
  lesson: LessonResponse | null
  sectionId: number
  courseId: number
}> = ({ isOpen, onClose, onUpdate, lesson }) => {
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

  // Quản lý files: Tách riêng files cũ (từ server) và files mới (blob URLs)
  const [existingServerFiles, setExistingServerFiles] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<string[]>([])

  useEffect(() => {
    if (lesson && isOpen) {
      setFormData({
        title: lesson.title,
        description: lesson.description || "",
        content: lesson.content || "",
        videoUrl: lesson.videoUrl || "",
        isPublished: false,
        isFreeLesson: false,
        attachments: lesson.attachments || [],
      })

      // Phân loại files: server URLs vs blob URLs
      const serverFiles: string[] = []
      const blobFiles: string[] = []

      ;(lesson.attachments || []).forEach((file) => {
        if (isServerFile(file)) {
          serverFiles.push(file)
        } else {
          blobFiles.push(file)
        }
      })

      setExistingServerFiles(serverFiles)
      setNewFiles(blobFiles)
    }
  }, [lesson, isOpen])

  // Helper: Kiểm tra xem có phải file từ server không
  const isServerFile = (fileUrl: string): boolean => {
    if (!fileUrl || typeof fileUrl !== "string") return false
    
    // Check nếu là HTTP/HTTPS URL
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      return true
    }
    
    // Check nếu là JSON metadata có URL từ server
    if (fileUrl.trim().startsWith("{")) {
      try {
        const meta = JSON.parse(fileUrl)
        if (meta.url && (meta.url.startsWith("http://") || meta.url.startsWith("https://"))) {
          return true
        }
      } catch {
        // Ignore parse error
      }
    }
    
    return false
  }

  // Helper: Lấy tên file
  const getFileName = (fileData: string): string => {
    try {
      const metadata = JSON.parse(fileData)
      return metadata.name || metadata.originalFilename || "Tệp không xác định"
    } catch {
      // Fallback: lấy từ URL
      const urlParts = fileData.split("/")
      const lastPart = urlParts[urlParts.length - 1]
      // Decode URI component để hiển thị tên file đúng
      return decodeURIComponent(lastPart.split("?")[0]) || "Tệp không xác định"
    }
  }

  // Helper: Lấy URL thực để xem/download
  const getFileUrl = (fileData: string): string => {
    try {
      const metadata = JSON.parse(fileData)
      return metadata.url || fileData
    } catch {
      return fileData
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  // Xử lý khi thêm files mới
  const handleFilesChange = (files: string[]) => {
    setNewFiles((prev) => [...prev, ...files])
    
    // Cập nhật formData
    const allFiles = [...existingServerFiles, ...newFiles, ...files]
    setFormData((prev) => ({
      ...prev,
      attachments: allFiles,
    }))
  }

  // Xóa file cũ từ server
  const handleRemoveServerFile = (fileToRemove: string) => {
    const updatedServerFiles = existingServerFiles.filter((file) => file !== fileToRemove)
    setExistingServerFiles(updatedServerFiles)
    
    // Cập nhật formData
    const allFiles = [...updatedServerFiles, ...newFiles]
    setFormData((prev) => ({
      ...prev,
      attachments: allFiles,
    }))
  }

  // Xóa file mới (blob)
  const handleRemoveNewFile = (fileToRemove: string) => {
    const updatedNewFiles = newFiles.filter((file) => file !== fileToRemove)
    setNewFiles(updatedNewFiles)
    
    // Cập nhật formData
    const allFiles = [...existingServerFiles, ...updatedNewFiles]
    setFormData((prev) => ({
      ...prev,
      attachments: allFiles,
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
      // Merge tất cả files
      const allAttachments = [...existingServerFiles, ...newFiles]
      
      onUpdate({
        ...lesson,
        title: formData.title,
        description: formData.description ?? "",
        content: formData.content ?? "",
        videoUrl: formData.videoUrl ?? "",
        isFreeLesson: false,
        isPublished: false,
        attachments: allAttachments,
      })
      onClose()
    } catch (err) {
      console.error("Lỗi khi cập nhật bài học:", err)
      setError("Không thể cập nhật bài học. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  // Reset form khi đóng modal
  const handleClose = () => {
    setExistingServerFiles([])
    setNewFiles([])
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-4xl">
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
              Tiêu Đề Bài Học <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
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
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
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
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              value={formData.videoUrl}
              onChange={handleChange}
              placeholder="VD: https://www.youtube.com/watch?v=..."
              disabled={isLoading}
            />
          </div>

          {/* Tài liệu đã upload (từ server) */}
          {existingServerFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Tài Liệu Đã Upload ({existingServerFiles.length})
              </label>
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                {existingServerFiles.map((file, idx) => (
                  <div
                    key={`server-${idx}`}
                    className="flex items-center justify-between p-2 bg-white rounded border hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">
                        {getFileName(file)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => window.open(getFileUrl(file), "_blank")}
                        title="Xem file"
                        disabled={isLoading}
                      >
                        <ExternalLink className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveServerFile(file)}
                        title="Xóa file"
                        disabled={isLoading}
                      >
                        <Trash className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files mới thêm (blob URLs) */}
          {newFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Tài Liệu Mới Thêm ({newFiles.length})
              </label>
              <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                {newFiles.map((file, idx) => (
                  <div
                    key={`new-${idx}`}
                    className="flex items-center justify-between p-2 bg-white rounded border hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">
                        {getFileName(file)}
                      </span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">
                        Mới
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleRemoveNewFile(file)}
                      title="Xóa file"
                      disabled={isLoading}
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Component upload files mới */}
          <div className="border-t pt-4">
            <FileUpload
              files={[]}
              onFilesChange={handleFilesChange}
              title="Thêm Tài Liệu Mới"
              description="Tải lên thêm tài liệu hỗ trợ cho bài học này"
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
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Tổng tài liệu:</span>{" "}
            {existingServerFiles.length + newFiles.length}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang Cập Nhật...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Cập Nhật Bài Học
              </>
            )}
          </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default EditLessonModal