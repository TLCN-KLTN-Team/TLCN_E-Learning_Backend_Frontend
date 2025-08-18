"use client";

import type React from "react";
import { useEffect, useRef } from "react";

const SystemStatistics: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const canvas = chartRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw user growth chart
        ctx.strokeStyle = "#3B82F6";
        ctx.lineWidth = 3;
        ctx.beginPath();

        const data = [
          1200, 1350, 1500, 1800, 2100, 2400, 2800, 3200, 3600, 4000, 4500,
          5000,
        ];
        const maxValue = Math.max(...data);
        const stepX = canvas.width / (data.length - 1);
        const stepY = (canvas.height - 40) / maxValue;

        data.forEach((value, index) => {
          const x = index * stepX;
          const y = canvas.height - value * stepY - 20;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          // Draw data points
          ctx.fillStyle = "#3B82F6";
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });

        ctx.stroke();
      }
    }
  }, []);

  const stats = [
    {
      label: "Tổng người dùng",
      value: "12,450",
      change: "+8.2%",
      color: "blue",
    },
    { label: "Đơn vị đào tạo", value: "24", change: "+2", color: "green" },
    { label: "Khóa học", value: "1,285", change: "+15.3%", color: "purple" },
    {
      label: "Doanh thu tháng",
      value: "6.45M VNĐ",
      change: "+12.5%",
      color: "yellow",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Thống kê Hệ thống</h2>
        <div className="flex space-x-4">
          <select className="border border-gray-300 text-gray-900 rounded-lg px-3 py-2">
            <option>30 ngày qua</option>
            <option>90 ngày qua</option>
            <option>1 năm qua</option>
          </select>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {stat.label}
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
                <p
                  className={`text-sm font-medium ${
                    stat.change.startsWith("+")
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {stat.change} so với tháng trước
                </p>
              </div>
              <div
                className={`p-3 rounded-full ${
                  stat.color === "blue"
                    ? "bg-blue-100"
                    : stat.color === "green"
                    ? "bg-green-100"
                    : stat.color === "purple"
                    ? "bg-purple-100"
                    : "bg-yellow-100"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    stat.color === "blue"
                      ? "text-blue-600"
                      : stat.color === "green"
                      ? "text-green-600"
                      : stat.color === "purple"
                      ? "text-purple-600"
                      : "text-yellow-600"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Tăng trưởng người dùng
          </h3>
          <canvas
            ref={chartRef}
            width={400}
            height={200}
            className="w-full"
          ></canvas>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Top đơn vị theo doanh thu
          </h3>
          <div className="space-y-4">
            {[
              { name: "Trung tâm CNTT", revenue: "2.5M VNĐ", percentage: 38.5 },
              {
                name: "Học viện Kinh doanh",
                revenue: "1.8M VNĐ",
                percentage: 27.9,
              },
              {
                name: "Trường Ngoại ngữ",
                revenue: "1.2M VNĐ",
                percentage: 18.6,
              },
              { name: "Viện Thiết kế", revenue: "950K VNĐ", percentage: 14.7 },
            ].map((unit, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {unit.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {unit.revenue}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${unit.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Hoạt động gần đây
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            {
              action: "Đơn vị mới đăng ký",
              detail: "Trung tâm Ngoại ngữ ABC đã đăng ký tham gia hệ thống",
              time: "2 giờ trước",
            },
            {
              action: "Khóa học mới",
              detail: "React Advanced được thêm bởi Trung tâm CNTT",
              time: "4 giờ trước",
            },
            {
              action: "Thanh toán thành công",
              detail: "Học viện Kinh doanh đã thanh toán hoa hồng tháng 1",
              time: "6 giờ trước",
            },
            {
              action: "Tài khoản mới",
              detail: "15 tài khoản học viên mới được tạo",
              time: "8 giờ trước",
            },
          ].map((activity, index) => (
            <div key={index} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.action}
                  </p>
                  <p className="text-sm text-gray-500">{activity.detail}</p>
                </div>
                <span className="text-sm text-gray-400">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SystemStatistics;
