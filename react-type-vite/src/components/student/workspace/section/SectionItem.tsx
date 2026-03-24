import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type {
  SectionResponse,
  ChannelResponse,
  BasicChannelResponse,
} from "@/types/chat.types";
import { ChannelList } from "../channel";
import { getListBasicChannelsBySectionId } from "@/services/api/workspace/channel.api";

interface SectionItemProps {
  section: SectionResponse;
  selectedChannel: ChannelResponse | null;
  onChannelSelect: (channel: BasicChannelResponse) => void;
  onInvitePeople?: (channel: ChannelResponse) => void;
  onChannelSettings?: (channel: ChannelResponse) => void;
  onCreateChannel?: (sectionId: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionItem = ({
  section,
  selectedChannel,
  onChannelSelect,
  onCreateChannel,
  isExpanded,
  onToggle,
}: SectionItemProps) => {
  const [channels, setChannels] = useState<BasicChannelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch channels when section is expanded
  useEffect(() => {
    if (isExpanded) {
      const fetchChannels = async () => {
        setIsLoading(true);
        try {
          const channelsData = await getListBasicChannelsBySectionId(
            section.id,
          );
          setChannels(channelsData);
        } catch (error) {
          console.error("Error fetching channels:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchChannels();
    }
  }, [isExpanded, section.id, section.isPublic]);

  const handleCreateChannel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateChannel?.(section.id);
  };

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between px-2 py-1.5 group hover:bg-gray-800 rounded transition-colors">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide truncate">
            {section.name}
          </span>
        </button>

        {/* Create Channel Button */}
        <button
          onClick={handleCreateChannel}
          className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
          title="Tạo kênh mới"
        >
          <Plus className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
        </button>
      </div>

      {/* Channels in Section - When Expanded */}
      {isExpanded && (
        <div className="ml-1">
          {isLoading ? (
            <div className="ml-8 py-2 text-xs text-gray-500 italic">
              Đang tải...
            </div>
          ) : channels.length > 0 ? (
            <ChannelList
              channels={channels}
              selectedChannel={selectedChannel}
              onChannelSelect={onChannelSelect}
            />
          ) : (
            <div className="ml-8 py-2 text-xs text-gray-500 italic">
              Chưa có kênh nào
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SectionItem;
