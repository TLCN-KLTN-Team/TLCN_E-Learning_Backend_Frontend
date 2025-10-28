"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { PlusCircle, Save, Loader2, AlertCircle, CheckCircle } from "lucide-react"
import AddSectionModal from "./AddSectionModal"
import SectionItem from "./SectionItem"
import { createOrUpdateSections } from "@/services/api/teacher/sectionApi"
import { convertSectionResponseToRequest } from "@/utils/converters"
import type { SectionResponse } from "@/services/api/response/sectionResponse"
import { getNextSectionOrderIndex } from "@/utils/orderIndexUtils"
import { clearAutoSave, saveToLocalStorage } from "@/utils/autoSaveUtils"

interface CourseBuilderProps {
  courseId: string
  sections: SectionResponse[]
  onSectionsChange: (sections: SectionResponse[]) => void
  onBack: () => void
}

const CourseBuilder: React.FC<CourseBuilderProps> = ({ courseId, sections, onSectionsChange, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (sections.length > 0) {
        saveToLocalStorage(courseId, sections)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [sections, courseId])

  const handleAddSection = (sectionData: any) => {
    const nextOrderIndex = getNextSectionOrderIndex(sections)

    const newSection: SectionResponse = {
      id: Date.now(), // Temporary ID, will be replaced by API
      courseId: Number.parseInt(courseId),
      courseName: "",
      title: sectionData.title,
      description: sectionData.description,
      orderIndex: nextOrderIndex,
      isPublished: false,
      createdAt: new Date(),
      updateAt: new Date(),
      lessons: new Set(),
      quizs: new Set(),
      assignments: new Set(),
    }

    const updatedSections = [...sections, newSection]
    onSectionsChange(updatedSections)
    setHasUnsavedChanges(true)
    setError(null)
  }

  const handleUpdateSection = (updatedSection: SectionResponse) => {
    const updatedSections = sections.map((s) => (s.id === updatedSection.id ? updatedSection : s))
    onSectionsChange(updatedSections)
    setHasUnsavedChanges(true)
    setError(null)
  }

  const handleDeleteSection = (sectionId: number) => {
    if (!sectionId) return

    if (
      window.confirm("Bạn có chắc chắn muốn xóa section này? Tất cả bài học và bài kiểm tra bên trong cũng sẽ bị xóa.")
    ) {
      onSectionsChange(sections.filter((s) => s.id !== sectionId))
      setHasUnsavedChanges(true)
      setError(null)
    }
  }

  // Handler for drag & drop reordering of sections
  const handleSectionReorder = (fromIndex: number, toIndex: number) => {
    const sortedSections = [...sections].sort((a, b) => a.orderIndex - b.orderIndex)

    // Get the actual sections at fromIndex and toIndex in the sorted array
    const fromSection = sortedSections[fromIndex]
    const toSection = sortedSections[toIndex]

    if (!fromSection || !toSection) return

    // Swap only the orderIndex of these two sections
    const updatedSections = sections.map((section) => {
      if (section.id === fromSection.id) {
        return { ...section, orderIndex: toSection.orderIndex }
      } else if (section.id === toSection.id) {
        return { ...section, orderIndex: fromSection.orderIndex }
      }
      return section
    })

    onSectionsChange(updatedSections)
    setHasUnsavedChanges(true)
    setError(null)
  }

  const handleSaveCourse = async () => {
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      if (sections.length === 0) {
        setError("Khóa học phải có ít nhất một section")
        setIsSaving(false)
        return
      }

      // Convert all sections to request format
      const sectionsToSave = sections.map(convertSectionResponseToRequest)

      console.log("Saving course structure:", {
        courseId,
        totalSections: sectionsToSave.length,
        sections: sectionsToSave,
      })

      // Call API to save all sections with nested content
      const response = await createOrUpdateSections({
        courseId: Number.parseInt(courseId),
        sections: sectionsToSave,
      })

      console.log("Course structure saved successfully:", {
        courseId,
        totalSections: response.length,
        totalLessons: response.reduce((sum, s) => sum + (s.lessons?.size || 0), 0),
        totalQuizzes: response.reduce((sum, s) => sum + (s.quizs?.size || 0), 0),
        sections: response,
      })

      onSectionsChange(response)
      setHasUnsavedChanges(false)
      clearAutoSave()

      setSuccessMessage("Khóa học đã được lưu thành công!")
      setTimeout(() => setSuccessMessage(null), 5000)
    } catch (err) {
      console.error("[v0] Error saving course:", err)
      const errorMessage = err instanceof Error ? err.message : "Không thể lưu khóa học. Vui lòng thử lại."
      setError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Sort sections by orderIndex
  const sortedSections = [...sections].sort((a, b) => a.orderIndex - b.orderIndex)

  // Calculate statistics
  const totalLessons = sections.reduce((sum, s) => sum + (s.lessons?.size || 0), 0)
  const totalQuizzes = sections.reduce((sum, s) => sum + (s.quizs?.size || 0), 0)
  const publishedSections = sections.filter((s) => s.isPublished).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Bước 2: Xây Dựng Khóa Học</h2>
          <p className="text-muted-foreground">
            Cấu trúc nội dung khóa học bằng cách thêm các section, bài học và bài kiểm tra.
          </p>
          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="text-blue-600">💡 Kéo các section để sắp xếp lại</span>
            <span className="text-gray-500">
              {sections.length} sections
            </span>
            <span className="text-green-600">{publishedSections} đã xuất bản</span>
            {hasUnsavedChanges && <span className="text-orange-600 font-medium">● Có thay đổi chưa lưu</span>}
          </div>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <PlusCircle className="mr-2 h-4 w-4" /> Thêm Section
        </Button>
      </div>

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

      <div className="space-y-4">
        {sortedSections.length > 0 ? (
          sortedSections.map((section, index) => (
            <SectionItem
              key={section.id}
              section={section}
              index={index}
              courseId={courseId}
              onUpdate={handleUpdateSection}
              onDelete={handleDeleteSection}
              onReorder={handleSectionReorder}
            />
          ))
        ) : (
          <div className="text-center py-12 border-dashed border-2 rounded-lg bg-card">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium mb-2">Khóa học của bạn chưa có nội dung.</h3>
              <p className="text-muted-foreground mb-4">
                Thêm section đầu tiên để bắt đầu xây dựng khóa học. Mỗi section có thể chứa nhiều bài học và bài kiểm
                tra.
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm Section Đầu Tiên
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddSectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddSection={handleAddSection}
        courseId={courseId}
        sections={sections}
      />

      <div className="flex justify-between mt-8 pt-6 border-t">
        <Button variant="outline" onClick={onBack}>
          Quay Lại Thông Tin Khóa Học
        </Button>
        <Button size="lg" onClick={handleSaveCourse} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu & Xuất Bản
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

export default CourseBuilder
