"use client";

import {
  Plus,
  Edit,
  Trash2,
  Building2,
  Users,
  BookOpen,
  DollarSign,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

const TrainingUnitsManagement: React.FC = () => {
  const [units, setUnits] = useState([
    {
      id: 1,
      name: "Trung tâm Công nghệ Thông tin",
      code: "CNTT001",
      status: "active",
      students: 1250,
      courses: 45,
      revenue: 2500000,
    },
    {
      id: 2,
      name: "Học viện Kinh doanh",
      code: "KD002",
      status: "active",
      students: 890,
      courses: 32,
      revenue: 1800000,
    },
    {
      id: 3,
      name: "Trường Ngoại ngữ",
      code: "NN003",
      status: "inactive",
      students: 650,
      courses: 28,
      revenue: 1200000,
    },
    {
      id: 4,
      name: "Viện Thiết kế Đồ họa",
      code: "DH004",
      status: "active",
      students: 420,
      courses: 18,
      revenue: 950000,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);

  const headerStyles =
    "px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Quản lý Đơn vị Đào tạo
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm đơn vị
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={headerStyles}>Đơn vị đào tạo</th>
                <th className={headerStyles}>Mã đơn vị</th>
                <th className={headerStyles}>Trạng thái</th>
                <th className={headerStyles}>Học viên</th>
                <th className={headerStyles}>Khóa học</th>
                <th className={headerStyles}>Doanh thu</th>
                <th className={headerStyles}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <div className="text-sm font-medium text-gray-900">
                        {unit.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{unit.code}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        unit.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {unit.status === "active" ? "Hoạt động" : "Tạm dừng"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      {unit.students.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      {unit.courses}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      {unit.revenue.toLocaleString()} VNĐ
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                        <Edit className="w-4 h-4" />
                        Sửa
                      </button>
                      <button className="text-red-600 hover:text-red-900 flex items-center gap-1">
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrainingUnitsManagement;
