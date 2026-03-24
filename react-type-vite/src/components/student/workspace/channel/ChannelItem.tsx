import { Settings, UserPlus } from "lucide-react";
import type { BasicChannelResponse } from "@/types/chat.types";

interface ChannelItemProps {
  channel: BasicChannelResponse;
  isSelected: boolean;
  onSelect: (channel: BasicChannelResponse) => void;
  onInvitePeople?: BasicChannelResponse
  onSettings?: BasicChannelResponse
}

const ChannelItem = ({
  channel,
  isSelected,
  onSelect,
}: ChannelItemProps) => {
  const handleInvitePeople = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex items-center justify-between px-2 py-1.5 group">
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {/* Channel Name - Clickable */}
        <div
          onClick={() => onSelect(channel)}
          className={`flex items-center gap-1.5 cursor-pointer flex-1 py-1 px-2 rounded transition-colors min-w-0 ${
            isSelected
              ? "bg-gray-600 text-white"
              : "hover:bg-gray-700 text-gray-300 hover:text-white"
          }`}
        >
          <span className="text-gray-400 flex-shrink-0">#</span>
          <span className="text-sm font-medium truncate">{channel.name}</span>
        </div>
      </div>

      {/* Action Buttons - Always visible */}
      <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
        <button
          onClick={handleInvitePeople}
          className="p-1 hover:bg-gray-600 rounded transition-colors"
          title="Thêm người vào channel"
        >
          <UserPlus className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
        </button>
        <button
          onClick={handleSettings}
          className="p-1 hover:bg-gray-600 rounded transition-colors"
          title="Cài đặt channel"
        >
          <Settings className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default ChannelItem;
