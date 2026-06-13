import {
  ChannelType,
  type ChannelResponse,
} from "@/types/chat.types";
import {
  FolderOpen,
  Hash,
  PanelRight,
  Search,
  UserPlus,
} from "lucide-react";
import ChannelTimer from "../channel/ChannelTimer";

interface ChatHeaderProps {
  selectedChannel: ChannelResponse;
  /** Toggle right-side channel info panel (Discord-style). */
  onTogglePanel: () => void;
  showPanel: boolean;
  /** UC-41: toggle panel "Tài liệu của nhóm" — chỉ áp dụng channel GROUP. */
  onToggleFiles?: () => void;
  showFilesPanel?: boolean;
  /** Optional invite handler — wires the "Mời" button in the header. */
  onInvite?: () => void;
}

const ChatHeader = ({
  selectedChannel,
  onTogglePanel,
  showPanel,
  onToggleFiles,
  showFilesPanel,
  onInvite,
}: ChatHeaderProps) => {
  const isGroup = selectedChannel.type === ChannelType.GROUP;
  const hasDeadline = Boolean(selectedChannel.submissionDeadline);

  return (
    <div className="h-12 px-3 border-b border-gray-700 bg-gray-900 flex items-center gap-2 flex-shrink-0">
      {/* UC-41: nút mở panel file của nhóm — chỉ GROUP channel */}
      {isGroup && onToggleFiles && (
        <button
          onClick={onToggleFiles}
          title="Tài liệu của nhóm"
          className={`p-1.5 rounded transition-colors ${
            showFilesPanel
              ? "bg-indigo-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-gray-800"
          }`}
        >
          <FolderOpen className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center gap-1.5 text-gray-100 font-semibold min-w-0">
        <Hash className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <span className="truncate text-[15px]">{selectedChannel.name}</span>
      </div>

      <div className="flex-1" />

      {/* UC-41: multi-phase countdown for GROUP channels with a deadline */}
      {isGroup && hasDeadline && (
        <ChannelTimer
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          submissionDeadline={selectedChannel.submissionDeadline}
          crossReviewDeadline={selectedChannel.crossReviewDeadline}
          allowCrossReview={selectedChannel.allowCrossReview}
        />
      )}

      <button
        type="button"
        onClick={onInvite}
        title="Mời thành viên"
        className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-indigo-500/60 text-indigo-300 hover:bg-indigo-500/10 transition-colors"
      >
        <UserPlus className="w-4 h-4" />
        <span className="text-xs font-medium">Mời</span>
      </button>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm"
          className="bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-500 rounded-md pl-8 pr-2.5 py-1 text-xs w-40 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <button
        type="button"
        onClick={onTogglePanel}
        title={showPanel ? "Ẩn thông tin kênh" : "Mở thông tin kênh"}
        className={`p-1.5 rounded border transition-colors ${
          showPanel
            ? "bg-gray-700 border-indigo-500/60 text-white"
            : "border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
        }`}
      >
        <PanelRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default ChatHeader;
