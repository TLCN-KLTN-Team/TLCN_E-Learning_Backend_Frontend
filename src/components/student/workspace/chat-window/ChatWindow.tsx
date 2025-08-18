import { useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import ParticipantsList from "./ParticipantsList";
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
