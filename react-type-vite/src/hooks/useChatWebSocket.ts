import { getAccessToken } from "@/utils/localStorageVariables";
import { Client, type IMessage } from "@stomp/stompjs";
import { useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { useAuth } from "@/context/auth-context/useAuth";
import type {
  ChatMessageRequest,
  ChatMessageResponse,
} from "@/types/chat.types";
import { toast } from "react-toastify";

// Types for WebSocket communication
export interface WebSocketError {
  message: string;
  timestamp: string;
}

// Hook for WebSocket chat functionality
export const useChatWebSocket = () => {
  const [client, setClient] = useState<Client | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [errors, setErrors] = useState<WebSocketError[]>([]);
  const { user } = useAuth();
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const isConnectingRef = useRef(false);

  // Initialize WebSocket connection with reconnection logic
  const connect = useCallback(() => {
    // Prevent multiple concurrent connections
    if (isConnectingRef.current || clientRef.current?.connected) {
      console.log("Already connected or connecting to WebSocket");
      return;
    }

    const token = getAccessToken();
    if (!token) {
      console.error("No access token available");
      return;
    }

    isConnectingRef.current = true;

    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Correct WebSocket URL for Spring Boot STOMP
    const sock = new SockJS(`${import.meta.env.VITE_BASE_URL}/server/ws`);

    const stompClient = new Client({
      webSocketFactory: () => sock,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        console.log("STOMP Debug:", str);
      },
      onConnect: () => {
        console.log("✅ Connected to WebSocket successfully");
        setIsConnected(true);
        isConnectingRef.current = false;
      },
      onDisconnect: () => {
        console.log("❌ Disconnected from WebSocket");
        setIsConnected(false);
        isConnectingRef.current = false;

        // Auto reconnect after 3 seconds if not manually disconnected
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log("🔄 Attempting to reconnect...");
          connect();
        }, 3000);
      },
      onStompError: (frame) => {
        console.error("❌ STOMP error:", frame);
        isConnectingRef.current = false;
        setIsConnected(false);
        setErrors((prev) => [
          ...prev,
          {
            message: `Connection error: ${
              frame.headers["message"] || "Unknown error"
            }`,
            timestamp: new Date().toISOString(),
          },
        ]);
      },
      onWebSocketError: (error) => {
        console.error("❌ WebSocket error:", error);
        isConnectingRef.current = false;
        setErrors((prev) => [
          ...prev,
          {
            message: `WebSocket error: ${error.message || "Connection failed"}`,
            timestamp: new Date().toISOString(),
          },
        ]);
      },
    });

    stompClient.activate();
    clientRef.current = stompClient;
    setClient(stompClient);
  }, []);

  // Subscribe to channel messages - STABLE callback
  const subscribeToChannel = useCallback(
    (channelId: string) => {
      if (!clientRef.current?.connected) {
        console.error("WebSocket not connected");
        return () => {}; // Return stable function
      }

      console.log(`📡 Subscribing to channel: ${channelId}`);
      const subscription = clientRef.current.subscribe(
        `/topic/channel/${channelId}`,
        (message: IMessage) => {
          try {
            const raw = JSON.parse(message.body);

            // Server wraps messages in MessageEvent: { type, message?, update? }
            let chatMessage: ChatMessageResponse | null = null;

            if (raw.type && raw.message) {
              // Wrapped event — extract the message payload
              if (raw.type === "NEW_MESSAGE") {
                chatMessage = raw.message as ChatMessageResponse;
              }
              // MESSAGE_UPDATED is handled by useChatMessages, skip here
            } else if (raw.sender) {
              // Legacy fallback: bare ChatMessageResponse
              chatMessage = raw as ChatMessageResponse;
            }

            if (!chatMessage) return;

            // Set 'me' property based on current user
            chatMessage.me = !!user?.id && user.id === chatMessage.sender?.id;

            // Filter messages by channelId if needed
            if (chatMessage.channelId === channelId) {
              setMessages((prev) => {
                // Avoid duplicate messages
                const exists = prev.some((msg) => msg.id === chatMessage!.id);
                if (exists) return prev;
                return [...prev, chatMessage!];
              });
            }
          } catch (error) {
            console.error("Error parsing channel message:", error);
          }
        },
      );

      return () => {
        console.log(`📡 Unsubscribing from channel: ${channelId}`);
        subscription.unsubscribe();
      };
    },
    [user?.id],
  ); // Add user.id dependency for 'me' property

  // Subscribe to direct messages - STABLE callback
  const subscribeToDirectMessages = useCallback(() => {
    if (!clientRef.current?.connected || !user?.username) {
      return () => {}; // Return stable function
    }

    console.log(`📬 Subscribing to direct messages for user: ${user.username}`);
    const subscription = clientRef.current.subscribe(
      `/user/queue/messages`,
      (message: IMessage) => {
        try {
          const chatMessage: ChatMessageResponse = JSON.parse(message.body);

          // Set 'me' property based on current user
          chatMessage.me = !!user?.id && user.id === chatMessage.sender?.id;

          setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === chatMessage.id);
            if (exists) return prev;
            return [...prev, chatMessage];
          });
        } catch (error) {
          toast.error("Failed to parse direct message");
          console.error("Error parsing direct message:", error);
        }
      },
    );

    return () => {
      console.log(`📬 Unsubscribing from direct messages`);
      subscription.unsubscribe();
    };
  }, [user?.id, user?.username]); // Keep user dependencies

  // Subscribe to error messages - STABLE callback
  const subscribeToErrors = useCallback(() => {
    if (!clientRef.current?.connected || !user?.username) {
      console.error("WebSocket not connected or user not available");
      return () => {}; // Return stable function
    }

    console.log(`🚨 Subscribing to error messages`);
    const subscription = clientRef.current.subscribe(
      `/user/queue/errors`,
      (message: IMessage) => {
        try {
          const errorMessage = message.body;
          console.error("Received error message:", errorMessage);

          setErrors((prev) => [
            ...prev,
            {
              message: errorMessage,
              timestamp: new Date().toISOString(),
            },
          ]);
        } catch (error) {
          console.error("Error parsing error message:", error);
        }
      },
    );

    return () => {
      console.log(`🚨 Unsubscribing from error messages`);
      subscription.unsubscribe();
    };
  }, [user?.username]); // Keep user dependency but avoid other unstable deps

  // Backward compatibility: file updates are now broadcast on /topic/channel/{channelId}
  const subscribeToMultipleFilesUploads = useCallback(
    (channelId: string) => {
      console.warn(
        "subscribeToMultipleFilesUploads is deprecated; using subscribeToChannel instead",
      );
      return subscribeToChannel(channelId);
    },
    [subscribeToChannel],
  );

  // Send message to channel
  const sendMessage = useCallback(
    (messageRequest: ChatMessageRequest) => {
      if (!clientRef.current?.connected) {
        console.error("WebSocket not connected");
        setErrors((prev) => [
          ...prev,
          {
            message: "Cannot send message: WebSocket not connected",
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      try {
        console.log("Sending message:", messageRequest);

        // Send message with correct format for Spring Boot STOMP
        const messagePayload = {
          channelId: messageRequest.channelId,
          content: messageRequest.content,
          clientMessageId: messageRequest.clientMessageId,
          textOnly: messageRequest.textOnly,
        };

        clientRef.current.publish({
          destination: "/app/chat.sendMessage",
          body: JSON.stringify(messagePayload),
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${
              localStorage.getItem("accessToken") || ""
            }`,
          },
        });
      } catch (error) {
        console.error("Error sending message:", error);
        setErrors((prev) => [
          ...prev,
          {
            message: `Failed to send message: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    },
    [], // No dependencies needed for sendMessage
  );

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    // Clear any pending reconnection
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    isConnectingRef.current = false;

    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
      setClient(null);
      setIsConnected(false);
    }
  }, []);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return {
    client,
    isConnected,
    messages,
    errors,
    connect,
    disconnect,
    subscribeToChannel,
    subscribeToDirectMessages,
    subscribeToErrors,
    subscribeToMultipleFilesUploads,
    sendMessage,
    clearMessages,
    clearErrors,
  };
};
