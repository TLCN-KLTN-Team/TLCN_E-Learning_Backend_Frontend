import type React from "react";
import { Calendar } from "lucide-react";

interface MonthYearPickerProps {
  mode: "month" | "year";
  value: string; // Format: "yyyy-MM" for month, "yyyy" for year
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  mode,
  value,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-500" />
      <label className="text-sm text-gray-600">
        {mode === "month" ? "Chọn tháng:" : "Chọn năm:"}
      </label>
      <input
        type={mode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
      />
    </div>
  );
};

export default MonthYearPicker;
