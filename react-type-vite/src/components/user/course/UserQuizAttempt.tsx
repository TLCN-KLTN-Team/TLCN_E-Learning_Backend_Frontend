import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import userQuizApi from '@/services/api/user/userQuizApi'
import type { QuizResponse } from '@/services/api/response/quizResponse'
import type { QuestionResponse } from '@/services/api/response/questionResponse'
import type { AnswerResponse } from '@/services/api/response/answerResponse'
import type { QuizAttemptHistoryResponse } from '@/services/api/response/quizAttemptHistoryResponse'
import type { QuizAttemptResponse } from '@/services/api/response/quizAttemptResponse'
import type { QuizAnswerSubmission } from '@/services/api/request/quizAttemptRequest'
import { Clock, CheckCircle, XCircle, Award, History, ChevronLeft, ChevronRight, LayoutGrid, LayoutList, X, Eye, EyeOff, Flag, AlertTriangle } from 'lucide-react'

type ViewMode = 'history' | 'taking' | 'result'
type QuizViewMode = 'single' | 'all'

interface UserAnswer {
  questionId: number
  selectedAnswerId?: number
  selectedAnswerIds?: number[]
  answerText?: string
}

interface Props {
  quizIdProp?: number
  onQuizCompleted?: () => void
  onExit?: () => void
}

export default function UserQuizAttempt({ quizIdProp, onQuizCompleted, onExit }: Props = {}) {
  const { quizId: quizIdParam } = useParams<{ quizId: string }>()
  const quizId = quizIdProp ? String(quizIdProp) : quizIdParam
  const navigate = useNavigate()

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  }

  const [viewMode, setViewMode] = useState<ViewMode>('taking')
  const [quizViewMode, setQuizViewMode] = useState<QuizViewMode>('single')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [attemptHistory, setAttemptHistory] = useState<QuizAttemptHistoryResponse[]>([])
  const [currentAttemptId, setCurrentAttemptId] = useState<number | null>(null)
  const [userAnswers, setUserAnswers] = useState<Map<number, UserAnswer>>(new Map())
  const [attemptResult, setAttemptResult] = useState<QuizAttemptResponse | null>(null)
  const [showAnswerReview, setShowAnswerReview] = useState(false)
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set())
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)

  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [timeSpent, setTimeSpent] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (quizId) {
      const savedState = localStorage.getItem(`quiz-attempt-${quizId}`)
      if (savedState) {
        try {
          const { attemptId, timeLeft: savedTimeLeft, answers, timestamp, flaggedQuestions: savedFlagged, shuffledQuestions: savedShuffledQuestions } = JSON.parse(savedState)
          const elapsed = Math.floor((Date.now() - timestamp) / 1000)
          const newTimeLeft = Math.max(0, savedTimeLeft - elapsed)

          if (newTimeLeft > 0 && attemptId) {
            setCurrentAttemptId(attemptId)
            setTimeLeft(newTimeLeft)
            setTimeSpent(elapsed)
            setViewMode('taking')

            const answersMap = new Map()
            answers.forEach((a: any) => {
              answersMap.set(a.questionId, a)
            })
            setUserAnswers(answersMap)
            // Restore flagged questions
            if (savedFlagged) {
              setFlaggedQuestions(new Set(savedFlagged))
            }

            loadQuizData(true, savedShuffledQuestions)
            return
          } else {
            localStorage.removeItem(`quiz-attempt-${quizId}`)
          }
        } catch (err) {
          console.error('Error restoring quiz state:', err)
        }
      }

      loadQuizData()
    }
  }, [quizId])

  useEffect(() => {
    if (viewMode === 'taking') {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) return 0
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
        setTimeSpent(prev => prev + 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [viewMode])

  useEffect(() => {
    if (viewMode === 'taking' && currentAttemptId && quizId && quiz) {
      const state = {
        attemptId: currentAttemptId,
        timeLeft,
        answers: Array.from(userAnswers.values()),
        timestamp: Date.now(),
        flaggedQuestions: Array.from(flaggedQuestions),
        shuffledQuestions: Array.from(quiz.questions)
      }
      localStorage.setItem(`quiz-attempt-${quizId}`, JSON.stringify(state))
    }
  }, [viewMode, currentAttemptId, timeLeft, userAnswers, quizId, flaggedQuestions, quiz])

  useEffect(() => {
    if (viewMode === 'result' && attemptResult) {
      setShowAnswerReview(true)
    } else if (viewMode !== 'result') {
      setShowAnswerReview(false)
    }
  }, [viewMode, attemptResult])

  const loadQuizData = async (skipAutoStart = false, savedQuestions?: QuestionResponse[]) => {
    try {
      setLoading(true)
      console.log('🔄 Đang load quiz với ID:', quizId)
      const [quizData, history] = await Promise.all([
        userQuizApi.getQuizDetail(Number(quizId)),
        userQuizApi.getQuizAttemptHistory(Number(quizId))
      ])

      console.log('✅ Quiz data nhận được:', quizData)
      console.log('📝 Chi tiết questions:', quizData.questions)
      console.log('📜 Lịch sử attempts:', history)

      if (savedQuestions && savedQuestions.length > 0) {
        quizData.questions = new Set(savedQuestions)
      } else if (quizData.questions) {
        let questionsArray = Array.from(quizData.questions)
        questionsArray = shuffleArray(questionsArray)
        questionsArray.forEach(q => {
          if (q.answers) {
            q.answers = new Set(shuffleArray(Array.from(q.answers))) as any
          }
        })
        quizData.questions = new Set(questionsArray)
      }

      setQuiz(quizData)
      setAttemptHistory(history)

      if (skipAutoStart) {
        return
      }

      // if (quizData.attemptLimit > 0 && history.length >= quizData.attemptLimit) {
      //   toast.error(`Bạn đã hết số lần làm bài (${quizData.attemptLimit} lần)`)
      //   return
      // }

      const { attemptId } = await userQuizApi.startQuizAttempt(Number(quizId))
      setCurrentAttemptId(attemptId)
      setViewMode('taking')
      setTimeLeft(quizData.duration * 60)
      setTimeSpent(0)
      setUserAnswers(new Map())
      toast.success('Bắt đầu làm bài!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải dữ liệu quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleStartQuiz = async () => {
    if (!quiz) return
    console.log('🎯 Bắt đầu quiz attempt cho quiz ID:', quizId)
    console.log('📊 Quiz hiện tại:', quiz)

    // if (quiz.attemptLimit > 0 && attemptHistory.length >= quiz.attemptLimit) {
    //   toast.error(`Bạn đã hết số lần làm bài (${quiz.attemptLimit} lần)`)
    //   return
    // }

    try {
      setLoading(true)
      const { attemptId } = await userQuizApi.startQuizAttempt(Number(quizId))
      console.log('✅ Attempt ID nhận được:', attemptId)
      setCurrentAttemptId(attemptId)
      setViewMode('taking')
      setTimeLeft(quiz.duration * 60)
      setTimeSpent(0)
      setUserAnswers(new Map())
      toast.success('Bắt đầu làm bài!')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể bắt đầu quiz')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: number, question: QuestionResponse, value: string | number | number[]) => {
    const newAnswers = new Map(userAnswers)

    if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
      newAnswers.set(questionId, {
        questionId,
        selectedAnswerId: Number(value)
      })
    } else if (question.questionType === 'MULTIPLE_CHOICE') {
      const current = newAnswers.get(questionId)?.selectedAnswerIds || []
      const answerId = Number(value)
      const newSelected = current.includes(answerId)
        ? current.filter(id => id !== answerId)
        : [...current, answerId]

      newAnswers.set(questionId, {
        questionId,
        selectedAnswerIds: newSelected
      })
    } else if (question.questionType === 'FILL_IN_THE_BLANK') {
      newAnswers.set(questionId, {
        questionId,
        selectedAnswerIds: Array.isArray(value) ? value : []
      })
    } else if (question.questionType === 'ESSAY') {
      newAnswers.set(questionId, {
        questionId,
        answerText: String(value)
      })
    }

    setUserAnswers(newAnswers)
  }

  const submitQuiz = async () => {
    if (!quiz) return
    if (!currentAttemptId) {
      toast.error("Không tìm thấy ID bài làm. Vui lòng tải lại trang!")
      return
    }

    try {
      setSubmitting(true)

      const answers: QuizAnswerSubmission[] = Array.from(userAnswers.values()).map(answer => ({
        questionId: answer.questionId,
        selectedAnswerId: answer.selectedAnswerId,
        selectedAnswerIds: answer.selectedAnswerIds,
        answerText: answer.answerText
      }))

      const result = await userQuizApi.submitQuizAttempt(Number(quizId), {
        quizId: Number(quizId),
        answers,
        timeSpent
      })

      localStorage.removeItem(`quiz-attempt-${quizId}`)

      const courseKeys = Object.keys(localStorage).filter(key => key.startsWith('course-learning-'))
      courseKeys.forEach(key => localStorage.removeItem(key))

      setAttemptResult(result)
      setViewMode('result')
      toast.success('Nộp bài thành công!')

      if (onQuizCompleted) {
        onQuizCompleted()
      }

      const history = await userQuizApi.getQuizAttemptHistory(Number(quizId))
      setAttemptHistory(history)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể nộp bài')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitQuiz = () => {
    if (!quiz || submitting) return

    const questionsArray = Array.from(quiz.questions)
    const unanswered = questionsArray.filter(q => !userAnswers.has(q.id))

    if (unanswered.length > 0) {
      setShowSubmitConfirm(true)
      return
    }

    submitQuiz()
  }

  const handleAutoSubmit = () => {
    toast('Hết giờ! Tự động nộp bài...', { icon: '⏰' })
    submitQuiz()
  }

  const handleViewAttemptResult = async (attemptNumber: number) => {
    try {
      setLoading(true)
      const attempt = attemptHistory[attemptNumber - 1]
      if (!attempt) {
        toast.error('Không tìm thấy thông tin lần làm bài')
        return
      }
      toast('Tính năng xem chi tiết kết quả đang được cập nhật', { icon: 'ℹ️' })
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xem kết quả')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getAnsweredCount = () => {
    if (!quiz) return 0
    return userAnswers.size
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

  if (loading && !quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  if (!quiz) return null

  // History View
  if (viewMode === 'history') {
    const questionsArray = Array.from(quiz.questions)
    const canStartNewAttempt = true // quiz.attemptLimit === 0 || attemptHistory.length < quiz.attemptLimit

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto py-8 px-4 max-w-5xl">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => onExit ? onExit() : navigate(-1)}
              className="text-gray-600 hover:text-gray-900 -ml-2"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Quay lại khóa học
            </Button>
          </div>

          <Card className="shadow-xl border-0 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-6">
              <CardTitle className="text-3xl text-white mb-2">{quiz.title}</CardTitle>
              {quiz.description && (
                <CardDescription className="text-purple-100 text-base">
                  {quiz.description}
                </CardDescription>
              )}
            </div>

            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200">
                  <Clock className="h-6 w-6 text-blue-600 mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Thời gian</p>
                  <p className="text-2xl font-bold text-gray-900">{quiz.duration}</p>
                  <p className="text-xs text-gray-500">phút</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-xl border border-purple-200">
                  <History className="h-6 w-6 text-purple-600 mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Số lần làm</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {attemptHistory.length}/{quiz.attemptLimit === 0 ? '∞' : quiz.attemptLimit}
                  </p>
                  <p className="text-xs text-gray-500">lần</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-xl border border-green-200">
                  <Award className="h-6 w-6 text-green-600 mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Điểm qua</p>
                  <p className="text-2xl font-bold text-gray-900">{quiz.passingScore}</p>
                  <p className="text-xs text-gray-500">%</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-5 rounded-xl border border-orange-200">
                  <CheckCircle className="h-6 w-6 text-orange-600 mb-2" />
                  <p className="text-xs text-gray-600 mb-1">Số câu hỏi</p>
                  <p className="text-2xl font-bold text-gray-900">{questionsArray.length}</p>
                  <p className="text-xs text-gray-500">câu</p>
                </div>
              </div>

              {attemptHistory.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-purple-600" />
                    Lịch sử làm bài
                  </h3>
                  <div className="space-y-3">
                    {attemptHistory.map((attempt, index) => (
                      <Card
                        key={index}
                        className="border-l-4 hover:shadow-md transition-shadow"
                        style={{ borderLeftColor: attempt.isPassed ? '#10b981' : '#ef4444' }}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-lg font-bold text-gray-900">
                                  Lần {attempt.attemptNumber}
                                </span>
                                {attempt.isPassed ? (
                                  <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                                    <CheckCircle className="h-4 w-4" />
                                    Đạt
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                                    <XCircle className="h-4 w-4" />
                                    Không đạt
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-6 text-sm text-gray-600">
                                <span className="font-medium">
                                  Điểm: <span className="text-gray-900">{attempt.score}/{attempt.totalScore}</span>
                                </span>
                                <span>Thời gian: {formatTime(attempt.timeSpent)}</span>
                                <span>{new Date(attempt.submittedAt).toLocaleString('vi-VN')}</span>
                              </div>
                            </div>
                            {quiz.showResults && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewAttemptResult(attempt.attemptNumber)}
                                className="ml-4"
                              >
                                Xem chi tiết
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {canStartNewAttempt ? (
                <Button
                  onClick={handleStartQuiz}
                  disabled={loading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 text-lg font-semibold shadow-lg"
                >
                  {attemptHistory.length === 0 ? 'Bắt đầu làm bài' : 'Làm bài lần nữa'}
                </Button>
              ) : (
                <Alert className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800">
                    Bạn đã hết số lần làm bài cho quiz này
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Taking Quiz View
  if (viewMode === 'taking') {
    const questionsArray = Array.from(quiz.questions)

    console.log('📝 Rendering questions:')
    console.log('- Tổng số questions:', questionsArray.length)
    console.log('- Questions array:', questionsArray)
    console.log('- Current question index:', currentQuestionIndex)
    console.log('- Current question:', questionsArray[currentQuestionIndex])

    const answeredCount = getAnsweredCount()
    const unansweredCount = questionsArray.length - answeredCount
    const currentQuestion = questionsArray[currentQuestionIndex]

    const handlePreviousQuestion = () => {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1)
      }
    }

    const handleNextQuestion = () => {
      if (currentQuestionIndex < questionsArray.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
      }
    }

    const handleQuestionClick = (index: number) => {
      setCurrentQuestionIndex(index)

      if (quizViewMode === 'all') {
        const questionElement = document.getElementById(`question-${index}`)
        if (questionElement) {
          questionElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
    }

    const renderFillInTheBlankQuestion = (question: QuestionResponse) => {
      const userAnswer = userAnswers.get(question.id)
      const blankAnswerMap = userAnswer?.selectedAnswerIds || []
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
            newAnswerIds.push(0)
          }

          if (sourceBlankIndex !== "") {
            const srcIdx = parseInt(sourceBlankIndex)
            while (newAnswerIds.length <= srcIdx) {
              newAnswerIds.push(0)
            }
          }

          if (sourceBlankIndex !== "" && sourceBlankIndex !== null) {
            const sourceIndex = parseInt(sourceBlankIndex)
            if (!isNaN(sourceIndex) && sourceIndex !== blankIndex) {
              newAnswerIds[sourceIndex] = 0
            }
          }

          newAnswerIds[blankIndex] = answerId
          handleAnswerChange(question.id, question, newAnswerIds)
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
        handleAnswerChange(question.id, question, newAnswerIds)
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
                          onMouseDown={(e) => e.stopPropagation()}
                          className="ml-1 p-0.5 hover:bg-blue-200 rounded-full text-blue-600 transition-colors"
                          title="Xóa"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ) : (
                      <span className="text-sm pointer-events-none">
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
              {question.answers && Array.from(question.answers).map((answer) => {
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

    const renderQuestion = (question: QuestionResponse, qIndex: number) => {
      console.log(`🔍 === Render question ${qIndex + 1} ===`)
      console.log('Question object:', question)
      console.log('Question.answers type:', typeof question.answers)
      console.log('Question.answers:', question.answers)
      console.log('Is array?', Array.isArray(question.answers))
      const answersArray = Array.from(question.answers)

      console.log('answersArray sau khi sort:', answersArray)
      console.log('answersArray length:', answersArray.length)
      const userAnswer = userAnswers.get(question.id)
      console.log('User answer hiện tại:', userAnswer)

      // Handle FILL_IN_THE_BLANK separately
      if (question.questionType === 'FILL_IN_THE_BLANK') {
        return (
          <div
            key={question.id}
            id={`question-${qIndex}`}
            className="bg-white rounded-lg border p-6 mb-6"
          >
            {/* Question Header */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                  {qIndex + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Điền khuyết
                    </span>
                    <span className="text-xs text-gray-500">Điểm {question.score}</span>
                    {userAnswers.has(question.id) && (
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

            {/* Fill in the Blank Content */}
            {renderFillInTheBlankQuestion(question)}
          </div>
        )
      }

      return (
        <div
          key={question.id}
          id={`question-${qIndex}`}
          className="bg-white rounded-lg border p-6 mb-6"
        >
          {/* Question Header */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-lg font-bold">
                {qIndex + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {question.questionType === 'SINGLE_CHOICE' ? 'Một đáp án' : question.questionType === 'MULTIPLE_CHOICE' ? 'Nhiều đáp án' : 'Đúng/Sai'}
                  </span>
                  <span className="text-xs text-gray-500">Điểm {question.score}</span>
                  {userAnswers.has(question.id) && (
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
                <p className="text-gray-900 text-base">{question.questionText}</p>
                {question.attachments && question.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {question.attachments.map((url: string, i: number) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Attachment ${i + 1}`}
                        className="max-w-full h-auto rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Answers */}
          <div>
            {(question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') && (
              <RadioGroup
                value={userAnswer?.selectedAnswerId?.toString()}
                onValueChange={(value: string) => handleAnswerChange(question.id, question, value)}
              >
                <div className="space-y-2">
                  {answersArray.map((answer: AnswerResponse) => (
                    <Label
                      key={answer.id}
                      htmlFor={`q${question.id}-a${answer.id}`}
                      className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <RadioGroupItem
                        value={answer.id.toString()}
                        id={`q${question.id}-a${answer.id}`}
                        className="mr-3"
                      />
                      <span className="flex-1 text-gray-700">
                        {answer.content}
                      </span>
                    </Label>
                  ))}
                </div>
              </RadioGroup>
            )}

            {question.questionType === 'MULTIPLE_CHOICE' && (
              <div className="space-y-2">
                {answersArray.map((answer: AnswerResponse) => {
                  const isChecked = userAnswer?.selectedAnswerIds?.includes(answer.id) || false
                  return (
                    <Label
                      key={answer.id}
                      htmlFor={`q${question.id}-a${answer.id}`}
                      className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
                    >
                      <Checkbox
                        id={`q${question.id}-a${answer.id}`}
                        checked={isChecked}
                        className="mr-3"
                        onCheckedChange={() => handleAnswerChange(question.id, question, answer.id)}
                      />
                      <span className="flex-1 text-gray-700">
                        {answer.content}
                      </span>
                    </Label>
                  )
                })}
              </div>
            )}

            {question.questionType === 'ESSAY' && (
              <textarea
                className="w-full min-h-[150px] p-3 border rounded focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-y"
                placeholder="Nhập câu trả lời của bạn..."
                value={userAnswer?.answerText || ''}
                onChange={(e) => handleAnswerChange(question.id, question, e.target.value)}
              />
            )}
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white border-b px-6 py-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
              <p className="text-sm text-gray-500">
                {quizViewMode === 'single'
                  ? `Câu hỏi ${currentQuestionIndex + 1}/${questionsArray.length}`
                  : `Tất cả ${questionsArray.length} câu hỏi`
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Toggle */}
              <button
                onClick={() => setQuizViewMode(quizViewMode === 'single' ? 'all' : 'single')}
                className="hidden md:flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {quizViewMode === 'single' ? (
                  <>
                    <LayoutList className="h-4 w-4" />
                    <span>Xem tất cả</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-4 w-4" />
                    <span>Xem từng câu</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-5 w-5" />
                <span className="text-lg font-semibold">
                  {quiz.duration === 0 ? formatTime(timeSpent) : formatTime(timeLeft)}
                </span>
              </div>
              <Button
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6"
              >
                Nộp bài
              </Button>
            </div>
          </div>
        </div>

        <div className="flex max-w-7xl mx-auto">
          {/* Main Content */}
          <div className="flex-1 p-6">
            {quizViewMode === 'single' ? (
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
                    disabled={currentQuestionIndex === questionsArray.length - 1}
                    variant="outline"
                  >
                    Câu tiếp
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-6">
                {questionsArray.map((question, index) => renderQuestion(question, index))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-80 p-6 bg-white border-l">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Bảng câu hỏi</h3>
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    <span className="text-gray-700">Đã trả lời:</span>
                  </span>
                  <span className="font-semibold">{answeredCount}/{questionsArray.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                    <span className="text-gray-700">Chưa trả lời:</span>
                  </span>
                  <span className="font-semibold">{unansweredCount}</span>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {questionsArray.map((q, idx) => {
                  const isAnswered = userAnswers.has(q.id)
                  const isActive = idx === currentQuestionIndex && quizViewMode === 'single'
                  const isFlagged = flaggedQuestions.has(q.id)
                  return (
                    <button
                      key={q.id}
                      onClick={() => handleQuestionClick(idx)}
                      className={`w-10 h-10 rounded border-2 flex items-center justify-center font-medium text-sm relative ${isActive ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                        } ${isAnswered
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                        }`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <Flag className="h-3 w-3 text-red-500 absolute -top-1 -right-1" fill="currentColor" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Chế độ xem</p>
              <button
                onClick={() => setQuizViewMode(quizViewMode === 'single' ? 'all' : 'single')}
                className="w-full flex items-center justify-start gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {quizViewMode === 'single' ? (
                  <>
                    <LayoutList className="h-4 w-4" />
                    <span>Xem tất cả câu hỏi</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="h-4 w-4" />
                    <span>Xem từng câu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {showSubmitConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg mb-2">Xác nhận nộp bài</h3>
                  <p className="text-gray-600 text-sm">
                    Bạn đã trả lời <strong>{answeredCount}/{questionsArray.length}</strong> câu hỏi.<br />
                    Còn <strong>{unansweredCount}</strong> câu chưa trả lời.<br /><br />
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

  // Result View
  if (viewMode === 'result' && attemptResult) {
    const questionsArray = Array.from(quiz.questions)
    const answersByQuestion = new Map(attemptResult.answers.map(answer => [answer.questionId, answer]))

    return (
      <div className="py-6 px-4 max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => onExit ? onExit() : navigate(-1)}
            className="text-gray-600 hover:text-gray-900 -ml-2"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Quay lại khóa học
          </Button>
        </div>
        <Card className="shadow-2xl border-0 overflow-hidden">
          <div className={`px-8 py-12 text-center ${attemptResult.isPassed
            ? 'bg-gradient-to-br from-green-500 to-emerald-600'
            : 'bg-gradient-to-br from-red-500 to-rose-600'
            }`}>
            <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
              {attemptResult.isPassed ? (
                <CheckCircle className="h-14 w-14 text-white" />
              ) : (
                <XCircle className="h-14 w-14 text-white" />
              )}
            </div>
            <CardTitle className="text-4xl font-bold text-white mb-3">
              {attemptResult.isPassed ? 'Chúc mừng! Bạn đã đạt' : 'Chưa đạt yêu cầu'}
            </CardTitle>
            <div className="text-white/90 text-xl">
              Điểm số: <span className="font-bold text-2xl">{attemptResult.score}/{attemptResult.totalScore}</span>
              <span className="ml-2 text-lg">
                ({((attemptResult.score / attemptResult.totalScore) * 100).toFixed(1)}%)
              </span>
            </div>
          </div>

          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center border border-blue-200">
                <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Thời gian</p>
                <p className="text-2xl font-bold text-gray-900">{formatTime(attemptResult.timeSpent)}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl text-center border border-purple-200">
                <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Điểm đạt được</p>
                <p className="text-2xl font-bold text-gray-900">{attemptResult.score}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center border border-green-200">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Kết quả</p>
                <p className={`text-lg font-bold ${attemptResult.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {attemptResult.isPassed ? 'Đạt' : 'Không đạt'}
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={() => setViewMode('history')}
                variant="outline"
                className="flex-1 py-6 text-base"
              >
                Xem lịch sử
              </Button>
              <Button
                onClick={() => {
                  // Clear CourseLearning localStorage before navigating back
                  const courseKeys = Object.keys(localStorage).filter(key => key.startsWith('course-learning-'))
                  courseKeys.forEach(key => localStorage.removeItem(key))
                  console.log('🗑️ Cleared CourseLearning state from localStorage')
                  onExit ? onExit() : navigate(-1)
                }}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 
                            hover:from-purple-700 hover:to-indigo-700 
                            py-6 text-base text-white"
              >
                Hoàn thành
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Chi tiết đáp án</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnswerReview(!showAnswerReview)}
              className="flex items-center gap-2"
            >
              {showAnswerReview ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Ẩn đáp án
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Xem đáp án
                </>
              )}
            </Button>
          </div>

          {showAnswerReview && (
            <div className="space-y-4">
              {questionsArray.map((question, idx) => {
                const attemptAnswer = answersByQuestion.get(question.id)
                const answersArray = Array.from(question.answers || [])
                const answerById = new Map(answersArray.map(a => [a.id, a]))
                const correctAnswers = answersArray.filter(a => a.isCorrect)

                const renderUserAnswer = () => {
                  if (!attemptAnswer) {
                    return <p className="text-gray-500">Chưa trả lời</p>
                  }

                  if (question.questionType === 'ESSAY') {
                    return (
                      <p className="text-gray-800 whitespace-pre-wrap">{attemptAnswer.answerText || 'Chưa trả lời'}</p>
                    )
                  }

                  if (question.questionType === 'FILL_IN_THE_BLANK') {
                    const blanks = attemptAnswer.selectedAnswerIds || []
                    if (blanks.length === 0) {
                      return <p className="text-gray-500">Chưa trả lời</p>
                    }

                    return (
                      <div className="space-y-1">
                        {blanks.map((answerId, blankIdx) => (
                          <div key={blankIdx} className="text-sm text-gray-800">
                            <span className="font-semibold text-gray-600 mr-2">Ô {blankIdx + 1}:</span>
                            <span>{answerById.get(answerId)?.content || '—'}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }

                  if (question.questionType === 'MULTIPLE_CHOICE') {
                    const selectedIds = attemptAnswer.selectedAnswerIds || []
                    if (selectedIds.length === 0) return <p className="text-gray-500">Chưa trả lời</p>

                    return (
                      <ul className="list-disc list-inside text-gray-800">
                        {selectedIds.map(id => (
                          <li key={id}>{answerById.get(id)?.content || '—'}</li>
                        ))}
                      </ul>
                    )
                  }

                  const selected = attemptAnswer.selectedAnswerId
                  if (!selected) return <p className="text-gray-500">Chưa trả lời</p>

                  return <p className="text-gray-800">{answerById.get(selected)?.content || '—'}</p>
                }

                const renderCorrectAnswers = () => {
                  if (question.questionType === 'ESSAY') {
                    return <p className="text-gray-500">Chờ giáo viên chấm</p>
                  }

                  if (question.questionType === 'FILL_IN_THE_BLANK') {
                    if (correctAnswers.length === 0) return <p className="text-gray-500">Chưa có đáp án</p>
                    return (
                      <div className="space-y-1">
                        {correctAnswers.map((answer, index) => (
                          <div key={answer.id} className="text-sm text-gray-800">
                            <span className="font-semibold text-gray-600 mr-2">Ô {index + 1}:</span>
                            <span>{answer.content}</span>
                          </div>
                        ))}
                      </div>
                    )
                  }

                  if (correctAnswers.length === 0) return <p className="text-gray-500">Chưa có đáp án</p>

                  return (
                    <ul className="list-disc list-inside text-gray-800">
                      {correctAnswers.map(answer => (
                        <li key={answer.id}>{answer.content}</li>
                      ))}
                    </ul>
                  )
                }

                const isCorrect = attemptAnswer?.isCorrect

                return (
                  <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-900">{question.questionText}</p>
                          <p className="text-xs text-gray-500">
                            {question.questionType === 'SINGLE_CHOICE' && 'Một đáp án'}
                            {question.questionType === 'MULTIPLE_CHOICE' && 'Nhiều đáp án'}
                            {question.questionType === 'TRUE_FALSE' && 'Đúng/Sai'}
                            {question.questionType === 'FILL_IN_THE_BLANK' && 'Điền khuyết'}
                            {question.questionType === 'ESSAY' && 'Tự luận'}
                          </p>
                        </div>
                      </div>
                      {attemptAnswer && (
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {isCorrect ? 'Đúng' : 'Sai'}
                        </span>
                      )}
                    </div>

                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg border p-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Câu trả lời của bạn</p>
                        {renderUserAnswer()}
                      </div>
                      <div className="bg-white rounded-lg border p-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Đáp án đúng</p>
                        {renderCorrectAnswers()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Show loading state
  if (loading && !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải bài kiểm tra...</p>
        </div>
      </div>
    )
  }

  return null
}
