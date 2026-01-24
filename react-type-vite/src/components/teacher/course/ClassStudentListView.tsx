"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, AlertCircle, Loader2, Eye, Info } from 'lucide-react'
import * as classApi from "@/services/api/teacher/classManagementApi";
import type { ClassStudentStatsResponse } from "@/services/api/response/studentEnrollmentResponse"
import type { CourseClassResponse } from "@/services/api/response/courseClassResponse"
import AddStudentsToClassModal from "./AddStudentsToClassModal"
import StudentDetailModal from "./StudentDetailModal"
import type { StudentResponse } from "@/services/api/response/studentResponse"

interface ClassStudentListViewProps {
  classData: CourseClassResponse
  courseId: string
  educationalUnitId: number
  onBack: () => void
}

// Hàm tính tiến độ dựa trên bài tập và quiz
const getStudentProgress = (student: StudentResponse): number => {
  const assignmentProgress = student.totalAssignments > 0
    ? (student.submittedAssignments / student.totalAssignments) * 100
    : 0

  const quizProgress = student.totalQuizzes > 0
    ? (student.completedQuizzes / student.totalQuizzes) * 100
    : 0

  const lessonProgress = student.totalLessons > 0 ?
    (student.viewedLessons / student.totalLessons) * 100 : 0

  // Trung bình của bài tập và quiz
  return (assignmentProgress + quizProgress + lessonProgress) / 3
}

// Hàm phân loại học sinh dựa trên tiến độ
const getPerformanceCategory = (progress: number) => {
  if (progress >= 80) return 'excellent' // Xuất sắc
  if (progress >= 60) return 'good' // Tốt
  if (progress >= 40) return 'average' // Trung bình
  if (progress >= 20) return 'below-average' // Yếu
  return 'poor' // Kém
}

// Hàm lấy màu cho từng hàng dựa trên tiến độ
const getRowColorClass = (progress: number) => {
  const category = getPerformanceCategory(progress)

  switch (category) {
    case 'excellent':
      return 'bg-green-50 hover:bg-green-100 border-l-4 border-l-green-500'
    case 'good':
      return 'bg-blue-50 hover:bg-blue-100 border-l-4 border-l-blue-500'
    case 'average':
      return 'bg-yellow-50 hover:bg-yellow-100 border-l-4 border-l-yellow-500'
    case 'below-average':
      return 'bg-orange-50 hover:bg-orange-100 border-l-4 border-l-orange-500'
    case 'poor':
      return 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500'
    default:
      return 'hover:bg-gray-50'
  }
}

// Hàm lấy badge tiến độ
const getProgressBadge = (progress: number) => {
  const category = getPerformanceCategory(progress)

  const configs = {
    excellent: { label: 'Xuất Sắc', color: 'bg-green-100 text-green-800 border-green-300' },
    good: { label: 'Tốt', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    average: { label: 'Trung Bình', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    'below-average': { label: 'Yếu', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    poor: { label: 'Kém', color: 'bg-red-100 text-red-800 border-red-300' }
  }

  const config = configs[category]

  return (
    <div className="flex items-center gap-2 justify-center">
      <Badge className={`${config.color} border font-medium`}>
        {config.label}
      </Badge>
      <span className="text-xs text-gray-500 font-medium">
        {progress.toFixed(0)}%
      </span>
    </div>
  )
}

const ClassStudentListView: React.FC<ClassStudentListViewProps> = ({
  classData,
  courseId,
  educationalUnitId,
}) => {
  const [students, setStudents] = useState<StudentResponse[]>([])
  const [stats, setStats] = useState<ClassStudentStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<StudentResponse | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [showLegend, setShowLegend] = useState(true)

  useEffect(() => {
    fetchClassData()
  }, [classData.id])

  const fetchClassData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [studentsData, statsData] = await Promise.all([
        classApi.getStudentsInClass(educationalUnitId, classData.id),
        classApi.getClassStatisticsByClass(educationalUnitId, classData.id),
      ])

      setStudents(studentsData)
      setStats(statsData)
    } catch (err) {
      console.error("Error fetching class data:", err)
      setError("Không thể tải danh sách sinh viên. Vui lòng thử lại.")
    } finally {
      setLoading(false)
    }
  }

  // Tính tiến độ trung bình của tất cả học sinh
  const calculateAverageProgress = () => {
    if (students.length === 0) return 0
    const totalProgress = students.reduce((sum, student) => sum + getStudentProgress(student), 0)
    return totalProgress / students.length
  }

  const handleAddStudents = async () => {
    await fetchClassData()
    setIsAddModalOpen(false)
  }

  const handleViewStudent = (student: StudentResponse) => {
    setSelectedStudent(student)
    setIsDetailModalOpen(true)
  }

  const filteredStudents = students.filter(
    (student) =>
      student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Đang tải danh sách sinh viên...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-semibold mb-1 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            {classData.className}
          </h2>
          <p className="text-sm text-gray-600">Mã lớp: {classData.classCode}</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="mr-2 h-4 w-4" />
          Thêm Sinh Viên
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-gray-600 text-xs uppercase tracking-wide">Tổng Sinh Viên</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.totalStudents}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-gray-600 text-xs uppercase tracking-wide">Sinh Viên Hoạt Động</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeStudents}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-gray-600 text-xs uppercase tracking-wide">Điểm Trung Bình</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{stats.averageScore.toFixed(1)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div>
                <p className="text-gray-600 text-xs uppercase tracking-wide">Tiến độ trung bình</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{calculateAverageProgress().toFixed(0)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Distribution */}


      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          placeholder="Tìm kiếm theo tên, MSSV hoặc email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border rounded-lg transition-colors border-gray-300 focus:border-blue-500 outline-none"
        />
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Danh Sách Sinh Viên ({filteredStudents.length})</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLegend(!showLegend)}
              className="text-xs"
            >
              <Info className="h-3 w-3 mr-1" />
              {showLegend ? 'Ẩn' : 'Hiện'} Chú Thích
            </Button>
          </CardTitle>
          {showLegend && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs">
              <p className="font-semibold mb-2 text-gray-700">Chú thích màu sắc:</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Xuất Sắc (≥80%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Tốt (60-79%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span>Trung Bình (40-59%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>Yếu (20-39%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Kém (&lt;20%)</span>
                </div>
              </div>
              <p className="mt-2 text-gray-600">
                * Tiến độ = Trung bình (% Bài tập hoàn thành + % Quiz hoàn thành + % Bài học đã xem)
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">MSSV</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Họ Tên</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-gray-700">Email</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Bài Tập</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Quiz</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Bài Học</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Điểm TB</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Tiến Độ</th>
                    <th className="text-center py-3 px-4 font-semibold text-sm text-gray-700">Trạng Thái</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-gray-700">Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student) => {
                    const progress = getStudentProgress(student)
                    return (
                      <tr key={student.studentId} className={`border-b border-gray-100 transition-colors ${getRowColorClass(progress)}`}>
                        <td className="py-3 px-4 font-medium">{student.studentId}</td>
                        <td className="py-3 px-4 font-medium">{student.username}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">{student.email}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm font-medium">
                            {student.submittedAssignments}/{student.totalAssignments}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm font-medium">
                            {student.completedQuizzes}/{student.totalQuizzes}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="text-sm font-medium">
                            {student.viewedLessons}/{student.totalLessons}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold text-base">{(student.averageScore ?? 0).toFixed(1)}</span>
                        </td>
                        <td className="py-3 px-4">
                          {getProgressBadge(progress)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={student.accountStatus === "ACTIVE" ? "default" : "secondary"}
                            className={
                              student.accountStatus === "ACTIVE"
                                ? "bg-green-100 text-green-800"
                                : student.accountStatus === "COMPLETED"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                            }
                          >
                            {student.accountStatus === "ACTIVE"
                              ? "Hoạt Động"
                              : student.accountStatus === "COMPLETED"
                                ? "Hoàn Thành"
                                : "Không Hoạt Động"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewStudent(student)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Chưa có sinh viên nào trong lớp này</p>
              <Button onClick={() => setIsAddModalOpen(true)} className="mt-4 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Thêm Sinh Viên Đầu Tiên
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddStudentsToClassModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        classId={classData.id}
        courseId={courseId}
        educationalUnitId={educationalUnitId}
        onStudentsAdded={handleAddStudents}
      />

      {selectedStudent && (
        <StudentDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedStudent(null)
          }}
          student={selectedStudent}
          classId={classData.id}
        />
      )}
    </div>
  )
}

export default ClassStudentListView