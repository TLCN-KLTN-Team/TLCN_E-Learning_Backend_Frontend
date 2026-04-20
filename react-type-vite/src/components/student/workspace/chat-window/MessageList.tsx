import { Hash, Edit, ArrowDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { hasRole } from "@/utils/roleUtils";
import MessageItem from "./MessageItem";
import { useEffect, useState, useRef, useCallback } from "react";
import type { ChannelResponse, ChatMessageResponse } from "@/types/chat.types";

interface MessageListProps {
  selectedChannel: ChannelResponse;
  messages: ChatMessageResponse[];
  isLoadingMessages: boolean;
  isConnected: boolean;
  wsErrors: Array<{ message: string }>;
  onRetry?: (message: ChatMessageResponse) => void;
}

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
    } else if (isSameMonth) {
      return messageDate.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (isSameYear) {
      return messageDate.toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
      });
    } else {
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

const MessageList = ({
  selectedChannel,
  messages,
  isLoadingMessages,
  isConnected,
  wsErrors,
  onRetry,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prevLengthRef = useRef(messages.length);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasNewMessage(false);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setIsNearBottom(nearBottom);
    if (nearBottom) setHasNewMessage(false);
  }, []);

  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      if (isNearBottom) {
        setTimeout(() => scrollToBottom(), 50);
      } else {
        setHasNewMessage(true);
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length, isNearBottom, scrollToBottom]);

  // Initial scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView();
  }, []);

  // Function to determine if messages should be grouped
  const shouldGroupMessages = (
    currentMessage: ChatMessageResponse,
    previousMessage: ChatMessageResponse | null,
    timeDifferenceThreshold = 5 * 60 * 1000, // 5 minutes
  ): boolean => {
    if (!previousMessage) return false;

    const isSameSender = currentMessage.sender.id === previousMessage.sender.id;
    const timeDifference =
      new Date(currentMessage.createdDate).getTime() -
      new Date(previousMessage.createdDate).getTime();

    return isSameSender && timeDifference <= timeDifferenceThreshold;
  };

  // Function to check if time separator should be shown (1 hour difference)
  const shouldShowTimeSeparator = (
    currentMessage: ChatMessageResponse,
    previousMessage: ChatMessageResponse | null,
  ): boolean => {
    if (!previousMessage) return true;

    const currentTime = new Date(currentMessage.createdDate).getTime();
    const previousTime = new Date(previousMessage.createdDate).getTime();
    const timeDifference = currentTime - previousTime;

    return timeDifference >= 3600000;
  };

  // Function to render messages with grouping logic and time separators
  const renderMessages = (msgs: ChatMessageResponse[]) => {
    const elements: React.ReactElement[] = [];

    msgs.forEach((message, index) => {
      const previousMessage = index > 0 ? msgs[index - 1] : null;
      const shouldGroup = shouldGroupMessages(message, previousMessage);
      const showTimeSeparator = shouldShowTimeSeparator(
        message,
        previousMessage,
      );

      if (showTimeSeparator) {
        elements.push(
          <TimeSeparator
            key={`separator-${message.id || message.clientMessageId}`}
            date={new Date(message.createdDate)}
          />,
        );
      }

      elements.push(
        <MessageItem
          key={message.id || message.clientMessageId}
          message={message}
          showAvatar={!shouldGroup}
          showTimestamp={!shouldGroup}
          onRetry={onRetry}
        />,
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

  // Show welcome message only if there are no messages at all
  if (messages.length === 0) {
    return (
      <div className="p-6 pt-16">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
            <Hash className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to #{selectedChannel.name}!
        </h1>
        <p className="text-gray-300 mb-4">
          {selectedChannel.description ||
            `This is the start of the #${selectedChannel.name} channel.`}
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
    <div className="relative flex-1 min-h-0">
      <div
        ref={containerRef}
        className="h-full overflow-y-auto custom-scrollbar px-4 py-4 space-y-1"
        onScroll={handleScroll}
      >
        {/* Channel description header */}
        <div className="pb-4 border-gray-700">
          <div className="flex items-center mb-3">
            <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
              <Hash className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to #{selectedChannel.name}!
          </h1>
          <p className="text-gray-300 mb-3">
            {selectedChannel.description ||
              `This is the start of the #${selectedChannel.name} channel.`}
          </p>
          {hasRole("TEACHER") && (
            <button className="flex items-center text-blue-400 hover:text-blue-300 text-sm">
              <Edit className="w-4 h-4 mr-1" />
              Edit Channel
            </button>
          )}
        </div>

        {/* Display all messages */}
        {renderMessages(messages)}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      <AnimatePresence>
        {hasNewMessage && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:brightness-110 transition-all"
          >
            <ArrowDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>

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
    </div>
  );
};

export default MessageList;
