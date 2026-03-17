import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { SectionResponse, ChannelResponse } from "@/types/chat.types";
import ChannelList from "../channel/ChannelList";

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
    new Set(sections.map((s) => s.id)) // Expand all by default
  );

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
        // Check if selected channel is in this section
        const selectedChannelInSection = section.channels?.find(
          (ch) => ch.id === selectedChannel?.id
        );

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
            {isExpanded && section.channels && section.channels.length > 0 && (
              <div className="ml-1">
                <ChannelList
                  channels={section.channels.map((ch) => ({
                    id: ch.id,
                    channelName: ch.channelName,
                    isPrivate: false,
                    endTime: 0,
                    groups: [],
                  }))}
                  selectedChannel={selectedChannel}
                  onChannelSelect={onChannelSelect}
                  onInvitePeople={onInvitePeople}
                  onChannelSettings={onChannelSettings}
                />
              </div>
            )}

            {/* Show Selected Channel When Collapsed */}
            {!isExpanded && selectedChannelInSection && (
              <div className="ml-1">
                <ChannelList
                  channels={[
                    {
                      id: selectedChannelInSection.id,
                      channelName: selectedChannelInSection.channelName,
                      isPrivate: false,
                      endTime: 0,
                      groups: [],
                    },
                  ]}
                  selectedChannel={selectedChannel}
                  onChannelSelect={onChannelSelect}
                  onInvitePeople={onInvitePeople}
                  onChannelSettings={onChannelSettings}
                />
              </div>
            )}

            {/* Empty State */}
            {isExpanded &&
              (!section.channels || section.channels.length === 0) && (
                <div className="ml-8 py-2 text-xs text-gray-500 italic">
                  Chưa có kênh nào
                </div>
              )}
          </div>
        );
      })}
    </div>
  );
};

export default SectionList;
