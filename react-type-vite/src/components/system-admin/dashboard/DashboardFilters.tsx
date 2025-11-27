import type React from "react";
import type {
  DashboardFilters,
  TimeFilter,
  TrainingUnitType,
} from "@/types/dashboard.types";
import {
  TIME_FILTER_OPTIONS,
  TRAINING_UNIT_TYPE_OPTIONS,
} from "../data/dashboardMockData";
import { Calendar, Building2 } from "lucide-react";

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFilterChange: (filters: DashboardFilters) => void;
}

const DashboardFiltersComponent: React.FC<DashboardFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const handleTimeFilterChange = (timeFilter: TimeFilter) => {
    onFilterChange({ ...filters, timeFilter });
  };

  const handleTrainingUnitTypeChange = (trainingUnitType: TrainingUnitType) => {
    onFilterChange({ ...filters, trainingUnitType });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Time Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="inline w-4 h-4 mr-1" />
            Thời gian
          </label>
          <select
            value={filters.timeFilter}
            onChange={(e) =>
              handleTimeFilterChange(e.target.value as TimeFilter)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TIME_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Training Unit Type Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building2 className="inline w-4 h-4 mr-1" />
            Loại đơn vị đào tạo
          </label>
          <select
            value={filters.trainingUnitType}
            onChange={(e) =>
              handleTrainingUnitTypeChange(e.target.value as TrainingUnitType)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {TRAINING_UNIT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default DashboardFiltersComponent;
