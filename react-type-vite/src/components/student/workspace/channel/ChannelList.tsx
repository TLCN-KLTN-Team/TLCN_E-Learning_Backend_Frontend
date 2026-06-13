import type { BasicChannelResponse, ChannelResponse } from "@/types/chat.types";
import ChannelItem from "./ChannelItem";

interface ChannelListProps {
  channels: BasicChannelResponse[];
  selectedChannel: ChannelResponse | null;
  onChannelSelect?: (channel: BasicChannelResponse) => void;
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
  const handleChannelSelect = (channel: BasicChannelResponse) => {
    onChannelSelect?.(channel);
  };

  return (
    <div className="space-y-2">
      {channels.map((channel: BasicChannelResponse) => (
        <ChannelItem
          key={channel.id}
          channel={channel}
          isSelected={selectedChannel?.id === channel.id}
          onSelect={handleChannelSelect}
          onInvitePeople={onInvitePeople}
          onSettings={onChannelSettings}
        />
      ))}
    </div>
  );
};

export default ChannelList;
