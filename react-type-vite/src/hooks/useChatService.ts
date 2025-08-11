import {
  useChatWebSocket,
  type ChatMessageRequest as WSChatMessageRequest,
} from "@/hooks/useChatWebSocket";
import {
  sendMessage as sendMessageAPI,
  type ChatMessageRequest as APIChatMessageRequest,
} from "@/services/api/workspaceApi";
import { useCallback, useEffect, useState } from "react";

// Unified interface for sending messages
export interface ChatMessagePayload {
  channelId: string;
  content: string;
  recipientId?: string;
}

// Hook that combines HTTP API and WebSocket for complete chat functionality
export const useChatService = () => {
  const webSocket = useChatWebSocket();
  const [isLoading, setIsLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  // Initialize WebSocket connection when hook is used
  useEffect(() => {
    webSocket.connect();

    return () => {
      webSocket.disconnect();
    };
  }, [webSocket]);

  // Send message via both API (for persistence) and WebSocket (for real-time)
  const sendMessage = useCallback(
    async (payload: ChatMessagePayload) => {
      setIsLoading(true);
      setApiErrors([]);

      try {
        // First, send via HTTP API for persistence
        const apiRequest: APIChatMessageRequest = {
          channelId: payload.channelId,
          message: payload.content,
        };

        const response = await sendMessageAPI(apiRequest);
        console.log("Message saved via API:", response);

        // Then, send via WebSocket for real-time delivery
        const wsRequest: WSChatMessageRequest = {
          channelId: payload.channelId,
          content: payload.content,
          recipientId: payload.recipientId,
        };

        webSocket.sendMessage(wsRequest);

        return response;
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to send message";
        setApiErrors((prev) => [...prev, errorMessage]);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [webSocket]
  );

  // Subscribe to specific channel
  const subscribeToChannel = useCallback(
    (channelId: string) => {
      return webSocket.subscribeToChannel(channelId);
    },
    [webSocket]
  );

  // Subscribe to direct messages
  const subscribeToDirectMessages = useCallback(() => {
    return webSocket.subscribeToDirectMessages();
  }, [webSocket]);

  // Clear API errors
  const clearApiErrors = useCallback(() => {
    setApiErrors([]);
  }, []);

  return {
    // WebSocket functionality
    isConnected: webSocket.isConnected,
    messages: webSocket.messages,
    wsErrors: webSocket.errors,
    connect: webSocket.connect,
    disconnect: webSocket.disconnect,
    subscribeToChannel,
    subscribeToDirectMessages,
    subscribeToErrors: webSocket.subscribeToErrors,
    clearMessages: webSocket.clearMessages,
    clearWsErrors: webSocket.clearErrors,

    // Enhanced functionality
    sendMessage,
    isLoading,
    apiErrors,
    clearApiErrors,

    // Combined error handling
    allErrors: [...webSocket.errors.map((e) => e.message), ...apiErrors],
    hasErrors: webSocket.errors.length > 0 || apiErrors.length > 0,
  };
};
