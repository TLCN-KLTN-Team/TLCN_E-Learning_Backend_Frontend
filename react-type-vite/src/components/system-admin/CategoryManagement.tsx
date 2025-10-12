"use client";

import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

import { CSS_CLASSES } from "./data/CategoriesData";
import {
  createCourseType,
  getCourseTypes,
  updateCourseType,
} from "@/services/api/superadmin/courseTypeApi";
import type { CourseCategoryResponse } from "@/services/api/response/courseTypeResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";
import { toast } from "react-toastify";
import AddCourseTypeModal from "./modals/AddCoureTypeModal";
import DeleteConfirmModal from "../system/DeleteConfirmModal";
import { paginationUtils } from "@/utils/paginationUtils";
import type { PaginationState } from "@/utils/paginationUtils";

const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<CourseCategoryResponse[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<CourseCategoryResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination state using paginationUtils
  const [paginationState, setPaginationState] = useState<PaginationState>(
    paginationUtils.createPaginationStateManager(10)
  );

  // Pagination handlers using paginationUtils
  const paginationHandlers = paginationUtils.createPaginationHandlers(
    (page: number) =>
      setPaginationState((prev) => ({ ...prev, currentPage: page })),
    (size: number) =>
      setPaginationState((prev) => ({ ...prev, pageSize: size })),
    undefined, // onPageChange callback - will be handled by useEffect
    undefined // onPageSizeChange callback - will be handled by useEffect
  );

  // Generate page numbers using paginationUtils
  const pageNumbers = paginationUtils.generatePageNumbers(
    paginationState.currentPage,
    paginationState.totalPages
  );

  // Get pagination display text
  const paginationText = paginationUtils.getPaginationText(paginationState);

  const handleAddCourseType = async (data: {
    name: string;
    description: string;
  }) => {
    try {
      // TODO: Call API to create new course type
      if (selectedCategory) {
        // handle update case
        const result = await updateCourseType(selectedCategory.id, {
          name: data.name,
          description: data.description,
        });
        setCategories((prev) => {
          const index = prev.findIndex((cat) => cat.id === selectedCategory.id);
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = result;
            return updated;
          }
          return prev;
        });
        setSelectedCategory(null);
        toast.success("Cập nhật danh mục thành công!");
      } else {
        const result = await createCourseType(data.name, data.description);
        setCategories((prev) => [...prev, result]);
        // Temporarily show success message
        toast.success("Thêm danh mục thành công!");
      }
      // Auto close modal
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding course type:", error);
      const errMsg = error instanceof Error ? error.message : "";
      console.log("Error message:", errMsg);
      toast.error(error ? errMsg : "Có lỗi xảy ra khi thêm hoặc sửa danh mục");
    }
  };

  const handleShowUpdate = (category: CourseCategoryResponse) => () => {
    setSelectedCategory(category);
    setShowAddModal(true);
  };

  const handleDeleteCourseType = async (id: number) => {
    try {
      // TODO: Call API to delete course type
      console.log("Deleting course type with id:", id);

      // Remove from state
      setCategories((prev) => prev.filter((cat) => cat.id !== id));

      toast.success("Xóa danh mục thành công!");
    } catch (error) {
      console.error("Error deleting course type:", error);
      const errMsg = error instanceof Error ? error.message : "";
      console.log("Error message:", errMsg);
      toast.error(error ? errMsg : "Có lỗi xảy ra khi xóa danh mục");
    }
  };

  const handleDeleteClick = (category: CourseCategoryResponse) => {
    setSelectedCategory(category);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;

    setIsDeleting(true);
    try {
      await handleDeleteCourseType(selectedCategory.id);
      setShowDeleteModal(false);
      setSelectedCategory(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTotalCourses = () => {
    return categories.reduce(
      (total, category) => total + category.numberOfType,
      0
    );
  };

  useEffect(() => {
    // Fetch categories from service
    const fetchCourseCategories = async () => {
      try {
        const result: PaginatedResponse<CourseCategoryResponse> =
          await getCourseTypes(
            paginationState.currentPage,
            paginationState.pageSize
          );
        setCategories(result.content);

        // Update pagination state using paginationUtils
        const newPaginationState = paginationUtils.calculatePaginationState(
          paginationState.currentPage,
          paginationState.pageSize,
          result.totalElements
        );
        setPaginationState(newPaginationState);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Lỗi phân trang");
      }
    };

    fetchCourseCategories();
  }, [paginationState.currentPage, paginationState.pageSize]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Quản lý Danh mục
        </h2>
        <button
          onClick={() => {
            setShowAddModal(true);
            setSelectedCategory(null);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Thêm danh mục</span>
          <span className="sm:hidden">Thêm</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng danh mục</p>
              <p className="text-2xl font-semibold text-gray-900">
                {categories.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng khóa học</p>
              <p className="text-2xl font-semibold text-gray-900">
                {handleTotalCourses()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={CSS_CLASSES.headerStyles}>Tên danh mục</th>
                <th className={CSS_CLASSES.headerStyles}>Mô tả</th>
                <th className={CSS_CLASSES.headerStyles}>Số khóa học</th>
                <th className={CSS_CLASSES.headerStyles}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {category.courseTypeName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {category.description || "Chưa có mô tả"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {category.numberOfType}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                        onClick={handleShowUpdate(category)}
                      >
                        <Edit className="w-4 h-4" />
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteClick(category)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">{paginationText}</div>
            <select
              value={paginationState.pageSize}
              onChange={(e) =>
                paginationHandlers.handlePageSizeChange(Number(e.target.value))
              }
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {paginationUtils.DEFAULT_CONFIG.pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / trang
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                paginationHandlers.handlePreviousPage(
                  paginationState.currentPage,
                  paginationState.totalPages
                )
              }
              disabled={!paginationState.hasPrevious}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {pageNumbers.pages.map((page) => (
                <button
                  key={page}
                  className={`px-2 py-1 rounded-sm border border-gray-300
                            ${
                              page === paginationState.currentPage
                                ? "z-10 bg-blue-600 text-white"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                  onClick={() =>
                    paginationHandlers.handlePageChange(
                      page,
                      paginationState.totalPages
                    )
                  }
                >
                  {page + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                paginationHandlers.handleNextPage(
                  paginationState.currentPage,
                  paginationState.totalPages
                )
              }
              disabled={!paginationState.hasNext}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Add Course Type Modal */}
      <AddCourseTypeModal
        title={selectedCategory ? "Cập nhật danh mục" : "Thêm danh mục"}
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedCategory(null);
        }}
        onSubmit={handleAddCourseType}
        editData={selectedCategory || undefined}
        isEditing={!!selectedCategory}
      />

      {/* Confirm Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedCategory(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa"
        message={`Bạn có chắc chắn muốn xóa danh mục "${
          selectedCategory?.courseTypeName || ""
        }"? Hành động này không thể hoàn tác.`}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default CategoryManagement;
