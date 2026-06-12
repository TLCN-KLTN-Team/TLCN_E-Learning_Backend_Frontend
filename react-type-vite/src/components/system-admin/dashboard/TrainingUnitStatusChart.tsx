import type React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ChartDataPoint } from "@/types/dashboard.types";
import { CheckCircle, Clock, Ban } from "lucide-react";

interface TrainingUnitStatusChartProps {
  data: ChartDataPoint[];
  total?: number;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType; bg: string; text: string }> = {
  "Hoạt động":       { color: "#10b981", icon: CheckCircle, bg: "bg-emerald-50", text: "text-emerald-700" },
  "Chờ duyệt":       { color: "#f59e0b", icon: Clock,       bg: "bg-amber-50",   text: "text-amber-700" },
  "Không hoạt động": { color: "#ef4444", icon: Ban,         bg: "bg-red-50",     text: "text-red-700" },
};

const FALLBACK_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6366f1"];

const TrainingUnitStatusChart: React.FC<TrainingUnitStatusChartProps> = ({ data, total }) => {
  const displayTotal = total ?? data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">
          Trạng thái đơn vị đào tạo
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Phân bố {displayTotal} đơn vị theo trạng thái hiện tại
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40 text-sm text-gray-400">
          Chưa có dữ liệu
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Donut chart */}
          <div className="relative shrink-0 w-[180px] h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_CONFIG[entry.name]?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toLocaleString("vi-VN")} đơn vị`,
                    name,
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-gray-900">{displayTotal}</span>
              <span className="text-[10px] text-gray-400 leading-tight">tổng số</span>
            </div>
          </div>

          {/* Legend + numbers */}
          <div className="flex-1 w-full space-y-2.5">
            {data.map((entry, index) => {
              const cfg = STATUS_CONFIG[entry.name];
              const Icon = cfg?.icon;
              const color = cfg?.color ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
              const percent = displayTotal > 0 ? ((entry.value / displayTotal) * 100).toFixed(1) : "0.0";

              return (
                <div key={entry.name} className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${cfg?.bg ?? "bg-gray-100"}`}
                  >
                    {Icon ? (
                      <Icon className={`w-4 h-4 ${cfg?.text ?? "text-gray-600"}`} />
                    ) : (
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-700 truncate">
                        {entry.name}
                      </span>
                      <span className="text-xs font-bold text-gray-900 ml-2 shrink-0">
                        {entry.value.toLocaleString("vi-VN")}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">
                          ({percent}%)
                        </span>
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingUnitStatusChart;
