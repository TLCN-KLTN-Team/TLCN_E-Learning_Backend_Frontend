import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  GraduationCap,
  Search,
  UserPlus,
  Trash2,
  Edit,
  Mail,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Lock,
  Unlock,
  X,
  Calendar,
  Hash,
  Building,
  Users,
  Link as LinkIcon,
  FileText,
  Upload,
} from "lucide-react";
import { toast } from "react-toastify";
import StudentFormModal from "@/components/admin/student/StudentFormModal";
import ImportStudentsModal from "@/components/admin/student/ImportStudentsModal";
import * as studentApi from "@/services/api/admin/studentApi";
import * as educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { StudentResponse } from "@/services/api/response/studentResponse";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";

const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [educationalUnitLoading, setEducationalUnitLoading] = useState(true);
  const [currentEducationalUnit, setCurrentEducationalUnit] =
    useState<EducationalUnitResponse | null>(null);
  const [educationalUnitId, setEducationalUnitId] = useState<number | null>(
    null
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State cho chức năng chỉnh sửa
  const [editingStudent, setEditingStudent] = useState<StudentResponse | null>(
    null
  );

  // State cho detail modal
  const [selectedStudent, setSelectedStudent] =
    useState<StudentResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [studentStatusTarget, setStudentStatusTarget] =
    useState<StudentResponse | null>(null);

  // Initialize educationalUnit
  useEffect(() => {
    const initializeEducationalUnit = async () => {
      try {
        setEducationalUnitLoading(true);
        const educationalUnit = await educationUnitApi.getMyEducationalUnit();
        setCurrentEducationalUnit(educationalUnit);
        setEducationalUnitId(educationalUnit.id);
      } catch (error: any) {
        console.error("Failed to load educationalUnit:", error);
        toast.error("Không thể tải dữ liệu cơ sở giáo dục");
      } finally {
        setEducationalUnitLoading(false);
      }
    };

    initializeEducationalUnit();
  }, []);

  const loadStudents = async (
    page: number = currentPage,
    size: number = pageSize,
    search?: string
  ) => {
    if (!educationalUnitId) return;

    try {
      setLoading(true);
      const response: PaginatedResponse<StudentResponse> =
        await studentApi.getStudents(educationalUnitId, page, size, search);
      setStudents(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(page);
    } catch (error: any) {
      console.error("Error loading students:", error);
      toast.error("Không thể tải danh sách sinh viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (educationalUnitId) {
      loadStudents(0, pageSize);
    }
  }, [educationalUnitId, pageSize]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (educationalUnitId) {
        loadStudents(0, pageSize, searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSuccess = () => {
    loadStudents(currentPage, pageSize);
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      await studentApi.deleteStudent(educationalUnitId!, studentId);
      toast.success("Xóa sinh viên thành công!");
      handleSuccess();
    } catch (error: any) {
      console.error("Error deleting student:", error);
      toast.error(error?.response?.data?.message || "Không thể xóa sinh viên");
    }
  };

  const handleEditStudent = (student: StudentResponse) => {
    setEditingStudent(student);
    setShowStudentModal(true);
  };

  const handleCloseModal = () => {
    setShowStudentModal(false);
    setEditingStudent(null);
  };

  const handleViewDetails = (student: StudentResponse) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const handleToggleAccountStatus = async (student: StudentResponse) => {
    const newStatus =
      student.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = newStatus === "INACTIVE" ? "vô hiệu hóa" : "kích hoạt";

    try {
      await studentApi.updateStudentAccountStatus(
        educationalUnitId!,
        student.id,
        newStatus
      );
      toast.success(
        `${action.charAt(0).toUpperCase() + action.slice(1)
        } tài khoản thành công!`
      );
      handleSuccess();
    } catch (error: any) {
      console.error("Error toggling account status:", error);
      toast.error(`Không thể ${action} tài khoản`);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadStudents(newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      ACTIVE: {
        label: "Đang hoạt động",
        className: "bg-green-100 text-green-800",
      },
      INACTIVE: {
        label: "Không hoạt động",
        className: "bg-gray-100 text-gray-800",
      },
    };

    const statusInfo = statusMap[status] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  // Show loading state while educationalUnit is loading
  if (educationalUnitLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!educationalUnitId) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Không tìm thấy cơ sở giáo dục
          </h3>
          <p className="text-red-700">
            Không thể tải dữ liệu cơ sở giáo dục. Vui lòng thử làm mới trang.
          </p>
        </div>
      </div>
    );
  }

  if (loading && students.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <GraduationCap className="mr-3 text-blue-600" size={32} />
            Quản lý Sinh viên
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý tài khoản sinh viên cho{" "}
            {currentEducationalUnit?.name || "cơ sở giáo dục của bạn"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
          >
            <Upload className="mr-2" size={18} />
            Import từ File
          </Button>
          <Button
            onClick={() => setShowStudentModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
          >
            <UserPlus className="mr-2" size={18} />
            Tạo Sinh Viên Mới
          </Button>
        </div>
      </div>

      {/* Statistics and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <GraduationCap className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Tổng Sinh viên
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalElements}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <Input
              placeholder="Tìm kiếm sinh viên theo tên, tên đăng nhập, email, mã sinh viên hoặc lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoComplete="off"
              role="search"
            />
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {students.length === 0 ? (
          <div className="p-12 text-center">
            {totalElements === 0 ? (
              <>
                <GraduationCap
                  className="mx-auto text-gray-400 mb-4"
                  size={48}
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy sinh viên nào
                </h3>
                <p className="text-gray-500 mb-4">
                  Bắt đầu bằng cách tạo tài khoản sinh viên đầu tiên
                </p>
                <Button
                  onClick={() => setShowStudentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
                >
                  <UserPlus className="mr-2" size={16} />
                  Tạo Sinh viên
                </Button>
              </>
            ) : (
              <>
                <Search className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có sinh viên nào phù hợp với tìm kiếm
                </h3>
                <p className="text-gray-500">
                  Thử điều chỉnh từ khóa tìm kiếm của bạn
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SINH VIÊN
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LIÊN HỆ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LỚP & MÃ SỐ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      KHOA
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TRẠNG THÁI
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HÀNH ĐỘNG
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-blue-600 font-medium text-sm">
                              {student.firstName[0]}
                              {student.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <button
                              onClick={() => handleViewDetails(student)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                              {student.firstName} {student.lastName}
                            </button>
                            <div className="text-sm text-gray-500">
                              @{student.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-y-1 flex-col">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail size={14} className="mr-2 text-gray-400" />
                            {student.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Mã SH: {student.studentId}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.className || "Chưa phân lớp"}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {student.department?.name || (
                            <span className="text-gray-500 italic">
                              Chưa có khoa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(student.accountStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStudent(student)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setStudentStatusTarget(student)}
                            className={`${student.accountStatus === "ACTIVE"
                              ? "text-orange-600 border-orange-200 hover:bg-orange-50"
                              : "text-green-600 border-green-200 hover:bg-green-50"
                              }`}
                            title={
                              student.accountStatus === "ACTIVE"
                                ? "Khóa tài khoản"
                                : "Mở khóa tài khoản"
                            }
                          >
                            {student.accountStatus === "ACTIVE" ? (
                              <Lock size={14} />
                            ) : (
                              <Unlock size={14} />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setStudentToDelete({
                                id: student.id,
                                name: `${student.firstName} ${student.lastName}`,
                              })
                            }
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Hiển thị</span>
                <select
                  aria-label="Chọn số lượng hiển thị"
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">
                  trên tổng số {totalElements} sinh viên
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Trang {currentPage + 1} / {totalPages || 1}
                </span>

                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(0)}
                    disabled={currentPage === 0 || loading}
                    className="px-2"
                  >
                    <ChevronsLeft size={16} />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0 || loading}
                    className="px-2"
                  >
                    <ChevronLeft size={16} />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || loading}
                    className="px-2"
                  >
                    <ChevronRight size={16} />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1 || loading}
                    className="px-2"
                  >
                    <ChevronsRight size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedStudent(null);
          }}
          onEdit={() => {
            setShowDetailModal(false);
            handleEditStudent(selectedStudent);
          }}
          onToggleStatus={() => {
            setStudentStatusTarget(selectedStudent);
          }}
        />
      )}

      <AlertDialog
        open={!!studentToDelete}
        onOpenChange={(open) => !open && setStudentToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sinh viên?</AlertDialogTitle>
            <AlertDialogDescription>
              {studentToDelete
                ? `Bạn có chắc chắn muốn xóa sinh viên \"${studentToDelete.name}\"? Hành động này không thể hoàn tác.`
                : "Hành động này không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (studentToDelete) {
                  handleDeleteStudent(studentToDelete.id);
                  setStudentToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!studentStatusTarget}
        onOpenChange={(open) => !open && setStudentStatusTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thay đổi trạng thái tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              {studentStatusTarget
                ? `Bạn có chắc chắn muốn ${
                    studentStatusTarget.accountStatus === "ACTIVE" ? "vô hiệu hóa" : "kích hoạt"
                  } tài khoản của \"${studentStatusTarget.firstName} ${studentStatusTarget.lastName}\"?`
                : "Xác nhận thay đổi trạng thái tài khoản."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (studentStatusTarget) {
                  handleToggleAccountStatus(studentStatusTarget);
                  setStudentStatusTarget(null);
                }
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StudentFormModal
        isOpen={showStudentModal}
        onClose={handleCloseModal}
        educationalUnitId={educationalUnitId!}
        onSuccess={handleSuccess}
        editingStudent={editingStudent}
      />

      <ImportStudentsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        educationalUnitId={educationalUnitId!}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

// Student Detail Modal Component
interface StudentDetailModalProps {
  student: StudentResponse;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onEdit,
  onToggleStatus,
}) => {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusInfo = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; className: string; icon: React.ReactElement }
    > = {
      ACTIVE: {
        label: "Đang hoạt động",
        className: "bg-green-100 text-green-800 border-green-200",
        icon: <Unlock className="text-green-600" size={20} />,
      },
      INACTIVE: {
        label: "Không hoạt động",
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <Lock className="text-gray-600" size={20} />,
      },
    };

    return (
      statusMap[status] || {
        label: status,
        className: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <GraduationCap className="text-gray-600" size={20} />,
      }
    );
  };

  const statusInfo = getStatusInfo(student.accountStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {student.firstName[0]}
                  {student.lastName[0]}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {student.firstName} {student.lastName}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  @{student.username}
                </p>
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full border ${statusInfo.className}`}
                  >
                    {statusInfo.icon}
                    <span className="text-sm font-medium">
                      {statusInfo.label}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
            >
              <X size={20} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-220px)]">
          {/* Contact Information */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <Mail size={16} className="mr-2 text-blue-600" />
              Thông Tin Liên Hệ
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Mail size={16} className="mr-3 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">
                    {student.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <GraduationCap size={16} className="mr-2 text-purple-600" />
              Thông Tin Học Tập
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start">
                <Hash size={16} className="mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Mã Sinh Viên</p>
                  <p className="text-sm font-medium text-gray-900">
                    {student.studentId}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Users size={16} className="mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Lớp</p>
                  <p className="text-sm font-medium text-gray-900">
                    {student.className || (
                      <span className="text-gray-400 italic">
                        Chưa phân lớp
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-start col-span-2">
                <Building size={16} className="mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Khoa/Phòng Ban</p>
                  <p className="text-sm font-medium text-gray-900">
                    {student.department?.name || (
                      <span className="text-gray-400 italic">Chưa có khoa</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          {student.dob && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <Calendar size={16} className="mr-2 text-green-600" />
                Thông Tin Cá Nhân
              </h3>
              <div className="flex items-start">
                <Calendar size={16} className="mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Ngày Sinh</p>
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(student.dob).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          {(student.description || student.socialUrl) && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <FileText size={16} className="mr-2 text-orange-600" />
                Thông Tin Bổ Sung
              </h3>
              <div className="space-y-3">
                {student.description && (
                  <div className="flex items-start">
                    <FileText size={16} className="mr-3 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Mô Tả</p>
                      <p className="text-sm text-gray-900">
                        {student.description}
                      </p>
                    </div>
                  </div>
                )}
                {student.socialUrl && (
                  <div className="flex items-start">
                    <LinkIcon size={16} className="mr-3 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">
                        Liên Kết Mạng Xã Hội
                      </p>
                      <a
                        href={student.socialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {student.socialUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Educational Unit Information */}
          {student.educationalUnit && (
            <div className="bg-indigo-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <Building size={16} className="mr-2 text-indigo-600" />
                Cơ Sở Giáo Dục
              </h3>
              <div className="flex items-start">
                <Building size={16} className="mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Tên Cơ Sở</p>
                  <p className="text-sm font-medium text-gray-900">
                    {student.educationalUnit.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t bg-gray-50 px-6 py-4 flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onToggleStatus}
            className={`${student.accountStatus === "ACTIVE"
              ? "text-orange-600 border-orange-300 hover:bg-orange-50"
              : "text-green-600 border-green-300 hover:bg-green-50"
              }`}
          >
            {student.accountStatus === "ACTIVE" ? (
              <>
                <Lock size={16} className="mr-2" />
                Khóa Tài Khoản
              </>
            ) : (
              <>
                <Unlock size={16} className="mr-2" />
                Mở Khóa Tài Khoản
              </>
            )}
          </Button>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="px-6">
              Đóng
            </Button>
            <Button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              <Edit size={16} className="mr-2" />
              Chỉnh Sửa
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentListPage;
