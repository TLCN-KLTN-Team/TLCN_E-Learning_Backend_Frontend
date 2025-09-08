import React from "react";
import { X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isLoading?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Lỗi!",
  message = "Không thể tải danh sách Danh mục.",
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      {/* Modal backdrop */}
      <div className="fixed inset-0 bg-black/20 transition-all duration-300" />

      {/* Modal Panel */}
      <div className="bg-white max-w-sm w-full rounded-2xl shadow-xl transform transition-all duration-300 scale-100 p-6">
        {/* Close button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-red-500 rounded-full flex items-center justify-center">
              <X className="w-6 h-6 text-red-500 stroke-[3]" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
        </div>

        {/* Action Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {isLoading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
