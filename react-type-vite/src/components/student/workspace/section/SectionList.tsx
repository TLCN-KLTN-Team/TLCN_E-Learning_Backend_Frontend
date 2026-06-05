import type {
  SectionResponse,
  ChannelResponse,
  BasicChannelResponse,
} from "@/types/chat.types";
import SectionItem from "./SectionItem";

interface SectionListProps {
  sections: SectionResponse[];
  selectedChannel: ChannelResponse | null;
  onChannelSelect: (channel: BasicChannelResponse) => void;
  onInvitePeople?: (channel: ChannelResponse) => void;
  onChannelSettings?: (channel: ChannelResponse) => void;
  onCreateChannel?: (sectionId: string) => void;
  onManageSession?: (sectionId: string, sectionName: string) => void;
  expandedSections: Set<string>;
  onToggleSection: (sectionId: string) => void;
}

const SectionList = ({
  sections,
  selectedChannel,
  onChannelSelect,
  onInvitePeople,
  onChannelSettings,
  onCreateChannel,
  onManageSession,
  expandedSections,
  onToggleSection,
}: SectionListProps) => {
  return (
    <div className="space-y-1">
      {sections.map((section) => (
        <SectionItem
          key={section.id}
          section={section}
          selectedChannel={selectedChannel}
          onChannelSelect={onChannelSelect}
          onInvitePeople={onInvitePeople}
          onChannelSettings={onChannelSettings}
          onCreateChannel={onCreateChannel}
          onManageSession={onManageSession}
          isExpanded={expandedSections.has(section.id)}
          onToggle={() => onToggleSection(section.id)}
        />
      ))}

      {sections.length === 0 && (
        <div className="ml-2 py-2 text-xs text-gray-500 italic">
          Không có section nào
        </div>
      )}
    </div>
  );
};

export default SectionList;
