"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash, PlusCircle, GripVertical, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import AnswerEditor from "./AnswerEditor"
import FileUpload from "./FileUpload"
import DragDropUtils from "@/utils/DragDropUtils"
import type { QuestionRequest } from "@/services/api/request/questionRequest"
import type { AnswerRequest } from "@/services/api/request/answerRequest"
import { validateQuestion } from "@/utils/validationUtils"

const QuestionEditor: React.FC<{
  question: QuestionRequest
  index: number
  onUpdate: (index: number, question: QuestionRequest) => void
  onDelete: (index: number) => void
  onReorder: (fromIndex: number, toIndex: number) => void
}> = ({ question, index, onUpdate, onDelete, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [showValidationErrors, setShowValidationErrors] = useState(false)

  const getFileName = (fileData: string): string => {
    try {
      const metadata = JSON.parse(fileData)
      return metadata.name || "Tệp không xác định"
    } catch {
      // Fallback for old format or plain URLs
      return fileData.split("/").pop() || "Tệp không xác định"
    }
  }

  const updateQuestion = (updates: Partial<QuestionRequest>) => {
    onUpdate(index, { ...question, ...updates })
  }

  const handleFilesChange = (files: string[]) => {
    updateQuestion({ attachments: files })
  }

  const addAnswer = () => {
    const newAnswer: AnswerRequest = {
      content: "",
      isCorrect: false,
      orderIndex: (question.answers?.length || 0) + 1,
    }
    updateQuestion({
      answers: [...(question.answers || []), newAnswer],
    })
  }

  const updateAnswer = (answerIndex: number, updatedAnswer: AnswerRequest) => {
    let updatedAnswers = (question.answers || []).map((answer, i) => (i === answerIndex ? updatedAnswer : answer))
    
    // Nếu là câu hỏi một lựa chọn và đáp án này được đánh dấu là đúng
    if (question.questionType === 'SINGLE_CHOICE' && updatedAnswer.isCorrect) {
      // Bỏ chọn tất cả các đáp án khác
      updatedAnswers = updatedAnswers.map((answer, i) => ({
        ...answer,
        isCorrect: i === answerIndex ? true : false
      }))
    }
    
    updateQuestion({ answers: updatedAnswers })
  }

  const deleteAnswer = (answerIndex: number) => {
    updateQuestion({
      answers: (question.answers || []).filter((_, i) => i !== answerIndex),
    })
  }

  const reorderAnswers = (fromIndex: number, toIndex: number) => {
    const reorderedAnswers = DragDropUtils.reorderArray(question.answers || [], fromIndex, toIndex)
    updateQuestion({ answers: reorderedAnswers })
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

    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex)
    }
    setDraggedIndex(null)
  }

  const isDragging = draggedIndex === index
  const isDragOver = draggedIndex !== null && draggedIndex !== index

  const validationErrors = validateQuestion(question)
  const hasErrors = validationErrors.length > 0

  return (
    <Card
      className={`transition-all ${isDragging ? "opacity-50" : ""} ${isDragOver ? "border-blue-300 bg-blue-50" : ""} ${
        hasErrors && showValidationErrors ? "border-red-300" : ""
      }`}
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
          <h4 className="font-semibold">Câu Hỏi {index + 1}</h4>
          {hasErrors && showValidationErrors && (
            <span title="Câu hỏi này có lỗi xác thực">
              <AlertCircle className="h-4 w-4 text-red-600" />
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDelete(index)}>
          <Trash className="h-4 w-4 text-red-500" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasErrors && showValidationErrors && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-1">
            {validationErrors.map((error, idx) => (
              <p key={idx} className="text-sm text-red-700">
                • {error.message}
              </p>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Nội Dung Câu Hỏi</label>
          <textarea
            value={question.questionText}
            onChange={(e) => updateQuestion({ questionText: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
              validationErrors.some((e) => e.field === "questionText") && showValidationErrors ? "border-red-500" : ""
            }`}
            rows={3}
            placeholder="Nhập nội dung câu hỏi"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={`questionType-${index}`} className="block text-sm font-medium mb-1">
              Loại Câu Hỏi
            </label>
            <select
              id={`questionType-${index}`}
              value={question.questionType}
              onChange={(e) => updateQuestion({ questionType: e.target.value as any })}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="SINGLE_CHOICE">Một Lựa Chọn</option>
              <option value="MULTIPLE_CHOICE">Nhiều Lựa Chọn</option>
              <option value="TRUE_FALSE">Đúng/Sai</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Điểm</label>
            <Input
              type="number"
              value={question.score || 1}
              onChange={(e) => updateQuestion({ score: Number.parseInt(e.target.value) || 1 })}
              min="1"
            />
          </div>
        </div>

        {/* Phần Tải Lên Tệp */}
        <FileUpload
          files={question.attachments || []}
          onFilesChange={handleFilesChange}
          title="Tài Liệu Đính Kèm Câu Hỏi"
          description="Tải lên hình ảnh, tài liệu hoặc tệp khác để hỗ trợ câu hỏi này"
          acceptedTypes={[".jpg", ".jpeg", ".png", ".gif", ".pdf", ".doc", ".docx", ".mp4", ".mov", ".txt"]}
          maxFileSize={25}
          maxFiles={5}
        />

        {question.attachments && question.attachments.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900 mb-2">Tệp đã tải lên:</p>
            <ul className="space-y-1">
              {question.attachments.map((file, idx) => (
                <li key={idx} className="text-sm text-blue-700">
                  📎 {getFileName(file)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Đáp Án (Kéo để sắp xếp lại)</label>
            <Button variant="outline" size="sm" onClick={addAnswer}>
              <PlusCircle className="h-4 w-4 mr-1" />
              Thêm Đáp Án
            </Button>
          </div>
          {validationErrors.some((e) => e.field === "answers") && showValidationErrors && (
            <p className="text-sm text-red-700 mb-2">{validationErrors.find((e) => e.field === "answers")?.message}</p>
          )}
          <div className="space-y-2">
            {(question.answers || []).map((answer, answerIndex) => (
              <AnswerEditor
                key={answerIndex}
                answer={answer}
                index={answerIndex}
                answers={question.answers || []}
                questionType={question.questionType}
                onUpdate={updateAnswer}
                onDelete={deleteAnswer}
                onReorder={reorderAnswers}
              />
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowValidationErrors(!showValidationErrors)}
          className="w-full"
        >
          {showValidationErrors ? "Ẩn" : "Hiển Thị"} Lỗi Xác Thực
        </Button>
      </CardContent>
    </Card>
  )
}

export default QuestionEditor