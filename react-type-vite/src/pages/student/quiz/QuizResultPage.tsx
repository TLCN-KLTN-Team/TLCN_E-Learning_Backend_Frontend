"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Target,
  ArrowLeft,
  Loader2,
  Home,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import quizApi from "@/services/api/student/quizApi"
import type { QuizAttemptResponse } from "@/services/api/response/quizAttemptResponse"

const QuizResultPage: React.FC = () => {
  const { quizId, attemptId } = useParams<{ quizId: string; attemptId: string }>()
  const navigate = useNavigate()

  const [result, setResult] = useState<QuizAttemptResponse | null>(null)
  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (attemptId && quizId) {
      fetchResults()
    }
  }, [attemptId, quizId])

  const fetchResults = async () => {
    try {
      setIsLoading(true)

      const [resultData, quizData] = await Promise.all([
        quizApi.getAttemptResult(Number(attemptId)),
        quizApi.getQuizDetail(Number(quizId)),
      ])

      setResult(resultData)
      setQuiz(quizData)
    } catch (error) {
      console.error("Error fetching results:", error)
      alert("Không thể tải kết quả bài làm")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleQuestion = (questionId: number) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!result || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy kết quả</p>
          <Button onClick={() => navigate(-1)}>Quay lại</Button>
        </div>
      </div>
    )
  }

  const percentage = (result.score / result.totalScore) * 100
  const isPassed = result.isPassed

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/student/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay về danh sách khóa học
          </Button>
        </div>

        {/* Result Card */}
        <div
          className={`rounded-lg p-8 mb-6 text-white ${
            isPassed
              ? "bg-gradient-to-r from-green-600 to-green-700"
              : "bg-gradient-to-r from-red-600 to-red-700"
          }`}
        >
          <div className="text-center">
            {isPassed ? (
              <CheckCircle className="h-20 w-20 mx-auto mb-4" />
            ) : (
              <XCircle className="h-20 w-20 mx-auto mb-4" />
            )}
            
            <h1 className="text-3xl font-bold mb-2">
              {isPassed ? "Chúc mừng! Bạn đã đạt" : "Chưa đạt yêu cầu"}
            </h1>
            
            <p className="text-xl mb-6 opacity-90">{quiz.title}</p>

            <div className="flex justify-center items-center gap-8 mb-6">
              <div>
                <p className="text-5xl font-bold mb-2">
                  {result.score.toFixed(2)}
                </p>
                <p className="text-lg opacity-90">
                  Điểm của bạn (trên {result.totalScore})
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <Target className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-gray-900">{percentage.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Tỷ lệ đúng</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-gray-900">{formatTime(result.timeSpent)}</p>
                <p className="text-sm text-gray-600">Thời gian</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-lg">
                <Award className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                <p className="text-2xl font-bold text-gray-900">{quiz.passingScore}%</p>
                <p className="text-sm text-gray-600">Điểm đạt</p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Tổng quan</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded">
              <p className="text-2xl font-bold text-gray-900">
                {result.answers.length}
              </p>
              <p className="text-sm text-gray-600">Tổng câu hỏi</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <p className="text-2xl font-bold text-green-600">
                {result.answers.filter((a) => a.isCorrect).length}
              </p>
              <p className="text-sm text-gray-600">Câu đúng</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded">
              <p className="text-2xl font-bold text-red-600">
                {result.answers.filter((a) => !a.isCorrect).length}
              </p>
              <p className="text-sm text-gray-600">Câu sai</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded">
              <p className="text-2xl font-bold text-blue-600">
                {new Date(result.submittedAt).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-sm text-gray-600">Ngày làm</p>
            </div>
          </div>
        </div>

        {/* Show Answers if quiz allows */}
        {quiz.showResults && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Chi tiết câu trả lời</h2>
            <div className="space-y-4">
              {result.answers.map((answer, index) => {
                const question = Array.from(quiz.questions || []).find(
                  (q) => q.id === answer.questionId
                )
                
                if (!question) return null

                const isExpanded = expandedQuestions.has(answer.questionId)
                
                // Get selected answers (single or multiple)
                const selectedAnswerIds = answer.selectedAnswerIds || 
                  (answer.selectedAnswerId ? [answer.selectedAnswerId] : [])
                

                // Get all answers for display
                const allAnswers = question.answers
                  ? Array.from(question.answers).sort((a, b) => a.orderIndex - b.orderIndex)
                  : []

                return (
                  <div
                    key={answer.id}
                    className={`border-2 rounded-lg p-4 ${
                      answer.isCorrect
                        ? "border-green-300 bg-green-50"
                        : "border-red-300 bg-red-50"
                    }`}
                  >
                    <button
                      onClick={() => toggleQuestion(answer.questionId)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {answer.isCorrect ? (
                            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                          ) : (
                            <XCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {question.questionType === "SINGLE_CHOICE" 
                                  ? "Một đáp án"
                                  : question.questionType === "MULTIPLE_CHOICE"
                                  ? "Nhiều đáp án"
                                  : question.questionType === "TRUE_FALSE"
                                  ? "Đúng/Sai"
                                  : "Không xác định"}
                              </span>
                            </div>
                            <p className="font-medium text-gray-900 mb-1">
                              Câu {index + 1}: {question.questionText}
                            </p>
                            <p className="text-sm text-gray-600">
                              Điểm: {answer.pointsAwarded}/{question.score}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-blue-600">
                            {isExpanded ? "Thu gọn" : "Xem chi tiết"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-blue-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="mt-4 pl-9 space-y-4">
                        {/* Question Image Attachments */}
                        {question.attachments && question.attachments.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">
                              Hình ảnh câu hỏi:
                            </p>
                            <div className="space-y-3">
                              {question.attachments.map((attachment, idx) => (
                                <img
                                  key={idx}
                                  src={attachment}
                                  alt={`Câu hỏi ${index + 1} - Hình ${idx + 1}`}
                                  className="max-w-full h-auto rounded-lg border border-gray-300 shadow-sm"
                                  onError={(e) => {
                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%239ca3af'%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E"
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* For MULTIPLE_CHOICE - Show all answers with checkboxes */}
                        {question.questionType === "MULTIPLE_CHOICE" && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">
                              Các đáp án:
                            </p>
                            <div className="space-y-2">
                              {allAnswers.map((ans) => {
                                const isSelected = selectedAnswerIds.includes(ans.id)
                                const isCorrectAnswer = ans.isCorrect
                                
                                let borderColor = "border-gray-300"
                                let bgColor = "bg-white"
                                let label = ""
                                
                                if (isCorrectAnswer && isSelected) {
                                  // Đúng và đã chọn
                                  borderColor = "border-green-500"
                                  bgColor = "bg-green-100"
                                  label = "Bạn chọn (Đúng)"
                                } else if (isCorrectAnswer && !isSelected) {
                                  // Đúng nhưng không chọn
                                  borderColor = "border-green-400"
                                  bgColor = "bg-green-50"
                                  label = "Đáp án đúng"
                                } else if (!isCorrectAnswer && isSelected) {
                                  // Sai và đã chọn
                                  borderColor = "border-red-500"
                                  bgColor = "bg-red-100"
                                  label = "Bạn chọn (Sai)"
                                } else {
                                  // Không chọn và sai
                                  bgColor = "bg-gray-50"
                                }

                                return (
                                  <div
                                    key={ans.id}
                                    className={`flex items-start gap-3 p-3 border-2 rounded-lg ${borderColor} ${bgColor}`}
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        disabled
                                        className="mt-1 w-4 h-4"
                                        aria-label={ans.content}
                                      />
                                      <span className="flex-1 text-gray-900">
                                        {ans.content}
                                      </span>
                                    </div>
                                    {label && (
                                      <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                                        isCorrectAnswer && isSelected
                                          ? "bg-green-200 text-green-800"
                                          : isCorrectAnswer
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-200 text-red-800"
                                      }`}>
                                        {label}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {/* For SINGLE_CHOICE and TRUE_FALSE - Show all answers with radio buttons */}
                        {(question.questionType === "SINGLE_CHOICE" || question.questionType === "TRUE_FALSE") && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-3">
                              Các đáp án:
                            </p>
                            <div className="space-y-2">
                              {allAnswers.map((ans) => {
                                const isSelected = selectedAnswerIds.includes(ans.id)
                                const isCorrectAnswer = ans.isCorrect
                                
                                let borderColor = "border-gray-300"
                                let bgColor = "bg-white"
                                let label = ""
                                
                                if (isCorrectAnswer && isSelected) {
                                  // Đúng và đã chọn
                                  borderColor = "border-green-500"
                                  bgColor = "bg-green-100"
                                  label = "Bạn chọn (Đúng)"
                                } else if (isCorrectAnswer && !isSelected) {
                                  // Đúng nhưng không chọn
                                  borderColor = "border-green-400"
                                  bgColor = "bg-green-50"
                                  label = "Đáp án đúng"
                                } else if (!isCorrectAnswer && isSelected) {
                                  // Sai và đã chọn
                                  borderColor = "border-red-500"
                                  bgColor = "bg-red-100"
                                  label = "Bạn chọn (Sai)"
                                } else {
                                  // Không chọn và sai
                                  bgColor = "bg-gray-50"
                                }

                                return (
                                  <div
                                    key={ans.id}
                                    className={`flex items-start gap-3 p-3 border-2 rounded-lg ${borderColor} ${bgColor}`}
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type="radio"
                                        checked={isSelected}
                                        disabled
                                        className="mt-1 w-4 h-4"
                                        aria-label={ans.content}
                                      />
                                      <span className="flex-1 text-gray-900">
                                        {ans.content}
                                      </span>
                                    </div>
                                    {label && (
                                      <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                                        isCorrectAnswer && isSelected
                                          ? "bg-green-200 text-green-800"
                                          : isCorrectAnswer
                                          ? "bg-green-100 text-green-700"
                                          : "bg-red-200 text-red-800"
                                      }`}>
                                        {label}
                                      </span>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => navigate("/student/dashboard")}
          >
            <Home className="h-4 w-4 mr-2" />
            Về trang chủ
          </Button>
        </div>
      </div>
    </div>
  )
}

export default QuizResultPage