"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Search, Eye, Clock, AlertCircle, Loader2, ArrowRight, CheckCircle, XCircle, Award, Users } from "lucide-react"
import * as quizGradingApi from "@/services/api/teacher/quizGradingApi"
import type { QuizResultResponse } from "@/services/api/response/quizResultResponse"
import type { QuizStatisticsResponse } from "@/services/api/response/quizStatisticsResponse"
import { useSelectedClass } from "@/context/teacher/SelectedClassContext"

interface ExamResultsViewProps {
  courseId?: number
}

const ExamResultsView: React.FC<ExamResultsViewProps> = () => {
  const { selectedClass } = useSelectedClass()
  const [results, setResults] = useState<QuizResultResponse[]>([])
  const [statistics, setStatistics] = useState<QuizStatisticsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterQuiz, setFilterQuiz] = useState<string>("all")
  const [selectedResult, setSelectedResult] = useState<QuizResultResponse | null>(null)

  useEffect(() => {
    if (!selectedClass) {
      setResults([])
      setStatistics(null)
      setError(null)
      return
    }
    fetchData()
  }, [selectedClass])

  const fetchData = async () => {
    if (!selectedClass) return

    setLoading(true)
    setError(null)

    try {
      // Fetch results
      const resultsData = await quizGradingApi.getQuizResultsForClass(selectedClass.id)
      setResults(resultsData)

      // Fetch statistics
      const statsData = await quizGradingApi.getQuizStatistics(selectedClass.id)
      setStatistics(statsData)
    } catch (error: any) {
      console.error("Error fetching data:", error)
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể tải dữ liệu"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredResults = results.filter((result) => {
    const matchesSearch =
      result.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      result.studentId?.includes(searchTerm) ||
      result.quizTitle?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterQuiz === "all" || result.quizTitle === filterQuiz

    return matchesSearch && matchesFilter
  })

  const quizzes = Array.from(new Set(results.map((r) => r.quizTitle)))

  const calculateAveragePercentage = () => {
    if (results.length === 0) return 0
    const sum = results.reduce((acc, result) => acc + result.percentage, 0)
    return sum / results.length
  }

  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Xem Bài Kiểm Tra</h2>
          <p className="text-gray-600">Xem kết quả quiz và kiểm tra của sinh viên</p>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Vui lòng chọn một lớp học</p>
          <p className="text-sm text-gray-500 mb-4">
            Đi tới Quản Lý Lớp Học để chọn một lớp trước khi xem kết quả kiểm tra.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <ArrowRight className="h-4 w-4" />
            Quản Lý Lớp Học <ArrowRight className="h-4 w-4" /> Chọn Lớp
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Xem Bài Kiểm Tra</h2>
          <p className="text-gray-600">
            Lớp: <span className="font-semibold text-gray-900">{selectedClass.className}</span>
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Xem Bài Kiểm Tra</h2>
          <p className="text-gray-600">
            Lớp: <span className="font-semibold text-gray-900">{selectedClass.className}</span>
          </p>
        </div>
        <div className="border-2 border-red-200 bg-red-50 rounded-lg p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600 mb-2">Có lỗi xảy ra</p>
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Xem Bài Kiểm Tra</h2>
        <p className="text-gray-600">
          Lớp: <span className="font-semibold text-gray-900">{selectedClass.className}</span>
        </p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Tổng Lượt Kiểm Tra</p>
                <p className="text-2xl font-bold">{statistics.totalAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Đạt Yêu Cầu</p>
                <p className="text-2xl font-bold text-green-600">{statistics.passedAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Chưa Đạt</p>
                <p className="text-2xl font-bold text-red-600">{statistics.failedAttempts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Award className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Phần Trăm TB</p>
                <p className="text-2xl font-bold text-orange-600">{calculateAveragePercentage().toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, MSSV, hoặc tên quiz..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterQuiz}
          onChange={(e) => setFilterQuiz(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả Quiz</option>
          {quizzes.map((quiz) => (
            <option key={quiz} value={quiz}>
              {quiz}
            </option>
          ))}
        </select>
      </div>

      {/* Results List */}
      <div className="grid gap-4">
        {filteredResults.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">
              {results.length === 0
                ? "Chưa có kết quả kiểm tra nào trong lớp này"
                : "Không tìm thấy kết quả nào phù hợp với bộ lọc"}
            </p>
          </div>
        ) : (
          filteredResults.map((result) => (
            <div
              key={result.id}
              className={`bg-white border rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${selectedResult?.id === result.id ? "ring-2 ring-blue-500" : "border-gray-200"
                }`}
              onClick={() => setSelectedResult(selectedResult?.id === result.id ? null : result)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{result.quizTitle}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${result.isPassed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                    >
                      {result.isPassed ? "Đạt" : "Không Đạt"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <p className="font-medium text-gray-900">{result.studentName}</p>
                      <p className="text-xs">{result.studentId}</p>
                    </div>
                    <div>
                      <p className="font-medium">Điểm</p>
                      <p className="text-base font-bold text-blue-600">
                        {result.score.toFixed(1)}/{result.totalScore}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Phần trăm</p>
                      <p className="text-base font-bold">{result.percentage.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="font-medium">Thời gian</p>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-base">
                          {result.timeSpent != null && !isNaN(result.timeSpent)
                            ? result.timeSpent >= 60
                              ? `${Math.floor(result.timeSpent / 60)} phút ${result.timeSpent % 60}s`
                              : `${result.timeSpent}s`
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Ngày làm</p>
                      <p className="text-xs">{new Date(result.submittedAt).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${result.isPassed ? "bg-green-500" : "bg-red-500"}`}
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>

                <button
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedResult(selectedResult?.id === result.id ? null : result)
                  }}
                >
                  <Eye className="h-4 w-4" />
                  {selectedResult?.id === result.id ? "Ẩn" : "Chi tiết"}
                </button>
              </div>

              {/* Detail View */}
              {selectedResult?.id === result.id && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-lg">Kết quả chi tiết</h4>
                      <span className="text-sm text-gray-600">Lần thi thứ {result.attemptNumber}</span>
                    </div>

                    {result.answers.map((answer, idx) => (
                      <div
                        key={answer.id}
                        className={`p-4 rounded-lg border ${answer.isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 mb-2">
                              Câu {idx + 1}: {answer.questionText}
                            </p>
                            <p className="text-xs text-gray-600 mb-2">
                              Loại: {
                                answer.questionType === 'SINGLE_CHOICE' ? 'Một đáp án' :
                                  answer.questionType === 'MULTIPLE_CHOICE' ? 'Nhiều đáp án' :
                                    answer.questionType === 'TRUE_FALSE' ? 'Đúng/Sai' :
                                      answer.questionType === 'FILL_IN_THE_BLANK' ? 'Điền khuyết' :
                                        answer.questionType === 'SHORT_ANSWER' ? 'Câu trả lời ngắn' :
                                          answer.questionType === 'ESSAY' ? 'Tự luận' :
                                            answer.questionType
                              } | Điểm: {answer.questionScore}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {answer.isCorrect ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                            <span className="text-sm font-semibold">+{answer.pointsAwarded.toFixed(1)} điểm</span>
                          </div>
                        </div>

                        {/* Selected Answer */}
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Trả lời của học sinh:</p>
                          <div className="bg-white rounded p-2">
                            {answer.selectedAnswers && answer.selectedAnswers.length > 0 ? (
                              answer.selectedAnswers.map((ans) => (
                                <p key={ans.id} className="text-sm text-gray-800">
                                  • {ans.answerText}
                                </p>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 italic">Chưa trả lời</p>
                            )}
                          </div>
                        </div>

                        {/* Correct Answer (if wrong) */}
                        {!answer.isCorrect && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-1">Đáp án đúng:</p>
                            <div className="bg-green-100 rounded p-2">
                              {answer.correctAnswers?.map((ans) => (
                                <p key={ans.id} className="text-sm text-green-800">
                                  • {ans.answerText}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ExamResultsView
