import {
  BookOpen,
  Building2,
  ChevronDown,
  DollarSign,
  Edit,
  Trash2,
  Users,
} from "lucide-react";
import { getStatusStyle, UnitStatus } from "../data/UnitStatus";

interface Unit {
  id: number;
  name: string;
  code: string;
  status: string;
  students: number;
  courses: number;
  revenue: number;
  representative: string;
  email: string;
  type: string;
  phone: string;
  address: string;
  establishedDate: string;
  documents: Array<{
    name: string;
    status: string;
    url: string;
  }>;
}

interface TraningUnitItemProps {
  unit: Unit;
  onRowClick: (unitId: number) => void;
  onStatusChange: (unitId: number, newStatus: string) => void;
  openDropdown: number | null;
  onDropdownToggle: (unitId: number | null) => void;
}

const TraningUnitItem = ({
  unit,
  onRowClick,
  onStatusChange,
  openDropdown,
  onDropdownToggle,
}: TraningUnitItemProps) => {
  const handleRowClick = () => {
    onRowClick(unit.id);
  };

  const handleDropdownToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDropdownToggle(openDropdown === unit.id ? null : unit.id);
  };

  const handleStatusChange = (e: React.MouseEvent, newStatus: string) => {
    e.stopPropagation();
    onStatusChange(unit.id, newStatus);
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
            <div className="md:hidden text-xs text-gray-500 mt-1">
              {unit.code} • {unit.students.toLocaleString()} học viên
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
        <div className="text-sm text-gray-900">{unit.code}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-400" />
          {unit.students.toLocaleString()}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
        <div className="flex items-center gap-1">
          <BookOpen className="w-4 h-4 text-gray-400" />
          {unit.courses}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden xl:table-cell">
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          {unit.revenue.toLocaleString()} VNĐ
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="absolute">
          <button
            onClick={handleDropdownToggle}
            className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 hover:opacity-80 transition-opacity ${getStatusStyle(
              unit.status
            )}`}
          >
            {UnitStatus[unit.status as keyof typeof UnitStatus]}
            <ChevronDown className="ml-1 w-3 h-3" />
          </button>

          {openDropdown === unit.id && (
            <div className="relative top-full left-0 z-10 bg-white border border-gray-200 rounded-md shadow-lg min-w-[150px]">
              {Object.entries(UnitStatus).map(([key, value]) => (
                <button
                  key={key}
                  onClick={(e) => handleStatusChange(e, key)}
                  className={`block w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                    unit.status === key ? "bg-blue-50" : ""
                  }`}
                >
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full ${getStatusStyle(
                      key
                    )}`}
                  >
                    {value}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex space-x-1 md:space-x-2">
          <button
            onClick={(e) => e.stopPropagation()}
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
