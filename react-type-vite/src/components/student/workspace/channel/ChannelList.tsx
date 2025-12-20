import { useEffect, useState } from "react";
import type { ChannelResponse, GroupResponse } from "@/types/chat.types";
import { ChevronDown, ChevronRight, UserPlus, Settings } from "lucide-react";
import GroupList from "../group/GroupList";

interface ChannelListProps {
  channels: ChannelResponse[];
  selectedChannel: ChannelResponse | null;
  onChannelSelect: (channel: ChannelResponse) => void;
  onInvitePeople?: (channel: ChannelResponse) => void;
  onChannelSettings?: (channel: ChannelResponse) => void;
}

const ChannelList = ({
  channels,
  selectedChannel,
  onChannelSelect,
  onInvitePeople,
  onChannelSettings,
}: ChannelListProps) => {
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(
    new Set()
  );
  const [selectedGroup, setSelectedGroup] = useState<GroupResponse | null>(
    null
  );

  const toggleChannel = (channelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChannels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(channelId)) {
        newSet.delete(channelId);
      } else {
        newSet.add(channelId);
      }
      return newSet;
    });
  };

  const handleInvitePeople = (
    channel: ChannelResponse,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onInvitePeople?.(channel);
  };

  const handleChannelSettings = (
    channel: ChannelResponse,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    onChannelSettings?.(channel);
  };

  const handleGroupSelect = (group: GroupResponse) => {
    setSelectedGroup(group);
    // You can add additional logic here to handle group selection
    // For example, loading group-specific messages or data
  };

  useEffect(() => {
    console.log("Channels updated, resetting expanded channels", channels);
  }, [channels]);

  return (
    <div className="space-y-2">
      {channels.map((channel: ChannelResponse) => {
        const isExpanded = expandedChannels.has(channel.id);
        const hasGroups = channel.groups && channel.groups.length > 0;

        return (
          <div key={channel.id}>
            {/* Channel Header with Arrow */}
            <div className="flex items-center justify-between px-2 py-1.5 group">
              <div className="flex items-center gap-1 flex-1 min-w-0">
                {/* Expand/Collapse Arrow - Only visible if has groups */}
                {hasGroups ? (
                  <button
                    onClick={(e) => toggleChannel(channel.id, e)}
                    className="p-0.5 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-400" />
                    )}
                  </button>
                ) : (
                  <div className="w-4 flex-shrink-0" /> // Spacer when no groups
                )}

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
                    {channel.channelName}
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

            {/* Groups List - Show when expanded */}
            {isExpanded && hasGroups && (
              <GroupList
                groups={channel.groups || []}
                selectedGroup={selectedGroup}
                onGroupSelect={handleGroupSelect}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChannelList;
