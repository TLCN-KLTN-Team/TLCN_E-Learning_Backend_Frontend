"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/modal"
import { AlertCircle, Loader2, Save } from "lucide-react"
import type { SectionRequest } from "@/services/api/request/sectionRequest"
import { getNextSectionOrderIndex } from "@/utils/orderIndexUtils"
import { validateSection, type ValidationError } from "@/utils/validationUtils"

const AddSectionModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onAddSection: (data: Omit<SectionRequest, "id">) => void
  courseId: string
  sections?: any[]
}> = ({ isOpen, onClose, onAddSection, sections = [] }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setErrors((prev) => prev.filter((err) => err.field !== name))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationErrors = validateSection(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      const nextOrderIndex = getNextSectionOrderIndex(sections)

      onAddSection({
        title: formData.title,
        description: formData.description,
        orderIndex: nextOrderIndex,
        isPublished: false,
      })

      setFormData({ title: "", description: "" })
      onClose()
    } catch (err) {
      console.error("Lỗi khi tạo phần:", err)
      setErrors([{ field: "general", message: "Không thể tạo phần. Vui lòng thử lại." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Tạo Phần Mới</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
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
              Tiêu Đề Phần
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="VD: Giới thiệu về React Cơ Bản"
              required
              autoFocus
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-lg transition-colors ${
                errors.some((e) => e.field === "title")
                  ? "border-red-500 focus:border-red-500"
                  : "border-gray-300 focus:border-blue-500"
              }`}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-1">
              Mô Tả (Tùy chọn)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Mô tả ngắn gọn về nội dung phần này..."
              className="w-full px-3 py-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              💡 <strong>Mẹo:</strong> Phần này sẽ tự động được đặt ở cuối. Bạn có thể kéo và thả để
              sắp xếp lại các phần sau. Tất cả thay đổi sẽ được lưu khi bạn nhấn "Lưu & Xuất Bản".
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
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
                Lưu Phần Học
              </>
            )}
          </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default AddSectionModal