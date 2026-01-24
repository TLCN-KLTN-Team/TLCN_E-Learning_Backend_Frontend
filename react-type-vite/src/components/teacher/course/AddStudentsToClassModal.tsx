"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, AlertCircle, Users, UserCheck, UserMinus } from "lucide-react"
import * as classApi from "@/services/api/teacher/classManagementApi"
import type { StudentResponse } from "@/services/api/response/studentResponse"
import { toast } from "react-toastify"

interface AddStudentsToClassModalProps {
  isOpen: boolean
  onClose: () => void
  classId: number
  courseId: string
  educationalUnitId: number
  onStudentsAdded: () => void
}

const AddStudentsToClassModal: React.FC<AddStudentsToClassModalProps> = ({
  isOpen,
  onClose,
  classId,
  educationalUnitId,
  onStudentsAdded,
}) => {
  const [allAvailableStudents, setAllAvailableStudents] = useState<StudentResponse[]>([])
  const [enrolledStudents, setEnrolledStudents] = useState<StudentResponse[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<"available" | "enrolled">("available")
  const [loadingData, setLoadingData] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadData()
      setSelectedStudents([])
      setSearchTerm("")
    }
  }, [isOpen, classId, educationalUnitId])

  const loadData = async () => {
    try {
      setLoadingData(true)
      setError(null)

      const [available, enrolled] = await Promise.all([
        classApi.getAvailableStudentsForClass(educationalUnitId, classId),
        classApi.getStudentsInClass(educationalUnitId, classId),
      ])

      setAllAvailableStudents(available || [])
      setEnrolledStudents(enrolled || [])
    } catch (err: any) {
      console.error("Error loading student data:", err)
      setError("Không thể tải dữ liệu sinh viên. Vui lòng thử lại.")
      toast.error("Không thể tải dữ liệu sinh viên")
    } finally {
      setLoadingData(false)
    }
  }

  // Filter out enrolled students from available students
  const availableStudents = allAvailableStudents.filter(
    (student) => !enrolledStudents.some((enrolled) => enrolled.id === student.id),
  )

  // Filter students based on search term
  const filteredAvailableStudents = availableStudents.filter(
    (student) =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.className?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredEnrolledStudents = enrolledStudents.filter(
    (student) =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.department?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.className?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    )
  }

  const handleSelectAll = () => {
    setSelectedStudents(filteredAvailableStudents.map((student) => student.studentId))
  }

  const handleDeselectAll = () => {
    setSelectedStudents([])
  }

  const handleAddStudents = async () => {
    if (!selectedStudents.length) {
      toast.error("Vui lòng chọn ít nhất một sinh viên")
      return
    }

    try {
      setIsLoading(true)
      await classApi.enrollStudentsToClass(educationalUnitId, classId, selectedStudents)
      toast.success("Thêm sinh viên vào lớp thành công!")
      await loadData()
      setSelectedStudents([])
      onStudentsAdded()
      onClose()
    } catch (err: any) {
      console.error("Error adding students:", err)
      toast.error(err?.response?.data?.message || "Không thể thêm sinh viên vào lớp")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnenrollStudent = async (studentId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn loại bỏ sinh viên này khỏi lớp?")) {
      try {
        setIsLoading(true)
        await classApi.unenrollStudentFromClass(educationalUnitId, classId, studentId)
        toast.success("Đã loại bỏ sinh viên khỏi lớp thành công!")
        await loadData()
      } catch (err: any) {
        console.error("Error unenrolling student:", err)
        toast.error(err?.response?.data?.message || "Không thể loại bỏ sinh viên khỏi lớp")
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleClose = () => {
    setSelectedStudents([])
    setActiveTab("available")
    setSearchTerm("")
    setError(null)
    onClose()
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white rounded-lg max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white">Quản Lý Sinh Viên Lớp</DialogTitle>
              <DialogDescription className="text-blue-100">
                Thêm hoặc loại bỏ sinh viên khỏi lớp học này
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <div className="px-6 pt-4 pb-3 flex-shrink-0">
          <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("available")}
              className={`flex-1 px-4 lg:px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "available"
                  ? "bg-white text-blue-600 shadow-sm transform scale-[1.02]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <Users className="inline mr-2" size={16} />
              <span className="hidden sm:inline">Sinh Viên Có Sẵn</span>
              <span className="sm:hidden">Có Sẵn</span>
              <span className="ml-1">({availableStudents.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("enrolled")}
              className={`flex-1 px-4 lg:px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === "enrolled"
                  ? "bg-white text-blue-600 shadow-sm transform scale-[1.02]"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
            >
              <UserCheck className="inline mr-2" size={16} />
              <span className="hidden sm:inline">Sinh Viên Đã Đăng Ký</span>
              <span className="sm:hidden">Đã Đăng Ký</span>
              <span className="ml-1">({enrolledStudents.length})</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-6 pb-3 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              type="text"
              placeholder="Tìm kiếm sinh viên theo tên, mã, khoa hoặc lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-2.5 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-3 flex-shrink-0">
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6" style={{ minHeight: 0 }}>
          {loadingData ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 font-medium">Đang tải danh sách sinh viên...</span>
            </div>
          ) : activeTab === "available" ? (
            <div className="space-y-4 pb-20">
              {filteredAvailableStudents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? "Không tìm thấy sinh viên" : "Không có sinh viên khả dụng"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm
                      ? "Thử điều chỉnh tiêu chí tìm kiếm"
                      : "Tất cả sinh viên đủ điều kiện đã được đăng ký hoặc không có sinh viên nào khả dụng"}
                  </p>
                </div>
              ) : (
                <>
                  {/* Action Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <span className="text-sm text-gray-600">
                        <span className="font-semibold">{filteredAvailableStudents.length}</span> sinh viên khả dụng
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={filteredAvailableStudents.length === 0}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50 flex-1 sm:flex-none bg-transparent"
                      >
                        Chọn tất cả
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAll}
                        disabled={selectedStudents.length === 0}
                        className="text-gray-600 border-gray-200 hover:bg-gray-50 flex-1 sm:flex-none bg-transparent"
                      >
                        Bỏ chọn tất cả
                      </Button>
                    </div>
                  </div>

                  {/* Student List */}
                  <div className="grid gap-3 pb-20">
                    {filteredAvailableStudents.map((student) => {
                      const isSelected = selectedStudents.includes(student.studentId)

                      return (
                        <div
                          key={student.id}
                          className={`relative group transition-all duration-200 rounded-xl border-2 ${isSelected
                              ? "border-blue-200 bg-blue-50 shadow-md"
                              : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                            }`}
                        >
                          <label className="flex items-center p-4 cursor-pointer">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="relative flex-shrink-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleStudent(student.studentId)}
                                  className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <UserCheck size={12} className="text-white" />
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                  {student.firstName[0]}
                                  {student.lastName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-gray-900 truncate">
                                    {student.firstName} {student.lastName}
                                  </h4>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 font-medium">
                                      Mã: {student.studentId}
                                    </span>
                                    {student.className && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                                        Lớp: {student.className}
                                      </span>
                                    )}
                                    {student.department && (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                                        {student.department.name}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3 pb-20">
              {filteredEnrolledStudents.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="text-gray-400" size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? "Không tìm thấy sinh viên" : "Chưa có sinh viên đăng ký"}
                  </h3>
                  <p className="text-gray-500 text-sm">
                    {searchTerm
                      ? "Thử điều chỉnh tiêu chí tìm kiếm"
                      : "Hiện tại chưa có sinh viên nào đăng ký lớp học này"}
                  </p>
                </div>
              ) : (
                filteredEnrolledStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl border border-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <UserCheck className="text-green-600" size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800 font-medium">
                            Mã: {student.studentId}
                          </span>
                          {student.className && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 font-medium">
                              Lớp: {student.className}
                            </span>
                          )}
                          {student.department && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 font-medium">
                              {student.department.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnenrollStudent(student.studentId)}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 flex-shrink-0 ml-3"
                    >
                      <UserMinus size={14} className="mr-1" />
                      <span className="hidden sm:inline">Loại bỏ</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="border-t bg-gray-50 px-6 py-4 flex-shrink-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 w-full">
            {activeTab === "available" && filteredAvailableStudents.length > 0 ? (
              <>
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-blue-600">{selectedStudents.length}</span> sinh viên đã chọn
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors flex-1 sm:flex-none bg-transparent"
                    disabled={isLoading}
                  >
                    Hủy
                  </Button>
                  <Button
                    onClick={handleAddStudents}
                    disabled={!selectedStudents.length || isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 min-w-[140px] flex-1 sm:flex-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Đang thêm...
                      </div>
                    ) : (
                      `Thêm ${selectedStudents.length} sinh viên`
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex justify-end w-full">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors bg-transparent"
                >
                  Đóng
                </Button>
              </div>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AddStudentsToClassModal
