import type { ChatMessageResponse } from "@/types/chat.types";

interface MessageItemProps {
  message: ChatMessageResponse;
  isWebSocketMessage?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

const MessageItem = ({
  message,
  showAvatar = true,
  showTimestamp = true,
}: MessageItemProps) => {
  const fullName = `${message.sender.firstName || ""} ${
    message.sender.lastName || ""
  }`.trim();

  const avatarUrl =
    message.sender.avatarUrl ||
    `https://ui-avatars.com/api/?name=${fullName || "User"}+${
      message.sender.lastName || ""
    }&background=3b82f6&color=fff`;

  const displayName = `${fullName || "Anonymous"} ${
    message.sender.lastName || ""
  }`.trim();

  const messageTime = new Date(message.createdDate).toLocaleTimeString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  return (
    <div className="flex items-start">
      {showAvatar ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="w-10 h-10 rounded-full mr-3"
        />
      ) : (
        <div className="w-10 mr-3"></div>
      )}

      <div className="flex-1">
        {showTimestamp && (
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-white">{displayName}</span>
            <span className="text-xs text-gray-400">{messageTime}</span>
            {message.me && (
              <span className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded-full">
                (You)
              </span>
            )}
          </div>
        )}
        <p className={`text-gray-300 ${showTimestamp ? "mt-1" : "mt-0"}`}>
          {message.content}
        </p>
      </div>
    </div>
  );
};

export default MessageItem;
