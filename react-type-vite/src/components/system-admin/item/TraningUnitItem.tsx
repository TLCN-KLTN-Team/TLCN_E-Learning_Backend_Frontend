import { useState } from "react";
import { Building2, Edit, FileDown, Loader2, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { getStatusStyle, unitStatus, getUnitTypeLabel, getUnitTypeStyle } from "../data/UnitStatus";
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

  const handleRowClick = () => onRowClick(unit.id);

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
      className="hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={handleRowClick}
    >
      {/* Tên đơn vị */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded bg-blue-50 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]" title={unit.name}>
              {unit.name}
            </p>
            {/* Extra info visible only on mobile */}
            <p className="md:hidden text-xs text-gray-400 truncate">{unit.representativeName}</p>
          </div>
        </div>
      </td>

      {/* Người đại diện */}
      <td className="px-4 py-3 hidden md:table-cell">
        <p className="text-sm text-gray-800 truncate max-w-[160px]" title={unit.representativeName}>
          {unit.representativeName || "—"}
        </p>
      </td>

      {/* Email */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <p className="text-sm text-gray-600 truncate max-w-[200px]" title={unit.representativeEmail}>
          {unit.representativeEmail || "—"}
        </p>
      </td>

      {/* Loại hình */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getUnitTypeStyle(unit.type || "")}`}>
          {getUnitTypeLabel(unit.type || "")}
        </span>
      </td>

      {/* Trạng thái */}
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold rounded-full whitespace-nowrap ${getStatusStyle(unit.status)}`}
        >
          {unitStatus(unit.status)}
        </span>
      </td>

      {/* Thao tác */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={handleExportClick}
            disabled={isExporting}
            title="Xuất hồ sơ PDF"
            className="p-1.5 rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <FileDown className="w-4 h-4" />}
          </button>
          {(unit.status === "ACTIVE" || unit.status === "SUSPENDED") && (
            <button
              onClick={handleEditClick}
              title="Chỉnh sửa trạng thái"
              className="p-1.5 rounded text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={(e) => e.stopPropagation()}
            title="Xóa"
            className="p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TraningUnitItem;
