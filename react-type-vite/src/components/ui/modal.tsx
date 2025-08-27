import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
  labelledBy?: string;      // id của tiêu đề
  describedBy?: string;     // id của mô tả
}

const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  children, 
  maxWidth = "max-w-2xl",
  labelledBy,
  describedBy
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
    >
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-all duration-200"
        onClick={onClose}
        aria-hidden="true" // screen reader bỏ qua overlay
      />

      {/* Modal content */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-full ${maxWidth} max-h-[90vh] overflow-hidden`}
      >
        {/* Hidden close button cho screen readers */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-2"
          aria-label="Close modal"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;