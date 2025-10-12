import React from "react";

interface DefaultThumbnailProps {
  title: string;
  className?: string;
}

const DefaultThumbnail: React.FC<DefaultThumbnailProps> = ({
  title,
  className = "",
}) => {
  // Lấy chữ cái đầu của từng từ trong title để tạo initials
  const getInitials = (str: string) => {
    return str
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(title);

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 ${className}`}
    >
      <div className="text-center text-white">
        <div className="text-2xl font-bold mb-2">{initials}</div>
        <div className="w-8 h-8 mx-auto mb-2">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-full h-full opacity-60"
          >
            <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.1 3.89 23 5 23H19C20.1 23 21 22.1 21 21V9M19 9H14V4L19 9Z" />
          </svg>
        </div>
        <div className="text-xs opacity-80">Khóa học</div>
      </div>
    </div>
  );
};

export default DefaultThumbnail;
