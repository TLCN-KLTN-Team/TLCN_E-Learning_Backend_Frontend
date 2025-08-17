"use client"

import type React from "react"
import { useState } from "react"

const AccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState([
    {
      id: 1,
      name: "Nguyễn Văn Admin",
      email: "admin@system.com",
      role: "system_admin",
      status: "active",
      lastLogin: "2024-01-15 10:30",
    },
    {
      id: 2,
      name: "Trần Thị Quản lý",
      email: "manager@cntt001.com",
      role: "unit_admin",
      status: "active",
      lastLogin: "2024-01-15 09:15",
    },
    {
      id: 3,
      name: "Lê Văn Giảng viên",
      email: "teacher@cntt001.com",
      role: "teacher",
      status: "active",
      lastLogin: "2024-01-14 16:45",
    },
    {
      id: 4,
      name: "Phạm Thị Học viên",
      email: "student@cntt001.com",
      role: "student",
      status: "inactive",
      lastLogin: "2024-01-10 14:20",
    },
  ])

  const [selectedRole, setSelectedRole] = useState("all")

  const filteredAccounts =
    selectedRole === "all" ? accounts : accounts.filter((account) => account.role === selectedRole)

  const getRoleName = (role: string) => {
    const roleNames = {
      system_admin: "Quản trị hệ thống",
      unit_admin: "Quản lý đơn vị",
      teacher: "Giảng viên",
      student: "Học viên",
    }
    return roleNames[role as keyof typeof roleNames] || role
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Quản lý Tài khoản</h2>
        <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tạo tài khoản
        </button>
      </div>

      <div className="flex space-x-4 mb-6">
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="system_admin">Quản trị hệ thống</option>
          <option value="unit_admin">Quản lý đơn vị</option>
          <option value="teacher">Giảng viên</option>
          <option value="student">Học viên</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tài khoản
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đăng nhập cuối
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">{account.name.charAt(0)}</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{account.name}</div>
                        <div className="text-sm text-gray-500">{account.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {getRoleName(account.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        account.status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {account.status === "active" ? "Hoạt động" : "Tạm khóa"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{account.lastLogin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">Sửa</button>
                      <button className="text-yellow-600 hover:text-yellow-900">
                        {account.status === "active" ? "Khóa" : "Mở khóa"}
                      </button>
                      <button className="text-red-600 hover:text-red-900">Xóa</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AccountManagement
