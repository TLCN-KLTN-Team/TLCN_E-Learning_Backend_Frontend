import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronRight, Plus, Trophy } from "lucide-react";
import { useAuth } from "@/context/auth-context/useAuth";
import type {
  SectionResponse,
  ChannelResponse,
  BasicChannelResponse,
} from "@/types/chat.types";
import { ChannelType } from "@/types/chat.types";
import { ChannelList } from "../channel";
import { getListBasicChannelsBySectionId } from "@/services/api/workspace/channel.api";

interface SectionItemProps {
  section: SectionResponse;
  selectedChannel: ChannelResponse | null;
  onChannelSelect: (channel: BasicChannelResponse) => void;
  onInvitePeople?: (channel: BasicChannelResponse) => void;
  onChannelSettings?: (channel: BasicChannelResponse) => void;
  onCreateChannel?: (sectionId: string) => void;
  onManageSession?: (sectionId: string, sectionName: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

const SectionItem = ({
  section,
  selectedChannel,
  onChannelSelect,
  onInvitePeople,
  onChannelSettings,
  onCreateChannel,
  onManageSession,
  isExpanded,
  onToggle,
}: SectionItemProps) => {
  const { user } = useAuth();
  const isTeacher = user?.roles?.includes("TEACHER") || user?.role === "TEACHER";
  const [channels, setChannels] = useState<BasicChannelResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Refs để tránh stale closure — đọc latest value mà không trigger lại effect
  const selectedChannelRef = useRef(selectedChannel);
  selectedChannelRef.current = selectedChannel;
  const onChannelSelectRef = useRef(onChannelSelect);
  onChannelSelectRef.current = onChannelSelect;

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

          // Safety net: nếu chưa có channel nào được chọn (workspace init chưa hoàn thành),
          // tự động chọn GROUP channel có deadline còn hiệu lực để mở WebSocket connection.
          if (!selectedChannelRef.current) {
            const now = new Date();
            // Ưu tiên OPEN (submissionDeadline > now), rồi đến REVIEW (còn hạn chấm chéo)
            const activeGroupChannel =
              channelsData.find(
                (ch) =>
                  ch.type === ChannelType.GROUP &&
                  ch.submissionDeadline &&
                  new Date(ch.submissionDeadline) > now,
              ) ??
              channelsData.find(
                (ch) =>
                  ch.type === ChannelType.GROUP &&
                  ch.allowCrossReview &&
                  ch.crossReviewDeadline &&
                  new Date(ch.crossReviewDeadline) > now,
              );
            if (activeGroupChannel) {
              onChannelSelectRef.current(activeGroupChannel);
            }
          }
        } catch (error) {
          console.error("Error fetching channels:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchChannels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Session Management Button */}
          <button
            onClick={(e) => { e.stopPropagation(); onManageSession?.(section.id, section.name); }}
            className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
            title="Quản lý phiên điểm"
          >
            <Trophy className="w-3.5 h-3.5 text-gray-500 hover:text-yellow-400" />
          </button>

          {/* Create Channel Button - TEACHER only */}
          {isTeacher && (
            <button
              onClick={handleCreateChannel}
              className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
              title="Tạo kênh mới"
            >
              <Plus className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
            </button>
          )}
        </div>

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
              onInvitePeople={onInvitePeople}
              onChannelSettings={onChannelSettings}
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
