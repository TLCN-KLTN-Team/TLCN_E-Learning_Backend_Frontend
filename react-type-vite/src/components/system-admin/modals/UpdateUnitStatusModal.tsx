import { X } from "lucide-react";
import type React from "react";
import { useState } from "react";

interface UpdateUnitStatusModalProps {
  unitName: string;
  currentStatus: string;
  targetStatus: string; // ACTIVE or SUSPEND
  representativeEmail: string;
  onClose: () => void;
  onConfirm: (newStatus: string, reason: string) => void;
}

const UpdateUnitStatusModal: React.FC<UpdateUnitStatusModalProps> = ({
  unitName,
  currentStatus,
  targetStatus,
  representativeEmail,
  onClose,
  onConfirm,
}) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      return;
    }

    const status = targetStatus === "SUSPENDED" ? "REACTIVATE" : "SUSPENDED";
    onConfirm(status, reason);
  };

  const actionText =
    targetStatus === "ACTIVE" ? "Tạm dừng hoạt động" : "Kích hoạt lại";
  const actionColor =
    targetStatus === "ACTIVE" ? "text-orange-600" : "text-green-600";
  const currentStatusLabel =
    currentStatus.toUpperCase() === "SUSPENDED"
      ? "Đang bị tạm dừng"
      : "Đang hoạt động";

  return (
    <div className="fixed inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">
            Cập nhật trạng thái đơn vị đào tạo
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Unit Information */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-1.5">
            <div>
              <span className="text-xs font-medium text-gray-600">
                Tên đơn vị:
              </span>
              <p className="text-sm font-semibold text-gray-900">{unitName}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-600">
                Email người đại diện:
              </span>
              <p className="text-sm text-gray-900">{representativeEmail}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-gray-600">
                Trạng thái hiện tại:
              </span>
              <p className="text-sm font-semibold text-gray-900">
                {currentStatusLabel}
              </p>
            </div>
          </div>

          {/* Action Description */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">Hành động:</span>{" "}
              <span className={`font-bold ${actionColor}`}>{actionText}</span>
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Đơn vị đào tạo sẽ được chuyển từ trạng thái{" "}
              <span className="font-semibold">{currentStatusLabel}</span> sang{" "}
              <span className="font-semibold">{actionText}</span>
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Lý do {actionText.toLowerCase()}{" "}
              <span className="text-red-500">*</span>
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Nhập lý do ${actionText.toLowerCase()} (sẽ được gửi qua email cho người đại diện)...`}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              Email thông báo sẽ được gửi đến:{" "}
              <span className="font-medium">{representativeEmail}</span>
            </p>
          </div>

          {/* Warning Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <span className="font-semibold">Lưu ý:</span> Việc thay đổi trạng
              thái sẽ ảnh hưởng đến quyền truy cập của đơn vị đào tạo. Email
              thông báo sẽ được gửi tự động đến người đại diện.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Cập nhật
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpdateUnitStatusModal;
