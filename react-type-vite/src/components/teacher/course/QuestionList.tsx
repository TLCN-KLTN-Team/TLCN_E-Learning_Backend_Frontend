"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { BookPlus, Trash } from "lucide-react"
import QuestionSelector from "./QuestionSelector"
import type { QuestionRequest } from "@/services/api/request/questionRequest"
import type { QuestionLibraryResponse } from "@/services/api/teacher/questionLibraryApi"

const QuestionList: React.FC<{
  questions: QuestionRequest[]
  onQuestionsChange: (questions: QuestionRequest[]) => void
}> = ({ questions, onQuestionsChange }) => {
  const [selectorOpen, setSelectorOpen] = useState(false)

  const handleSelectLibraryQuestions = (selectedQuestions: QuestionLibraryResponse[]) => {
    console.log('[QuestionList] Selected library questions:', selectedQuestions)
    const newQuestions = selectedQuestions.map((libQ, idx) => ({
      id: libQ.id, // Keep library question ID for many-to-many relationship
      questionText: libQ.questionText,
      questionType: libQ.questionType as "MULTIPLE_CHOICE" | "TRUE_FALSE" | "SINGLE_CHOICE" | "SHORT_ANSWER" | "ESSAY",
      score: libQ.score || 10,
      difficultyLevel: libQ.difficultyLevel,
      tags: libQ.tags,
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
            className="group relative flex gap-4 p-5 rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md"
          >
            {/* Numbering Column */}
            <div className="flex flex-col items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary ring-2 ring-background">
                {index + 1}
              </span>
              <div className="w-px h-full bg-border/50 my-2" />
            </div>

            {/* Content Column */}
            <div className="flex-1 space-y-3">
              {/* Header: Badges & Actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {q.questionType && (
                    <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80">
                      {q.questionType === 'MULTIPLE_CHOICE' ? 'Nhiều đáp án' :
                        q.questionType === 'TRUE_FALSE' ? 'Đúng/Sai' :
                          q.questionType === 'SINGLE_CHOICE' ? 'Một đáp án' : 'Điền khuyết'}
                    </span>
                  )}
                  {q.difficultyLevel && (
                    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${q.difficultyLevel === 'EASY' ? 'border-transparent bg-green-100 text-green-700' :
                      q.difficultyLevel === 'MEDIUM' ? 'border-transparent bg-yellow-100 text-yellow-700' :
                        'border-transparent bg-red-100 text-red-700'
                      }`}>
                      {q.difficultyLevel === 'EASY' ? 'Dễ' : q.difficultyLevel === 'MEDIUM' ? 'Trung bình' : 'Khó'}
                    </span>
                  )}
                  <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                    {q.score} điểm
                  </span>
                  {q.tags && q.tags.split(',').map((tag, i) => (
                    <span key={i} className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-normal text-muted-foreground border-border bg-background">
                      {tag.trim()}
                    </span>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -mr-2"
                  onClick={() => {
                    const filtered = questions.filter((_, i) => i !== index)
                    onQuestionsChange(filtered)
                  }}
                  title="Xóa câu hỏi"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>

              {/* Question Text */}
              <div>
                <p className="text-base font-medium leading-relaxed">
                  {q.questionText}
                </p>
              </div>

              {/* Answers */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Đáp án</p>
                <div className="flex flex-col gap-3">
                  {q.answers?.map((ans, idx) => (
                    <div
                      key={idx}
                      className={`relative flex items-center gap-3 p-3 rounded-md border transition-colors ${ans.isCorrect
                        ? 'bg-green-50/50 border-green-200 shadow-sm'
                        : 'bg-background border-border hover:bg-accent/50'
                        }`}
                    >
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium border ${ans.isCorrect
                        ? 'bg-green-100 text-green-700 border-green-200'
                        : 'bg-muted text-muted-foreground border-border'
                        }`}>
                        {q.questionType === 'FILL_IN_THE_BLANK' ? (idx + 1) : String.fromCharCode(65 + idx)}
                      </div>
                      <span className={`text-sm flex-1 ${ans.isCorrect ? 'text-green-900 font-medium' : 'text-foreground/90'}`}>
                        {ans.content}
                      </span>
                      {ans.isCorrect && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-green-500" />
                      )}
                    </div>
                  ))}
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
            <Button
              variant="outline"
              onClick={() => setSelectorOpen(true)}
            >
              Thêm câu hỏi ngay
            </Button>
          </div>
        )}
        {questions.length > 0 && (
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
      />
    </Card>
  )
}

export default QuestionList