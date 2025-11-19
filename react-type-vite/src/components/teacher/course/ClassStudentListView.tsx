"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Plus, Search, AlertCircle, Loader2, Eye, Trash2} from 'lucide-react'
import * as classApi from "@/services/api/admin/classApi";
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
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

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

  const handleAddStudents = async () => {
    await fetchClassData()
    setIsAddModalOpen(false)
  }

  const handleViewStudent = (student: StudentResponse) => {
    setSelectedStudent(student)
    setIsDetailModalOpen(true)
  }

  const handleRemoveStudent = async (studentId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sinh viên này khỏi lớp?")) {
      return
    }

    try {
      setIsDeleting(studentId)
      await classApi.unenrollStudentFromClass(educationalUnitId, classData.id, studentId);
      
      // Refresh data to update statistics
      await fetchClassData()
    } catch (err) {
      console.error("Error removing student:", err)
      alert("Không thể xóa sinh viên. Vui lòng thử lại.")
    } finally {
      setIsDeleting(null)
    }
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
                <p className="text-gray-600 text-xs uppercase tracking-wide">Tỷ Lệ Hoàn Thành</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{(stats.completionRate * 100).toFixed(0)}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
          <CardTitle>Danh Sách Sinh Viên ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MSSV</TableHead>
                    <TableHead>Họ Tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-center">Bài Tập</TableHead>
                    <TableHead className="text-center">Quiz</TableHead>
                    <TableHead className="text-center">Điểm TB</TableHead>
                    <TableHead className="text-center">Trạng Thái</TableHead>
                    <TableHead className="text-right">Hành Động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="font-medium">{student.studentId}</TableCell>
                      <TableCell>{student.username}</TableCell>
                      <TableCell className="text-sm text-gray-600">{student.email}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">
                          {student.submittedAssignments}/{student.totalAssignments}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm">
                          {student.completedQuizzes}/{student.totalQuizzes}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-semibold">{(student.averageScore ?? 0).toFixed(1)}</span>
                      </TableCell>
                      <TableCell className="text-center">
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
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveStudent(student.studentId)}
                            disabled={isDeleting === student.studentId}
                            className="text-red-600 hover:text-red-700"
                          >
                            {isDeleting === student.studentId ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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