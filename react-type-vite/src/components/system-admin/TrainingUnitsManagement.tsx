"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { LoadingDots } from "../ui/LoadingDots";

import SubmissionModal from "./modals/SubmissionModal";
import UpdateUnitStatusModal from "./modals/UpdateUnitStatusModal";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import { toast } from "react-toastify";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { paginationUtils } from "@/utils/paginationUtils";
import type { PaginationState } from "@/utils/paginationUtils";

import EducationalUnitService from "@/services/api/superadmin/educationalUnit.api";
import TraningUnitItem from "./item/TraningUnitItem";

const TrainingUnitsManagement: React.FC = () => {
  // const [setUnits] = useState<EducationalUnitResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [units, setUnits] = useState<EducationalUnitResponse[]>([]);

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

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedUnitData, setSelectedUnitData] =
    useState<EducationalUnitResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
  const [modalRef, setModalRef] = useState<HTMLDivElement | null>(null);

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

      console.log("Update status message:", message);

      // Update local state with the new status
      newStatus = newStatus === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
      setUnits((prevUnits) =>
        prevUnits.map((unit) =>
          unit.id === selectedUnitData.id
            ? { ...unit, status: newStatus }
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

  // Fetch units data
  useEffect(() => {
    const fetchEducationalUnits = async () => {
      setIsLoading(true);
      try {
        const data = await EducationalUnitService.getAllEducationalUnits();
        setUnits(data.content);
        console.log(data);

        // Update pagination state using paginationUtils
        const newPaginationState = paginationUtils.calculatePaginationState(
          data.page,
          data.size,
          data.totalElements
        );
        setPaginationState(newPaginationState);

        toast.success("Tải các đơn vị đào tạo thành công");
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef && !modalRef.contains(event.target as Node)) {
        setShowDetailModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [modalRef]);

  const headerStyles = "px-6 py-3 text-left font-bold text-gray-900 uppercase";

  if (isLoading) {
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
          Quản lý Đơn vị Đào tạo
        </h2>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={`${headerStyles} min-w-[200px]`}>
                  Đơn vị đào tạo
                </th>
                <th className={`${headerStyles} hidden md:table-cell`}>
                  Người đại diện
                </th>
                <th className={`${headerStyles} hidden lg:table-cell`}>
                  Email người đại diện
                </th>
                <th className={`${headerStyles} hidden lg:table-cell`}>
                  Loại hình
                </th>
                <th className={headerStyles}>Trạng thái</th>
                <th className={headerStyles}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {units.map((unit) => (
                <TraningUnitItem
                  key={unit.id}
                  unit={unit}
                  onRowClick={handleShowDetails}
                  onEditClick={handleEditUnit}
                  openDropdown={openDropdown}
                  onDropdownToggle={handleDropdownToggle}
                />
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

      {/* Unit Detail Modal */}
      <div ref={setModalRef}>
        <SubmissionModal
          unit={selectedUnitData!}
          isOpen={showDetailModal && selectedUnitData !== null}
          onClose={() => setShowDetailModal(false)}
        />
      </div>

      {/* Update Status Modal */}
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
