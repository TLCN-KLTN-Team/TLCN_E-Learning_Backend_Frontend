"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/modal"
import FileUpload from "./FileUpload"
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

  useEffect(() => {
    if (assignment) {
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
    }
  }, [assignment, isOpen])

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

  const handleAssignmentFilesChange = (files: string[]) => {
    setFormData((prev) => ({
      ...prev,
      assignmentFiles: files,
    }))
  }

  const handleRubricFilesChange = (files: string[]) => {
    setFormData((prev) => ({
      ...prev,
      rubricFiles: files,
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
      onUpdate({
        ...assignment,
        title: formData.title,
        description: formData.description ?? "",
        deadline: formData.deadline,
        submissionType: formData.submissionType,
        assignmentFiles: formData.assignmentFiles ?? [],
        rubricFiles: formData.rubricFiles ?? [],
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

  const deadlineDate = formData.deadline instanceof Date ? formData.deadline : new Date(formData.deadline)
  const deadlineString = deadlineDate.toISOString().split("T")[0]

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
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
              Tiêu Đề Bài Tập
            </label>
            <Input
              id="title"
              name="title"
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
              className="w-full p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium mb-1">
                Hạn Chót
              </label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
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
            <Input
              id="maxScore"
              name="maxScore"
              type="number"
              value={formData.maxScore || ""}
              onChange={handleChange}
              placeholder="100"
              disabled={isLoading}
              min="0"
            />
          </div>

          <FileUpload
            files={formData.assignmentFiles || []}
            onFilesChange={handleAssignmentFilesChange}
            title="Tệp Đề Bài"
            description="Tải lên tệp đề bài cho học viên"
            acceptedTypes={[".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".jpg", ".jpeg", ".png", ".zip"]}
            maxFileSize={100}
            maxFiles={10}
          />

          <FileUpload
            files={formData.rubricFiles || []}
            onFilesChange={handleRubricFilesChange}
            title="Tiêu Chí Chấm Điểm (Rubric)"
            description="Tải lên tệp tiêu chí chấm điểm (tùy chọn)"
            acceptedTypes={[".pdf", ".doc", ".docx", ".xlsx", ".xls"]}
            maxFileSize={50}
            maxFiles={5}
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
              Xuất bản bài tập này
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Đang cập nhật..." : "Cập Nhật Bài Tập"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EditAssignmentModal
