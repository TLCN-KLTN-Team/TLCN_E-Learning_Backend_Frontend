"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      <DialogContent className="p-0 bg-slate-50 border-none shadow-2xl rounded-2xl overflow-hidden max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header Banner */}
        <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          
          <div className="relative z-10 flex items-center gap-6">
            <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/40 flex items-center justify-center text-4xl font-bold shadow-lg">
              {currentStudent.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight mb-2 drop-shadow-md">{currentStudent.username}</h2>
              <div className="flex items-center gap-3 text-white/90">
                <Badge variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm px-3 py-1">
                  MSSV: {currentStudent.studentId}
                </Badge>
                <span className="flex items-center gap-1.5 text-sm bg-black/20 px-3 py-1 rounded-full"><User className="w-4 h-4" /> {currentStudent.email}</span>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 bg-slate-50">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
            <p className="text-indigo-600/80 font-medium animate-pulse text-lg">Đang tổng hợp dữ liệu sinh viên...</p>
          </div>
        ) : (
          <div className="p-8">
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-200/50 p-1.5 rounded-xl">
                <TabsTrigger value="info" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:font-bold data-[state=active]:shadow-sm transition-all">
                  <User className="h-4 w-4 mr-2" />
                  Thông Tin Cá Nhân
                </TabsTrigger>
                <TabsTrigger value="progress" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:font-bold data-[state=active]:shadow-sm transition-all">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Tiến Độ Học Tập
                </TabsTrigger>
                <TabsTrigger value="scores" className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:font-bold data-[state=active]:shadow-sm transition-all">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Kết Quả Điểm Số
                </TabsTrigger>
              </TabsList>

              {/* Personal Information Tab */}
              <TabsContent value="info" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-6">
                  <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-500" /> Hồ Sơ Sinh Viên
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-5">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Họ và Tên</p>
                        <p className="text-lg font-semibold text-slate-800">{currentStudent.username}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mã Sinh Viên</p>
                        <p className="text-lg font-semibold text-slate-800">{currentStudent.studentId}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Địa chỉ Email</p>
                        <p className="text-md font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg inline-block border border-indigo-100">{currentStudent.email}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/80 backdrop-blur-xl hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                    <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                      <CardTitle className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-emerald-500" /> Trạng Thái Hoạt Động
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-5 space-y-6">
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trạng Thái Tài Khoản</p>
                        <div className="flex items-center bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <span className="relative flex h-3.5 w-3.5 mr-3">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentStudent.accountStatus === 'ACTIVE' ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
                            <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${currentStudent.accountStatus === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                          </span>
                          <span className={`font-bold tracking-wide ${currentStudent.accountStatus === 'ACTIVE' ? 'text-emerald-600' : 'text-slate-600'}`}>
                            {currentStudent.accountStatus === "ACTIVE" ? "ĐANG HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                          </span>
                        </div>
                      </div>
                      
                      {currentStudent.enrollmentDate && (
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày Tham Gia Khóa Học</p>
                          <p className="text-lg font-semibold text-slate-800">
                            {new Date(currentStudent.enrollmentDate).toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Progress Tab */}
              <TabsContent value="progress" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid gap-6">
                  <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-blue-400 to-blue-600"></div>
                    <CardContent className="p-7">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-1">
                            <BookOpen className="w-5 h-5 text-blue-500" /> Bài Tập Thực Hành
                          </h3>
                          <p className="text-slate-500 text-sm">Tiến độ nộp bài tập được giao</p>
                        </div>
                        <div className="text-right">
                          <span className="text-4xl font-black text-blue-600 tracking-tighter">{currentStudent.submittedAssignments}</span>
                          <span className="text-lg text-slate-400 font-medium"> / {currentStudent.totalAssignments}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 mt-2 overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-4 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${assignmentProgress}%` }}>
                          <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm font-medium text-slate-400">0%</span>
                        <p className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{assignmentProgress.toFixed(1)}% Hoàn thành</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white overflow-hidden relative group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-400 to-purple-600"></div>
                    <CardContent className="p-7">
                      <div className="flex justify-between items-end mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-1">
                            <BarChart3 className="w-5 h-5 text-purple-500" /> Bài Kiểm Tra
                          </h3>
                          <p className="text-slate-500 text-sm">Tiến độ làm bài trắc nghiệm (Quiz)</p>
                        </div>
                        <div className="text-right">
                          <span className="text-4xl font-black text-purple-600 tracking-tighter">{currentStudent.completedQuizzes}</span>
                          <span className="text-lg text-slate-400 font-medium"> / {currentStudent.totalQuizzes}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 mt-2 overflow-hidden shadow-inner">
                        <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out relative" style={{ width: `${quizProgress}%` }}>
                          <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm font-medium text-slate-400">0%</span>
                        <p className="text-sm font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">{quizProgress.toFixed(1)}% Hoàn thành</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Scores Tab */}
              <TabsContent value="scores" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-6 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BookOpen className="w-24 h-24 text-blue-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-3 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/30">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-blue-900">Điểm Bài Tập</h3>
                    </div>
                    <div className="flex items-baseline gap-1 relative z-10">
                      <span className="text-6xl font-black tracking-tighter text-blue-600">
                        {calculatedScores.assignment != null ? calculatedScores.assignment.toFixed(1) : "-"}
                      </span>
                      <span className="text-xl font-bold text-blue-400">/10</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 p-6 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <BarChart3 className="w-24 h-24 text-purple-600" />
                    </div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                      <div className="p-3 bg-purple-500 rounded-xl text-white shadow-lg shadow-purple-500/30">
                        <BarChart3 className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-purple-900">Điểm Kiểm Tra</h3>
                    </div>
                    <div className="flex items-baseline gap-1 relative z-10">
                      <span className="text-6xl font-black tracking-tighter text-purple-600">
                        {calculatedScores.quiz != null ? calculatedScores.quiz.toFixed(1) : "-"}
                      </span>
                      <span className="text-xl font-bold text-purple-400">/10</span>
                    </div>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 p-8 shadow-xl text-white hover:shadow-2xl transition-all hover:-translate-y-1">
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
                  
                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-sm">Điểm Trung Bình Tích Lũy</h3>
                      <p className="text-indigo-100 font-medium">Được tổng hợp từ toàn bộ quá trình học tập</p>
                      <div className="flex gap-2 mt-4">
                        <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">Bài tập: 40%</Badge>
                        <Badge className="bg-white/20 text-white hover:bg-white/30 border-none">Kiểm tra: 60%</Badge>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 bg-white/20 py-4 px-8 rounded-2xl backdrop-blur-md border border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
                      <span className="text-7xl font-black tracking-tighter text-white drop-shadow-md">
                        {calculatedScores.total != null ? calculatedScores.total.toFixed(1) : "-"}
                      </span>
                      <span className="text-2xl font-bold text-indigo-100">/10</span>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default StudentDetailModal
