import {
  Smile,
  ThumbsUp,
  MessageSquare,
  Edit,
  MoreHorizontal,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface MessageHoverToolbarProps {
  isOwnMessage: boolean;
  onReact: () => void;
  onQuickReaction: () => void;
  onReply: () => void;
  onEdit?: () => void;
  onMore: () => void;
}

const MessageHoverToolbar = ({
  isOwnMessage,
  onReact,
  onQuickReaction,
  onReply,
  onEdit,
}: MessageHoverToolbarProps) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoreMenu]);

  return (
    <div className="absolute -top-3 right-2 bg-gray-800 border border-gray-600 rounded-lg shadow-lg px-1 py-1 flex items-center gap-1 z-10">
      {/* React emoji */}
      <button
        onClick={onReact}
        className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-yellow-400"
        title="React"
      >
        <Smile className="w-4 h-4" />
      </button>

      {/* Quick reaction */}
      <button
        onClick={onQuickReaction}
        className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-blue-400"
        title="Quick reaction"
      >
        <ThumbsUp className="w-4 h-4" />
      </button>

      {/* Reply */}
      <button
        onClick={onReply}
        className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-green-400"
        title="Reply"
      >
        <MessageSquare className="w-4 h-4" />
      </button>

      {/* Edit - only for own messages */}
      {isOwnMessage && onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-blue-400"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
      )}

      {/* More menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white"
          title="More"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* More menu dropdown */}
        {showMoreMenu && (
          <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-1 min-w-[160px] z-20">
            <button
              onClick={() => {
                console.log("Copy message");
                setShowMoreMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Copy message
            </button>
            {isOwnMessage && (
              <>
                <button
                  onClick={() => {
                    onEdit?.();
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    console.log("Delete message");
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors"
                >
                  Delete
                </button>
              </>
            )}
            <button
              onClick={() => {
                console.log("Pin message");
                setShowMoreMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Pin
            </button>
            <button
              onClick={() => {
                console.log("Forward message");
                setShowMoreMenu(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              Forward
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageHoverToolbar;
