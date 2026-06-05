import React, { useEffect, useState } from "react";
import { getDepartmentStats } from "../../../services/api/admin/educationUnitApi";
import type { DepartmentStatResponse } from "../../../services/api/response/departmentStatResponse";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip} from "recharts";
import { BookOpen, Users } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

const AdminDepartmentStats: React.FC = () => {
  const [stats, setStats] = useState<DepartmentStatResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDepartmentStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch department stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-48 bg-gray-100 rounded"></div>
      </div>
    );
  }

  // Chuẩn bị dữ liệu cho biểu đồ tròn theo số lượng khóa học
  const chartData = stats.filter(s => s.courseCount > 0 || s.studentCount > 0).map(s => ({
    name: s.departmentName,
    value: s.courseCount, // Dùng số khóa học làm tỷ trọng biểu đồ tròn
    students: s.studentCount
  }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full max-h-[420px]">
      <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
        <span className="w-1.5 h-6 bg-indigo-500 rounded-full mr-3"></span>
        Thống kê theo Khoa
      </h2>
      
      {chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          Chưa có dữ liệu khóa học/sinh viên theo khoa
        </div>
      ) : (
        <>
          <div className="h-48 shrink-0 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, _name: string, props: any) => [
                    `${value} khóa học, ${props.payload.students} sinh viên`, 
                    'Chi tiết'
                  ]}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-3 mt-auto overflow-y-auto custom-scrollbar pr-2 flex-1">
            {stats.map((dept, idx) => (
              <div key={dept.departmentId} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                       style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                    {dept.departmentName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 line-clamp-1">{dept.departmentName}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><BookOpen size={12}/> {dept.courseCount} Khóa</span>
                      <span className="flex items-center gap-1"><Users size={12}/> {dept.studentCount} SV</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDepartmentStats;
