"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Modal from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Save } from "lucide-react"
import QuizSettings from "./QuizSettings"
import QuestionList from "./QuestionList"
import QuizBlueprintConfig from "./QuizBlueprintConfig"
import { convertQuestionsResponseToRequest } from "@/utils/converters"
import type { QuizRequest } from "@/services/api/request/quizRequest"
import type { QuestionRequest } from "@/services/api/request/questionRequest"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import type { SectionResponse } from "@/services/api/response/sectionResponse"

const EditQuizModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  onUpdate: (quiz: QuizRequest) => void
  quiz: QuizResponse | null
  section: SectionResponse
  sectionId: number
  courseId: number
}> = ({ isOpen, onClose, onUpdate, quiz, sectionId, courseId }) => {
  const [formData, setFormData] = useState<QuizRequest>({
    title: "Bài Kiểm Tra Mới",
    description: "",
    duration: 15,
    passingScore: 70,
    sectionId,
    questions: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (quiz) {
      const questionsArray = quiz.questions ? Array.from(quiz.questions) : []
      const convertedQuestions = convertQuestionsResponseToRequest(questionsArray)

      setFormData({
        id: quiz.id,
        title: quiz.title,
        description: quiz.description || "",
        duration: quiz.duration || 15,
        attemptLimit: quiz.attemptLimit,
        passingScore: quiz.passingScore || 70,
        numberItem: quiz.numberItem,
        showResults: quiz.showResults,
        isPublished: false,
        sectionId,
        questions: convertedQuestions,
        ...(quiz.startTime && quiz.startTime.trim() !== "" && { startTime: quiz.startTime }),
        ...(quiz.endTime && quiz.endTime.trim() !== "" && { endTime: quiz.endTime }),
      })
    }
  }, [quiz, isOpen, sectionId])

  const hasAttempts = (quiz?.attemptsCount || 0) > 0

  const handleQuizChange = useCallback((updater: (draft: QuizRequest) => void) => {
    setFormData((prev) => {
      const newQuiz = { ...prev }
      updater(newQuiz)
      return newQuiz
    })
  }, [])

  const handleSettingsChange = (updatedSettings: Partial<QuizRequest>) => {
    handleQuizChange((draft) => {
      Object.assign(draft, updatedSettings)
    })
  }

  const handleQuestionsChange = (questions: QuestionRequest[]) => {
    handleQuizChange((draft) => {
      draft.questions = questions
    })
  }

  const handleSave = async () => {
    if (!quiz) return

    setIsLoading(true)
    setError(null)

    try {
      onUpdate({
        id: quiz.id,
        title: formData.title,
        description: formData.description,
        duration: formData.duration,
        attemptLimit: formData.attemptLimit,
        passingScore: formData.passingScore,
        showResults: formData.showResults,
        isPublished: false,
        sectionId,
        numberItem: quiz.numberItem,
        questions: formData.questions,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
      })
      onClose()
    } catch (err) {
      console.error("Lỗi khi cập nhật bài kiểm tra:", err)
      setError("Không thể cập nhật bài kiểm tra. Vui lòng thử lại.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Chỉnh Sửa Bài Kiểm Tra</h2>
        </div>

        {hasAttempts && (
          <div className="mx-6 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Bài kiểm tra đã có học sinh làm</p>
              <p className="text-sm text-yellow-700">
                Bạn không thể thay đổi cấu trúc đề thi (thêm/xóa câu hỏi, sửa ma trận CĐR) để đảm bảo tính toàn vẹn dữ liệu điểm số của học sinh.
              </p>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          <QuizSettings settings={formData} onSettingsChange={handleSettingsChange} />
          {quiz?.id && (
            <QuizBlueprintConfig 
              quizId={quiz.id} 
              courseId={courseId} 
              hasAttempts={hasAttempts}
              currentQuestions={formData.questions ?? []}
              onQuestionsGenerated={handleQuestionsChange}
            />
          )}
          <QuestionList 
            questions={formData.questions ?? []} 
            onQuestionsChange={handleQuestionsChange} 
            courseId={courseId} 
            hasAttempts={hasAttempts}
          />
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang Cập Nhật...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Cập Nhật Bài Kiểm Tra
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EditQuizModal