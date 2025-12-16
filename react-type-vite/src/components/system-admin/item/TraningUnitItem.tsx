import { Building2, Edit, Trash2 } from "lucide-react";
import { getStatusStyle, unitStatus } from "../data/UnitStatus";
import type { EducationalUnitResponse } from "@/services/api/response/educationalUnitResponse";

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
