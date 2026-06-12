"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import { LoadingDots } from "../ui/LoadingDots";

import SubmissionModal from "./modals/SubmissionModal";
import UpdateUnitStatusModal from "./modals/UpdateUnitStatusModal";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight, Search, Building2, CheckCircle, Clock, Ban } from "lucide-react";
import { getUnitTypeLabel, getUnitTypeStyle } from "./data/UnitStatus";
import { paginationUtils } from "@/utils/paginationUtils";
import type { PaginationState } from "@/utils/paginationUtils";

import EducationalUnitService from "@/services/api/superadmin/educationalUnit.api";
import TraningUnitItem from "./item/TraningUnitItem";

const STATUS_FILTERS = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Hoạt động" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "SUSPENDED", label: "Tạm dừng" },
  { value: "REJECTED", label: "Từ chối" },
];

const TrainingUnitsManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [units, setUnits] = useState<EducationalUnitResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [paginationState, setPaginationState] = useState<PaginationState>(
    paginationUtils.createPaginationStateManager(10)
  );

  const paginationHandlers = paginationUtils.createPaginationHandlers(
    (page: number) =>
      setPaginationState((prev) => ({ ...prev, currentPage: page })),
    (size: number) =>
      setPaginationState((prev) => ({ ...prev, pageSize: size })),
    undefined,
    undefined
  );

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedUnitData, setSelectedUnitData] =
    useState<EducationalUnitResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [modalRef, setModalRef] = useState<HTMLDivElement | null>(null);

  // Derived stats
  const stats = useMemo(() => ({
    total: units.length,
    active: units.filter((u) => u.status === "ACTIVE").length,
    pending: units.filter((u) => u.status === "PENDING").length,
    suspended: units.filter((u) => u.status === "SUSPENDED").length,
  }), [units]);

  // Client-side filter + search
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchesStatus = statusFilter === "ALL" || u.status === statusFilter;
      const matchesType = typeFilter === "ALL" || u.type?.toUpperCase() === typeFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.representativeName?.toLowerCase().includes(q) ||
        u.representativeEmail?.toLowerCase().includes(q);
      return matchesStatus && matchesType && matchesSearch;
    });
  }, [units, searchQuery, statusFilter, typeFilter]);

  // Paginate filtered results client-side
  const pageSize = paginationState.pageSize;
  const currentPage = paginationState.currentPage;
  const totalFiltered = filteredUnits.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages - 1);
  const pagedUnits = filteredUnits.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const pageNumbers = paginationUtils.generatePageNumbers(safePage, totalPages);

  const handleShowDetails = (unitId: number) => {
    const unitData = units.find((unit) => unit.id === unitId) || null;
    setSelectedUnitData(unitData);
    setShowDetailModal(true);
  };

  const handleEditUnit = (unit: EducationalUnitResponse) => {
    setSelectedUnitData(unit);
    setShowUpdateStatusModal(true);
  };

  const handleUpdateStatus = async (newStatus: string, reason: string) => {
    if (!selectedUnitData) return;

    try {
      const message = await EducationalUnitService.updateEducationalUnitStatus(
        selectedUnitData.id,
        newStatus,
        reason,
        selectedUnitData.name,
        selectedUnitData.representativeEmail || ""
      );

      const resolvedStatus = newStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
      setUnits((prevUnits) =>
        prevUnits.map((unit) =>
          unit.id === selectedUnitData.id
            ? { ...unit, status: resolvedStatus }
            : unit
        )
      );

      toast.success(message || "Đã cập nhật trạng thái thành công!");
      setShowUpdateStatusModal(false);
      setSelectedUnitData(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Lỗi khi cập nhật trạng thái đơn vị đào tạo"
      );
    }
  };

  const handleDropdownToggle = (unitId: string | null) => {
    setOpenDropdown(unitId);
  };

  useEffect(() => {
    const fetchEducationalUnits = async () => {
      setIsLoading(true);
      try {
        const data = await EducationalUnitService.getAllEducationalUnits();
        setUnits(data.content);

        const newPaginationState = paginationUtils.calculatePaginationState(
          data.page,
          data.size,
          data.totalElements
        );
        setPaginationState(newPaginationState);
      } catch (error) {
        toast.error(
          error
            ? `Lỗi khi tải các đơn vị đào tạo: ${error}`
            : "Lỗi khi tải các đơn vị đào tạo"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchEducationalUnits();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef && !modalRef.contains(event.target as Node)) {
        setShowDetailModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modalRef]);

  // Reset to page 0 whenever search/filter changes
  useEffect(() => {
    setPaginationState((prev) => ({ ...prev, currentPage: 0 }));
  }, [searchQuery, statusFilter, typeFilter]);

  const headerStyles = "px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingDots />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Page title + type filter */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quản lý Đơn vị Đào tạo</h2>
          <p className="text-sm text-gray-500 mt-0.5">Danh sách các đơn vị đào tạo đăng ký trên hệ thống</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["ALL", "UNIVERSITY", "COLLEGE", "INTERMEDIATE"] as const).map((type) => {
            const isActive = typeFilter === type;
            if (type === "ALL") {
              return (
                <button
                  key="ALL"
                  onClick={() => setTypeFilter("ALL")}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-gray-800 text-white border-gray-800"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  Tất cả loại hình
                </button>
              );
            }
            const baseStyle = getUnitTypeStyle(type);
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  isActive ? baseStyle + " ring-2 ring-offset-1 ring-current" : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                }`}
              >
                {getUnitTypeLabel(type)}
                <span className="ml-1.5 opacity-70">
                  ({units.filter((u) => u.type?.toUpperCase() === type).length})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tổng số</p>
            <p className="text-xl font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Hoạt động</p>
            <p className="text-xl font-bold text-green-700">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-yellow-50 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Chờ duyệt</p>
            <p className="text-xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
            <Ban className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Tạm dừng</p>
            <p className="text-xl font-bold text-red-700">{stats.suspended}</p>
          </div>
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col min-h-0">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-gray-200 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, người đại diện, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  statusFilter === f.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f.label}
                {f.value !== "ALL" && (
                  <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    statusFilter === f.value ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {units.filter((u) => u.status === f.value).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`${headerStyles} min-w-[220px]`}>Đơn vị đào tạo</th>
                <th className={`${headerStyles} hidden md:table-cell`}>Người đại diện</th>
                <th className={`${headerStyles} hidden lg:table-cell min-w-[180px]`}>Email</th>
                <th className={`${headerStyles} hidden lg:table-cell`}>Loại hình</th>
                <th className={headerStyles}>Trạng thái</th>
                <th className={`${headerStyles} text-right`}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {pagedUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      {searchQuery || statusFilter !== "ALL"
                        ? "Không tìm thấy đơn vị đào tạo phù hợp"
                        : "Chưa có đơn vị đào tạo nào"}
                    </p>
                  </td>
                </tr>
              ) : (
                pagedUnits.map((unit) => (
                  <TraningUnitItem
                    key={unit.id}
                    unit={unit}
                    onRowClick={handleShowDetails}
                    onEditClick={handleEditUnit}
                    openDropdown={openDropdown}
                    onDropdownToggle={handleDropdownToggle}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {totalFiltered === 0
                ? "Không có kết quả"
                : `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, totalFiltered)} / ${totalFiltered}`}
            </span>
            <select
              value={pageSize}
              onChange={(e) =>
                paginationHandlers.handlePageSizeChange(Number(e.target.value))
              }
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {paginationUtils.DEFAULT_CONFIG.pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size} / trang
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => paginationHandlers.handlePreviousPage(safePage, totalPages)}
              disabled={safePage === 0}
              className="p-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {pageNumbers.pages.map((page) => (
              <button
                key={page}
                onClick={() => paginationHandlers.handlePageChange(page, totalPages)}
                className={`min-w-[30px] h-[30px] text-xs rounded border transition-colors ${
                  page === safePage
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page + 1}
              </button>
            ))}

            <button
              onClick={() => paginationHandlers.handleNextPage(safePage, totalPages)}
              disabled={safePage >= totalPages - 1}
              className="p-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <div ref={setModalRef}>
        <SubmissionModal
          unit={selectedUnitData!}
          isOpen={showDetailModal && selectedUnitData !== null}
          onClose={() => setShowDetailModal(false)}
        />
      </div>

      {showUpdateStatusModal && selectedUnitData && (
        <UpdateUnitStatusModal
          unitName={selectedUnitData.name}
          currentStatus={selectedUnitData.status}
          targetStatus={selectedUnitData.status}
          representativeEmail={selectedUnitData.representativeEmail || ""}
          onClose={() => {
            setShowUpdateStatusModal(false);
            setSelectedUnitData(null);
          }}
          onConfirm={handleUpdateStatus}
        />
      )}
    </div>
  );
};

export default TrainingUnitsManagement;
