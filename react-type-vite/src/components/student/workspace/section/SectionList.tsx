import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type {
  SectionResponse,
  ChannelResponse,
  BasicChannelResponse,
} from "@/types/chat.types";
import ChannelList from "../channel/ChannelList";

import { getListBasicChannelsBySectionId } from "@/services/api/workspace/channel.api";

interface SectionListProps {
  sections: SectionResponse[];
  selectedChannel: ChannelResponse | null;
  onChannelSelect: (channel: ChannelResponse) => void;
  onInvitePeople?: (channel: ChannelResponse) => void;
  onChannelSettings?: (channel: ChannelResponse) => void;
  onCreateChannel?: (sectionId: string) => void;
}

const SectionList = ({
  sections,
  selectedChannel,
  onChannelSelect,
  onInvitePeople,
  onChannelSettings,
  onCreateChannel,
}: SectionListProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );

  const [publicChannels, setPublicChannels] = useState<BasicChannelResponse[]>(
    [],
  );

  useEffect(() => {
    const publicSection = sections.find((sec) => sec.isPublic);
    if (publicSection) {
      const fetchPublicChannels = async () => {
        try {
          const channels = await getListBasicChannelsBySectionId(
            publicSection.id,
          );
          setPublicChannels(channels);
        } catch (error) {
          console.error("Error fetching public channels:", error);
        }
      };
      fetchPublicChannels();
    }
  }, [sections]);

  const toChannelResponse = (
    channel: BasicChannelResponse,
    sectionId: string,
  ): ChannelResponse => ({
    id: channel.id,
    sectionId,
    name: channel.name,
    slug: channel.name.toLowerCase().replace(/\s+/g, "-"),
    description: "",
    position: 0,
    scope: "SECTION",
    type: "TEXT",
    status: "ACTIVE",
    isReadOnly: false,
    isPublic: channel.isPublic,
    memberCount: 0,
    lastMessageId: null,
    lastActivityAt: new Date(0).toISOString(),
    messages: [],
    createdAt: new Date(0).toISOString(),
  });

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const handleCreateChannel = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateChannel?.(sectionId);
  };

  return (
    <div className="space-y-1">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);

        return (
          <div key={section.id}>
            {/* Section Header */}
            <div className="flex items-center justify-between px-2 py-1.5 group hover:bg-gray-800 rounded transition-colors">
              <button
                onClick={() => toggleSection(section.id)}
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
                onClick={(e) => handleCreateChannel(section.id, e)}
                className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                title="Tạo kênh mới"
              >
                <Plus className="w-3.5 h-3.5 text-gray-500 hover:text-white" />
              </button>
            </div>

            {/* Channels in Section - When Expanded */}
            {isExpanded && publicChannels.length > 0 && (
              <div className="ml-1">
                <ChannelList
                  channels={publicChannels}
                  selectedChannel={selectedChannel}
                  onChannelSelect={(channel) =>
                    onChannelSelect(toChannelResponse(channel, section.id))
                  }
                  onInvitePeople={(channel) =>
                    onInvitePeople?.(toChannelResponse(channel, section.id))
                  }
                  onChannelSettings={(channel) =>
                    onChannelSettings?.(toChannelResponse(channel, section.id))
                  }
                />
              </div>
            )}

            {/* Show Selected Channel When Collapsed */}
            {!isExpanded && publicChannels.length > 0 && (
              <div className="ml-1">
                <ChannelList
                  channels={publicChannels}
                  selectedChannel={selectedChannel}
                  onChannelSelect={(channel) =>
                    onChannelSelect(toChannelResponse(channel, section.id))
                  }
                  onInvitePeople={(channel) =>
                    onInvitePeople?.(toChannelResponse(channel, section.id))
                  }
                  onChannelSettings={(channel) =>
                    onChannelSettings?.(toChannelResponse(channel, section.id))
                  }
                />
              </div>
            )}

            {/* Empty State */}
            {isExpanded && publicChannels.length === 0 && (
              <div className="ml-8 py-2 text-xs text-gray-500 italic">
                Chưa có kênh nào
              </div>
            )}
          </div>
        );
      })}

      {!publicChannels && (
        <div className="ml-2 py-2 text-xs text-gray-500 italic">
          Không có section public
        </div>
      )}
    </div>
  );
};

export default SectionList;
