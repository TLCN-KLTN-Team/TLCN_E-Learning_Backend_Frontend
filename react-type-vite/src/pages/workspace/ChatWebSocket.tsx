import { useEffect, useState } from "react";
import { useChatWebSocket } from "@/hooks/useChatWebSocket";

const ChatWebSocket = () => {
  const {
    isConnected,
    messages,
    errors,
    connect,
    disconnect,
    subscribeToChannel,
    subscribeToDirectMessages,
    subscribeToErrors,
    sendMessage,
    clearMessages,
    clearErrors,
  } = useChatWebSocket();

  const [testChannelId, setTestChannelId] = useState("test-channel-1");
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  useEffect(() => {
    if (isConnected) {
      // Subscribe to test channel and direct messages
      const unsubscribeChannel = subscribeToChannel(testChannelId);
      const unsubscribeDirectMessages = subscribeToDirectMessages();
      const unsubscribeErrors = subscribeToErrors();

      return () => {
        unsubscribeChannel?.();
        unsubscribeDirectMessages?.();
        unsubscribeErrors?.();
      };
    }
  }, [
    isConnected,
    testChannelId,
    subscribeToChannel,
    subscribeToDirectMessages,
    subscribeToErrors,
  ]);

  const handleSendTestMessage = () => {
    if (!testMessage.trim()) return;

    sendMessage({
      channelId: testChannelId,
      content: testMessage.trim(),
    });

    setTestMessage("");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Chat WebSocket</h1>

      {/* Connection Status */}
      <div className="mb-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
        <p
          className={`font-medium ${
            isConnected ? "text-green-600" : "text-red-600"
          }`}
        >
          Status: {isConnected ? "Connected" : "Disconnected"}
        </p>
      </div>

      {/* Test Message Input */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-medium mb-3">Send Test Message</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Channel ID"
            value={testChannelId}
            onChange={(e) => setTestChannelId(e.target.value)}
            className="px-3 py-2 border rounded flex-1"
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSendTestMessage()}
            className="px-3 py-2 border rounded flex-1"
          />
          <button
            onClick={handleSendTestMessage}
            disabled={!isConnected || !testMessage.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Messages ({messages.length})</h3>
          <button
            onClick={clearMessages}
            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
          {messages.length === 0 ? (
            <p className="text-gray-500">No messages yet...</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="p-3 bg-gray-50 dark:bg-gray-700 rounded"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium">{message.senderName}</span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{message.content}</p>
                <div className="text-xs text-gray-400 mt-1">
                  Channel: {message.channelId} | Type: {message.messageType}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-red-600">
              Errors ({errors.length})
            </h3>
            <button
              onClick={clearErrors}
              className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {errors.map((error, index) => (
              <div
                key={index}
                className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded"
              >
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error.message}
                </p>
                <span className="text-xs text-red-500">
                  {new Date(error.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={connect}
          disabled={isConnected}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        >
          Connect
        </button>
        <button
          onClick={disconnect}
          disabled={!isConnected}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
        >
          Disconnect
        </button>
      </div>
    </div>
  );
};

export default ChatWebSocket;
