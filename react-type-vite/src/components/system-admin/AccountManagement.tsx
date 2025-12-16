"use client";

import { getUsers, changeUserStatus } from "@/services/api/userApi";
import {
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { LoadingDots } from "../ui/LoadingDots";
import AccountDetailModal from "./modals/AccountDetailModal";
import ChangeStatusModal from "./modals/ChangeStatusModal";
import {
  ROLE_FILTER_OPTIONS,
  CSS_CLASSES,
  getUserFullName,
  getInitials,
  getRoleName,
  getRoleIcon,
  getRoleColor,
  formatDate,
} from "./data/AccountData";
import type { UserResponse } from "@/services/api/response/userResponse";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";
import {
  AccountStatus,
  ACCOUNT_STATUS_LABELS,
  ACCOUNT_STATUS_COLORS,
} from "@/types/account.enum";

const AccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<UserResponse[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<UserResponse | null>(
    null
  );
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [committedSearchQuery, setCommittedSearchQuery] = useState("");
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<AccountStatus | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const result: PaginatedResponse<UserResponse> = await getUsers(
          currentPage,
          pageSize,
          committedSearchQuery,
          selectedRole,
          selectedStatus
        );
        console.log("Fetched accounts:", result);
        setAccounts(result.content);
        setCurrentPage(result.page);
        setTotalElements(result.totalElements);
        setTotalPages(result.totalPages);
        setHasNext(result.hasNext ?? false);
        setHasPrevious(result.hasPrevious ?? false);
        if (result.content.length > 0) {
          toast.success("Tải tài khoản thành công");
        }
      } catch (error) {
        toast.error(error ? `${error}` : "Lỗi khi tải tài khoản");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, [
    currentPage,
    pageSize,
    committedSearchQuery,
    selectedRole,
    selectedStatus,
  ]);

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
    const end = Math.min(totalPages - 1, start + maxVisible);

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

  const handleStatusChange = (
    account: UserResponse,
    newStatus: AccountStatus,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    setSelectedAccount(account);
    setTargetStatus(newStatus);
    setShowStatusModal(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!selectedAccount || !targetStatus) return;

    try {
      await changeUserStatus(selectedAccount.id, targetStatus);

      // Update local state
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === selectedAccount.id
            ? { ...acc, accountStatus: targetStatus }
            : acc
        )
      );

      toast.success(
        targetStatus === AccountStatus.BANNED
          ? "Đã khóa tài khoản thành công! Email thông báo đã được gửi."
          : targetStatus === AccountStatus.ACTIVE
          ? "Đã mở khóa tài khoản thành công! Email thông báo đã được gửi."
          : "Đã thay đổi trạng thái tài khoản thành công!"
      );

      setShowStatusModal(false);
      setSelectedAccount(null);
      setTargetStatus(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Lỗi khi thay đổi trạng thái tài khoản"
      );
    }
  };

  const handleSearch = () => {
    setCommittedSearchQuery(searchQuery);
    setCurrentPage(0); // Reset to first page when searching
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setCommittedSearchQuery("");
    setCurrentPage(0);
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

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoặc email... (Nhấn Enter để tìm)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại tài khoản
            </label>
            <select
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2"
            >
              {ROLE_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Trạng thái
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(0);
              }}
              className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value={AccountStatus.PENDING_VERIFICATION}>
                {ACCOUNT_STATUS_LABELS[AccountStatus.PENDING_VERIFICATION]}
              </option>
              <option value={AccountStatus.ACTIVE}>
                {ACCOUNT_STATUS_LABELS[AccountStatus.ACTIVE]}
              </option>
              <option value={AccountStatus.INACTIVE}>
                {ACCOUNT_STATUS_LABELS[AccountStatus.INACTIVE]}
              </option>
              <option value={AccountStatus.BANNED}>
                {ACCOUNT_STATUS_LABELS[AccountStatus.BANNED]}
              </option>
            </select>
          </div>
        </div>

        {/* Results count */}
        {(committedSearchQuery ||
          selectedRole !== "all" ||
          selectedStatus !== "all") && (
          <div className="text-sm text-gray-600">
            Tìm thấy <span className="font-semibold">{totalElements}</span> kết
            quả
          </div>
        )}
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
              {accounts.map((account) => (
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
                    {account.role && (
                      <span
                        className={`${CSS_CLASSES.roleBadge} ${getRoleColor([
                          account.role,
                        ])}`}
                      >
                        {(() => {
                          const IconComponent = getRoleIcon([account.role]);
                          return <IconComponent className="w-4 h-4" />;
                        })()}
                        {getRoleName([account.role])}
                      </span>
                    )}
                  </td>
                  <td className={`${CSS_CLASSES.cell} text-sm text-gray-900`}>
                    {formatDate(account.dob)}
                  </td>
                  <td className={CSS_CLASSES.cell}>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        ACCOUNT_STATUS_COLORS[account.accountStatus]
                      }`}
                    >
                      {ACCOUNT_STATUS_LABELS[account.accountStatus]}
                    </span>
                  </td>
                  <td className={`${CSS_CLASSES.cell} text-sm font-medium`}>
                    <div
                      className="flex space-x-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {account.accountStatus === AccountStatus.BANNED ||
                      account.accountStatus === AccountStatus.INACTIVE ? (
                        <button
                          onClick={(e) =>
                            handleStatusChange(account, AccountStatus.ACTIVE, e)
                          }
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors flex items-center gap-1"
                          title="Mở khóa"
                        >
                          <Unlock className="w-4 h-4" />
                          <span className="hidden md:inline">Mở khóa</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) =>
                            handleStatusChange(account, AccountStatus.BANNED, e)
                          }
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                          title="Khóa"
                          disabled={
                            account.accountStatus ===
                            AccountStatus.PENDING_VERIFICATION
                          }
                        >
                          <Lock className="w-4 h-4" />
                          <span className="hidden md:inline">Khóa</span>
                        </button>
                      )}
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

      {showStatusModal && selectedAccount && targetStatus && (
        <ChangeStatusModal
          accountName={getUserFullName(selectedAccount)}
          currentStatus={selectedAccount.accountStatus}
          targetStatus={targetStatus}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedAccount(null);
            setTargetStatus(null);
          }}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </div>
  );
};

export default AccountManagement;
