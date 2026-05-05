import React from "react";
import NotificationCenterPage from "@/components/shared/notifications/NotificationCenterPage";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

const TeacherNotificationsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  title = "Thông báo giảng viên",
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative z-10 max-w-3xl w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <h3 className="text-lg font-medium">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="p-4">
            <NotificationCenterPage
              title={title}
              fallbackPath="/teacher/home"
              notificationsPagePath="/teacher/notifications"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherNotificationsModal;
