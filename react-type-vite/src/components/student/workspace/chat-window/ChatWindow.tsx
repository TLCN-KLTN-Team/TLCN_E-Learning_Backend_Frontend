import { useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ParticipantsList from "./ParticipantsList";
import ChannelWorkspace from "../channel/ChannelWorkspace";
import TimeBasedChannelView from "../channel/TimeBasedChannelView";
import { ChannelType } from "@/types/chat.types";
import type {
  ChannelResponse,
  ChatMessageResponse,
  Participant,
} from "@/types/chat.types";

interface ChatWindowProps {
  selectedChannel: ChannelResponse | null;
  participants: Participant[];
  isLoadingMessages: boolean;
  isConnected: boolean;
  wsMessages: ChatMessageResponse[];
  wsErrors: Array<{ message: string }>;
  onSendMessage: (content: string) => void;
  onClearErrors: () => void;
}

const ChatWindow = ({
  selectedChannel,
  participants,
  isLoadingMessages,
  isConnected,
  wsMessages,
  wsErrors,
  onSendMessage,
  onClearErrors,
}: ChatWindowProps) => {
  const [showParticipants, setShowParticipants] = useState(false);

  const toggleParticipants = () => {
    setShowParticipants(!showParticipants);
  };

  // Check if this is a timed exercise channel
  const isExerciseChannel = () => {
    return selectedChannel?.endTime && selectedChannel.endTime > 0;
  };

  // Check if this is a time-based channel (TEXT, GROUP, etc. with endTime)
  const isTimeBasedChannel = () => {
    if (!selectedChannel?.endTime || selectedChannel.endTime <= 0) {
      return false;
    }

    // Check if it's one of the time-based channel types
    const timeBasedTypes = [
      ChannelType.TEXT,
      ChannelType.GROUP,
      ChannelType.ANNOUNCEMENT,
      ChannelType.POST,
    ];

    return timeBasedTypes.includes(
      selectedChannel.channelType || ChannelType.TEXT
    );
  };

  // Handle channel expiration
  const handleChannelExpired = () => {
    console.log("Channel expired, redirecting to channel list...");
    // Could add navigation logic here or emit event to parent
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

  // If this is a time-based channel with endTime, show the time-based view
  if (isTimeBasedChannel()) {
    return (
      <TimeBasedChannelView
        channel={selectedChannel}
        participants={participants}
        wsMessages={wsMessages}
        isConnected={isConnected}
        onSendMessage={onSendMessage}
      />
    );
  }

  // If this is an exercise channel (legacy), show the workspace interface
  if (isExerciseChannel()) {
    return (
      <div className="flex-1 flex flex-col bg-gray-100">
        <ChannelWorkspace
          channelId={selectedChannel.id}
          channelName={selectedChannel.channelName}
          endTime={new Date(selectedChannel.endTime).toISOString()}
          onChannelExpired={handleChannelExpired}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-gray-900 border-l border-gray-700">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <ChatHeader
          selectedChannel={selectedChannel}
          onToggleParticipants={toggleParticipants}
          showParticipants={showParticipants}
        />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto bg-gray-800">
          <MessageList
            selectedChannel={selectedChannel}
            wsMessages={wsMessages}
            isLoadingMessages={isLoadingMessages}
            isConnected={isConnected}
            wsErrors={wsErrors}
          />
        </div>

        {/* Message Input */}
        <MessageInput
          selectedChannel={selectedChannel}
          isConnected={isConnected}
          wsMessages={wsMessages}
          wsErrors={wsErrors}
          onSendMessage={onSendMessage}
          onClearErrors={onClearErrors}
        />
      </div>

      {/* Participants Sidebar */}
      <ParticipantsList
        participants={participants}
        isVisible={showParticipants}
        onClose={() => setShowParticipants(false)}
      />
    </div>
  );
};

export default ChatWindow;
