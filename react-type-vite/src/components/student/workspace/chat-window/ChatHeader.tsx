import { ChannelType, type ChannelResponse } from "@/types/chat.types";
import { Hash, Users, Bell, Pin, Search, FolderOpen } from "lucide-react";
import ChannelTimer from "../channel/ChannelTimer";

interface ChatHeaderProps {
  selectedChannel: ChannelResponse;
  onToggleParticipants: () => void;
  showParticipants: boolean;
  /** UC-41: toggle panel "Tài liệu của nhóm" — chỉ áp dụng channel GROUP */
  onToggleFiles?: () => void;
  showFilesPanel?: boolean;
}

const ChatHeader = ({
  selectedChannel,
  onToggleParticipants,
  showParticipants,
  onToggleFiles,
  showFilesPanel,
}: ChatHeaderProps) => {
  const isGroup = selectedChannel.type === ChannelType.GROUP;
  const hasDeadline = Boolean(selectedChannel.submissionDeadline);

  return (
    <div className="px-6 py-3 border-b border-gray-600 bg-gray-900 flex items-center">
      {/* UC-41: nút mở panel file ở GÓC TRÊN BÊN TRÁI cho channel GROUP */}
      {isGroup && onToggleFiles && (
        <button
          onClick={onToggleFiles}
          title="Tài liệu của nhóm"
          className={`mr-3 p-1.5 rounded transition-colors ${
            showFilesPanel
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-700"
          }`}
        >
          <FolderOpen className="w-5 h-5" />
        </button>
      )}

      <Hash className="w-5 h-5 text-gray-400 mr-2" />
      <h3 className="text-white font-semibold">{selectedChannel.name}</h3>

      <div className="ml-auto flex items-center space-x-4">
        <button
          className={`transition-colors flex items-center gap-2 ${
            showParticipants ? "text-white" : "text-gray-400 hover:text-white"
          }`}
          onClick={onToggleParticipants}
          title={`${showParticipants ? "Ẩn" : "Hiện"} danh sách thành viên`}
        >
          <Users className="w-5 h-5" />
          <span className="text-sm font-medium">
            {selectedChannel.memberCount}
          </span>
        </button>
        <button className="text-gray-400 hover:text-white">
          <Bell className="w-5 h-5" />
        </button>
        <button className="text-gray-400 hover:text-white">
          <Pin className="w-5 h-5" />
        </button>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="bg-gray-900 text-white placeholder-gray-400 rounded border px-2 py-1 pl-8 text-sm w-64"
          />
        </div>

        {/* UC-41: countdown đa phase cho channel GROUP có deadline */}
        {isGroup && hasDeadline && (
          <div className="min-w-[200px]">
            <ChannelTimer
              channelId={selectedChannel.id}
              channelName={selectedChannel.name}
              submissionDeadline={selectedChannel.submissionDeadline}
              crossReviewDeadline={selectedChannel.crossReviewDeadline}
              allowCrossReview={selectedChannel.allowCrossReview}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;
