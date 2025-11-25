"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ClipboardCheck, Calendar, Clock, CheckCircle, XCircle, Eye, ChevronUp } from "lucide-react"
import { toast } from "react-toastify"
import teacherPublicApi, { 
  type StudentQuizAttempt,
  type QuizAttemptDetail 
} from "@/services/api/teacher/teacherPublicApi"

const StudentQuizzesPage: React.FC = () => {
  const { courseId, studentId } = useParams<{ courseId: string; studentId: string }>()
  const navigate = useNavigate()
  const [studentName, setStudentName] = useState<string>("")
  const [quizAttempts, setQuizAttempts] = useState<StudentQuizAttempt[]>([])
  const [expandedAttempt, setExpandedAttempt] = useState<number | null>(null)
  const [attemptDetails, setAttemptDetails] = useState<Record<number, QuizAttemptDetail>>({})
  const [loadingDetail, setLoadingDetail] = useState<number | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!courseId || !studentId) return

      try {
        // Load quiz attempts from API
        const attempts = await teacherPublicApi.getStudentQuizAttempts(Number(courseId), studentId)
        setQuizAttempts(attempts)
        
        // Get student name from first attempt if available
        if (attempts.length > 0 && attempts[0].studentName) {
          setStudentName(attempts[0].studentName)
        } else {
          setStudentName(studentId)
        }
      } catch (error) {
        console.error("Error loading quiz attempts:", error)
        toast.error("Đã có lỗi khi tải dữ liệu bài kiểm tra")
      }
    }

    loadData()
  }, [courseId, studentId])

  const handleViewDetails = async (attemptId: number) => {
    if (expandedAttempt === attemptId) {
      // Collapse if already expanded
      setExpandedAttempt(null)
      return
    }

    // Expand and fetch details if not already loaded
    setExpandedAttempt(attemptId)
    
    if (!attemptDetails[attemptId]) {
      setLoadingDetail(attemptId)
      try {
        const detail = await teacherPublicApi.getQuizAttemptDetails(attemptId)
        setAttemptDetails(prev => ({ ...prev, [attemptId]: detail }))
      } catch (error) {
        console.error("Error fetching quiz attempt details:", error)
        toast.error("Không thể tải chi tiết bài kiểm tra")
        setExpandedAttempt(null)
      } finally {
        setLoadingDetail(null)
      }
    }
  }

  const averageScore = quizAttempts.length > 0
    ? (quizAttempts.reduce((sum, q) => sum + q.score, 0) / quizAttempts.length).toFixed(1)
    : 0

  return (
    <div className="flex-1 overflow-auto">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(`/teacher/public-courses/${courseId}/students`)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách người dùng
            </Button>
            
            <h1 className="text-3xl font-bold mb-2 flex items-center text-foreground">
              <ClipboardCheck className="mr-3 text-primary" size={32} />
              Bài kiểm tra của {studentName}
            </h1>
            <p className="text-muted-foreground text-lg">Xem chi tiết các bài kiểm tra đã làm</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng bài làm</p>
                  <h3 className="text-2xl font-bold text-card-foreground">{quizAttempts.length}</h3>
                </div>
                <ClipboardCheck className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Điểm trung bình</p>
                  <h3 className="text-2xl font-bold text-card-foreground">{averageScore}</h3>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Đạt</p>
                  <h3 className="text-2xl font-bold text-card-foreground">
                    {quizAttempts.filter(q => q.passed).length}
                  </h3>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Không đạt</p>
                  <h3 className="text-2xl font-bold text-card-foreground">
                    {quizAttempts.filter(q => !q.passed).length}
                  </h3>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>

          {/* Quiz Attempts List */}
          {quizAttempts.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardCheck className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="text-lg font-medium text-foreground mb-2">Chưa có bài kiểm tra nào</h3>
              <p className="text-muted-foreground">Người dùng chưa làm bài kiểm tra nào</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quizAttempts.map((attempt) => (
                <div
                  key={attempt.attemptId}
                  className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-card-foreground mb-2">
                        {attempt.quizTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(attempt.attemptDate).toLocaleDateString('vi-VN')}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {attempt.duration} phút
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-3xl font-bold mb-1 ${
                        attempt.passed ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {attempt.score}/{attempt.maxScore}
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        attempt.passed
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {attempt.passed ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Đạt
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Không đạt
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-muted-foreground">
                        Câu đúng: <span className="font-semibold text-card-foreground">{attempt.questionsCorrect}/{attempt.totalQuestions}</span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Tỷ lệ: <span className="font-semibold text-card-foreground">{Math.round((attempt.questionsCorrect / attempt.totalQuestions) * 100)}%</span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(attempt.attemptId)}
                    >
                      {expandedAttempt === attempt.attemptId ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          Ẩn chi tiết
                        </>
                      ) : (
                        <>
                          <Eye className="w-4 h-4 mr-2" />
                          Xem chi tiết
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          attempt.passed ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${(attempt.questionsCorrect / attempt.totalQuestions) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {expandedAttempt === attempt.attemptId && (
                    <div className="mt-4 border-t pt-4">
                      {loadingDetail === attempt.attemptId ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                        </div>
                      ) : attemptDetails[attempt.attemptId] ? (
                        <div className="space-y-4">
                          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">
                              {attemptDetails[attempt.attemptId].quizTitle}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Người dùng: </span>
                                <span className="font-medium">{attemptDetails[attempt.attemptId].studentName}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 dark:text-gray-400">Điểm: </span>
                                <span className="font-medium">
                                  {attemptDetails[attempt.attemptId].score} / {attemptDetails[attempt.attemptId].maxScore}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Questions List */}
                          <div className="space-y-4">
                            {attemptDetails[attempt.attemptId].questions.map((question, index) => (
                              <div
                                key={question.questionId}
                                className={`border rounded-lg p-4 ${
                                  question.isCorrect
                                    ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                                    : "border-red-300 bg-red-50 dark:bg-red-900/20"
                                }`}
                              >
                                <div className="flex items-start justify-between mb-3">
                                  <h4 className="font-medium flex-1">
                                    Câu {index + 1}: {question.questionText}
                                  </h4>
                                  <div className="flex items-center gap-2 ml-4">
                                    {question.isCorrect ? (
                                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    )}
                                    <span className="text-sm font-semibold">
                                      {question.points} điểm
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  {question.options.map((option, optionIndex) => {
                                    const isStudentAnswer = question.studentAnswers.includes(optionIndex)
                                    const isCorrectAnswer = question.correctAnswers.includes(optionIndex)
                                    
                                    let borderColor = "border-gray-200 dark:border-gray-700"
                                    let bgColor = "bg-white dark:bg-gray-800"
                                    let label = ""
                                    
                                    if (isCorrectAnswer && isStudentAnswer) {
                                      // Đúng và đã chọn
                                      borderColor = "border-green-500"
                                      bgColor = "bg-green-100 dark:bg-green-800/30"
                                      label = "Người dùng chọn (Đúng)"
                                    } else if (isCorrectAnswer && !isStudentAnswer) {
                                      // Đúng nhưng không chọn
                                      borderColor = "border-green-400"
                                      bgColor = "bg-green-50 dark:bg-green-900/20"
                                      label = "Đáp án đúng"
                                    } else if (!isCorrectAnswer && isStudentAnswer) {
                                      // Sai và đã chọn
                                      borderColor = "border-red-500"
                                      bgColor = "bg-red-100 dark:bg-red-800/30"
                                      label = "Người dùng chọn (Sai)"
                                    }
                                    
                                    return (
                                      <div
                                        key={optionIndex}
                                        className={`p-3 rounded border-2 ${borderColor} ${bgColor}`}
                                      >
                                        <div className="flex items-center justify-between gap-2">
                                          <span className={isCorrectAnswer ? "font-medium" : ""}>
                                            {option}
                                          </span>
                                          {label && (
                                            <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                                              isCorrectAnswer && isStudentAnswer
                                                ? "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100"
                                                : isCorrectAnswer
                                                ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200"
                                                : "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100"
                                            }`}>
                                              {label}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>

                                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">Loại câu hỏi: </span>
                                  {question.questionType === "SINGLE_CHOICE" 
                                    ? "Một đáp án"
                                    : question.questionType === "MULTIPLE_CHOICE"
                                    ? "Nhiều đáp án"
                                    : question.questionType === "TRUE_FALSE"
                                    ? "Đúng/Sai"
                                    : "Không xác định"}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default StudentQuizzesPage
