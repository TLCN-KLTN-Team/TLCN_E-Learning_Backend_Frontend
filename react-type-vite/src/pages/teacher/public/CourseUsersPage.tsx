"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  ArrowLeft, 
  Search, 
  Users, 
  Mail, 
  Calendar,
  ClipboardCheck,
  FileText,
  Award,
  Filter,
  Download,
  RefreshCw
} from "lucide-react"
import { toast } from "react-toastify"
import teacherPublicApi, { type PublicCourseStudent } from "@/services/api/teacher/teacherPublicApi"
import { CourseApiService } from "@/services/api/user/courseApi"

interface Student extends PublicCourseStudent {}

// Helper function to get progress color based on percentage
const getProgressColor = (progress: number): string => {
  if (progress <= 30) return "bg-red-600"
  if (progress <= 70) return "bg-yellow-500"
  return "bg-green-600"
}

// Helper function to get progress text color
const getProgressTextColor = (progress: number): string => {
  if (progress <= 30) return "text-red-600"
  if (progress <= 70) return "text-yellow-600"
  return "text-green-600"
}

const CourseStudentsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [courseName, setCourseName] = useState<string>("")
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = async () => {
    if (!courseId) return

    try {
      // Load students - backend sẽ tự load course info
      const studentsData = await teacherPublicApi.getCourseStudents(Number(courseId))
      setStudents(studentsData)
      setFilteredStudents(studentsData)
      
      // Try to load course info for display (optional)
      try {
        const course = await CourseApiService.getCourseById(courseId)
        if (course && course.courseName) {
          setCourseName(course.courseName)
        }
      } catch (err) {
        console.log("Could not load course name, using default")
      }
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Đã có lỗi khi tải dữ liệu")
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadData()
      toast.success("Đã cập nhật dữ liệu tiến độ")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Không thể cập nhật dữ liệu")
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true)
      await loadData()
      setLoading(false)
    }

    loadInitialData()
  }, [courseId])

  useEffect(() => {
    const filtered = students.filter(
      (student) =>
        student.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStudents(filtered)
  }, [searchTerm, students])

  const handleViewQuizzes = (studentId: string) => {
    navigate(`/teacher/public-courses/${courseId}/students/${studentId}/quizzes`)
  }

  const handleViewAssignments = (studentId: string) => {
    navigate(`/teacher/public-courses/${courseId}/students/${studentId}/assignments`)
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-auto">
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/teacher/public-courses")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách khóa học
            </Button>
            
            <h1 className="text-3xl font-bold mb-2 flex items-center text-foreground">
              <Users className="mr-3 text-primary" size={32} />
              Người dùng - {courseName || 'Khóa học'}
            </h1>
            <p className="text-muted-foreground text-lg">Quản lý và xem chi tiết người dùng đã mua khóa học</p>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng người dùng</p>
                  <h3 className="text-2xl font-bold text-card-foreground">{students.length}</h3>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tiến độ TB</p>
                  <h3 className="text-2xl font-bold text-card-foreground">
                    {students.length > 0 
                      ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
                      : 0}%
                  </h3>
                </div>
                <Award className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Điểm TB</p>
                  <h3 className="text-2xl font-bold text-card-foreground">
                    {students.length > 0
                      ? (students.reduce((sum, s) => sum + s.averageScore, 0) / students.length).toFixed(1)
                      : 0}/10
                  </h3>
                </div>
                <ClipboardCheck className="w-8 h-8 text-orange-500" />
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bài tập đã nộp</p>
                  <h3 className="text-2xl font-bold text-card-foreground">
                    {students.reduce((sum, s) => sum + s.assignmentsSubmitted, 0)}
                  </h3>
                </div>
                <FileText className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Search and Actions */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
              <Input
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Đang cập nhật...' : 'Làm mới'}
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Lọc
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Xuất Excel
              </Button>
            </div>
          </div>

          {/* Students Table */}
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto text-muted-foreground mb-4" size={48} />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {students.length === 0 ? "Chưa có người dùng nào" : "Không tìm thấy người dùng"}
              </h3>
              <p className="text-muted-foreground">
                {students.length === 0 ? "Người dùng mua khóa học sẽ hiển thị ở đây" : "Thử điều chỉnh từ khóa tìm kiếm"}
              </p>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Người dùng
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Ngày đăng ký
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Tiến độ
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Bài kiểm tra
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Bài tập
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Điểm TB
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStudents.map((student) => (
                      <tr key={student.studentId} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-card-foreground">
                              {student.studentName}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                              <Mail className="w-3 h-3 mr-1" />
                              {student.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(student.enrolledDate).toLocaleDateString('vi-VN')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-muted rounded-full h-2.5 min-w-[100px] overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all ${getProgressColor(student.progress)}`}
                                style={{ width: `${Math.min(100, Math.max(0, student.progress))}%` }}
                                aria-label={`Progress: ${Math.round(student.progress)}%`}
                              />
                            </div>
                            <span className={`text-sm font-semibold min-w-[45px] text-right ${getProgressTextColor(student.progress)}`}>
                              {Math.round(student.progress)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-card-foreground">{student.quizzesTaken} bài</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-card-foreground">{student.assignmentsSubmitted} bài</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            student.averageScore >= 8
                              ? 'bg-green-100 text-green-800'
                              : student.averageScore >= 6
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.averageScore.toFixed(1)}/10
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewQuizzes(student.studentId)}
                            >
                              <ClipboardCheck className="w-4 h-4 mr-1" />
                              Quiz
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewAssignments(student.studentId)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Bài tập
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default CourseStudentsPage
