"use client";

import { Plus } from "lucide-react";
import type React from "react";
import { useState, useEffect } from "react";

import { unitData } from "./data/UnitStatus";
import TraningUnitItem from "./item/TraningUnitItem";
import SubmissionModal from "./modals/SubmissionModal";

const TrainingUnitsManagement: React.FC = () => {
  const [units, setUnits] = useState(unitData);

  const [showAddModal, setShowAddModal] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalRef, setModalRef] = useState<HTMLDivElement | null>(null);

  const handleStatusChange = (unitId: number, newStatus: string) => {
    setUnits(
      units.map((unit) =>
        unit.id === unitId ? { ...unit, status: newStatus } : unit
      )
    );
    setOpenDropdown(null);
  };

  const handleShowDetails = (unitId: number) => {
    setSelectedUnit(unitId);
    setShowDetailModal(true);
  };

  const handleDropdownToggle = (unitId: number | null) => {
    setOpenDropdown(unitId);
  };

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

  const headerStyles =
    "px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Quản lý Đơn vị Đào tạo
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 self-start md:self-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Thêm đơn vị</span>
          <span className="sm:hidden">Thêm</span>
        </button>
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
                  Mã đơn vị
                </th>
                <th className={`${headerStyles} hidden lg:table-cell`}>
                  Học viên
                </th>
                <th className={`${headerStyles} hidden lg:table-cell`}>
                  Khóa học
                </th>
                <th className={`${headerStyles} hidden xl:table-cell`}>
                  Doanh thu
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
                  onStatusChange={handleStatusChange}
                  openDropdown={openDropdown}
                  onDropdownToggle={handleDropdownToggle}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit Detail Modal */}
      <div ref={setModalRef}>
        <SubmissionModal
          unit={
            selectedUnit
              ? units.find((u) => u.id === selectedUnit) || null
              : null
          }
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
        />
      </div>
    </div>
  );
};

export default TrainingUnitsManagement;
