import { useState, useEffect, useCallback } from "react";
import {
  useChatWebSocket,
  type WebSocketError,
} from "@/hooks/useChatWebSocket";
import type {
  ChatMessageRequest,
  ChatMessageResponse,
} from "@/types/chat.types";

interface SafeChatWebSocketReturn {
  isConnected: boolean;
  messages: ChatMessageResponse[];
  errors: WebSocketError[];
  sendMessage: (message: ChatMessageRequest) => void;
  subscribeToChannel: (channelId: string) => (() => void) | undefined;
  subscribeToDirectMessages: () => (() => void) | undefined;
  subscribeToErrors: () => (() => void) | undefined;
  subscribeToMultipleFilesUploads: (
    channelId: string
  ) => (() => void) | undefined;
  connect: () => void;
  disconnect: () => void;
  clearErrors: () => void;
  error: string | null;
  isInitialized: boolean;
  clearError: () => void;
}

// Safe WebSocket Hook với error handling
export const useSafeChatWebSocket = (): SafeChatWebSocketReturn => {
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize WebSocket
  const webSocket = useChatWebSocket();

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Wrapper functions với try-catch
  const safeSendMessage = useCallback(
    (message: ChatMessageRequest) => {
      try {
        if (!webSocket.isConnected) {
          throw new Error("WebSocket not connected");
        }
        webSocket.sendMessage(message);
        setError(null); // Clear previous errors on successful send
      } catch (err) {
        console.error("Error sending message:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
      }
    },
    [webSocket]
  );

  const safeSubscribeToChannel = useCallback(
    (channelId: string) => {
      try {
        return webSocket.subscribeToChannel(channelId);
      } catch (err) {
        console.error("Error subscribing to channel:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return () => {}; // Return empty cleanup function
      }
    },
    [webSocket]
  );

  const safeSubscribeToDirectMessages = useCallback(() => {
    try {
      return webSocket.subscribeToDirectMessages();
    } catch (err) {
      console.error("Error subscribing to direct messages:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return () => {};
    }
  }, [webSocket]);

  const safeSubscribeToErrors = useCallback(() => {
    try {
      return webSocket.subscribeToErrors();
    } catch (err) {
      console.error("Error subscribing to errors:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      return () => {};
    }
  }, [webSocket]);

  const safeSubscribeToMultipleFilesUploads = useCallback(
    (channelId: string) => {
      try {
        return webSocket.subscribeToMultipleFilesUploads(channelId);
      } catch (err) {
        console.error("Error subscribing to file uploads:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        return () => {};
      }
    },
    [webSocket]
  );

  const safeConnect = useCallback(() => {
    try {
      webSocket.connect();
      setError(null);
    } catch (err) {
      console.error("Error connecting:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Connection failed";
      setError(errorMessage);
    }
  }, [webSocket]);

  const safeDisconnect = useCallback(() => {
    try {
      webSocket.disconnect();
    } catch (err) {
      console.error("Error disconnecting:", err);
      // Don't set error for disconnect issues
    }
  }, [webSocket]);

  return {
    isConnected: webSocket.isConnected,
    messages: webSocket.messages,
    errors: webSocket.errors,
    sendMessage: safeSendMessage,
    subscribeToChannel: safeSubscribeToChannel,
    subscribeToDirectMessages: safeSubscribeToDirectMessages,
    subscribeToErrors: safeSubscribeToErrors,
    subscribeToMultipleFilesUploads: safeSubscribeToMultipleFilesUploads,
    connect: safeConnect,
    disconnect: safeDisconnect,
    clearErrors: webSocket.clearErrors,
    error,
    isInitialized,
    clearError: () => setError(null),
  };
};
