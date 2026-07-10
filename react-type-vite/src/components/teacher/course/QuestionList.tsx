"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookPlus, Trash2, CheckCircle2, XCircle, Tag } from "lucide-react"
import QuestionSelector from "./QuestionSelector"
import type { QuestionRequest } from "@/services/api/request/questionRequest"
import type { QuestionLibraryResponse } from "@/services/api/teacher/questionLibraryApi"

interface QuestionListProps {
  questions: QuestionRequest[]
  onQuestionsChange: (questions: QuestionRequest[]) => void
  courseId?: number
  hasAttempts?: boolean
}

const QuestionList: React.FC<QuestionListProps> = ({ questions, onQuestionsChange, courseId, hasAttempts = false }) => {
  const [selectorOpen, setSelectorOpen] = useState(false)

  const handleSelectLibraryQuestions = (selectedQuestions: QuestionLibraryResponse[]) => {
    console.log('[QuestionList] Selected library questions:', selectedQuestions)
    const newQuestions = selectedQuestions.map((libQ, idx) => ({
      id: libQ.id, // Keep library question ID for many-to-many relationship
      questionText: libQ.questionText,
      questionType: libQ.questionType as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SINGLE_CHOICE" | "SHORT_ANSWER" | "ESSAY" | "FILL_IN_THE_BLANK",
      score: libQ.score || 10,
      difficultyLevel: libQ.difficultyLevel,
      tags: libQ.tags,
      cloCode: libQ.cloCode,
      courseName: libQ.courseName,
      attachments: libQ.attachments,
      orderIndex: questions.length + idx + 1,
      answers: libQ.answers.map((ans, ansIdx) => ({
        content: ans.content,
        isCorrect: ans.isCorrect,
        orderIndex: ansIdx + 1,
      })),
    }))
    console.log('[QuestionList] Converted questions:', newQuestions)
    onQuestionsChange([...questions, ...newQuestions])
  }

  const removeQuestion = (index: number) => {
    const filtered = questions.filter((_, i) => i !== index)
    onQuestionsChange(filtered)
  }

  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      MULTIPLE_CHOICE: "Nhiều đáp án",
      TRUE_FALSE: "Đúng/Sai",
      SINGLE_CHOICE: "Một đáp án",
      FILL_IN_THE_BLANK: "Điền khuyết",
    }
    return types[type] || type
  }

  const getDifficultyBadge = (difficulty?: string) => {
    if (!difficulty) return null
    const colors: Record<string, string> = {
      EASY: "bg-green-100 text-green-800 border-transparent",
      MEDIUM: "bg-yellow-100 text-yellow-800 border-transparent",
      HARD: "bg-red-100 text-red-800 border-transparent",
    }
    const labels: Record<string, string> = {
      EASY: "Dễ",
      MEDIUM: "Trung bình",
      HARD: "Khó",
    }
    return (
      <Badge className={colors[difficulty] || ""}>{labels[difficulty] || difficulty}</Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <h3 className="text-lg font-semibold">Câu Hỏi</h3>
          <p className="text-sm text-gray-600">Chọn câu hỏi từ ngân hàng để thêm vào bài kiểm tra.</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, index) => (
          <div
            key={q.id || index}
            className="bg-card rounded-lg border p-4 hover:shadow-md transition-shadow relative"
          >
            <div className="absolute top-4 right-4">
              {!hasAttempts && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1 text-destructive hover:text-destructive"
                  onClick={() => removeQuestion(index)}
                  title="Xóa câu hỏi"
                >
                  <Trash2 className="h-4 w-4" />
                  Xóa
                </Button>
              )}
            </div>

            <div className="flex items-start justify-between">
              <div className="flex-1 pr-20">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-transparent">Câu {index + 1}</Badge>
                  {q.questionType && (
                    <Badge variant="outline">{getQuestionTypeLabel(q.questionType)}</Badge>
                  )}
                  {getDifficultyBadge(q.difficultyLevel)}
                  {q.cloCode && (
                    <Badge className="bg-blue-100 text-blue-800 border-transparent">
                      {q.courseName ? `${q.cloCode} - ${q.courseName}` : q.cloCode}
                    </Badge>
                  )}
                  {q.score && (
                    <Badge variant="secondary">{q.score} điểm</Badge>
                  )}
                </div>

                <h3 className="text-lg font-medium mb-2">{q.questionText}</h3>

                {q.tags && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Tag className="h-4 w-4" />
                    {q.tags.split(",").map((tag, i) => (
                      <span
                        key={i}
                        className="bg-secondary px-2 py-1 rounded text-xs"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {q.answers && q.answers.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {q.answers.map((answer, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center gap-2 rounded-md border p-2 text-sm ${
                          answer.isCorrect
                            ? "border-green-200 bg-green-50 text-green-900"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        {answer.isCorrect ? (
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        )}
                        <span className={answer.isCorrect ? "font-medium flex items-center" : "flex items-center"}>
                          {q.questionType === 'FILL_IN_THE_BLANK' && (
                            <span className="mr-2 px-1.5 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-500 font-bold">
                              Ô {idx + 1}
                            </span>
                          )}
                          {answer.content}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Chưa có đáp án
                  </div>
                )}

                <div className="mt-2 text-sm text-muted-foreground">
                  {q.answers?.length || 0} đáp án • {q.answers?.filter(a => a.isCorrect).length || 0} đáp án đúng
                </div>
              </div>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
            <div className="rounded-full bg-muted/20 p-4 mb-4">
              <BookPlus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Chưa có câu hỏi nào</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-1 mb-4">
              Bài kiểm tra cần ít nhất một câu hỏi. Hãy thêm câu hỏi từ ngân hàng hoặc tạo mới.
            </p>
            {!hasAttempts && (
              <Button
                variant="outline"
                onClick={() => setSelectorOpen(true)}
              >
                Thêm câu hỏi ngay
              </Button>
            )}
          </div>
        )}
        {questions.length > 0 && !hasAttempts && (
          <div className="flex justify-center pt-4 border-t border-dashed">
            <Button
              variant="outline"
              className="gap-2 border-dashed border-2 hover:border-primary hover:bg-primary/5 hover:text-primary"
              onClick={() => setSelectorOpen(true)}
            >
              <BookPlus className="h-4 w-4" />
              Thêm câu hỏi khác
            </Button>
          </div>
        )}
      </CardContent>

      {/* Question Selector Modal */}
      <QuestionSelector
        isOpen={selectorOpen}
        onClose={() => setSelectorOpen(false)}
        onSelect={handleSelectLibraryQuestions}
        courseId={courseId}
      />
    </Card>
  )
}

export default QuestionList