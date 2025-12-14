"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import FileUpload from "./FileUpload"
import { Paperclip, Trash, ExternalLink, Loader2, Save } from "lucide-react"
import type { AssignmentResponse } from "@/services/api/response/assignmentResponse"
import type { AssignmentRequest } from "@/services/api/request/assignmentRequest"

const EditAssignmentModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onUpdate: (data: AssignmentResponse) => void
  assignment: AssignmentResponse | null
  sectionId: number
  courseId: number
}> = ({ isOpen, onClose, onUpdate, assignment }) => {
  const [formData, setFormData] = useState<Omit<AssignmentRequest, "id" | "sectionId">>({
    title: "",
    description: "",
    deadline: new Date(),
    submissionType: "UPLOAD_FILE",
    assignmentFiles: [],
    rubricFiles: [],
    maxScore: 100,
    isPublished: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Quản lý Assignment Files
  const [existingAssignmentFiles, setExistingAssignmentFiles] = useState<string[]>([])
  const [newAssignmentFiles, setNewAssignmentFiles] = useState<string[]>([])

  // Quản lý Rubric Files
  const [existingRubricFiles, setExistingRubricFiles] = useState<string[]>([])
  const [newRubricFiles, setNewRubricFiles] = useState<string[]>([])

  useEffect(() => {
    if (assignment && isOpen) {
      setFormData({
        title: assignment.title,
        description: assignment.description || "",
        deadline: assignment.deadline instanceof Date ? assignment.deadline : new Date(assignment.deadline),
        submissionType: assignment.submissionType,
        assignmentFiles: assignment.assignmentFiles || [],
        rubricFiles: assignment.rubricFiles || [],
        maxScore: assignment.maxScore || 100,
        isPublished: assignment.isPublished || false,
      })

      // Phân loại Assignment Files
      const serverAssignmentFiles: string[] = []
      const blobAssignmentFiles: string[] = []
      ;(assignment.assignmentFiles || []).forEach((file) => {
        if (isServerFile(file)) {
          serverAssignmentFiles.push(file)
        } else {
          blobAssignmentFiles.push(file)
        }
      })
      setExistingAssignmentFiles(serverAssignmentFiles)
      setNewAssignmentFiles(blobAssignmentFiles)

      // Phân loại Rubric Files
      const serverRubricFiles: string[] = []
      const blobRubricFiles: string[] = []
      ;(assignment.rubricFiles || []).forEach((file) => {
        if (isServerFile(file)) {
          serverRubricFiles.push(file)
        } else {
          blobRubricFiles.push(file)
        }
      })
      setExistingRubricFiles(serverRubricFiles)
      setNewRubricFiles(blobRubricFiles)
    }
  }, [assignment, isOpen])

  // Helper: Kiểm tra file từ server
  const isServerFile = (fileUrl: string): boolean => {
    if (!fileUrl || typeof fileUrl !== "string") return false
    
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      return true
    }
    
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
      const urlParts = fileData.split("/")
      const lastPart = urlParts[urlParts.length - 1]
      return decodeURIComponent(lastPart.split("?")[0]) || "Tệp không xác định"
    }
  }

  // Helper: Lấy URL thực
  const getFileUrl = (fileData: string): string => {
    try {
      const metadata = JSON.parse(fileData)
      return metadata.url || fileData
    } catch {
      return fileData
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"

    let newValue: any = value
    if (name === "deadline") {
      newValue = new Date(value)
    } else if (name === "maxScore") {
      newValue = value ? Number.parseInt(value) : undefined
    } else if (isCheckbox) {
      newValue = (e.target as HTMLInputElement).checked
    }

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }))
  }

  // Xử lý Assignment Files
  const handleAssignmentFilesChange = (files: string[]) => {
    setNewAssignmentFiles((prev) => [...prev, ...files])
    
    const allFiles = [...existingAssignmentFiles, ...newAssignmentFiles, ...files]
    setFormData((prev) => ({
      ...prev,
      assignmentFiles: allFiles,
    }))
  }

  const handleRemoveServerAssignmentFile = (fileToRemove: string) => {
    const updated = existingAssignmentFiles.filter((file) => file !== fileToRemove)
    setExistingAssignmentFiles(updated)
    
    const allFiles = [...updated, ...newAssignmentFiles]
    setFormData((prev) => ({
      ...prev,
      assignmentFiles: allFiles,
    }))
  }

  const handleRemoveNewAssignmentFile = (fileToRemove: string) => {
    const updated = newAssignmentFiles.filter((file) => file !== fileToRemove)
    setNewAssignmentFiles(updated)
    
    const allFiles = [...existingAssignmentFiles, ...updated]
    setFormData((prev) => ({
      ...prev,
      assignmentFiles: allFiles,
    }))
  }

  // Xử lý Rubric Files
  const handleRubricFilesChange = (files: string[]) => {
    setNewRubricFiles((prev) => [...prev, ...files])
    
    const allFiles = [...existingRubricFiles, ...newRubricFiles, ...files]
    setFormData((prev) => ({
      ...prev,
      rubricFiles: allFiles,
    }))
  }

  const handleRemoveServerRubricFile = (fileToRemove: string) => {
    const updated = existingRubricFiles.filter((file) => file !== fileToRemove)
    setExistingRubricFiles(updated)
    
    const allFiles = [...updated, ...newRubricFiles]
    setFormData((prev) => ({
      ...prev,
      rubricFiles: allFiles,
    }))
  }

  const handleRemoveNewRubricFile = (fileToRemove: string) => {
    const updated = newRubricFiles.filter((file) => file !== fileToRemove)
    setNewRubricFiles(updated)
    
    const allFiles = [...existingRubricFiles, ...updated]
    setFormData((prev) => ({
      ...prev,
      rubricFiles: allFiles,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) {
      setError("Tiêu đề bài tập là bắt buộc")
      return
    }

    if (!assignment) return

    setIsLoading(true)
    setError(null)

    try {
      const allAssignmentFiles = [...existingAssignmentFiles, ...newAssignmentFiles]
      const allRubricFiles = [...existingRubricFiles, ...newRubricFiles]
      
      onUpdate({
        ...assignment,
        title: formData.title,
        description: formData.description ?? "",
        deadline: formData.deadline,
        submissionType: formData.submissionType,
        assignmentFiles: allAssignmentFiles,
        rubricFiles: allRubricFiles,
        maxScore: formData.maxScore ?? 100,
        isPublished: formData.isPublished ?? false,
        updateAt: new Date(),
      })
      onClose()
    } catch (err) {
      console.error("Lỗi khi cập nhật bài tập:", err)
      setError("Không thể cập nhật bài tập. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setExistingAssignmentFiles([])
    setNewAssignmentFiles([])
    setExistingRubricFiles([])
    setNewRubricFiles([])
    setError(null)
    onClose()
  }

  const deadlineDate = formData.deadline instanceof Date ? formData.deadline : new Date(formData.deadline)
  const deadlineString = deadlineDate.toISOString().split("T")[0]

  return (
    <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Chỉnh Sửa Bài Tập</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              Tiêu Đề Bài Tập <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Xây dựng ứng dụng React Todo"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Mô Tả Bài Tập
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả chi tiết về yêu cầu bài tập"
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium mb-1">
                Hạn Chót <span className="text-red-500">*</span>
              </label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
                value={deadlineString}
                onChange={handleChange}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="submissionType" className="block text-sm font-medium mb-1">
                Loại Nộp Bài
              </label>
              <select
                id="submissionType"
                name="submissionType"
                value={formData.submissionType}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="UPLOAD_FILE">Tải lên tệp</option>
                <option value="TEXT">Văn bản</option>
                <option value="LINK">Liên kết</option>
                <option value="BOTH">Tệp hoặc Văn bản</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="maxScore" className="block text-sm font-medium mb-1">
              Điểm Tối Đa
            </label>
            <input
              id="maxScore"
              name="maxScore"
              type="number"
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              value={formData.maxScore || ""}
              onChange={handleChange}
              placeholder="100"
              disabled={isLoading}
              min="0"
            />
          </div>

          {/* ASSIGNMENT FILES - Files đã upload */}
          {existingAssignmentFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Tệp Đề Bài Đã Upload ({existingAssignmentFiles.length})
              </label>
              <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                {existingAssignmentFiles.map((file, idx) => (
                  <div
                    key={`assignment-server-${idx}`}
                    className="flex items-center justify-between p-2 bg-white rounded border hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{getFileName(file)}</span>
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
                        onClick={() => handleRemoveServerAssignmentFile(file)}
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

          {/* ASSIGNMENT FILES - Files mới */}
          {newAssignmentFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Tệp Đề Bài Mới Thêm ({newAssignmentFiles.length})
              </label>
              <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                {newAssignmentFiles.map((file, idx) => (
                  <div
                    key={`assignment-new-${idx}`}
                    className="flex items-center justify-between p-2 bg-white rounded border hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{getFileName(file)}</span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Mới</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleRemoveNewAssignmentFile(file)}
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

          {/* Upload Assignment Files mới */}
          <div className="border-t pt-4">
            <FileUpload
              files={[]}
              onFilesChange={handleAssignmentFilesChange}
              title="Thêm Tệp Đề Bài Mới"
              description="Tải lên tệp đề bài cho học viên"
              acceptedTypes={[".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".jpg", ".jpeg", ".png", ".zip"]}
              maxFileSize={100}
              maxFiles={10}
            />
          </div>

          {/* RUBRIC FILES - Files đã upload */}
          {existingRubricFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Tiêu Chí Chấm Điểm Đã Upload ({existingRubricFiles.length})
              </label>
              <div className="space-y-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                {existingRubricFiles.map((file, idx) => (
                  <div
                    key={`rubric-server-${idx}`}
                    className="flex items-center justify-between p-2 bg-white rounded border hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{getFileName(file)}</span>
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
                        <ExternalLink className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleRemoveServerRubricFile(file)}
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

          {/* RUBRIC FILES - Files mới */}
          {newRubricFiles.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Tiêu Chí Chấm Điểm Mới Thêm ({newRubricFiles.length})
              </label>
              <div className="space-y-2 p-3 bg-green-50 rounded-lg border border-green-200">
                {newRubricFiles.map((file, idx) => (
                  <div
                    key={`rubric-new-${idx}`}
                    className="flex items-center justify-between p-2 bg-white rounded border hover:border-green-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate">{getFileName(file)}</span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded">Mới</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => handleRemoveNewRubricFile(file)}
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

          {/* Upload Rubric Files mới */}
          <div className="border-t pt-4">
            <FileUpload
              files={[]}
              onFilesChange={handleRubricFilesChange}
              title="Thêm Tiêu Chí Chấm Điểm Mới"
              description="Tải lên tệp tiêu chí chấm điểm (tùy chọn)"
              acceptedTypes={[".pdf", ".doc", ".docx", ".xlsx", ".xls"]}
              maxFileSize={50}
              maxFiles={5}
            />
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Tổng tài liệu:</span>{" "}
            {existingAssignmentFiles.length + newAssignmentFiles.length + existingRubricFiles.length + newRubricFiles.length}
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
                Cập Nhật Bài Tập
              </>
            )}
          </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default EditAssignmentModal