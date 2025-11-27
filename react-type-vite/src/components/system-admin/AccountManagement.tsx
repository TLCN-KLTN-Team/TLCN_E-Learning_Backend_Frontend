"use client";

import { getUsers } from "@/services/api/userApi";
import { Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LoadingDots } from "../ui/LoadingDots";
import AccountDetailModal from "./modals/AccountDetailModal";
import EditAccountModal from "./modals/EditAccountModal";
import {
  ROLE_FILTER_OPTIONS,
  TABLE_HEADERS,
  CSS_CLASSES,
  getUserFullName,
  getInitials,
  getRoleName,
  getRoleIcon,
  getRoleColor,
  formatDate,
  filterAccountsByRole,
} from "./data/AccountData";
import type { UserResponse } from "@/services/api/response/userResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";

const AccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<UserResponse[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<UserResponse | null>(
    null
  );
  const [selectedRole, setSelectedRole] = useState("all");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(false);

  const filteredAccounts = filterAccountsByRole(accounts, selectedRole);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const result: PaginatedResponse<UserResponse> = await getUsers(
          currentPage,
          pageSize
        );
        setAccounts(result.content);
        setCurrentPage(result.page);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        setHasNext(result.hasNext);
        setHasPrevious(result.hasPrevious);
        toast.success("Tải tài khoản thành công");
      } catch (error) {
        toast.error(error ? `${error}` : "Lỗi khi tải tài khoản");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [currentPage, pageSize]);

  const handlePageChange = async (newPage: number) => {
    if (newPage < 0 || newPage >= totalPages) return;
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = async (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(0); // Reset to first page when changing page size
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(0, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages - 1, start + maxVisible);

    if (end - start + 1 < maxVisible) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleRowClick = (account: UserResponse) => {
    setSelectedAccount(account);
    setShowViewModal(true);
  };

  const handleEditClick = (account: UserResponse, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAccount(account);
    setShowEditModal(true);
  };

  const handleSaveAccount = async (updatedData: Partial<UserResponse>) => {
    try {
      // TODO: Call API to update user
      // await updateUser(selectedAccount!.id, updatedData);

      // Update local state
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === selectedAccount?.id ? { ...acc, ...updatedData } : acc
        )
      );

      toast.success("Đã cập nhật thông tin tài khoản thành công!");
      setShowEditModal(false);
    } catch (error) {
      toast.error("Lỗi khi cập nhật tài khoản");
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Quản lý Tài khoản
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0 mb-6">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border border-gray-300 text-gray-900 rounded-lg px-3 py-2 w-full sm:w-auto"
        >
          {ROLE_FILTER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={CSS_CLASSES.headerStyles}>Tài khoản</th>
                <th className={CSS_CLASSES.headerStyles}>Vai trò</th>
                <th className={CSS_CLASSES.headerStyles}>Ngày sinh</th>
                <th className={CSS_CLASSES.headerStyles}>Trạng thái</th>
                <th className={CSS_CLASSES.headerStyles}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr
                  key={account.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleRowClick(account)}
                >
                  <td className={CSS_CLASSES.cell}>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {account.avatarUrl ? (
                          <img
                            className={CSS_CLASSES.avatar}
                            src={account.avatarUrl}
                            alt={getUserFullName(account)}
                          />
                        ) : (
                          <div className={CSS_CLASSES.avatarFallback}>
                            <span className="text-sm font-medium text-white">
                              {getInitials(account)}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getUserFullName(account)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {account.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={CSS_CLASSES.cell}>
                    <div className="flex flex-wrap gap-1">
                      {account.roles.map((role, index) => {
                        const IconComponent = getRoleIcon([role]);
                        return (
                          <span
                            key={index}
                            className={`${CSS_CLASSES.roleBadge} ${getRoleColor(
                              [role]
                            )}`}
                          >
                            <IconComponent className="w-4 h-4" />
                            {getRoleName([role])}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className={`${CSS_CLASSES.cell} text-sm text-gray-900`}>
                    {formatDate(account.dob)}
                  </td>
                  <td className={CSS_CLASSES.cell}>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Hoạt động
                    </span>
                  </td>
                  <td className={`${CSS_CLASSES.cell} text-sm font-medium`}>
                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleEditClick(account, e)}
                        className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors flex items-center gap-1"
                        title="Sửa"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="hidden md:inline">Sửa</span>
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden md:inline">Xóa</span>
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
            <div className="text-sm text-gray-700">
              Hiển thị {currentPage * pageSize + 1} -{" "}
              {Math.min((currentPage + 1) * pageSize, totalElements)} trong tổng
              số {totalElements} tài khoản
            </div>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 / trang</option>
              <option value={10}>10 / trang</option>
              <option value={20}>20 / trang</option>
              <option value={50}>50 / trang</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPrevious || loading}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {generatePageNumbers().map((page) => (
                <button
                  className={`px-2 py-1 rounded-sm border border-gray-300
                    ${
                      page === currentPage
                        ? "z-10 bg-blue-600 text-white"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  onClick={() => handlePageChange(page)}
                >
                  {page + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNext || loading}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {showViewModal && selectedAccount && (
        <AccountDetailModal
          account={selectedAccount}
          onClose={() => setShowViewModal(false)}
        />
      )}
      {showEditModal && selectedAccount && (
        <EditAccountModal
          account={selectedAccount}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveAccount}
        />
      )}
    </div>
  );
};

export default AccountManagement;
