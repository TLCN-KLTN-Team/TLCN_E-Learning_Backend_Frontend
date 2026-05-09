import { useState } from "react";
import { Building2, Edit, FileDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { getStatusStyle, unitStatus } from "../data/UnitStatus";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";
import fileExportApi from "@/services/api/file/exportApi";

interface TraningUnitItemProps {
  unit: EducationalUnitResponse;
  onRowClick: (unitId: number) => void;
  onEditClick: (unit: EducationalUnitResponse) => void;
  openDropdown: string | null;
  onDropdownToggle: (unitId: string | null) => void;
}

const TraningUnitItem = ({
  unit,
  onRowClick,
  onEditClick,
}: TraningUnitItemProps) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleRowClick = () => {
    onRowClick(unit.id);
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditClick(unit);
  };

  const handleExportClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExporting) return;

    try {
      setIsExporting(true);
      await fileExportApi.downloadEducationalUnitProfile(unit.id, unit.name);
      toast.success(`Đã xuất hồ sơ "${unit.name}" thành công`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? `Xuất hồ sơ thất bại: ${error.message}`
          : "Xuất hồ sơ thất bại"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <tr
      key={unit.id}
      className="hover:bg-gray-50 cursor-pointer"
      onClick={handleRowClick}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-400" />
          <div>
            <div className="text-sm font-medium text-gray-900">{unit.name}</div>
            {/* Show mobile info */}
            <div className="md:hidden text-xs text-gray-500 mt-1">học viên</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
        <div className="text-sm text-gray-900">{unit.representativeName}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
        <div className="flex items-center gap-1">
          {unit.representativeEmail}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
        <div className="flex items-center gap-1">{unit.type}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="relative">
          <button
            onClick={handleDropdownToggle}
            className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 hover:opacity-80 transition-opacity
              ${getStatusStyle(unit.status)}`}
          >
            {unitStatus(unit.status)}
          </button>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-1 md:space-x-2">
          <button
            onClick={handleExportClick}
            disabled={isExporting}
            title="Xuất hồ sơ PDF"
            className="text-emerald-600 hover:text-emerald-900 flex items-center gap-1 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4" />
            )}
            <span className="hidden md:inline">
              {isExporting ? "Đang xuất..." : "Xuất hồ sơ"}
            </span>
          </button>
          <button
            onClick={handleEditClick}
            className="text-blue-600 hover:text-blue-900 flex items-center gap-1 p-1"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden md:inline">Sửa</span>
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-red-600 hover:text-red-900 flex items-center gap-1 p-1"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">Xóa</span>
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TraningUnitItem;
