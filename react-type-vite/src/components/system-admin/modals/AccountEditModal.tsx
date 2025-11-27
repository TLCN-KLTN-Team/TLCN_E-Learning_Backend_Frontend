import React, { useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";
import type { UserResponse } from "@/services/api/response/userResponse";
import { verifyEmailBySuperAdmin } from "@/services/api/userApi";
import { toast } from "react-toastify";

interface AccountEditModalProps {
  account: UserResponse;
  onClose: () => void;
  onSuccess: () => void;
}

const AccountEditModal: React.FC<AccountEditModalProps> = ({
  account,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const handleVerifyAccount = async () => {
    try {
      setLoading(true);
      await verifyEmailBySuperAdmin(account.email);
      toast.success("Xác thực tài khoản thành công");
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error ? `${error}` : "Lỗi khi xác thực tài khoản");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Modal backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="bg-white max-w-md w-full rounded-lg shadow-2xl transform transition-all duration-300 scale-100 border border-gray-200 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Xác thực tài khoản
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Bạn có chắc chắn muốn xác thực tài khoản này?
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <span className="text-sm text-gray-900">{account.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Họ tên:</span>
              <span className="text-sm text-gray-900">
                {account.firstName} {account.lastName}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                Username:
              </span>
              <span className="text-sm text-gray-900">{account.username}</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                Sau khi xác thực, tài khoản sẽ được kích hoạt và email sẽ được
                xác minh.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Hủy
          </button>
          <button
            onClick={handleVerifyAccount}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Xác thực
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccountEditModal;
