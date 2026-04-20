import { useEffect, useCallback } from "react";
import { toast } from "react-toastify";

import { useSafeChatWebSocket } from "@/hooks/useSafeChatWebSocket";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import ChatErrorBoundary from "@/components/student/workspace/ChatErrorBoundary";

// Import layout components
import {
  WorkspaceSidebar,
  SectionChannelPanel,
  ChatPanel,
} from "@/components/student/workspace/layout";
import type { ChatMessageResponse } from "@/types/chat.types";
import type { FileItem } from "@/types/file.types";

const WorkspacePageContent = () => {
  // Use custom hooks for workspace management and WebSocket
  const {
    selectedWorkspace,
    selectedChannel,
    participants,
    isLoadingMessages,
    handleWorkspaceSelect,
    handleChannelSelect,
    loadMoreWorkspaces,
    getVisibleWorkspaces,
    hasMoreWorkspaces,
  } = useWorkspace();

  // Initialize WebSocket chat with safety wrapper
  const {
    isConnected,
    errors: wsErrors,
    connect,
    disconnect,
    subscribeToDirectMessages,
    subscribeToErrors,
    clearErrors,
    clearError,
    client: stompClient,
  } = useSafeChatWebSocket();

  // ─── useChatMessages: manages message list + real-time events ───
  const {
    messages,
    loading: messagesLoading,
    addOptimisticMessage,
    markMessageFailed,
    removeOptimisticMessage,
    applyMessageUpdate,
    upsertServerMessage,
  } = useChatMessages({
    channelId: selectedChannel?.id,
    stompClient: stompClient as any,
    isConnected,
  });

  // ─── useSendMessage: handles send flow with optimistic UI ───
  const { send } = useSendMessage({
    channelId: selectedChannel?.id,
    stompClient: stompClient as any,
    isConnected,
    addOptimisticMessage,
    markMessageFailed,
    applyMessageUpdate,
    upsertServerMessage,
  });

  // Subscribe to direct messages + errors when connected
  useEffect(() => {
    if (!isConnected) return;

    const unsubDM = subscribeToDirectMessages();
    const unsubErr = subscribeToErrors();

    return () => {
      unsubDM?.();
      unsubErr?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Initialize WebSocket connection only once
  useEffect(() => {
    let mounted = true;

    const initConnection = () => {
      if (mounted) {
        connect();
      }
    };

    const connectionTimer = setTimeout(initConnection, 100);

    return () => {
      mounted = false;
      clearTimeout(connectionTimer);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = useCallback(
    (content: string, files: FileItem[] = []) => {
      if (!selectedChannel) {
        toast.warning("Vui lòng chọn kênh trước khi gửi tin nhắn.");
        return;
      }

      if (!isConnected) {
        toast.error("Kết nối real-time bị mất. Vui lòng thử lại sau.");
        return;
      }

      try {
        send(content, files);
        clearError();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Lỗi không xác định";
        toast.error(`Không thể gửi tin nhắn: ${errorMessage}`);
      }
    },
    [selectedChannel, isConnected, send, clearError],
  );

  // Retry a failed message
  const handleRetry = useCallback(
    (message: ChatMessageResponse) => {
      if (!message.clientMessageId) return;

      // Remove the failed message
      removeOptimisticMessage(message.clientMessageId);

      // Re-send as text-only (original files are lost on retry)
      handleSendMessage(message.content, []);
    },
    [removeOptimisticMessage, handleSendMessage],
  );

  return (
    <div className="h-screen flex bg-gray-800">
      {/* Left Panel - Workspaces */}
      <WorkspaceSidebar
        workspaces={getVisibleWorkspaces()}
        selectedWorkspace={selectedWorkspace}
        hasMoreWorkspaces={hasMoreWorkspaces()}
        onWorkspaceSelect={handleWorkspaceSelect}
        onLoadMore={loadMoreWorkspaces}
      />

      {/* Middle Panel - Sections & Channels */}
      <SectionChannelPanel
        selectedWorkspace={selectedWorkspace}
        selectedChannel={selectedChannel}
        onChannelSelect={handleChannelSelect}
      />

      {/* Right Panel - Chat Area */}
      <ChatPanel
        selectedChannel={selectedChannel}
        participants={participants}
        isLoadingMessages={isLoadingMessages || messagesLoading}
        isConnected={isConnected}
        messages={messages}
        wsErrors={wsErrors}
        onSendMessage={handleSendMessage}
        onClearErrors={clearErrors}
        onRetry={handleRetry}
      />
    </div>
  );
};

// Main WorkspacePage component wrapped with error boundary
const WorkspacePage = () => {
  return (
    <ChatErrorBoundary>
      <WorkspacePageContent />
    </ChatErrorBoundary>
  );
};

export default WorkspacePage;
