"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/modal"
import { AlertCircle, Loader2, Save } from "lucide-react"
import FileUpload from "./FileUpload"
import type { SectionRequest } from "@/services/api/request/sectionRequest"
import { getNextAssignmentNumberItem } from "@/utils/orderIndexUtils"
import { validateAssignment, type ValidationError } from "@/utils/validationUtils"
import type { AssignmentRequest } from "@/services/api/request/assignmentRequest"

const AddAssignmentModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onAddAssignment: (data: Omit<AssignmentRequest, "id">) => void
  sectionId: number
  courseId: number
  existingSection: SectionRequest
}> = ({ isOpen, onClose, onAddAssignment, existingSection }) => {
  const [formData, setFormData] = useState<Omit<AssignmentRequest, "id" | "sectionId">>({
    title: "",
    description: "",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
    submissionType: "UPLOAD_FILE",
    assignmentFiles: [],
    rubricFiles: [],
    maxScore: 100,
    isPublished: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])

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
    setErrors((prev) => prev.filter((err) => err.field !== name))
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    const validationErrors = validateAssignment(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      const existingAssignments = (existingSection.assignments || []) as any[]
      const nextNumberItem = getNextAssignmentNumberItem(existingAssignments)

      const newAssignment: AssignmentRequest = {
        sectionId: existingSection.id || 0,
        title: formData.title,
        description: formData.description,
        deadline: formData.deadline,
        submissionType: formData.submissionType,
        assignmentFiles: formData.assignmentFiles,
        rubricFiles: formData.rubricFiles,
        maxScore: formData.maxScore,
        numberItem: nextNumberItem,
        isPublished: false,
      }

      onAddAssignment(newAssignment)

      // Reset form
      setFormData({
        title: "",
        description: "",
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        submissionType: "UPLOAD_FILE",
        assignmentFiles: [],
        rubricFiles: [],
        maxScore: 100,
        isPublished: false,
      })

      onClose()
    } catch (err) {
      console.error("Lỗi khi tạo bài tập:", err)
      setErrors([{ field: "general", message: "Không thể tạo bài tập. Vui lòng thử lại." }])
    } finally {
      setIsLoading(false)
    }
  }

  const deadlineDate = formData.deadline instanceof Date ? formData.deadline : new Date(formData.deadline)
  const deadlineString = deadlineDate.toISOString().split("T")[0]

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Tạo Bài Tập Mới</h2>
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
              Tiêu Đề Bài Tập
            </label>
            <input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Xây dựng ứng dụng React Todo"
              required
              autoFocus
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.some((e) => e.field === "title") ? "border-red-500 focus:border-red-500" : "border-gray-300 focus:border-blue-500"}`}
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
                Hạn Chót
              </label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                value={deadlineString}
                onChange={handleChange}
                required
                disabled={isLoading}
                className={`w-full px-3 py-2 border rounded-lg transition-colors ${errors.some((e) => e.field === "deadline") ? "border-red-500 focus:border-red-500"  : "border-gray-300 focus:border-blue-500"}`}
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
               className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
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

          {/* Assignment Files Upload */}
          <FileUpload
            files={formData.assignmentFiles || []}
            onFilesChange={handleAssignmentFilesChange}
            title="Tệp Đề Bài"
            description="Tải lên tệp đề bài cho học viên"
            acceptedTypes={[".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".jpg", ".jpeg", ".png", ".zip"]}
            maxFileSize={100}
            maxFiles={10}
          />

          {/* Rubric Files Upload */}
          <FileUpload
            files={formData.rubricFiles || []}
            onFilesChange={handleRubricFilesChange}
            title="Tiêu Chí Chấm Điểm (Rubric)"
            description="Tải lên tệp tiêu chí chấm điểm (tùy chọn)"
            acceptedTypes={[".pdf", ".doc", ".docx", ".xlsx", ".xls"]}
            maxFileSize={50}
            maxFiles={5}
          />
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-700">
              💡 <strong>Mẹo:</strong> Bài tập sẽ được thêm vào cuối phần này. Bạn có thể kéo và thả để sắp xếp lại bài
              tập sau. Tất cả thay đổi sẽ được lưu khi bạn nhấn "Lưu & Xuất Bản".
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
                Lưu Bài Tập
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AddAssignmentModal
