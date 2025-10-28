"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import Modal from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
import QuizSettings from "./QuizSettings"
import QuestionList from "./QuestionList"
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
}> = ({ isOpen, onClose, onUpdate, quiz, sectionId }) => {
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
        isPublished: quiz.isPublished,
        sectionId,
        questions: convertedQuestions,
        startTime: quiz.startTime ? (quiz.startTime instanceof Date ? quiz.startTime.toISOString() : String(quiz.startTime)) : undefined,
        endTime: quiz.endTime ? (quiz.endTime instanceof Date ? quiz.endTime.toISOString() : String(quiz.endTime)) : undefined,
      })
    }
  }, [quiz, isOpen, sectionId])

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
        isPublished: formData.isPublished,
        sectionId,
        numberItem: quiz.numberItem,
        questions: formData.questions,
        startTime: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
        endTime: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}
          <QuizSettings settings={formData} onSettingsChange={handleSettingsChange} />
          <QuestionList questions={formData.questions ?? []} onQuestionsChange={handleQuestionsChange} />
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Đang cập nhật..." : "Cập Nhật Bài Kiểm Tra"}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default EditQuizModal