import type { ChatMessageResponse } from "@/types/chat.types";
import { MessageStatus } from "@/types/chat.enums";
import { useState } from "react";
import MessageHoverToolbar from "./MessageHoverToolbar";
import FileCard from "./FileCard";
import { ExternalLink, X, RotateCcw, Loader2 } from "lucide-react";
import { getAvartarFromName } from "@/utils/callApiUtils";

interface MessageItemProps {
  message: ChatMessageResponse;
  isWebSocketMessage?: boolean;
  showAvatar?: boolean;
  showTimestamp?: boolean;
  onRetry?: (message: ChatMessageResponse) => void;
}

const MessageItem = ({
  message,
  showAvatar = true,
  showTimestamp = true,
  onRetry,
}: MessageItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [selectedMediaUrl, setSelectedMediaUrl] = useState<string | null>(null);
  const [selectedMediaAlt, setSelectedMediaAlt] = useState<string>("Image");

  const isPending = message.status === MessageStatus.PENDING;
  const isFailed = message.status === MessageStatus.FAILED;

  const displayName = message.sender.nickname
    ? `${message.sender.nickname}`.trim()
    : "Anonymous";
  const avatarUrl = message.sender.avatarUrl || getAvartarFromName(displayName);

  const messageTime = new Date(message.createdDate).toLocaleTimeString(
    "vi-VN",
    {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
      year: "numeric",
    },
  );

  // Handler functions for toolbar actions
  const handleReact = () => {
    console.log("React to message:", message.id);
  };

  const handleQuickReaction = () => {
    console.log("Quick reaction to message:", message.id);
  };

  const handleReply = () => {
    console.log("Reply to message:", message.id);
  };

  const handleEdit = () => {
    console.log("Edit message:", message.id);
  };

  const handleMore = () => {
    console.log("More options for message:", message.id);
  };

  // Render attachments from the post-attach pattern
  const renderAttachments = (withTopSpacing = true) => {
    if (!message.attachments || message.attachments.length === 0) return null;

    return (
      <div className={`${withTopSpacing ? "mt-2" : ""} flex flex-wrap gap-2`}>
        {message.attachments.map((att) =>
          att.attachmentType === "IMAGE" ? (
            <img
              key={att.id}
              src={att.fileUrl}
              alt={att.fileName}
              className={`max-w-xs max-h-48 rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity ${
                isPending ? "opacity-50" : ""
              }`}
              loading="lazy"
              onClick={() => {
                setSelectedMediaUrl(att.fileUrl);
                setSelectedMediaAlt(att.fileName || "Image");
                setShowMediaModal(true);
              }}
            />
          ) : (
            <FileCard key={att.id} attachment={att} />
          ),
        )}
      </div>
    );
  };

  const hasTextContent = Boolean(message.content?.trim());

  const renderLegacyImage = () => {
    if (!message.fileUrl) return null;

    return (
      <div className={`${showTimestamp ? "mt-1" : "mt-0"}`}>
        <div className="relative inline-block">
          <img
            src={message.fileUrl}
            alt={message.content || "Image"}
            className="max-w-sm max-h-64 rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
            loading="lazy"
            onClick={() => {
              setSelectedMediaUrl(message.fileUrl || null);
              setSelectedMediaAlt(message.content || "Image");
              setShowMediaModal(true);
            }}
          />
        </div>
      </div>
    );
  };

  const renderLegacyFile = () => {
    if (!message.fileUrl) return null;

    return (
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
    );
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case "TEXT":
        return hasTextContent ? (
          <p className={`text-gray-300 ${showTimestamp ? "mt-1" : "mt-0"}`}>
            {message.content}
          </p>
        ) : null;

      // Legacy formats kept for backward compatibility.
      case "IMAGE":
        return renderLegacyImage();

      case "FILE":
        return renderLegacyFile();

      case "MIXED":
        return (
          <>
            {hasTextContent && (
              <p className={`text-gray-300 ${showTimestamp ? "mt-1" : "mt-0"}`}>
                {message.content}
              </p>
            )}
            {renderAttachments(hasTextContent)}
          </>
        );

      case "FILE_ONLY":
        return renderAttachments(showTimestamp) || renderLegacyFile();

      default:
        return (
          <>
            {hasTextContent && (
              <p className={`text-gray-300 ${showTimestamp ? "mt-1" : "mt-0"}`}>
                {message.content}
              </p>
            )}
            {renderAttachments(hasTextContent || showTimestamp)}
          </>
        );
    }
  };

  return (
    <div
      className={`flex items-start mb-2 group relative px-2 py-1 rounded-lg transition-all duration-200 hover:bg-gray-800/50 ${
        isPending ? "opacity-60" : ""
      } ${isFailed ? "opacity-80" : ""}`}
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
            {renderMessageContent()}

            {/* PENDING status indicator */}
            {isPending && (
              <div className="flex items-center gap-1.5 mt-1.5">
                <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                <span className="text-xs text-gray-400">Đang gửi...</span>
              </div>
            )}

            {/* FAILED status indicator + retry button */}
            {isFailed && (
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs text-red-400">Gửi thất bại</span>
                {onRetry && (
                  <button
                    onClick={() => onRetry(message)}
                    className="flex items-center gap-1 px-2 py-0.5 text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Thử lại
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Hover toolbar - only visible on hover and not for pending/failed */}
          {isHovered && !isPending && !isFailed && (
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

      {/* Media Modal */}
      {showMediaModal && selectedMediaUrl && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowMediaModal(false);
            setSelectedMediaUrl(null);
          }}
        >
          <div
            className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowMediaModal(false);
                setSelectedMediaUrl(null);
              }}
              className="absolute top-4 right-4 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full p-2 z-10 transition-colors"
              title="Đóng"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Open in new tab button */}
            <button
              onClick={() => window.open(selectedMediaUrl, "_blank")}
              className="absolute top-4 right-16 bg-gray-800/80 hover:bg-gray-700 text-white rounded-full p-2 z-10 transition-colors"
              title="Mở trong tab mới"
            >
              <ExternalLink className="w-6 h-6" />
            </button>

            {/* Media content */}
            <div className="flex items-center justify-center w-full h-full">
              <img
                src={selectedMediaUrl}
                alt={selectedMediaAlt}
                className="max-w-full max-h-full object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Caption if available */}
            {message.content && (
              <div className="absolute bottom-4 left-4 right-4 bg-black/60 text-white px-4 py-2 rounded-lg">
                <p className="text-sm">{message.content}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
