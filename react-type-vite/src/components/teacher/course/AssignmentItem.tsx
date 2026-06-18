"use client"

import type React from "react"
import { useState } from "react"
import {
  GripVertical,
  FileText,
  Edit,
  Trash,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  Paperclip,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AssignmentResponse } from "@/services/api/response/assignmentResponse"
import AssignmentVisibilityModal from "./AssignmentVisibilityModal"

interface AssignmentItemProps {
  assignment: AssignmentResponse
  index: number
  courseId: string
  educationalUnitId: number
  onUpdate: (assignment: AssignmentResponse) => void
  onDelete: (assignmentId: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onEdit: (assignment: AssignmentResponse) => void
}

const AssignmentItem: React.FC<AssignmentItemProps> = ({
  assignment,
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
    e.stopPropagation()
    e.dataTransfer.setData("text/plain", index.toString())
    e.dataTransfer.setData("application/tlcn-assignment", index.toString())
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const fromIndex = Number.parseInt(e.dataTransfer.getData("text/plain"))
    const toIndex = index

    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex)
    }
    setDraggedIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const isDragging = draggedIndex === index
  const isDragOver = draggedIndex !== null && draggedIndex !== index

  const isDeadlinePassed = new Date(assignment.deadline) < new Date()
  const daysUntilDeadline = Math.ceil(
    (new Date(assignment.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )

  const getSubmissionTypeText = (type: string) => {
    const map: Record<string, string> = {
      UPLOAD_FILE: "Tải file lên",
      TEXT: "Nhập văn bản",
      LINK: "Gửi liên kết",
      BOTH: "File hoặc văn bản",
    }
    return map[type] || type
  }

  return (
    <>
      <div
        className={`border rounded-lg transition-all ${isDragging ? "opacity-50" : ""} ${isDragOver ? "border-2 border-blue-300 bg-blue-50" : "border-gray-200"
          }`}
      >
        <div
          className={`flex items-center justify-between p-3 cursor-pointer ${!isDragging ? "hover:bg-gray-50" : ""}`}
          draggable
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3 flex-1">
            <GripVertical className="h-4 w-4 text-gray-400 cursor-move" onClick={(e) => e.stopPropagation()} />
            <span className="text-sm text-gray-500 min-w-[30px]">#{assignment.numberItem}</span>
            <FileText className="h-5 w-5 text-orange-500" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{assignment.title}</span>
              </div>
              {!isExpanded && (
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {isDeadlinePassed ? (
                      <span className="text-red-600">Hết hạn</span>
                    ) : (
                      <span>{daysUntilDeadline} ngày còn lại</span>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {getSubmissionTypeText(assignment.submissionType)}
                  </span>
                  {assignment.submissionsCount !== undefined && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      {assignment.submissionsCount} bài nộp
                    </span>
                  )}
                </div>
              )}
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsVisibilityModalOpen(true)}
              title="Quản lý hiển thị cho các lớp"
            >
              <Eye className="h-4 w-4 text-orange-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(assignment)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(assignment.id)}>
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>

        {/* Chi Tiết Mở Rộng */}
        {isExpanded && (
          <div className="px-3 pb-3 pt-2 border-t bg-gray-50/50 space-y-4">
            {/* Thông Tin Bài Tập */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-500 text-xs">Hạn chót</p>
                  <p className="font-medium">{new Date(assignment.deadline).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-gray-500 text-xs">Loại nộp</p>
                  <p className="font-medium">{getSubmissionTypeText(assignment.submissionType)}</p>
                </div>
              </div>
              {assignment.maxScore !== undefined && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-gray-500 text-xs">Điểm tối đa</p>
                    <p className="font-medium">{assignment.maxScore}</p>
                  </div>
                </div>
              )}
            </div>

            {assignment.description && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Mô tả:</p>
                <p className="text-sm text-gray-600">{assignment.description}</p>
              </div>
            )}

            {/* Tệp Đính Kèm */}
            {assignment.assignmentFiles && assignment.assignmentFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Tệp Đề Bài ({assignment.assignmentFiles.length})
                </p>
                <div className="space-y-1">
                  {assignment.assignmentFiles.map((file, idx) => (
                    <div key={idx} className="text-xs text-blue-600 hover:underline cursor-pointer">
                      📄 {getFileName(file)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rubric Files */}
            {assignment.rubricFiles && assignment.rubricFiles.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Tiêu Chí Chấm Điểm ({assignment.rubricFiles.length})
                </p>
                <div className="space-y-1">
                  {assignment.rubricFiles.map((file, idx) => (
                    <div key={idx} className="text-xs text-blue-600 hover:underline cursor-pointer">
                      📋 {getFileName(file)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cài Đặt */}
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
              <span>Tạo: {new Date(assignment.createdAt).toLocaleDateString("vi-VN")}</span>
              {assignment.updateAt && <span>Cập nhật: {new Date(assignment.updateAt).toLocaleDateString("vi-VN")}</span>}
              {assignment.submissionsCount !== undefined && (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {assignment.submissionsCount} bài nộp
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <AssignmentVisibilityModal
        isOpen={isVisibilityModalOpen}
        onClose={() => setIsVisibilityModalOpen(false)}
        assignmentId={assignment.id}
        assignmentTitle={assignment.title}
        courseId={Number(courseId)}
        educationalUnitId={educationalUnitId}
      />
    </>
  )
}

export default AssignmentItem