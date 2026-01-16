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
      questionType: libQ.questionType,
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
      <CardContent className="space-y-4">
        {questions.map((q, index) => (
          <div key={q.id || index} className="p-5 border-2 border-gray-200 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
                    {index + 1}
                  </span>
                  {q.questionType && (
                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                      {q.questionType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : 
                       q.questionType === 'TRUE_FALSE' ? 'Đúng/Sai' :
                       q.questionType === 'SHORT_ANSWER' ? 'Trả lời ngắn' : 'Tự luận'}
                    </span>
                  )}
                  {q.difficultyLevel && (
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      q.difficultyLevel === 'EASY' ? 'bg-green-100 text-green-700' :
                      q.difficultyLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {q.difficultyLevel === 'EASY' ? '🟢 Dễ' : q.difficultyLevel === 'MEDIUM' ? '🟡 Trung bình' : '🔴 Khó'}
                    </span>
                  )}
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
                    {q.score} điểm
                  </span>
                </div>
                
                {/* Question Text */}
                <div className="mb-4">
                  <p className="text-base font-medium text-gray-900 leading-relaxed">{q.questionText}</p>
                </div>
                
                {/* Answers */}
                <div className="space-y-2 pl-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Đáp án:</p>
                  {q.answers?.map((ans, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-start gap-2 p-2 rounded-lg ${
                        ans.isCorrect 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-gray-50'
                      }`}
                    >
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        ans.isCorrect 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-300 text-gray-600'
                      }`}>
                        {ans.isCorrect ? '✓' : String.fromCharCode(65 + idx)}
                      </span>
                      <span className={`text-sm ${
                        ans.isCorrect ? 'text-green-800 font-medium' : 'text-gray-700'
                      }`}>
                        {ans.content}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Delete Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const filtered = questions.filter((_, i) => i !== index)
                  onQuestionsChange(filtered)
                }}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                title="Xóa câu hỏi"
              >
                <Trash className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ))}
        {questions.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed rounded-lg bg-gray-50">
            <p className="text-gray-500 mb-4">Bài kiểm tra này chưa có câu hỏi nào.</p>
            <p className="text-sm text-gray-400">Nhấn nút "Thêm từ Ngân hàng" bên dưới để chọn câu hỏi</p>
          </div>
        )}
        {/* Nút Thêm từ Ngân hàng */}
          <div className="flex justify-center pt-2"> 
              <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectorOpen(true)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <BookPlus className="h-4 w-4 mr-2" />
                      Thêm từ Ngân hàng Câu hỏi
              </Button>
          </div>
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