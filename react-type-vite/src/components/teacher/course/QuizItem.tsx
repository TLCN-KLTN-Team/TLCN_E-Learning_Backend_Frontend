"use client"

import type React from "react"
import { useState } from "react"
import {
  GripVertical,
  HelpCircle,
  Edit,
  Trash,
  Clock,
  Target,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuizResponse } from "@/services/api/response/quizResponse"

interface QuizItemProps {
  quiz: QuizResponse
  index: number
  onUpdate: (quiz: QuizResponse) => void
  onDelete: (quizId: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  onEdit: (quiz: QuizResponse) => void
}

const QuizItem: React.FC<QuizItemProps> = ({ quiz, index, onDelete, onReorder, onEdit }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

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

    console.log("[v0] QuizItem handleDrop - từ vị trí:", fromIndex, "đến vị trí:", toIndex)

    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex)
    }
    setDraggedIndex(null)
  }

  const isDragging = draggedIndex === index
  const isDragOver = draggedIndex !== null && draggedIndex !== index

  // Chuyển đổi Set thành Array và tính toán thống kê
  const questionsArray = quiz.questions ? Array.from(quiz.questions) : []
  const totalScore = questionsArray.reduce((sum, q) => sum + q.score, 0)
  const questionCount = questionsArray.length

  return (
    <div
      className={`border rounded-lg transition-all ${isDragging ? "opacity-50" : ""} ${
        isDragOver ? "border-2 border-blue-300 bg-blue-50" : "border-gray-200"
      }`}
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
          <span className="text-sm text-gray-500 min-w-[30px]">#{quiz.numberItem}</span>
          <HelpCircle className="h-5 w-5 text-purple-500" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{quiz.title}</span>
              {quiz.isPublished ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                  <Eye className="h-3 w-3" />
                  Đã Xuất Bản
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                  <EyeOff className="h-3 w-3" />
                  Nháp
                </span>
              )}
            </div>
            {!isExpanded && (
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                <span className="flex items-center gap-1">
                  <HelpCircle className="h-3 w-3" />
                  {questionCount} câu hỏi
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {quiz.duration} phút
                </span>
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Điểm đạt: {quiz.passingScore}%
                </span>
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
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(quiz)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(quiz.id)}>
            <Trash className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      </div>

      {/* Chi Tiết Mở Rộng */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-2 border-t bg-gray-50/50 space-y-4">
          {/* Thông Tin Bài Kiểm Tra */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">Thời gian</p>
                <p className="font-medium">{quiz.duration} phút</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">Điểm đạt</p>
                <p className="font-medium">{quiz.passingScore}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Award className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">Giới hạn</p>
                <p className="font-medium">{quiz.attemptLimit} lần</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <HelpCircle className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-gray-500 text-xs">Tổng điểm</p>
                <p className="font-medium">{totalScore}</p>
              </div>
            </div>
          </div>

          {quiz.description && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Mô tả:</p>
              <p className="text-sm text-gray-600">{quiz.description}</p>
            </div>
          )}

          {/* Danh Sách Câu Hỏi */}
          {questionsArray.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                Danh sách câu hỏi ({questionCount})
              </p>
              <div className="space-y-3">
                {questionsArray
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((question, qIdx) => {
                    const answersArray = question.answers ? Array.from(question.answers) : []

                    return (
                      <div key={question.id} className="bg-white rounded-lg border p-3">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            Câu {qIdx + 1}
                          </span>
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {question.questionType}
                          </span>
                          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded ml-auto">
                            {question.score} điểm
                          </span>
                        </div>

                        <p className="text-sm font-medium mb-2">{question.questionText}</p>

                        {question.attachments && question.attachments.length > 0 && (
                          <div className="mb-2 text-xs text-gray-500">
                            📎 {question.attachments.length} tệp đính kèm
                          </div>
                        )}

                        {/* Đáp Án */}
                        {answersArray.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {answersArray
                              .sort((a, b) => a.orderIndex - b.orderIndex)
                              .map((answer) => (
                                <div
                                  key={answer.id}
                                  className={`flex items-center gap-2 text-sm p-2 rounded ${
                                    answer.isCorrect
                                      ? "bg-green-50 border border-green-200"
                                      : "bg-gray-50 border border-gray-200"
                                  }`}
                                >
                                  {answer.isCorrect ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                  )}
                                  <span className={answer.isCorrect ? "text-green-900 font-medium" : "text-gray-700"}>
                                    {answer.content}
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          {/* Cài Đặt */}
          <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
            <span className="flex items-center gap-1">
              {quiz.showResults ? (
                <>
                  <Eye className="h-3 w-3" />
                  Hiển thị kết quả
                </>
              ) : (
                <>
                  <EyeOff className="h-3 w-3" />
                  Ẩn kết quả
                </>
              )}
            </span>
            <span>Số lần làm: {quiz.attemptsCount || 0}</span>
            <span>Tạo: {new Date(quiz.createdAt).toLocaleDateString("vi-VN")}</span>
            {quiz.updateAt && <span>Cập nhật: {new Date(quiz.updateAt).toLocaleDateString("vi-VN")}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizItem