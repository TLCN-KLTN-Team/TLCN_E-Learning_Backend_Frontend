import type { ChannelResponse } from "@/types/chat.types";
import {
  Hash,
  Users,
  Bell,
  Pin,
  AtSign,
  Search,
  HelpCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getMembersInChannel } from "@/services/api/workspace/channel.api";

interface ChatHeaderProps {
  selectedChannel: ChannelResponse;
  onToggleParticipants: () => void;
  showParticipants: boolean;
}

const ChatHeader = ({
  selectedChannel,
  onToggleParticipants,
  showParticipants,
}: ChatHeaderProps) => {
  const [memberCount, setMemberCount] = useState<number>(
    selectedChannel.participants?.length || 0
  );

  useEffect(() => {
    const fetchMemberCount = async () => {
      try {
        const members = await getMembersInChannel(selectedChannel.id);
        setMemberCount(members.length);
      } catch (error) {
        console.error("Error fetching member count:", error);
        // Fallback to participants length if API fails
        setMemberCount(selectedChannel.participants?.length || 0);
      }
    };

    fetchMemberCount();
  }, [selectedChannel.id, selectedChannel.participants?.length]);
  return (
    <div className="px-6 py-3 border-b border-gray-600 bg-gray-900 flex items-center">
      <Hash className="w-5 h-5 text-gray-400 mr-2" />
      <h3 className="text-white font-semibold">
        {selectedChannel.channelName}
      </h3>
      <div className="ml-auto flex items-center space-x-4">
        <button
          className={`transition-colors flex items-center gap-2 ${
            showParticipants ? "text-white" : "text-gray-400 hover:text-white"
          }`}
          onClick={onToggleParticipants}
          title={`${showParticipants ? "Ẩn" : "Hiện"} danh sách thành viên`}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">{memberCount}</span>
        </button>
        <button className="text-gray-400 hover:text-white">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-gray-400 hover:text-white">
          <Pin className="w-5 h-5" />
        </button>
        <button className="text-gray-400 hover:text-white">
          <AtSign className="w-5 h-5" />
        </button>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="bg-gray-900 text-white placeholder-gray-400 rounded border px-2 py-1 pl-8 text-sm w-64"
          />
        </div>
        <button className="text-gray-400 hover:text-white">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
