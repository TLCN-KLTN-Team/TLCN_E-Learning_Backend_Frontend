import { Hash, Edit } from "lucide-react";
import { toast } from "react-toastify";

import { hasRole } from "@/utils/roleUtils";
import MessageItem from "./MessageItem";
import { useEffect, useState, useRef } from "react";
import { getMessagesByChannelId } from "@/services/api/workspace/messageApi";
import type { ChannelResponse, ChatMessageResponse } from "@/types/chat.types";
import { useAuth } from "@/context/auth-context/useAuth";

// Time separator component (like Discord)
const TimeSeparator = ({ date }: { date: Date }) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);

    const isToday = messageDate.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = messageDate.toDateString() === yesterday.toDateString();

    const isSameYear = messageDate.getFullYear() === now.getFullYear();
    const isSameMonth = isSameYear && messageDate.getMonth() === now.getMonth();

    // Nếu cùng ngày -> hiển thị giờ
    if (isToday) {
      return `Hôm nay lúc ${messageDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (isYesterday) {
      return `Hôm qua lúc ${messageDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }
    // Nếu cùng tháng -> hiển thị ngày
    else if (isSameMonth) {
      return messageDate.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    // Nếu cùng năm -> hiển thị ngày tháng
    else if (isSameYear) {
      return messageDate.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
      });
    }
    // Khác năm -> hiển thị đầy đủ
    else {
      return messageDate.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
  };

  return (
    <div className="flex items-center my-4">
      <div className="flex-1 h-px bg-gray-600"></div>
      <span className="px-3 text-xs text-gray-400 font-medium">
        {formatDate(date)}
      </span>
      <div className="flex-1 h-px bg-gray-600"></div>
    </div>
  );
};

interface MessageListProps {
  selectedChannel: ChannelResponse;
  wsMessages: ChatMessageResponse[];
  isLoadingMessages: boolean;
  isConnected: boolean;
  wsErrors: Array<{ message: string }>;
}

const MessageList = ({
  selectedChannel,
  wsMessages,
  isLoadingMessages,
  isConnected,
  wsErrors,
}: MessageListProps) => {
  const [allMessages, setAllMessages] = useState<ChatMessageResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [allMessages]);

  // Function to determine if messages should be grouped
  const shouldGroupMessages = (
    currentMessage: ChatMessageResponse,
    previousMessage: ChatMessageResponse | null,
    timeDifferenceThreshold = 5 * 60 * 1000 // 5 minutes
  ): boolean => {
    if (!previousMessage) return false;

    const isSameSender = currentMessage.sender.id === previousMessage.sender.id;
    const timeDifference =
      new Date(currentMessage.createdDate).getTime() -
      new Date(previousMessage.createdDate).getTime();

    return isSameSender && timeDifference <= timeDifferenceThreshold;
  };

  useEffect(() => {
    if (selectedChannel) {
      setLoading(true);
      const fetchMessages = async () => {
        try {
          const messagesData = await getMessagesByChannelId(selectedChannel.id);
          console.log("Fetched messages:", messagesData);

          // Set 'me' property for messages from API
          const messagesWithMe = messagesData.map((msg) => ({
            ...msg,
            me: user?.id === msg.sender.id,
          }));

          setAllMessages(messagesWithMe);
          setLoading(false);
        } catch (error) {
          console.error("Error fetching messages:", error);
          toast.error("Không thể tải tin nhắn. Vui lòng thử lại sau.");
          setLoading(false);
        }
      };
      fetchMessages();
    }
  }, [selectedChannel, user?.id]);

  // Effect to sync WebSocket messages with allMessages
  useEffect(() => {
    if (!selectedChannel) return;

    console.log(`Selected channel`, selectedChannel);

    // Filter WebSocket messages for current channel
    const currentChannelWsMessages = wsMessages.filter(
      (msg) => msg.channelId === selectedChannel.id
    );

    if (currentChannelWsMessages.length > 0) {
      setAllMessages((prevMessages) => {
        // Create a set of existing message IDs for quick lookup
        const existingIds = new Set(prevMessages.map((msg) => msg.id));

        // Filter out WebSocket messages that are already in the list
        const newMessages = currentChannelWsMessages.filter(
          (wsMsg) => !existingIds.has(wsMsg.id)
        );

        if (newMessages.length === 0) {
          return prevMessages; // No new messages to add
        }

        // Add 'me' property to new WebSocket messages
        const processedNewMessages = newMessages.map((msg) => ({
          ...msg,
          me: user?.id === msg.sender.id,
        }));

        // Combine and sort all messages by timestamp
        const combinedMessages = [...prevMessages, ...processedNewMessages];
        return combinedMessages.sort(
          (a, b) =>
            new Date(a.createdDate).getTime() -
            new Date(b.createdDate).getTime()
        );
      });
    }
  }, [wsMessages, selectedChannel, user?.id]);

  // Function to check if time separator should be shown (1 hour difference)
  const shouldShowTimeSeparator = (
    currentMessage: ChatMessageResponse,
    previousMessage: ChatMessageResponse | null
  ): boolean => {
    if (!previousMessage) return true;

    const currentTime = new Date(currentMessage.createdDate).getTime();
    const previousTime = new Date(previousMessage.createdDate).getTime();
    const timeDifference = currentTime - previousTime;

    // Show separator if difference is >= 1 hour (3600000 milliseconds)
    return timeDifference >= 3600000;
  };

  // Function to render messages with grouping logic and time separators
  const renderMessages = (messages: ChatMessageResponse[]) => {
    const elements: React.ReactElement[] = [];

    messages.forEach((message, index) => {
      const previousMessage = index > 0 ? messages[index - 1] : null;
      const shouldGroup = shouldGroupMessages(message, previousMessage);
      const showTimeSeparator = shouldShowTimeSeparator(
        message,
        previousMessage
      );

      // Add time separator if needed
      if (showTimeSeparator) {
        elements.push(
          <TimeSeparator
            key={`separator-${message.id}`}
            date={new Date(message.createdDate)}
          />
        );
      }

      // Add message
      elements.push(
        <MessageItem
          key={message.id}
          message={message}
          showAvatar={!shouldGroup}
          showTimestamp={!shouldGroup}
        />
      );
    });

    return elements;
  };
  if (isLoadingMessages) {
    return (
      <div className="p-6 pt-16 text-center">
        <div className="text-gray-400">Loading messages...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 pt-16 text-center">
        <div className="text-gray-400">Loading messages...</div>
      </div>
    );
  }

  // Show welcome message only if there are no messages at all
  if (allMessages.length === 0) {
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
          {selectedChannel.description ||
            `This is the start of the #${selectedChannel.channelName} channel.`}
        </p>
        {hasRole("TEACHER") && (
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
        {/* Channel description header - shown even when messages exist */}
        <div className="pb-4 border-gray-700">
          <div className="flex items-center mb-3">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
              <Hash className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to #{selectedChannel.channelName}!
          </h1>
          <p className="text-gray-300 mb-3">
            {selectedChannel.description ||
              `This is the start of the #${selectedChannel.channelName} channel.`}
          </p>
          {hasRole("TEACHER") && (
            <button className="flex items-center text-blue-400 hover:text-blue-300 text-sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit Channel
            </button>
          )}
        </div>

        {/* Display all messages (API + WebSocket combined and sorted) */}
        {renderMessages(allMessages)}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
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
