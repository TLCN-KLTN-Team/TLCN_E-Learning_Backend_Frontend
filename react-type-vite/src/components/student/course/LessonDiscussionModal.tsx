import React from "react";
import { X } from "lucide-react";
import DiscussionSection from "./DiscussionSection";
import { useAuth } from "@/context/auth-context/useAuth";

interface LessonDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: number;
  lessonTitle: string;
}

const LessonDiscussionModal: React.FC<LessonDiscussionModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
}) => {
  const { user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        {/* Backdrop */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              Thảo luận: {lessonTitle}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Discussion Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <DiscussionSection
              itemType="lesson"
              itemId={lessonId}
              itemTitle={lessonTitle}
              user={user}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonDiscussionModal;
