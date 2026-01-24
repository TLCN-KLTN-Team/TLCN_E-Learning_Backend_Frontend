"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { User, BookOpen, BarChart3, Loader2 } from "lucide-react"
import { getStudentDetails } from "@/services/api/teacher/classManagementApi"
import { getSubmissionsForClass } from "@/services/api/teacher/assignmentGradingApi"
import { getQuizResultsForClass } from "@/services/api/teacher/quizGradingApi"
import type { StudentResponse } from "@/services/api/response/studentResponse"

interface StudentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  student: StudentResponse
  classId: number
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ isOpen, onClose, student, classId }) => {
  const [detailedStudent, setDetailedStudent] = useState<StudentResponse | null>(null)
  const [loading, setLoading] = useState(true)

  // State for calculated scores
  const [calculatedScores, setCalculatedScores] = useState<{
    assignment: number | null
    quiz: number | null
    total: number | null
  }>({ assignment: null, quiz: null, total: null })

  useEffect(() => {
    if (isOpen && student) {
      fetchStudentDetails()
    }
  }, [isOpen, student])

  const fetchStudentDetails = async () => {
    try {
      setLoading(true)
      const details = await getStudentDetails(classId, student.studentId)
      console.log("Student Details API Response:", details)
      setDetailedStudent(details)

      // Fetch additional grading data
      await fetchGradingData(student.studentId)
    } catch (err) {
      console.error("Error fetching student details:", err)
      setDetailedStudent(student)
    } finally {
      setLoading(false)
    }
  }

  const fetchGradingData = async (studentId: string) => {
    try {
      const [assignmentData, quizData] = await Promise.all([
        getSubmissionsForClass(classId).catch(err => {
          console.error("Error fetching assignments:", err)
          return []
        }),
        getQuizResultsForClass(classId).catch(err => {
          console.error("Error fetching quiz results:", err)
          return []
        })
      ])

      // 1. Calculate Assignment Average
      let assignmentAvg: number | null = null
      const studentAssignment = assignmentData.find(s => s.studentId === studentId)
      if (studentAssignment && studentAssignment.averageScore != null) {
        assignmentAvg = studentAssignment.averageScore
        // Normalize if > 10
        if (assignmentAvg > 10) assignmentAvg /= 10
      }

      // 2. Calculate Quiz Average
      let quizAvg: number | null = null
      // quizData is QuizResultResponse[] (all attempts)
      // Filter by student
      const studentAttempts = quizData.filter(q => q.studentId === studentId)

      if (studentAttempts.length > 0) {
        // Group by quizId and take MAX score for each quiz
        const bestScoresByQuiz = new Map<number, number>()
        studentAttempts.forEach(attempt => {
          const currentMax = bestScoresByQuiz.get(attempt.quizId) || 0
          // Assuming percentage 0-100. Normalize to 0-10
          let score = attempt.percentage
          if (score > 10) score /= 10

          if (score > currentMax) {
            bestScoresByQuiz.set(attempt.quizId, score)
          }
        })

        let sum = 0
        bestScoresByQuiz.forEach(score => sum += score)
        quizAvg = bestScoresByQuiz.size > 0 ? sum / bestScoresByQuiz.size : 0
      }

      // 3. Calculate Total
      let total: number | null = null
      if (assignmentAvg != null || quizAvg != null) {
        const a = assignmentAvg || 0
        const q = quizAvg || 0
        // Weight: 40% Ass, 60% Quiz (since no exam distinction)
        // Or 40% Ass, 30% Quiz, 30% Exam (using Quiz for Exam)
        // Let's use 40% Ass, 60% Quiz for now standard
        total = (a * 0.4) + (q * 0.6)
      }

      setCalculatedScores({
        assignment: assignmentAvg,
        quiz: quizAvg,
        total: total
      })

    } catch (error) {
      console.error("Error calculating scores:", error)
    }
  }

  const currentStudent = detailedStudent || student

  // Calculate progress percentages
  const assignmentProgress =
    currentStudent.totalAssignments > 0
      ? (currentStudent.submittedAssignments / currentStudent.totalAssignments) * 100
      : 0
  const quizProgress =
    currentStudent.totalQuizzes > 0 ? (currentStudent.completedQuizzes / currentStudent.totalQuizzes) * 100 : 0

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=" bg-white rounded-lg overflow-hidden max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chi Tiết Sinh Viên</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="info" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Thông Tin</span>
              </TabsTrigger>
              <TabsTrigger value="progress" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Tiến Độ</span>
              </TabsTrigger>
              <TabsTrigger value="scores" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Điểm Số</span>
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Thông Tin Cá Nhân</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Mã Sinh Viên</p>
                      <p className="font-semibold">{currentStudent.studentId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Họ Tên</p>
                      <p className="font-semibold">{currentStudent.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-blue-600">{currentStudent.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Trạng Thái</p>
                      <Badge
                        className={
                          currentStudent.accountStatus === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : currentStudent.accountStatus === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                        }
                      >
                        {currentStudent.accountStatus === "ACTIVE"
                          ? "Hoạt Động"
                          : currentStudent.accountStatus === "completed"
                            ? "Hoàn Thành"
                            : "Không Hoạt Động"}
                      </Badge>
                    </div>
                  </div>

                  {currentStudent.enrollmentDate && (
                    <div>
                      <p className="text-sm text-gray-600">Ngày Đăng Ký</p>
                      <p className="font-semibold">
                        {new Date(currentStudent.enrollmentDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Biểu Đồ Tiến Độ Học Tập</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Assignment Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Bài Tập</p>
                      <span className="text-sm text-gray-600">
                        {currentStudent.submittedAssignments}/{currentStudent.totalAssignments}
                      </span>
                    </div>
                    <Progress value={assignmentProgress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{assignmentProgress.toFixed(0)}% hoàn thành</p>
                  </div>

                  {/* Quiz Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Quiz</p>
                      <span className="text-sm text-gray-600">
                        {currentStudent.completedQuizzes}/{currentStudent.totalQuizzes}
                      </span>
                    </div>
                    <Progress value={quizProgress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">{quizProgress.toFixed(0)}% hoàn thành</p>
                  </div>

                  {/* Overall Progress */}
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Tiến Độ Chung</p>
                      <span className="text-sm text-gray-600">
                        {((assignmentProgress + quizProgress) / 2).toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={(assignmentProgress + quizProgress) / 2} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Scores Tab */}
            <TabsContent value="scores" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Bảng Thống Kê Điểm Số</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Điểm Bài Tập</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {calculatedScores.assignment != null ? calculatedScores.assignment.toFixed(1) : "--"}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Điểm Quiz</p>
                      <p className="text-2xl font-bold text-green-600">
                        {calculatedScores.quiz != null ? calculatedScores.quiz.toFixed(1) : "--"}
                      </p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">Điểm Kiểm Tra</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {calculatedScores.quiz != null ? calculatedScores.quiz.toFixed(1) : "--"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <p className="text-sm text-gray-600 mb-1">Điểm Trung Bình</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {calculatedScores.total != null ? calculatedScores.total.toFixed(1) : "--"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default StudentDetailModal
