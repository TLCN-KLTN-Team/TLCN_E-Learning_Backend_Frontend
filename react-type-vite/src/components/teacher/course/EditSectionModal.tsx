"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Modal from "@/components/ui/modal"
import type { SectionResponse } from "@/services/api/response/sectionResponse"
import { Loader2, Save } from "lucide-react"

const EditSectionModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onUpdate: (data: SectionResponse) => void
  section: SectionResponse | null
  courseId: number
}> = ({ isOpen, onClose, onUpdate, section}) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isPublished: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title,
        description: section.description || "",
        isPublished: false,
      })
    }
  }, [section, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const isCheckbox = type === "checkbox"
    setFormData((prev) => ({
      ...prev,
      [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError("Tiêu đề phần là bắt buộc")
      return
    }

    if (!section) return

    setIsLoading(true)
    setError(null)

    try {
      onUpdate({
        ...section,
        title: formData.title,
        description: formData.description,
        isPublished: false,
      })
      onClose()
    } catch (err) {
      console.error("Lỗi khi cập nhật phần:", err)
      setError("Không thể cập nhật phần. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Chỉnh Sửa Phần</h2>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
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
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              required
              disabled={isLoading}
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
              className="w-full p-2 border rounded-lg transition-colors 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'"
              rows={3}
              disabled={isLoading}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>
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
                Cập Nhật Phần Học
              </>
            )}
          </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default EditSectionModal