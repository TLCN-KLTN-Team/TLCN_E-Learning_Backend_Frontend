import { Plus } from "lucide-react";
import { useAuth } from "@/context/auth-context/useAuth";
import type { ChannelResponse } from "@/services/api/channelApi";

interface ChannelListProps {
  channels: ChannelResponse[];
  selectedChannel: ChannelResponse | null;
  onChannelSelect: (channel: ChannelResponse) => void;
}

const ChannelList = ({
  channels,
  selectedChannel,
  onChannelSelect,
}: ChannelListProps) => {
  const { user } = useAuth();

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-2 py-1">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Kênh văn bản
        </h3>
        {user?.role === "teacher" && (
          <button className="text-gray-400 hover:text-white">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      {channels.map((channel: ChannelResponse) => (
        <div
          key={channel.id}
          onClick={() => onChannelSelect(channel)}
          className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
            selectedChannel?.id === channel.id
              ? "bg-gray-600 text-white"
              : "hover:bg-gray-600 text-gray-300 hover:text-white"
          }`}
        >
          <span className="mr-2 text-gray-400">#</span>
          <span className="text-sm">{channel.channelName}</span>
        </div>
      ))}
    </div>
  );
};

export default ChannelList;
