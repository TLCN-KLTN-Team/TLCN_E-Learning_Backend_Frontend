import React, { useState, useEffect } from "react";
import {
  Search,
  Edit,
  Trash2,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import type { DepartmentResponse } from "@/services/api/response/departmentResponse";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import {
  deleteDepartment,
  getDepartmentsByEducationalUnit,
} from "@/services/api/admin/departmentApi";
import educationUnitApi from "@/services/api/admin/educationUnitApi";
import DepartmentFormModal from "@/components/admin/department/DepartmentFormModal";

const DepartmentManagementPage: React.FC = () => {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [educationalUnitLoading, setEducationalUnitLoading] = useState(true);
  const [currentEducationalUnit, setCurrentEducationalUnit] =
    useState<EducationalUnitResponse | null>(null);
  const [educationalUnitId, setEducationalUnitId] = useState<number | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [showDepartmentModal, setShowDepartmentModal] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<DepartmentResponse | null>(null);

  // Detail modal state

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

  const loadDepartments = async (
    page: number = currentPage,
    size: number = pageSize,
    search?: string
  ) => {
    if (!educationalUnitId) return;

    try {
      setLoading(true);
      const response = await getDepartmentsByEducationalUnit(
        educationalUnitId,
        page,
        size,
        search || undefined
      );

      setDepartments(response.content || []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error loading departments:", error);
      toast.error("Không thể tải danh sách khoa. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (educationalUnitId) {
      loadDepartments(0, pageSize);
    }
  }, [educationalUnitId, pageSize]);

  // Handle search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (educationalUnitId) {
        loadDepartments(0, pageSize, searchTerm);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSuccess = () => {
    loadDepartments(currentPage, pageSize);
  };

  const handleDelete = async (departmentId: string, departmentName: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa khoa "${departmentName}"? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      await deleteDepartment(educationalUnitId!, departmentId);
      toast.success("Xóa khoa thành công!");

      // Reload departments and adjust page if needed
      if (departments.length === 1 && currentPage > 0) {
        loadDepartments(currentPage - 1, pageSize);
      } else {
        loadDepartments(currentPage, pageSize);
      }
    } catch (error: any) {
      console.error("Error deleting department:", error);
      const errorMessage =
        error?.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại!";
      toast.error(errorMessage);
    }
  };

  const handleEditDepartment = (department: DepartmentResponse) => {
    setEditingDepartment(department);
    setShowDepartmentModal(true);
  };

  const handleCloseModal = () => {
    setShowDepartmentModal(false);
    setEditingDepartment(null);
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      loadDepartments(newPage, pageSize);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0);
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

  if (loading && departments.length === 0) {
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
            <Building className="mr-3 text-blue-600" size={32} />
            Quản lý Khoa
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý các khoa trong{" "}
            {currentEducationalUnit?.name || "cơ sở giáo dục của bạn"}
          </p>
        </div>
        <Button
          onClick={() => setShowDepartmentModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
        >
          <Plus className="mr-2" size={18} />
          Thêm Khoa Mới
        </Button>
      </div>

      {/* Statistics and Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="text-blue-600" size={24} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng Khoa</p>
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
              placeholder="Tìm kiếm khoa theo tên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-lg"
              autoComplete="off"
              role="search"
            />
          </div>
        </div>
      </div>

      {/* Departments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {departments.length === 0 ? (
          <div className="p-12 text-center">
            {totalElements === 0 ? (
              <>
                <Building className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không tìm thấy khoa nào
                </h3>
                <p className="text-gray-500 mb-4">
                  Bắt đầu bằng cách tạo khoa đầu tiên
                </p>
                <Button
                  onClick={() => setShowDepartmentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-lg"
                >
                  <Plus className="mr-2" size={16} />
                  Tạo Khoa
                </Button>
              </>
            ) : (
              <>
                <Search className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Không có khoa nào phù hợp với tìm kiếm
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
                      STT
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      TÊN KHOA
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MÔ TẢ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      HÀNH ĐỘNG
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departments.map((dept, index) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {currentPage * pageSize + index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <Building className="text-blue-600" size={20} />
                          </div>
                          <div>{dept.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md">
                          <div
                            className="line-clamp-2"
                            title={dept.description || ""}
                          >
                            {dept.description || (
                              <span className="text-gray-400 italic">
                                Chưa có mô tả
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditDepartment(dept)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            title="Chỉnh sửa"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(dept.id, dept.name)}
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
                  trên tổng số {totalElements} khoa
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

      {/* Department Form Modal */}
      <DepartmentFormModal
        isOpen={showDepartmentModal}
        onClose={handleCloseModal}
        educationalUnitId={educationalUnitId!}
        onSuccess={handleSuccess}
        editingDepartment={editingDepartment}
      />
    </div>
  );
};

export default DepartmentManagementPage;
