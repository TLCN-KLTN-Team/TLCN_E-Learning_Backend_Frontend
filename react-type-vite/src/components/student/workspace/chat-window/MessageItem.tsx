import type { ChatMessageResponse } from "@/types/chat.types";
import { useState } from "react";
import MessageHoverToolbar from "./MessageHoverToolbar";

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
  const [isHovered, setIsHovered] = useState(false);

  const fullName = `${message.sender.firstName || ""} ${
    message.sender.lastName || ""
  }`.trim();

  const avatarUrl =
    message.sender.avatarUrl ||
    `https://ui-avatars.com/api/?name=${fullName || "User"}+${
      message.sender.lastName || ""
    }&background=3b82f6&color=fff`;

  const displayName = `${message.sender.lastName || "Anonymous"} ${
    message.sender.firstName || ""
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

  // Handler functions for toolbar actions
  const handleReact = () => {
    console.log("React to message:", message.id);
    // TODO: Implement emoji picker
  };

  const handleQuickReaction = () => {
    console.log("Quick reaction to message:", message.id);
    // TODO: Add quick reaction (like thumbs up)
  };

  const handleReply = () => {
    console.log("Reply to message:", message.id);
    // TODO: Implement reply functionality
  };

  const handleEdit = () => {
    console.log("Edit message:", message.id);
    // TODO: Implement edit functionality
  };

  const handleMore = () => {
    console.log("More options for message:", message.id);
  };

  // All messages use the same left-aligned layout
  return (
    <div
      className="flex items-start mb-2 group relative px-2 py-1 rounded-lg transition-all duration-200 hover:bg-gray-800/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
            <span
              className={`font-semibold ${
                message.me ? "text-blue-400" : "text-white"
              }`}
            >
              {displayName}
            </span>
            <span className="text-xs text-gray-400">{messageTime}</span>
            {message.me && (
              <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                You
              </span>
            )}
          </div>
        )}

        {/* Message content wrapper with relative positioning for toolbar */}
        <div className="relative">
          {/* Message content bubble wrapper */}
          <div
            className={`transition-all duration-200 ${
              isHovered
                ? message.me
                  ? "bg-blue-600/10 border border-blue-500/20 rounded-lg px-3 py-2 -mx-1"
                  : "bg-gray-700/30 border border-gray-600/30 rounded-lg px-3 py-2 -mx-1"
                : ""
            }`}
          >
            {/* Message content based on messageType */}
            {message.messageType === "TEXT" ? (
              <p className={`text-gray-300 ${showTimestamp ? "mt-1" : "mt-0"}`}>
                {message.content}
              </p>
            ) : message.messageType === "IMAGE" && message.fileUrl ? (
              <div className={`${showTimestamp ? "mt-1" : "mt-0"}`}>
                <div className="relative inline-block">
                  <img
                    src={message.fileUrl}
                    alt={message.content || "Image"}
                    className="max-w-sm max-h-64 rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
                    loading="lazy"
                    onClick={() => window.open(message.fileUrl!, "_blank")}
                    title={`Click to view ${
                      message.content || "image"
                    } in full size`}
                  />
                </div>
              </div>
            ) : message.messageType === "FILE" && message.fileUrl ? (
              <div className={`${showTimestamp ? "mt-1" : "mt-0"}`}>
                <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg border border-gray-600 max-w-sm">
                  <div className="w-10 h-10 bg-gray-700 rounded flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {message.content || "Unknown file"}
                    </p>
                    <p className="text-gray-400 text-xs">File attachment</p>
                  </div>
                  <a
                    href={message.fileUrl}
                    download={message.content}
                    className="text-blue-400 hover:text-blue-300 text-sm"
                    title="Download file"
                  >
                    ↓
                  </a>
                </div>
              </div>
            ) : (
              // Fallback for unknown message types or missing fileUrl
              <p
                className={`text-gray-500 text-sm italic ${
                  showTimestamp ? "mt-1" : "mt-0"
                }`}
              >
                {message.content || "Content unavailable"}
              </p>
            )}
          </div>

          {/* Hover toolbar - only visible on hover */}
          {isHovered && (
            <MessageHoverToolbar
              isOwnMessage={message.me || false}
              onReact={handleReact}
              onQuickReaction={handleQuickReaction}
              onReply={handleReply}
              onEdit={message.me ? handleEdit : undefined}
              onMore={handleMore}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
