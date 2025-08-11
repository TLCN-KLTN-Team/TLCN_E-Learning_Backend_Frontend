import React, { useEffect, useState } from "react";
import { useChatService } from "@/hooks/useChatService";
import type { ChannelResponse } from "@/services/api/workspaceApi";

interface ChatIntegrationProps {
  selectedChannel: ChannelResponse | null;
  onMessageSent?: () => void;
}

const ChatIntegration: React.FC<ChatIntegrationProps> = ({ 
  selectedChannel, 
  onMessageSent 
}) => {
  const chat = useChatService();
  const [newMessage, setNewMessage] = useState("");

  // Subscribe to current channel when it changes
  useEffect(() => {
    if (selectedChannel && chat.isConnected) {
      const unsubscribeChannel = chat.subscribeToChannel(selectedChannel.id);
      const unsubscribeDirectMessages = chat.subscribeToDirectMessages();
      const unsubscribeErrors = chat.subscribeToErrors();

      return () => {
        unsubscribeChannel?.();
        unsubscribeDirectMessages?.();
        unsubscribeErrors?.();
      };
    }
  }, [selectedChannel, chat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    try {
      await chat.sendMessage({
        channelId: selectedChannel.id,
        content: newMessage.trim()
      });
      
      setNewMessage("");
      onMessageSent?.();
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Connection Status */}
      <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b">
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${chat.isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {chat.isConnected ? '🟢 Real-time chat active' : '🔴 Connecting...'}
          </span>
          {chat.hasErrors && (
            <button
              onClick={() => {
                chat.clearWsErrors();
                chat.clearApiErrors();
              }}
              className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
            >
              Clear Errors ({chat.allErrors.length})
            </button>
          )}
        </div>
      </div>

      {/* Messages Display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Existing channel messages */}
        {selectedChannel?.messages?.map((message) => (
          <div key={message.id} className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
              {message.sender.firstName?.[0] || message.sender.username?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-baseline space-x-2">
                <span className="font-medium text-sm">
                  {message.sender.firstName && message.sender.lastName
                    ? `${message.sender.firstName} ${message.sender.lastName}`
                    : message.sender.username || 'Unknown User'
                  }
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(message.createdDate).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {message.message}
              </p>
            </div>
          </div>
        ))}

        {/* Real-time WebSocket messages */}
        {chat.messages
          .filter(msg => msg.channelId === selectedChannel?.id)
          .map((message) => (
            <div key={`ws-${message.id}`} className="flex items-start space-x-3 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-medium">
                {message.senderName[0] || 'U'}
              </div>
              <div className="flex-1">
                <div className="flex items-baseline space-x-2">
                  <span className="font-medium text-sm">
                    {message.senderName}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                    Live
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  {message.content}
                </p>
              </div>
            </div>
          ))
        }
      </div>

      {/* Error Display */}
      {chat.hasErrors && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200">
          <div className="text-xs text-red-600 space-y-1">
            {chat.allErrors.slice(0, 3).map((error, index) => (
              <div key={index}>{error}</div>
            ))}
            {chat.allErrors.length > 3 && (
              <div>... and {chat.allErrors.length - 3} more errors</div>
            )}
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 bg-gray-900 border-t">
        <div className="relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={selectedChannel ? `Message #${selectedChannel.channelName}` : "Select a channel to start chatting"}
            disabled={!selectedChannel || chat.isLoading || !chat.isConnected}
            className="w-full px-4 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !selectedChannel || chat.isLoading || !chat.isConnected}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {chat.isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
        
        {/* Connection status in input area */}
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span>
            {chat.isConnected ? 'Connected to real-time chat' : 'Connecting to chat server...'}
          </span>
          {chat.messages.length > 0 && (
            <span>{chat.messages.length} real-time messages received</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatIntegration;
