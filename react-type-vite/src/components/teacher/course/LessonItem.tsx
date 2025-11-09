"use client"

import type React from "react"
import { useState } from "react"
import { GripVertical, FileVideo, Star, Edit, Trash, Paperclip, Clock, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { LessonResponse } from "@/services/api/response/lessonResponse"
import LessonVisibilityModal from "./LessonVisibilityModal"

interface LessonItemProps {
  lesson: LessonResponse
  index: number
  courseId: string
  educationalUnitId: string
  onUpdate: (lesson: LessonResponse) => void
  onDelete: (lessonId: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onEdit: (lesson: LessonResponse) => void
}

const LessonItem: React.FC<LessonItemProps> = ({ 
  lesson, 
  index, 
  courseId,
  educationalUnitId,
  onDelete, 
  onReorder, 
  onEdit 
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisibilityModalOpen, setIsVisibilityModalOpen] = useState(false)

  const getFileName = (fileData: string): string => {
    try {
      const metadata = JSON.parse(fileData)
      return metadata.name || "Tệp không xác định"
    } catch {
      // Fallback for old format or plain URLs
      return fileData.split("/").pop() || "Tệp không xác định"
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", index.toString())
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const fromIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
    const toIndex = index

    console.log("LessonItem handleDrop - từ vị trí:", fromIndex, "đến vị trí:", toIndex)

    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex)
    }
    setDraggedIndex(null)
  }

  const isDragging = draggedIndex === index
  const isDragOver = draggedIndex !== null && draggedIndex !== index

  return (
    <>
      <div
        className={`border rounded-lg transition-all ${
          isDragging ? "opacity-50" : ""
        } ${isDragOver ? "border-2 border-blue-300 bg-blue-50" : "border-gray-200"}`}
      >
        <div
          className={`flex items-center justify-between p-3 cursor-pointer ${!isDragging ? "hover:bg-gray-50" : ""}`}
          draggable
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 flex-1">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" onClick={(e) => e.stopPropagation()} />
            <span className="text-sm text-gray-500 min-w-[30px]">#{lesson.numberItem}</span>
            <FileVideo className="h-5 w-5 text-blue-500" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{lesson.title}</span>
              </div>
              {lesson.description && !isExpanded && (
                <p className="text-sm text-gray-500 line-clamp-1">{lesson.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setIsVisibilityModalOpen(true)}
              title="Quản lý hiển thị cho các lớp"
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(lesson)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(lesson.id)}>
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Chi Tiết Mở Rộng */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-2 border-t bg-gray-50/50 space-y-3">
            {lesson.description && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Mô tả:</p>
                <p className="text-sm text-gray-600">{lesson.description}</p>
              </div>
            )}

            {lesson.videoUrl && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">URL Video:</p>
                <a
                  href={lesson.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FileVideo className="h-3 w-3" />
                  {lesson.videoUrl}
                </a>
              </div>
            )}

            {lesson.attachments && lesson.attachments.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">
                  <Paperclip className="h-3 w-3 inline mr-1" />
                  Tài liệu đính kèm ({lesson.attachments.length}):
                </p>
                <ul className="space-y-1">
                  {lesson.attachments.map((attachment, idx) => (
                    <li key={idx}>
                      <a
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {getFileName(attachment)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {lesson.content && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Nội dung:</p>
                <div className="text-sm text-gray-600 bg-white p-2 rounded border max-h-40 overflow-y-auto">
                  {lesson.content}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Tạo: {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
              </span>
              {lesson.updateAt && <span>Cập nhật: {new Date(lesson.updateAt).toLocaleDateString("vi-VN")}</span>}
            </div>
          </div>
        )}
      </div>

      <LessonVisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        lessonId={lesson.id}
        lessonTitle={lesson.title}
        courseId={Number(courseId)}
        educationalUnitId={educationalUnitId}
      />
    </>
  )
}

export default LessonItem