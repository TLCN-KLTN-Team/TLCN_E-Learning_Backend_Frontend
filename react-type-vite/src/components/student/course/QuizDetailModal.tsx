import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  Clock,
  Target,
  Award,
  Calendar,
  AlertCircle,
  Loader2,
  Play,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Modal from "@/components/ui/modal"
import type { QuizResponse } from "@/services/api/response/quizResponse"
import * as quizApi from "@/services/api/student/quizApi"
import type { QuizAttemptHistoryResponse } from "@/services/api/response/quizAttemptHistoryResponse"
import DiscussionSection from "./DiscussionSection"
import { useAuth } from "@/context/auth-context/useAuth"
import { getUnreadCount, markDiscussionAsRead } from "@/services/api/quizDiscussionApi"

interface QuizDetailModalProps {
  isOpen: boolean
  onClose: () => void
  quizId: number
  returnPath?: string
}

const QuizDetailModal: React.FC<QuizDetailModalProps> = ({
  isOpen,
  onClose,
  quizId,
  returnPath,
}) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [quiz, setQuiz] = useState<QuizResponse | null>(null)
  const [attemptHistory, setAttemptHistory] = useState<QuizAttemptHistoryResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"info" | "discussion">("info")
  const [unreadCount, setUnreadCount] = useState<number>(0)

  useEffect(() => {
    if (isOpen && quizId) {
      fetchQuizDetail()
    }
  }, [isOpen, quizId])

  const fetchQuizDetail = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [quizData, historyData, unreadCountData] = await Promise.all([
        quizApi.getQuizDetail(quizId),
        quizApi.getQuizAttemptHistory(quizId),
        getUnreadCount(quizId).catch(() => 0), // Fallback to 0 if fails
      ])

      setQuiz(quizData)
      setAttemptHistory(historyData)
      setUnreadCount(unreadCountData)
    } catch (err) {
      console.error("Error fetching quiz detail:", err)
      setError("Không thể tải thông tin bài kiểm tra")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartQuiz = async () => {
    if (!quiz) return

    try {
      const { attemptId } = await quizApi.startQuizAttempt(quizId)
      navigate(`/student/quiz/${quizId}/attempt/${attemptId}`, {
        state: { returnPath }
      })
      onClose()
    } catch (err) {
      console.error("Error starting quiz:", err)
      alert("Không thể bắt đầu làm bài. Vui lòng thử lại.")
    }
  }

  const isAvailable = () => {
    if (!quiz) return false
    const now = new Date()
    if (quiz.startTime && new Date(quiz.startTime) > now) return false
    if (quiz.endTime && new Date(quiz.endTime) < now) return false
    return true
  }

  const canTakeQuiz = () => {
    if (!quiz) return false
    if (!isAvailable()) return false
    if (attemptHistory.length >= quiz.attemptLimit) return false
    return true
  }

  const remainingAttempts = quiz ? quiz.attemptLimit - attemptHistory.length : 0

  if (isLoading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
        <div className="p-8 flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Đang tải thông tin bài kiểm tra...</p>
        </div>
      </Modal>
    )
  }

  if (error || !quiz) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
        <div className="p-8">
          <div className="flex items-center gap-3 text-red-600 mb-4">
            <AlertCircle className="h-6 w-6" />
            <p className="font-medium">{error || "Không tìm thấy bài kiểm tra"}</p>
          </div>
          <Button onClick={onClose}>Đóng</Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {quiz.title}
            </h2>
            {quiz.description && (
              <p className="text-gray-600">{quiz.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b px-6 mt-4">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab("info")}
              className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === "info"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <FileText className="w-4 h-4" />
              Thông tin & Làm bài
            </button>
            <button
              onClick={async () => {
                setActiveTab("discussion")
                if (unreadCount > 0) {
                  try {
                    await markDiscussionAsRead(quizId)
                    setUnreadCount(0)
                  } catch (err) {
                    console.error("Error marking as read:", err)
                  }
                }
              }}
              className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === "discussion"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
            >
              <MessageSquare className="w-4 h-4" />
              Thảo luận
              {unreadCount > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "info" && (
            <>
              {/* Quiz Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4">Thông tin bài kiểm tra</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Thời gian làm bài</p>
                      <p className="font-medium">{quiz.duration} phút</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Award className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Số lần làm</p>
                      <p className="font-medium">
                        {attemptHistory.length}/{quiz.attemptLimit} lần
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Điểm đạt</p>
                      <p className="font-medium">{quiz.passingScore}%</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Cách chấm điểm</p>
                      <p className="font-medium">Lần cao nhất</p>
                    </div>
                  </div>
                </div>

                {quiz.startTime && (
                  <div className="mt-4 pt-4 border-t border-blue-200">
                    <p className="text-sm text-gray-700">
                      <strong>Thời gian mở:</strong>{" "}
                      {new Date(quiz.startTime).toLocaleString("vi-VN")}
                    </p>
                  </div>
                )}

                {quiz.endTime && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700">
                      <strong>Thời gian đóng:</strong>{" "}
                      {new Date(quiz.endTime).toLocaleString("vi-VN")}
                    </p>
                  </div>
                )}
              </div>

              {/* Quiz Instructions */}
              <div className="bg-gray-50 border rounded-lg p-6 mb-6">
                <h3 className="font-semibold mb-3">Hướng dẫn</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>
                      Sinh viên làm bài trong thời gian {quiz.duration} phút
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>Mỗi SV được thực hiện {quiz.attemptLimit} lần làm bài, lấy bài có điểm cao nhất</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>
                      Đánh giá: SV được đánh giá là hoàn thành khi đạt từ {quiz.passingScore}/100% trở lên
                    </span>
                  </li>
                </ul>
              </div>

              {/* Attempt History */}
              {attemptHistory.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Lịch sử làm bài</h3>
                  <div className="space-y-2">
                    {attemptHistory.map((attempt, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {attempt.isPassed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <p className="font-medium">Lần {attempt.attemptNumber}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(attempt.submittedAt).toLocaleString("vi-VN")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            {attempt.score.toFixed(2)}/{attempt.totalScore}
                          </p>
                          <p className="text-sm text-gray-600">
                            {Math.round((attempt.score / attempt.totalScore) * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning Messages */}
              {!isAvailable() && quiz.startTime && new Date(quiz.startTime) > new Date() && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">
                      Bài kiểm tra chưa mở. Thời gian mở:{" "}
                      {new Date(quiz.startTime).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              )}

              {!isAvailable() && quiz.endTime && new Date(quiz.endTime) < new Date() && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">
                      Bài kiểm tra đã đóng vào{" "}
                      {new Date(quiz.endTime).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
              )}

              {remainingAttempts === 0 && isAvailable() && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="font-medium">
                      Bạn đã hết số lần làm bài ({quiz.attemptLimit} lần)
                    </p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Đóng
                </Button>
                {canTakeQuiz() ? (
                  <Button
                    onClick={handleStartQuiz}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Thực hiện lại đề thi
                  </Button>
                ) : (
                  <Button disabled className="bg-gray-300 text-gray-500">
                    Không thể làm bài
                  </Button>
                )}
              </div>
            </>
          )}

          {activeTab === "discussion" && (
            <DiscussionSection
              itemType="quiz"
              itemId={quizId}
              itemTitle={quiz.title}
              user={user}
            />
          )}
        </div>
      </div>
    </Modal>
  )
}

export default QuizDetailModal