interface SessionDividerProps {
  timestamp: Date;
}

const SessionDivider = ({ timestamp }: SessionDividerProps) => {
  const formattedTime = timestamp.toLocaleString("vi-VN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center my-6">
      <div className="flex-1 h-px bg-gray-600"></div>
      <div className="px-4 py-2 bg-gray-700 rounded-full">
        <span className="text-xs text-gray-300">{formattedTime}</span>
      </div>
      <div className="flex-1 h-px bg-gray-600"></div>
    </div>
  );
};

export default SessionDivider;
