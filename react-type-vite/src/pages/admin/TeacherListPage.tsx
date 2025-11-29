import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
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
  Hash,
  Building,
  CreditCard,
  Link as LinkIcon,
  FileText,
  User,
} from "lucide-react";
import { toast } from "react-toastify";
import TeacherFormModal from "@/components/admin/teacher/TeacherFormModal";
import * as teacherApi from "@/services/api/admin/teacherApi";
import educationUnitApi from "@/services/api/admin/educationUnitApi";
import type { TeacherResponse } from "@/services/api/response/teacherResponse";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";

const TeacherListPage: React.FC = () => {
  const [teachers, setTeachers] = useState<TeacherResponse[]>([]);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [educationalUnitLoading, setEducationalUnitLoading] = useState(true);
  const [currentEducationalUnit, setCurrentEducationalUnit] =
    useState<EducationalUnitResponse | null>(null);
  const [educationalUnitId, setEducationalUnitId] = useState<string | null>(
    null
  );

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State cho chức năng chỉnh sửa
  const [editingTeacher, setEditingTeacher] = useState<TeacherResponse | null>(
    null
  );

  // State cho detail modal
  const [selectedTeacher, setSelectedTeacher] =
    useState<TeacherResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Initialize EducationalUnit
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

  const loadTeachers = async (
    page: number = currentPage,
    size: number = pageSize,
    search?: string
  ) => {
    if (!educationalUnitId) return;

    try {
      setLoading(true);
      const response: PaginatedResponse<TeacherResponse> =
        await teacherApi.getTeachers(educationalUnitId, page, size);
      setTeachers(response.content || []);
      setTotalElements(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(page);
    } catch (error: any) {
      console.error("Error loading teachers:", error);
      toast.error("Không thể tải danh sách giáo viên");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (educationalUnitId) {
      loadTeachers(0, pageSize);
    }
  }, [educationalUnitId, pageSize]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (educationalUnitId) {
        loadTeachers(0, pageSize, searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSuccess = () => {
    loadTeachers(currentPage, pageSize);
  };

  const handleDeleteTeacher = async (
    teacherId: string,
    teacherName: string
  ) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa giáo viên "${teacherName}"? Hành động này không thể hoàn tác.`
      )
    ) {
      try {
        await teacherApi.deleteTeacher(educationalUnitId!, teacherId);
        toast.success("Xóa giáo viên thành công!");
        handleSuccess();
      } catch (error: any) {
        console.error("Error deleting teacher:", error);
        toast.error(
          error?.response?.data?.message || "Không thể xóa giáo viên"
        );
      }
    }
  };

  const handleEditTeacher = (teacher: TeacherResponse) => {
    setEditingTeacher(teacher);
    setShowTeacherModal(true);
  };

  const handleCloseModal = () => {
    setShowTeacherModal(false);
    setEditingTeacher(null);
  };

  const handleViewDetails = (teacher: TeacherResponse) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
  };

  const handleToggleAccountStatus = async (teacher: TeacherResponse) => {
    const newStatus =
      teacher.accountStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const action = newStatus === "INACTIVE" ? "vô hiệu hóa" : "kích hoạt";

    if (
      window.confirm(
        `Bạn có chắc chắn muốn ${action} tài khoản của "${teacher.firstName} ${teacher.lastName}"?`
      )
    ) {
      try {
        await teacherApi.updateTeacherAccountStatus(
          educationalUnitId!,
          teacher.id,
          newStatus
        );
        toast.success(
          `${
            action.charAt(0).toUpperCase() + action.slice(1)
          } tài khoản thành công!`
        );
        handleSuccess();
      } catch (error: any) {
        console.error("Error toggling account status:", error);
        toast.error(`Không thể ${action} tài khoản`);
      }
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadTeachers(newPage, pageSize);
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

  if (loading && teachers.length === 0) {
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
            <Users className="mr-3 text-green-600" size={32} />
            Quản lý Giáo viên
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý tài khoản giáo viên cho{" "}
            {currentEducationalUnit?.name || "cơ sở giáo dục của bạn"}
          </p>
        </div>
        <Button
          onClick={() => setShowTeacherModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
        >
          <UserPlus className="mr-2" size={18} />
          Tạo Giáo viên Mới
        </Button>
      </div>

      {/* Statistics and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="text-green-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Tổng Giáo viên
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
              placeholder="Tìm kiếm giáo viên theo tên, tên đăng nhập, email, mã giáo viên hoặc khoa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoComplete="off"
              role="search"
            />
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {teachers.length === 0 ? (
          <div className="p-12 text-center">
            {totalElements === 0 ? (
              <>
                <Users className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy giáo viên nào
                </h3>
                <p className="text-gray-500 mb-4">
                  Bắt đầu bằng cách tạo tài khoản giáo viên đầu tiên
                </p>
                <Button
                  onClick={() => setShowTeacherModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
                >
                  <UserPlus className="mr-2" size={16} />
                  Tạo Giáo viên
                </Button>
              </>
            ) : (
              <>
                <Search className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có giáo viên nào phù hợp với tìm kiếm
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
                      GIÁO VIÊN
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      LIÊN HỆ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MÃ GIÁO VIÊN
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
                  {teachers.map((teacher) => (
                    <tr
                      key={teacher.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-4">
                            <span className="text-green-600 font-medium text-sm">
                              {teacher.firstName[0]}
                              {teacher.lastName[0]}
                            </span>
                          </div>
                          <div>
                            <button
                              onClick={() => handleViewDetails(teacher)}
                              className="text-sm font-medium text-green-600 hover:text-green-800 hover:underline transition-colors"
                            >
                              {teacher.firstName} {teacher.lastName}
                            </button>
                            <div className="text-sm text-gray-500">
                              @{teacher.username}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start space-y-1 flex-col">
                          <div className="flex items-center text-sm text-gray-900">
                            <Mail size={14} className="mr-2 text-gray-400" />
                            {teacher.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {teacher.teacherId}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {teacher.department?.name || (
                            <span className="text-gray-500 italic">
                              Chưa có khoa
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(teacher.accountStatus)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTeacher(teacher)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleAccountStatus(teacher)}
                            className={`${
                              teacher.accountStatus === "ACTIVE"
                                ? "text-orange-600 border-orange-200 hover:bg-orange-50"
                                : "text-green-600 border-green-200 hover:bg-green-50"
                            }`}
                            title={
                              teacher.accountStatus === "ACTIVE"
                                ? "Khóa tài khoản"
                                : "Mở khóa tài khoản"
                            }
                          >
                            {teacher.accountStatus === "ACTIVE" ? (
                              <Lock size={14} />
                            ) : (
                              <Unlock size={14} />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDeleteTeacher(
                                teacher.id,
                                `${teacher.firstName} ${teacher.lastName}`
                              )
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
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">
                  trên tổng số {totalElements} giáo viên
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

      {/* Teacher Detail Modal */}
      {showDetailModal && selectedTeacher && (
        <TeacherDetailModal
          teacher={selectedTeacher}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTeacher(null);
          }}
          onEdit={() => {
            setShowDetailModal(false);
            handleEditTeacher(selectedTeacher);
          }}
          onToggleStatus={() => {
            handleToggleAccountStatus(selectedTeacher);
          }}
        />
      )}

      <TeacherFormModal
        isOpen={showTeacherModal}
        onClose={handleCloseModal}
        educationalUnitId={educationalUnitId}
        onSuccess={handleSuccess}
        editingTeacher={editingTeacher}
      />
    </div>
  );
};

// Teacher Detail Modal Component
interface TeacherDetailModalProps {
  teacher: TeacherResponse;
  onClose: () => void;
  onEdit: () => void;
  onToggleStatus: () => void;
}

const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  teacher,
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
        icon: <User className="text-gray-600" size={20} />,
      }
    );
  };

  const statusInfo = getStatusInfo(teacher.accountStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      ></div>

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {teacher.firstName[0]}
                  {teacher.lastName[0]}
                </span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {teacher.firstName} {teacher.lastName}
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  @{teacher.username}
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
                    {teacher.email}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
              <Building size={16} className="mr-2 text-purple-600" />
              Thông Tin Nghề Nghiệp
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start">
                <Hash size={16} className="mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Mã Giảng Viên</p>
                  <p className="text-sm font-medium text-gray-900">
                    {teacher.teacherId}
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <Building size={16} className="mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Khoa/Phòng Ban</p>
                  <p className="text-sm font-medium text-gray-900">
                    {teacher.department?.name || (
                      <span className="text-gray-400 italic">Chưa có khoa</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          {teacher.dob && (
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <CreditCard size={16} className="mr-2 text-indigo-600" />
                Thông Tin Tài Chính
              </h3>
              <div className="flex items-start">
                <CreditCard size={16} className="mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">
                    Số Tài Khoản Ngân Hàng
                  </p>
                  <p className="text-sm font-medium text-gray-900 font-mono">
                    {(teacher.bankAccountNumber ?? "")
                      .replace(/(.{4})/g, "$1 ")
                      .trim() || "Chưa có số tài khoản"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Additional Information */}
          {(teacher.description || teacher.socialUrl) && (
            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <FileText size={16} className="mr-2 text-orange-600" />
                Thông Tin Bổ Sung
              </h3>
              <div className="space-y-3">
                {teacher.description && (
                  <div className="flex items-start">
                    <FileText size={16} className="mr-3 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Mô Tả</p>
                      <p className="text-sm text-gray-900">
                        {teacher.description}
                      </p>
                    </div>
                  </div>
                )}
                {teacher.socialUrl && (
                  <div className="flex items-start">
                    <LinkIcon size={16} className="mr-3 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">
                        Liên Kết Mạng Xã Hội
                      </p>
                      <a
                        href={teacher.socialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all"
                      >
                        {teacher.socialUrl}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Educational Unit Information */}
          {teacher.educationalUnit && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
                <Building size={16} className="mr-2 text-gray-600" />
                Cơ Sở Giáo Dục
              </h3>
              <div className="flex items-start">
                <Building size={16} className="mr-3 text-gray-400 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Tên Cơ Sở</p>
                  <p className="text-sm font-medium text-gray-900">
                    {teacher.educationalUnit.name}
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
            className={`${
              teacher.accountStatus === "ACTIVE"
                ? "text-orange-600 border-orange-300 hover:bg-orange-50"
                : "text-green-600 border-green-300 hover:bg-green-50"
            }`}
          >
            {teacher.accountStatus === "ACTIVE" ? (
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
              className="bg-green-600 hover:bg-green-700 text-white px-6"
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

export default TeacherListPage;
