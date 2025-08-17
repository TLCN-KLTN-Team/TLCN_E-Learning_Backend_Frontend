import { Hash, Edit } from "lucide-react";
import type {
  ChatMessageResponse,
  ChannelResponse,
} from "@/services/api/workspaceApi";
import { getRoles } from "@/utils/localStorageVariables";
import MessageItem from "./MessageItem";
import SessionDivider from "./SessionDivider";

interface MessageListProps {
  selectedChannel: ChannelResponse;
  channelMessages: ChatMessageResponse[];
  wsMessages: ChatMessageResponse[];
  isLoadingMessages: boolean;
  isConnected: boolean;
  wsErrors: Array<{ message: string }>;
}

const MessageList = ({
  selectedChannel,
  channelMessages,
  wsMessages,
  isLoadingMessages,
  isConnected,
  wsErrors,
}: MessageListProps) => {
  // Function to determine if messages should be grouped
  const shouldGroupMessages = (
    currentMessage: ChatMessageResponse,
    previousMessage: ChatMessageResponse | null,
    timeDifferenceThreshold = 5 * 60 * 1000 // 5 minutes
  ): boolean => {
    if (!previousMessage) return false;

    const isSameSender =
      currentMessage.sender.userId === previousMessage.sender.userId;
    const timeDifference =
      new Date(currentMessage.createdDate).getTime() -
      new Date(previousMessage.createdDate).getTime();

    return isSameSender && timeDifference <= timeDifferenceThreshold;
  };

  // Function to render messages with grouping logic
  const renderMessages = (
    messages: ChatMessageResponse[],
    isWebSocket = false
  ) => {
    return messages.map((message, index) => {
      const previousMessage = index > 0 ? messages[index - 1] : null;
      const shouldGroup = shouldGroupMessages(message, previousMessage);

      return (
        <MessageItem
          key={isWebSocket ? `ws-${message.id}` : message.id}
          message={message}
          isWebSocketMessage={isWebSocket}
          showAvatar={!shouldGroup}
          showTimestamp={!shouldGroup}
        />
      );
    });
  };
  if (isLoadingMessages) {
    return (
      <div className="p-6 pt-16 text-center">
        <div className="text-gray-400">Loading messages...</div>
      </div>
    );
  }

  if (channelMessages.length === 0) {
    return (
      <div className="p-6 pt-16">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
            <Hash className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to #{selectedChannel.channelName}!
        </h1>
        <p className="text-gray-300 mb-4">
          This is the start of the #{selectedChannel.channelName} channel.
        </p>
        {getRoles().includes("TEACHER") && (
          <button className="flex items-center text-blue-400 hover:text-blue-300 text-sm">
            <Edit className="w-4 h-4 mr-1" />
            Edit Channel
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="p-4 space-y-4">
        {/* Display existing messages from API */}
        {renderMessages(channelMessages, false)}

        {/* Show session divider if there are WebSocket messages */}
        {wsMessages.filter((msg) => msg.channelId === selectedChannel.id)
          .length > 0 && <SessionDivider timestamp={new Date()} />}

        {/* Display real-time WebSocket messages */}
        {renderMessages(
          wsMessages.filter((msg) => msg.channelId === selectedChannel.id),
          true
        )}
      </div>

      {/* WebSocket connection status */}
      {!isConnected && (
        <div className="px-4 py-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 text-sm">
          ⚠️ Real-time chat disconnected. Messages will still be sent.
        </div>
      )}

      {/* Error display */}
      {wsErrors.length > 0 && (
        <div className="px-4 py-2 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
          ❌ {wsErrors[0].message}
          {wsErrors.length > 1 && ` (+${wsErrors.length - 1} more)`}
        </div>
      )}
    </>
  );
};

export default MessageList;
