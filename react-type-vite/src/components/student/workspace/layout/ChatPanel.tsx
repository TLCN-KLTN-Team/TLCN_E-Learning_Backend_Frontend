import { useState } from "react";
import ChatHeader from "../chat-window/ChatHeader";
import MessageList from "../chat-window/MessageList";
import MessageInput from "../chat-window/MessageInput";
import ChannelInfoPanel from "../chat-window/ChannelInfoPanel";
import ChannelWorkspace from "../channel/ChannelWorkspace";
import ChannelFilesPanel from "../channel/ChannelFilesPanel";
import TimeBasedChannelView from "../channel/TimeBasedChannelView";
import {
  ChannelType,
  type ChannelResponse,
  type ChatMessageResponse,
  type UserResponse,
} from "@/types/chat.types";
import type { FileItem } from "@/types/file.types";

interface ChatPanelProps {
  selectedChannel: ChannelResponse | null;
  participants: UserResponse[];
  isLoadingMessages: boolean;
  isConnected: boolean;
  messages: ChatMessageResponse[];
  wsErrors: Array<{ message: string }>;
  onSendMessage: (content: string, files: FileItem[]) => void;
  onClearErrors: () => void;
  onRetry?: (message: ChatMessageResponse) => void;
}

const ChatPanel = ({
  selectedChannel,
  participants,
  isLoadingMessages,
  isConnected,
  messages,
  wsErrors,
  onSendMessage,
  onClearErrors,
  onRetry,
}: ChatPanelProps) => {
  // Default open per wireframe (Discord-style channel info panel pinned right).
  const [showInfoPanel, setShowInfoPanel] = useState(true);
  const [showFilesPanel, setShowFilesPanel] = useState(false);

  const toggleInfoPanel = () => setShowInfoPanel((v) => !v);
  const toggleFilesPanel = () => setShowFilesPanel((v) => !v);

  const isExerciseChannel = () => {
    return selectedChannel?.endTime && selectedChannel.endTime > 0;
  };

  const isTimeBasedChannel = () => {
    if (!selectedChannel?.endTime || selectedChannel.endTime <= 0) {
      return false;
    }
  };

  const handleChannelExpired = () => {
    console.log("Channel expired, redirecting to channel list...");
  };

  if (!selectedChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-700">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Chọn một kênh để bắt đầu
          </h3>
          <p className="text-gray-400">
            Chọn một workspace và kênh từ sidebar để xem tin nhắn
          </p>
        </div>
      </div>
    );
  }

  if (isTimeBasedChannel()) {
    return (
      <TimeBasedChannelView
        channel={selectedChannel}
        participants={participants}
        wsMessages={messages}
        isConnected={isConnected}
        onSendMessage={(content: string) => onSendMessage(content, [])}
      />
    );
  }

  if (isExerciseChannel()) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <ChannelWorkspace
          channelId={selectedChannel.id}
          channelName={selectedChannel.name}
          endTime={new Date(selectedChannel.endTime!)}
          onChannelExpired={handleChannelExpired}
        />
      </div>
    );
  }

  const isGroupChannel = selectedChannel.type === ChannelType.GROUP;

  return (
    <div className="flex-1 flex bg-gray-900 border-l border-gray-700 min-h-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        <ChatHeader
          selectedChannel={selectedChannel}
          onTogglePanel={toggleInfoPanel}
          showPanel={showInfoPanel}
          onToggleFiles={isGroupChannel ? toggleFilesPanel : undefined}
          showFilesPanel={showFilesPanel}
        />

        {/* UC-41: panel "Tài liệu của nhóm" — slide-in từ trái, chỉ cho GROUP */}
        {isGroupChannel && showFilesPanel && (
          <ChannelFilesPanel
            isOpen={showFilesPanel}
            onClose={() => setShowFilesPanel(false)}
            channel={selectedChannel}
          />
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-800 min-h-0">
          <MessageList
            selectedChannel={selectedChannel}
            messages={messages}
            isLoadingMessages={isLoadingMessages}
            isConnected={isConnected}
            wsErrors={wsErrors}
            onRetry={onRetry}
          />
        </div>

        <MessageInput
          selectedChannel={selectedChannel}
          isConnected={isConnected}
          wsMessages={messages}
          wsErrors={wsErrors}
          onSendMessage={onSendMessage}
          onClearErrors={onClearErrors}
        />
      </div>

      {/* Right info panel (Discord-style) */}
      {showInfoPanel && (
        <ChannelInfoPanel
          channel={selectedChannel}
          onClose={() => setShowInfoPanel(false)}
        />
      )}
    </div>
  );
};

export default ChatPanel;
