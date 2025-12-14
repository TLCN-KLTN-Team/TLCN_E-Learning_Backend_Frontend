"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  AlertTriangle,
  CheckCircle,
  Loader2,
  LayoutGrid,
  LayoutList,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import type { QuestionResponse } from "@/services/api/response/questionResponse"
import quizApi from "@/services/api/student/quizApi"
import type { QuizAnswerSubmission } from "@/services/api/request/quizAttemptRequest"

const QuizTakingPage: React.FC = () => {
  const { quizId} = useParams<{ quizId: string; attemptId: string }>()
  const navigate = useNavigate()

  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [questions, setQuestions] = useState<QuestionResponse[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<number, QuizAnswerSubmission>>(new Map())
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [viewMode, setViewMode] = useState<"single" | "all">("single") // NEW: View mode state
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (quizId) {
      fetchQuizData()
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [quizId])

  useEffect(() => {
    if (quiz && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
      }
    }
  }, [quiz, timeRemaining])

  const fetchQuizData = async () => {
    try {
      const quizData = await quizApi.getQuizDetail(Number(quizId))
      setQuiz(quizData)
      
      if (quizData.questions) {
        const questionsArray = Array.from(quizData.questions).sort(
          (a, b) => a.orderIndex - b.orderIndex
        )
        setQuestions(questionsArray)
      }

      setTimeRemaining(quizData.duration * 60)
    } catch (error) {
      console.error("Error fetching quiz:", error)
      alert("Không thể tải bài kiểm tra")
      navigate(-1)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleAnswerChange = (
    questionId: number,
    answerId?: number,
    answerText?: string,
    answerIds?: number[]
  ) => {
    setAnswers((prev) => {
      const newAnswers = new Map(prev)
      newAnswers.set(questionId, {
        questionId,
        selectedAnswerId: answerId,
        selectedAnswerIds: answerIds,
        answerText,
      })
      return newAnswers
    })
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleQuestionClick = (index: number) => {
    setCurrentQuestionIndex(index)
    setShowSidebar(false)
    
    // Scroll to question if in all view mode
    if (viewMode === "all") {
      const questionElement = document.getElementById(`question-${index}`)
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }

  const isQuestionAnswered = (questionId: number): boolean => {
    const answer = answers.get(questionId)
    return !!(
      answer?.selectedAnswerId || 
      (answer?.selectedAnswerIds && answer.selectedAnswerIds.length > 0) ||
      answer?.answerText
    )
  }

  const getQuestionStatus = (questionId: number): string => {
    if (isQuestionAnswered(questionId)) {
      return "answered"
    }
    return "unanswered"
  }

  const handleAutoSubmit = async () => {
    if (isSubmitting) return
    
    alert("Hết thời gian làm bài! Bài làm của bạn sẽ được tự động nộp.")
    await submitQuiz()
  }

  const handleSubmitClick = () => {
    const unansweredCount = questions.filter(
      (q) => !isQuestionAnswered(q.id)
    ).length

    if (unansweredCount > 0) {
      setShowSubmitConfirm(true)
    } else {
      submitQuiz()
    }
  }

  const submitQuiz = async () => {
    if (!quiz || isSubmitting) return

    try {
      setIsSubmitting(true)

      const timeSpent = (quiz.duration * 60) - timeRemaining

      const answersArray = Array.from(answers.values())

      const result = await quizApi.submitQuizAttempt(Number(quizId), {
        quizId: Number(quizId),
        answers: answersArray,
        timeSpent,
      })

      navigate(`/student/quiz/${quizId}/result/${result.id}`)
    } catch (error) {
      console.error("Error submitting quiz:", error)
      alert("Không thể nộp bài. Vui lòng thử lại.")
      setIsSubmitting(false)
    }
  }

  // NEW: Render single question component
  const renderQuestion = (question: QuestionResponse, index: number) => {
    const currentAnswer = answers.get(question.id)
    
    return (
      <div 
        key={question.id} 
        id={`question-${index}`}
        className="bg-white rounded-lg shadow-sm p-6 mb-6"
      >
        {/* Question Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              {index + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {question.questionType}
                </span>
                <span className="text-xs text-gray-500">
                  Đạt điểm {question.score} trên {question.score}
                </span>
                {isQuestionAnswered(question.id) && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
              </div>
              <p className="text-lg font-medium text-gray-900">
                {question.questionText}
              </p>
            </div>
          </div>

          {/* Question Attachments */}
          {question.attachments && question.attachments.length > 0 && (
            <div className="mb-4 pl-13 space-y-3">
              {question.attachments.map((attachment, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={attachment}
                    alt={`Câu hỏi ${index + 1} - Hình ảnh ${idx + 1}`}
                    className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E"
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answers */}
        <div className="space-y-3 pl-13">
          {question.questionType === "MULTIPLE_CHOICE" ? (
            // Multiple Choice - Use checkboxes
            <>
              {question.answers &&
                Array.from(question.answers)
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((answer) => {
                    const isSelected = currentAnswer?.selectedAnswerIds?.includes(answer.id)
                    return (
                      <label
                        key={answer.id}
                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          name={`question-${question.id}`}
                          value={answer.id}
                          checked={isSelected}
                          onChange={(e) => {
                            const currentIds = currentAnswer?.selectedAnswerIds || []
                            const newIds = e.target.checked
                              ? [...currentIds, answer.id]
                              : currentIds.filter(id => id !== answer.id)
                            handleAnswerChange(question.id, undefined, undefined, newIds)
                          }}
                          className="mt-1 w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="flex-1 text-gray-900">
                          {answer.content}
                        </span>
                      </label>
                    )
                  })}
            </>
          ) : (
            // Single Choice & True/False - Use radio buttons
            <>
              {question.answers &&
                Array.from(question.answers)
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map((answer) => (
                    <label
                      key={answer.id}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        currentAnswer?.selectedAnswerId === answer.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={answer.id}
                        checked={currentAnswer?.selectedAnswerId === answer.id}
                        onChange={() =>
                          handleAnswerChange(question.id, answer.id)
                        }
                        className="mt-1 w-4 h-4 text-blue-600"
                      />
                      <span className="flex-1 text-gray-900">
                        {answer.content}
                      </span>
                    </label>
                  ))}
            </>
          )}
        </div>
      </div>
    )
  }

  if (!quiz || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const answeredCount = questions.filter((q) => isQuestionAnswered(q.id)).length
  const unansweredCount = questions.length - answeredCount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">
                  {viewMode === "single" 
                    ? `Câu hỏi ${currentQuestionIndex + 1}/${questions.length}`
                    : `Tất cả ${questions.length} câu hỏi`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <button
                onClick={() => setViewMode(viewMode === "single" ? "all" : "single")}
                className="hidden md:flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={viewMode === "single" ? "Xem tất cả câu hỏi" : "Xem từng câu"}
              >
                {viewMode === "single" ? (
                  <>
                    <LayoutList className="h-4 w-4" />
                    <span className="text-sm">Xem tất cả</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-4 w-4" />
                    <span className="text-sm">Xem từng câu</span>
                  </>
                )}
              </button>

              {/* Timer */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${
                  timeRemaining < 300
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                <Clock className="h-5 w-5" />
                {formatTime(timeRemaining)}
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleSubmitClick}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang nộp...
                  </>
                ) : (
                  "Nộp bài"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1">
            {viewMode === "single" ? (
              // Single Question View
              <>
                {renderQuestion(currentQuestion, currentQuestionIndex)}

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    variant="outline"
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Câu trước
                  </Button>
                  <Button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    variant="outline"
                  >
                    Câu tiếp
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              // All Questions View
              <div className="space-y-6">
                {questions.map((question, index) => renderQuestion(question, index))}
                
              </div>
            )}
          </div>

          {/* Sidebar - Question Navigator */}
          <div
            className={`${
              showSidebar ? "fixed inset-0 z-50 lg:relative" : "hidden lg:block"
            } lg:w-80`}
          >
            <div
              className={`${
                showSidebar ? "absolute right-0 top-0 h-full w-80" : ""
              } bg-white rounded-lg shadow-sm p-6`}
            >
              {showSidebar && (
                <button
                  onClick={() => setShowSidebar(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded lg:hidden"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              <h3 className="font-semibold text-lg mb-4">Bảng câu hỏi</h3>

              <div className="mb-4 p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-600">
                  <CheckCircle className="inline h-4 w-4 text-green-600 mr-1" />
                  Đã trả lời: {answeredCount}/{questions.length}
                </p>
                {unansweredCount > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    <AlertTriangle className="inline h-4 w-4 text-orange-600 mr-1" />
                    Chưa trả lời: {unansweredCount}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, index) => {
                  const status = getQuestionStatus(question.id)
                  const isActive = index === currentQuestionIndex && viewMode === "single"

                  return (
                    <button
                      key={question.id}
                      onClick={() => handleQuestionClick(index)}
                      className={`
                        aspect-square rounded flex items-center justify-center font-medium text-sm
                        ${isActive ? "ring-2 ring-blue-600 ring-offset-2" : ""}
                        ${
                          status === "answered"
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-300"
                        }
                      `}
                    >
                      {index + 1}
                    </button>
                  )
                })}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  Chế độ xem
                </p>
                <button
                  onClick={() => setViewMode(viewMode === "single" ? "all" : "single")}
                  className="w-full text-sm bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition-colors"
                >
                  {viewMode === "single" ? (
                    <>
                      <LayoutList className="inline h-4 w-4 mr-2" />
                      Xem tất cả câu hỏi
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="inline h-4 w-4 mr-2" />
                      Xem từng câu
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-lg mb-2">Xác nhận nộp bài</h3>
                <p className="text-gray-600 text-sm">
                  Bạn còn <strong>{unansweredCount}</strong> câu hỏi chưa trả lời.
                  Bạn có chắc chắn muốn nộp bài không?
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSubmitConfirm(false)}
              >
                Tiếp tục làm bài
              </Button>
              <Button
                onClick={() => {
                  setShowSubmitConfirm(false)
                  submitQuiz()
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                Nộp bài ngay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuizTakingPage