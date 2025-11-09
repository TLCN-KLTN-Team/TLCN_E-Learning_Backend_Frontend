"use client"

import type React from "react"
import { useState, useCallback } from "react"
import Modal from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Save, AlertCircle, Loader2 } from "lucide-react"
import QuizSettings from "./QuizSettings"
import QuestionList from "./QuestionList"
import type { QuizRequest } from "@/services/api/request/quizRequest"
import type { QuestionRequest } from "@/services/api/request/questionRequest"
import type { SectionResponse } from "@/services/api/response/sectionResponse"
import { getNextQuizNumberItem } from "@/utils/orderIndexUtils"
import { validateQuiz, type ValidationError } from "@/utils/validationUtils"

const QuizModalEditor: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSave: (quiz: QuizRequest) => void
  courseId: string
  sectionId: number
  section?: SectionResponse
}> = ({ isOpen, onClose, onSave, sectionId, section }) => {
  const [quiz, setQuiz] = useState<QuizRequest>({
    title: "Bài Kiểm Tra Mới",
    description: "",
    duration: 15,
    passingScore: 70,
    attemptLimit: 3,
    showResults: false,
    isPublished: false,
    sectionId,
    questions: [],
    startTime: undefined,
    endTime: undefined,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<ValidationError[]>([])

  const handleQuizChange = useCallback((updater: (draft: QuizRequest) => void) => {
    setQuiz((prev) => {
      const newQuiz = { ...prev }
      updater(newQuiz)
      return newQuiz
    })
  }, [])

  const handleSettingsChange = (updatedSettings: Partial<QuizRequest>) => {
    handleQuizChange((draft) => {
      Object.assign(draft, updatedSettings)
    })
    setErrors((prev) => prev.filter((err) => !["title", "duration", "passingScore", "attemptLimit", "showResults", "isPublished", "startTime", "endTime"].includes(err.field)))
  }

  const handleQuestionsChange = (questions: QuestionRequest[]) => {
    handleQuizChange((draft) => {
      draft.questions = questions
    })
    setErrors((prev) => prev.filter((err) => err.field !== "questions"))
  }

  const handleSave = async () => {
    const validationErrors = validateQuiz(quiz)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      const existingQuizzes = section?.quizs ? Array.from(section.quizs) : []
      const nextQuizNumberItem = getNextQuizNumberItem(existingQuizzes)

      const questionsWithOrderIndex = (quiz.questions || []).map((q, index) => ({
        ...q,
        orderIndex: q.orderIndex ?? index + 1,
        answers: (q.answers || []).map((a, answerIndex) => ({
          ...a,
          orderIndex: a.orderIndex ?? answerIndex + 1,
        })),
      }))

      const newQuiz: QuizRequest = {
        title: quiz.title,
        description: quiz.description,
        duration: quiz.duration,
        attemptLimit: quiz.attemptLimit,
        passingLimit: quiz.attemptLimit, // lưu ý: giữ nguyên ánh xạ attemptLimit
        passingScore: quiz.passingScore,
        numberItem: nextQuizNumberItem,
        sectionId,
        showResults: quiz.showResults,
        isPublished: false,
        questions: questionsWithOrderIndex,
        ...(quiz.startTime && quiz.startTime.trim() !== "" && { startTime: new Date(quiz.startTime).toISOString() }),
        ...(quiz.endTime && quiz.endTime.trim() !== "" && { endTime: new Date(quiz.endTime).toISOString() }),
      }

      onSave(newQuiz)
      onClose()

      // Reset form
      setQuiz({
        title: "Bài Kiểm Tra Mới",
        description: "",
        duration: 15,
        passingScore: 70,
        attemptLimit: 3,
        showResults: false,
        isPublished: false,
        sectionId,
        questions: [],
        startTime: undefined,
        endTime: undefined,
      })
    } catch (err) {
      console.error("[v0] Lỗi khi lưu bài kiểm tra:", err)
      setErrors([{ field: "general", message: "Không thể lưu bài kiểm tra. Vui lòng thử lại." }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">Tạo Bài Kiểm Tra Mới</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-2">
              {errors.map((error, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error.message}</p>
                </div>
              ))}
            </div>
          )}
          <QuizSettings settings={quiz} onSettingsChange={handleSettingsChange} />
          <QuestionList questions={quiz.questions ?? []} onQuestionsChange={handleQuestionsChange} />
        </div>

        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Hủy
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Lưu Bài Kiểm Tra
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
export default QuizModalEditor