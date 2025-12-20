import React from "react";
import { X, User, Mail, Phone, MapPin, Calendar, Shield } from "lucide-react";
import type { UserResponse } from "@/services/api/response/userResponse";
import {
  getUserFullName,
  getRoleName,
  getRoleIcon,
  getRoleColor,
  formatDate,
} from "../data/AccountData";

interface AccountDetailModalProps {
  account: UserResponse;
  onClose: () => void;
}

const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] transition-all duration-300" />

      {/* Modal Panel */}
      <div className="bg-white max-w-2xl w-full rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Chi tiết tài khoản
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Profile Section */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {account.avatarUrl ? (
                <img
                  src={account.avatarUrl}
                  alt={getUserFullName(account)}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {account.firstName?.charAt(0) || account.username.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {getUserFullName(account)}
              </h3>
              <p className="text-gray-600">@{account.username}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {account.role &&
                  (() => {
                    const IconComponent = getRoleIcon([account.role]);
                    return (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                          [account.role]
                        )}`}
                      >
                        <IconComponent className="w-3 h-3" />
                        {getRoleName([account.role])}
                      </span>
                    );
                  })()}
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4" />
                Thông tin cá nhân
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{account.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Số điện thoại
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">Chưa cập nhật</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Ngày sinh
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">
                      {formatDate(account.dob)}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Địa chỉ
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">Chưa cập nhật</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Thông tin tài khoản
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Tên đăng nhập
                  </label>
                  <div className="mt-1">
                    <span className="text-gray-900">{account.username}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Trạng thái
                  </label>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Hoạt động
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Quyền truy cập
                  </label>
                  <div className="mt-1">
                    {account.role &&
                      (() => {
                        const IconComponent = getRoleIcon([account.role]);
                        return (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(
                              [account.role]
                            )}`}
                          >
                            <IconComponent className="w-3 h-3" />
                            {getRoleName([account.role])}
                          </span>
                        );
                      })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Đóng
          </button>
          {/* <button className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors">
            Chỉnh sửa
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default AccountDetailModal;
