"use client"

import type React from "react"
import { useState, useCallback, useEffect, useMemo } from "react"
import Modal from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Save, AlertCircle, Loader2, Plus, Trash2 } from "lucide-react"
import QuizSettings from "./QuizSettings"
import QuestionList from "./QuestionList"
import type { QuizRequest } from "@/services/api/request/quizRequest"
import type { QuestionRequest } from "@/services/api/request/questionRequest"
import type { SectionResponse } from "@/services/api/response/sectionResponse"
import { getNextQuizNumberItem } from "@/utils/orderIndexUtils"
import { validateQuiz, type ValidationError } from "@/utils/validationUtils"
import { type CourseObjectiveResponse, getTeacherActiveClos } from "@/services/api/teacher/courseObjectiveApi"
import { useQuizGenerator } from "@/hooks/useQuizGenerator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "react-toastify"

const QuizModalEditor: React.FC<{
  isOpen: boolean
  onClose: () => void
  onSave: (quiz: QuizRequest) => void
  courseId: string
  sectionId: number
  section?: SectionResponse
}> = ({ isOpen, onClose, onSave, courseId, sectionId, section }) => {
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
  const [availableClos, setAvailableClos] = useState<CourseObjectiveResponse[]>([])
  const [blueprintDraft, setBlueprintDraft] = useState<{ cloId: number; percentage: number }[]>([])

  const {
    generationMode,
    setGenerationMode,
    randomQuestionCount,
    setRandomQuestionCount,
    targetScore,
    setTargetScore,
    isGeneratingQuestions,
    generateQuestions,
  } = useQuizGenerator({
    onQuestionsGenerated: (newQuestions) => {
      setQuiz((prev) => {
        const draft = { ...prev }
        draft.questions = [...(draft.questions || []), ...newQuestions]
        return draft
      })
      setErrors((prev) => prev.filter((err) => err.field !== "questions"))
    }
  })

  const filteredClos = useMemo(
    () => availableClos.filter((clo) => clo.courseId === Number(courseId)),
    [availableClos, courseId]
  )

  const totalBlueprintPercentage = useMemo(
    () => blueprintDraft.reduce((sum, row) => sum + (Number(row.percentage) || 0), 0),
    [blueprintDraft]
  )

  const selectedCloIds = useMemo(() => new Set(blueprintDraft.map((row) => row.cloId)), [blueprintDraft])

  useEffect(() => {
    if (!isOpen) return

    const loadClos = async () => {
      try {
        const clos = await getTeacherActiveClos()
        setAvailableClos(clos)
      } catch (error) {
        console.error("Error loading CLOs for quiz draft:", error)
        toast.error("Không thể tải danh sách CĐR cho ma trận")
      }
    }

    loadClos()
  }, [isOpen])

  const addBlueprintRow = () => {
    const firstAvailable = filteredClos.find((clo) => !selectedCloIds.has(clo.id))
    if (!firstAvailable) {
      toast.warning("Tất cả CĐR của khóa học đã được thêm")
      return
    }
    setBlueprintDraft((prev) => [...prev, { cloId: firstAvailable.id, percentage: 0 }])
  }

  const updateBlueprintRow = (index: number, patch: Partial<{ cloId: number; percentage: number }>) => {
    setBlueprintDraft((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)))
  }

  const removeBlueprintRow = (index: number) => {
    setBlueprintDraft((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleGenerateQuestionsByBlueprint = async () => {
    await generateQuestions(
      blueprintDraft,
      totalBlueprintPercentage,
      quiz.questions || [],
      (quiz.questions?.length || 0) + 1
    )
  }

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
    const rawValidationErrors = validateQuiz(quiz)
    const validationErrors = blueprintDraft.length > 0
      ? rawValidationErrors.filter((err) => err.field !== "questions")
      : rawValidationErrors

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    if (blueprintDraft.length > 0 && totalBlueprintPercentage !== 100) {
      setErrors([{ field: "blueprint", message: "Tổng tỷ lệ ma trận CĐR phải bằng 100%." }])
      return
    }

    setIsLoading(true)
    setErrors([])

    try {
      const existingQuizzes = section?.quizs ? Array.from(section.quizs) : []
      const nextQuizNumberItem = getNextQuizNumberItem(existingQuizzes)

      // Extract question IDs for many-to-many relationship
      const questionIds = (quiz.questions || [])
        .filter(q => q.id) // Only include questions with IDs (from library)
        .map(q => q.id!)

      console.log('[QuizModalEditor] Saving quiz with question IDs:', questionIds)

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
        questions: quiz.questions, // Include questions for frontend display
        questionIds, // Send question IDs instead of full question data
        blueprintDraft,
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
      setBlueprintDraft([])
    } catch (err) {
      console.error("Lỗi khi lưu bài kiểm tra:", err)
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
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-blue-700 font-medium">Ma trận CĐR</p>
              <span className={`text-xs font-semibold ${totalBlueprintPercentage === 100 ? "text-green-700" : "text-yellow-700"}`}>
                Tổng: {totalBlueprintPercentage}%
              </span>
            </div>

            {blueprintDraft.length === 0 ? (
              <p className="text-sm text-blue-700">Chưa có cấu hình ma trận. Bạn có thể thêm ngay khi tạo quiz.</p>
            ) : (
              <div className="space-y-2">
                {blueprintDraft.map((row, index) => (
                  <div key={`draft-${index}`} className="grid grid-cols-12 gap-2 items-end bg-white rounded border p-2">
                    <div className="col-span-7 min-w-0">
                      <Label className="text-xs">CĐR</Label>
                      <Select
                        value={String(row.cloId)}
                        onValueChange={(value) => updateBlueprintRow(index, { cloId: Number(value) })}
                      >
                        <SelectTrigger className="w-full bg-white text-left">
                          <SelectValue placeholder="Chọn CĐR" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-[10000]">
                          {filteredClos
                            .filter((clo) => clo.id === row.cloId || !selectedCloIds.has(clo.id))
                            .map((clo) => (
                              <SelectItem key={clo.id} value={String(clo.id)}>
                                {clo.code} - {clo.description || `Khóa học #${clo.courseId}`}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Tỷ lệ (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={row.percentage}
                        onChange={(e) => updateBlueprintRow(index, { percentage: Math.max(0, Number(e.target.value) || 0) })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeBlueprintRow(index)}
                        className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button type="button" variant="outline" onClick={addBlueprintRow}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm CĐR
            </Button>

            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                <Label className="text-xs">Chế độ sinh</Label>
                <Select value={generationMode} onValueChange={(val: any) => setGenerationMode(val)}>
                  <SelectTrigger className="w-full bg-white text-left">
                    <SelectValue placeholder="Chọn chế độ" />
                  </SelectTrigger>
                  <SelectContent className="bg-white z-[10000]">
                    <SelectItem value="count">Theo số lượng câu hỏi</SelectItem>
                    <SelectItem value="score">Theo tổng điểm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-4">
                {generationMode === "count" ? (
                  <>
                    <Label className="text-xs">Số câu cần sinh</Label>
                    <Input
                      type="number"
                      min={1}
                      value={randomQuestionCount}
                      onChange={(e) => setRandomQuestionCount(Math.max(1, Number(e.target.value) || 1))}
                    />
                  </>
                ) : (
                  <>
                    <Label className="text-xs">Tổng điểm mục tiêu</Label>
                    <Input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={targetScore}
                      onChange={(e) => setTargetScore(Math.max(0.5, Number(e.target.value) || 10))}
                    />
                  </>
                )}
              </div>
              <div className="col-span-4">
                <Button
                  type="button"
                  onClick={handleGenerateQuestionsByBlueprint}
                  disabled={isGeneratingQuestions || blueprintDraft.length === 0}
                  className="w-full bg-blue-600 text-white hover:bg-blue-700 h-10"
                >
                  {isGeneratingQuestions ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Sinh câu hỏi"
                  )}
                </Button>
              </div>
            </div>

            <p className="text-xs text-blue-700">
              Sau khi cấu hình ma trận, bạn có thể bấm nút sinh để hệ thống chọn ngẫu nhiên câu hỏi từ ngân hàng theo tỷ lệ CĐR.
            </p>
          </div>
          <QuestionList questions={quiz.questions ?? []} onQuestionsChange={handleQuestionsChange} courseId={Number(courseId)} />
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