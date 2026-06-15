"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
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
  Flag,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import type { QuestionResponse } from "@/services/api/response/questionResponse"
import * as quizApi from "@/services/api/student/quizApi"
import type { QuizAnswerSubmission } from "@/services/api/request/quizAttemptRequest"

const QuizTakingPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string; attemptId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const returnPath = location.state?.returnPath

  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [questions, setQuestions] = useState<QuestionResponse[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<number, QuizAnswerSubmission>>(new Map())
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [viewMode, setViewMode] = useState<"single" | "all">("single")
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  // Map question types to Vietnamese
  const getQuestionTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      MULTIPLE_CHOICE: "Nhiều đáp án",
      TRUE_FALSE: "Đúng/Sai",
      SINGLE_CHOICE: "Một đáp án",
      FILL_IN_THE_BLANK: "Điền khuyết",
    }
    return typeMap[type] || type
  }

  const toggleQuestionFlag = (questionId: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  useEffect(() => {
    if (quizId) {
      // Try to restore from localStorage first
      const savedState = localStorage.getItem(`quiz-taking-${quizId}`)
      if (savedState) {
        try {
          const { answers: savedAnswers, timeRemaining: savedTimeRemaining, timestamp, flaggedQuestions: savedFlagged, shuffledQuestions: savedShuffledQuestions } = JSON.parse(savedState)
          const elapsed = Math.floor((Date.now() - timestamp) / 1000)
          const newTimeRemaining = Math.max(0, savedTimeRemaining - elapsed)

          if (newTimeRemaining > 0) {
            console.log('🔄 Restoring quiz state from localStorage')
            // Restore answers
            const answersMap = new Map()
            savedAnswers.forEach((answer: QuizAnswerSubmission) => {
              answersMap.set(answer.questionId, answer)
            })
            setAnswers(answersMap)
            setTimeRemaining(newTimeRemaining)
            // Restore flagged questions
            if (savedFlagged) {
              setFlaggedQuestions(new Set(savedFlagged))
            }

            // Still need to load quiz data
            fetchQuizData(true, savedShuffledQuestions) // Pass flag to skip time reset and pass saved shuffled questions
            return
          } else {
            // Clear expired state
            localStorage.removeItem(`quiz-taking-${quizId}`)
          }
        } catch (err) {
          console.error('Error restoring quiz state:', err)
        }
      }

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

  // Save state to localStorage
  useEffect(() => {
    if (quizId && quiz && timeRemaining > 0) {
      const state = {
        answers: Array.from(answers.values()),
        timeRemaining,
        timestamp: Date.now(),
        flaggedQuestions: Array.from(flaggedQuestions),
        shuffledQuestions: questions
      }
      localStorage.setItem(`quiz-taking-${quizId}`, JSON.stringify(state))
    }
  }, [quizId, quiz, answers, timeRemaining, flaggedQuestions, questions])

  const fetchQuizData = async (skipTimeReset = false, savedQuestions?: QuestionResponse[]) => {
    try {
      const quizData = await quizApi.getQuizDetail(Number(quizId))
      setQuiz(quizData)

      if (savedQuestions && savedQuestions.length > 0) {
        setQuestions(savedQuestions)
      } else if (quizData.questions) {
        let questionsArray = Array.from(quizData.questions)
        questionsArray = shuffleArray(questionsArray)
        
        questionsArray.forEach(q => {
          if (q.answers) {
            q.answers = new Set(shuffleArray(Array.from(q.answers))) as any
          }
        })
        
        setQuestions(questionsArray)
      }

      // Only reset time if not restoring from localStorage
      if (!skipTimeReset) {
        setTimeRemaining(quizData.duration * 60)
      }
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

      console.log('📤 Submitting quiz answers:')
      console.log('- Total answers:', answersArray.length)
      console.log('- Answers detail:', answersArray)
      answersArray.forEach(answer => {
        if (answer.selectedAnswerIds && answer.selectedAnswerIds.length > 0) {
          console.log(`  Question ${answer.questionId} (FILL_IN_THE_BLANK):`, answer.selectedAnswerIds)
        }
      })

      const result = await quizApi.submitQuizAttempt(Number(quizId), {
        quizId: Number(quizId),
        answers: answersArray,
        timeSpent,
      })

      // Clear localStorage after successful submit
      localStorage.removeItem(`quiz-taking-${quizId}`)
      console.log('🗑️ Cleared quiz state from localStorage')

      navigate(`/student/quiz/${quizId}/result/${result.id}`, {
        state: { returnPath }
      })
    } catch (error) {
      console.error("Error submitting quiz:", error)
      alert("Không thể nộp bài. Vui lòng thử lại.")
      setIsSubmitting(false)
    }
  }

  const renderFillInTheBlankQuestion = (question: QuestionResponse) => {
    const currentAnswer = answers.get(question.id)
    const blankAnswerMap = currentAnswer?.selectedAnswerIds || []

    const partRegex = /(\[[_\s]*\d+[_\s]*\])/g
    const parts = question.questionText.split(partRegex)
    let blankCounter = 0

    const getAnswerForBlank = (blankIndex: number): string | undefined => {
      const answerId = blankAnswerMap[blankIndex]
      if (!answerId) return undefined
      const answer = Array.from(question.answers || []).find((a) => a.id === answerId)
      return answer?.content
    }

    const handleDropOnBlank = (blankIndex: number, e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const answerId = parseInt(e.dataTransfer.getData("answerId"))
      const sourceBlankIndex = e.dataTransfer.getData("sourceBlankIndex")

      if (answerId) {
        const newAnswerIds = [...blankAnswerMap]
        while (newAnswerIds.length <= blankIndex) {
          newAnswerIds.push(0);
        }

        if (sourceBlankIndex !== "") {
          const srcIdx = parseInt(sourceBlankIndex)
          while (newAnswerIds.length <= srcIdx) {
            newAnswerIds.push(0);
          }
        }

        if (sourceBlankIndex !== "" && sourceBlankIndex !== null) {
          const sourceIndex = parseInt(sourceBlankIndex)
          if (!isNaN(sourceIndex) && sourceIndex !== blankIndex) {
            newAnswerIds[sourceIndex] = 0
          }
        }

        newAnswerIds[blankIndex] = answerId
        handleAnswerChange(question.id, undefined, undefined, newAnswerIds)
      }
    }

    const handleDragStart = (answerId: number, e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = "copy"
      e.dataTransfer.setData("answerId", answerId.toString())
      e.dataTransfer.setData("sourceBlankIndex", "")
    }

    const handleDragStartFromBlank = (answerId: number, blankIndex: number, e: React.DragEvent) => {
      e.stopPropagation()
      e.dataTransfer.effectAllowed = "copy"
      e.dataTransfer.setData("answerId", answerId.toString())
      e.dataTransfer.setData("sourceBlankIndex", blankIndex.toString())
    }

    const handleRemoveFromBlank = (blankIndex: number) => {
      const newAnswerIds = [...blankAnswerMap]
      newAnswerIds[blankIndex] = 0
      handleAnswerChange(question.id, undefined, undefined, newAnswerIds)
    }

    const usedAnswerIds = new Set(blankAnswerMap.filter(id => id !== 0 && id !== undefined))

    return (
      <div className="space-y-8 pl-0 md:pl-2">
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm leading-10 text-lg">
          {parts.map((part, index) => {
            if (part.match(partRegex)) {
              const currentBlankIndex = blankCounter++
              const answerText = getAnswerForBlank(currentBlankIndex)

              return (
                <span
                  key={index}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.dataTransfer.dropEffect = "copy"
                  }}
                  onDrop={(e) => handleDropOnBlank(currentBlankIndex, e)}
                  className={`
                    inline-flex items-center justify-center align-middle mx-1.5 px-3 py-1
                    min-w-[120px] min-h-[40px] h-auto rounded-md border-2 transition-all select-none
                    ${answerText
                      ? "bg-blue-100 border-blue-500 text-blue-800"
                      : "bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:bg-blue-50"
                    }
                  `}
                >
                  {answerText ? (
                    <span
                      draggable
                      onDragStart={(e) => {
                        const answerId = blankAnswerMap[currentBlankIndex]
                        if (answerId) {
                          handleDragStartFromBlank(answerId, currentBlankIndex, e)
                        }
                      }}
                      className="flex items-center gap-1 font-medium text-base whitespace-normal break-words text-center cursor-grab active:cursor-grabbing w-full justify-center h-full"
                    >
                      {answerText}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveFromBlank(currentBlankIndex)
                        }}
                        className="ml-1 p-0.5 hover:bg-blue-200 rounded-full text-blue-600 transition-colors"
                        title="Xóa"
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ) : (
                    <span className="text-sm pointer-events-none text-gray-400">
                      ({currentBlankIndex + 1})
                    </span>
                  )}
                </span>
              )
            }
            return <span key={index} className="text-gray-800 align-middle">{part}</span>
          })}
        </div>

        <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Kéo đáp án vào ô trống tương ứng
          </p>
          <div className="flex flex-wrap gap-3">
            {question.answers &&
              Array.from(question.answers)
                .map((answer) => {
                  const isUsed = usedAnswerIds.has(answer.id)
                  return (
                    <div
                      key={answer.id}
                      draggable={!isUsed}
                      onDragStart={(e) => !isUsed && handleDragStart(answer.id, e)}
                      className={`
                        px-4 py-2 rounded-lg font-medium text-sm transition-all border select-none
                        ${isUsed
                          ? "bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
                          : "bg-white text-gray-700 border-gray-300 shadow-sm hover:shadow-md hover:border-blue-400 hover:text-blue-600 cursor-grab active:cursor-grabbing"
                        }
                      `}
                    >
                      {answer.content}
                    </div>
                  )
                })}
          </div>
        </div>
      </div>
    )
  }

  const renderQuestion = (question: QuestionResponse, index: number) => {
    if (question.questionType === "FILL_IN_THE_BLANK") {
      return (
        <div
          key={question.id}
          id={`question-${index}`}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <span className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {getQuestionTypeLabel(question.questionType)}
                  </span>
                  <span className="text-xs text-gray-500">
                    Điểm {question.score}
                  </span>
                  {isQuestionAnswered(question.id) && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <button
                    onClick={() => toggleQuestionFlag(question.id)}
                    className={`ml-auto p-1.5 rounded hover:bg-gray-100 transition-colors ${flaggedQuestions.has(question.id) ? 'text-red-600' : 'text-gray-400'
                      }`}
                    title={flaggedQuestions.has(question.id) ? 'Bỏ đánh dấu' : 'Đánh dấu câu hỏi'}
                  >
                    <Flag className="h-5 w-5" fill={flaggedQuestions.has(question.id) ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {renderFillInTheBlankQuestion(question)}
        </div>
      )
    }

    const currentAnswer = answers.get(question.id)

    return (
      <div
        key={question.id}
        id={`question-${index}`}
        className="bg-white rounded-lg shadow-sm p-6 mb-6"
      >
        <div className="mb-6">
          <div className="flex items-start gap-3 mb-4">
            <span className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
              {index + 1}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                  {getQuestionTypeLabel(question.questionType)}
                </span>
                <span className="text-xs text-gray-500">
                  Điểm {question.score}
                </span>
                {isQuestionAnswered(question.id) && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                <button
                  onClick={() => toggleQuestionFlag(question.id)}
                  className={`ml-auto p-1.5 rounded hover:bg-gray-100 transition-colors ${flaggedQuestions.has(question.id) ? 'text-red-600' : 'text-gray-400'
                    }`}
                  title={flaggedQuestions.has(question.id) ? 'Bỏ đánh dấu' : 'Đánh dấu câu hỏi'}
                >
                  <Flag className="h-5 w-5" fill={flaggedQuestions.has(question.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <p className="text-lg font-medium text-gray-900">
                {question.questionText}
              </p>
            </div>
          </div>

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

        <div className="space-y-3 pl-13">
          {question.questionType === "MULTIPLE_CHOICE" ? (
            <>
              {question.answers &&
                Array.from(question.answers)
                  .map((answer) => {
                    const isSelected = currentAnswer?.selectedAnswerIds?.includes(answer.id)
                    return (
                      <label
                        key={answer.id}
                        className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected
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
            <>
              {question.answers &&
                Array.from(question.answers)
                  .map((answer) => (
                    <label
                      key={answer.id}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${currentAnswer?.selectedAnswerId === answer.id
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

              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold text-lg ${timeRemaining < 300
                  ? "bg-red-100 text-red-700"
                  : "bg-blue-100 text-blue-700"
                  }`}
              >
                <Clock className="h-5 w-5" />
                {formatTime(timeRemaining)}
              </div>

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
          <div className="flex-1">
            {viewMode === "single" ? (
              <>
                {renderQuestion(currentQuestion, currentQuestionIndex)}

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
              <div className="space-y-6">
                {questions.map((question, index) => renderQuestion(question, index))}
              </div>
            )}
          </div>

          <div
            className={`${showSidebar ? "fixed inset-0 z-50 lg:relative" : "hidden lg:block"
              } lg:w-80`}
          >
            <div
              className={`${showSidebar ? "absolute right-0 top-0 h-full w-80" : ""
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
                  const isFlagged = flaggedQuestions.has(question.id)

                  return (
                    <button
                      key={question.id}
                      onClick={() => handleQuestionClick(index)}
                      className={`
                        aspect-square rounded flex items-center justify-center font-medium text-sm relative
                        ${isActive ? "ring-2 ring-blue-600 ring-offset-2" : ""}
                        ${status === "answered"
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-white border-2 border-gray-300 text-gray-700 hover:border-blue-300"
                        }
                      `}
                    >
                      {index + 1}
                      {isFlagged && (
                        <Flag className="h-3 w-3 text-red-500 absolute -top-1 -right-1" fill="currentColor" />
                      )}
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                className="bg-green-600 hover:bg-green-700 text-white"
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