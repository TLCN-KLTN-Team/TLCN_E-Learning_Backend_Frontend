"use client";

import {
  DollarSign,
  TrendingUp,
  Percent,
  Download,
  Building2,
} from "lucide-react";
import type React from "react";
import { useState } from "react";

const RevenueManagement: React.FC = () => {
  const [revenueData, setRevenueData] = useState([
    {
      id: 1,
      unit: "Trung tâm CNTT",
      month: "2024-01",
      revenue: 2500000,
      commission: 375000,
      net: 2125000,
    },
    {
      id: 2,
      unit: "Học viện Kinh doanh",
      month: "2024-01",
      revenue: 1800000,
      commission: 270000,
      net: 1530000,
    },
    {
      id: 3,
      unit: "Trường Ngoại ngữ",
      month: "2024-01",
      revenue: 1200000,
      commission: 180000,
      net: 1020000,
    },
    {
      id: 4,
      unit: "Viện Thiết kế",
      month: "2024-01",
      revenue: 950000,
      commission: 142500,
      net: 807500,
    },
  ]);

  const [selectedMonth, setSelectedMonth] = useState("2024-01");

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalCommission = revenueData.reduce(
    (sum, item) => sum + item.commission,
    0
  );
  const totalNet = revenueData.reduce((sum, item) => sum + item.net, 0);
  const headerStyles =
    "px-6 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wider";

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Quản lý Doanh thu
        </h2>
        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 text-gray-900 rounded-lg px-3 py-2 w-full sm:w-auto"
          >
            <option value="2024-01">Tháng 1/2024</option>
            <option value="2023-12">Tháng 12/2023</option>
            <option value="2023-11">Tháng 11/2023</option>
          </select>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 justify-center">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Xuất báo cáo</span>
            <span className="sm:hidden">Xuất</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Tổng doanh thu
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalRevenue.toLocaleString()} VNĐ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100">
              <Percent className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Hoa hồng (15%)
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalCommission.toLocaleString()} VNĐ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Doanh thu ròng
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {totalNet.toLocaleString()} VNĐ
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100">
              <Building2 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Đơn vị tham gia
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {revenueData.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Chi tiết doanh thu theo đơn vị
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className={headerStyles}>Đơn vị đào tạo</th>
                <th className={headerStyles}>Tháng</th>
                <th className={headerStyles}>Doanh thu</th>
                <th className={headerStyles}>Hoa hồng (15%)</th>
                <th className={headerStyles}>Doanh thu ròng</th>
                <th className={headerStyles}>Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {item.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.month}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">
                      {item.revenue.toLocaleString()} VNĐ
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-yellow-600">
                      {item.commission.toLocaleString()} VNĐ
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">
                      {item.net.toLocaleString()} VNĐ
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        Chi tiết
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        Xuất hóa đơn
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

export default RevenueManagement;
