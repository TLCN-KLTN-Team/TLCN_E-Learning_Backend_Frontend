import { useEffect, } from "react";
import type { BasicChannelResponse, ChannelResponse } from "@/types/chat.types";
import { Settings, UserPlus } from "lucide-react";


interface ChannelListProps {
  channels: BasicChannelResponse[];
  selectedChannel: ChannelResponse | null;
  onChannelSelect: (channel: BasicChannelResponse) => void;
  onInvitePeople?: (channel: BasicChannelResponse) => void;
  onChannelSettings?: (channel: BasicChannelResponse) => void;
}

const ChannelList = ({
  channels,
  selectedChannel,
  onChannelSelect,
  onInvitePeople,
  onChannelSettings,
}: ChannelListProps) => {

  const handleInvitePeople = (
    channel: BasicChannelResponse,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onInvitePeople?.(channel);
  };

  const handleChannelSettings = (
    channel: BasicChannelResponse,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onChannelSettings?.(channel);
  };

  useEffect(() => {
    console.log("Channels updated, resetting expanded channels", channels);
  }, [channels]);

  return (
    <div className="space-y-2">
      {channels.map((channel: BasicChannelResponse) => {

        return (
          <div key={channel.id}>
            {/* Channel Header with Arrow */}
            <div className="flex items-center justify-between px-2 py-1.5 group">
              <div className="flex items-center gap-1 flex-1 min-w-0">

                {/* Channel Name - Clickable */}
                <div
                  onClick={() => onChannelSelect(channel)}
                  className={`flex items-center gap-1.5 cursor-pointer flex-1 py-1 px-2 rounded transition-colors min-w-0 ${
                    selectedChannel?.id === channel.id
                      ? "bg-gray-600 text-white"
                      : "hover:bg-gray-700 text-gray-300 hover:text-white"
                  }`}
                >
                  <span className="text-gray-400 flex-shrink-0">#</span>
                  <span className="text-sm font-medium truncate">
                    {channel.name}
                  </span>
                </div>
              </div>

              {/* Action Buttons - Always visible */}
              <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
                <button
                  onClick={(e) => handleInvitePeople(channel, e)}
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                  title="Thêm người vào channel"
                >
                  <UserPlus className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
                </button>
                <button
                  onClick={(e) => handleChannelSettings(channel, e)}
                  className="p-1 hover:bg-gray-600 rounded transition-colors"
                  title="Cài đặt channel"
                >
                  <Settings className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default ChannelList;
