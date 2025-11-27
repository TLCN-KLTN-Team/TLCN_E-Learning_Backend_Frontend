import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { AccountStatus } from "@/types/account.enum";

interface ChangeStatusModalProps {
  accountName: string;
  currentStatus: AccountStatus;
  targetStatus: AccountStatus;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}

const ChangeStatusModal: React.FC<ChangeStatusModalProps> = ({
  accountName,
  currentStatus,
  targetStatus,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLocking = targetStatus === AccountStatus.BANNED;
  const isUnlocking =
    currentStatus === AccountStatus.BANNED &&
    targetStatus === AccountStatus.ACTIVE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocking && !reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason || undefined);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    if (isLocking) return "Khóa tài khoản";
    if (isUnlocking) return "Mở khóa tài khoản";
    return "Thay đổi trạng thái tài khoản";
  };

  const getDescription = () => {
    if (isLocking) {
      return `Bạn có chắc chắn muốn khóa tài khoản "${accountName}"? Người dùng sẽ không thể đăng nhập vào hệ thống.`;
    }
    if (isUnlocking) {
      return `Bạn có chắc chắn muốn mở khóa tài khoản "${accountName}"? Người dùng sẽ có thể đăng nhập trở lại.`;
    }
    return `Bạn có chắc chắn muốn thay đổi trạng thái tài khoản "${accountName}"?`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-4">
            <p className="text-gray-600">{getDescription()}</p>

            {isLocking && (
              <div>
                <label
                  htmlFor="reason"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Lý do khóa <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập lý do khóa tài khoản..."
                  required
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                isLocking
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isSubmitting || (isLocking && !reason.trim())}
            >
              {isSubmitting ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeStatusModal;
