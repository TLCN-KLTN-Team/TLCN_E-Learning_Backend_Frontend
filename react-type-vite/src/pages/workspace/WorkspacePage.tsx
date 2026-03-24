import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { useSafeChatWebSocket } from "@/hooks/useSafeChatWebSocket";
import { useWorkspace } from "@/hooks/useWorkspace";
import ChatErrorBoundary from "@/components/student/workspace/ChatErrorBoundary";

// Import layout components
import {
  WorkspaceSidebar,
  SectionChannelPanel,
  ChatPanel,
} from "@/components/student/workspace/layout";

const WorkspacePageContent = () => {
  const navigate = useNavigate();

  // Use custom hooks for workspace management and WebSocket
  const {
    selectedWorkspace,
    selectedSection,
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
    messages: wsMessages,
    errors: wsErrors,
    connect,
    disconnect,
    subscribeToChannel,
    subscribeToDirectMessages,
    subscribeToErrors,
    subscribeToMultipleFilesUploads,
    sendMessage: sendWebSocketMessage,
    clearErrors,
    clearError,
  } = useSafeChatWebSocket();

  // Simple subscription effect - only run when connection status or channel changes
  useEffect(() => {
    if (!isConnected || !selectedChannel) {
      return;
    }

    console.log(
      `🔗 Setting up subscriptions for channel: ${selectedChannel.id}`,
    );

    // Subscribe to all channels at once
    const unsubscribeChannel = subscribeToChannel(selectedChannel.id);
    const unsubscribeDirectMessages = subscribeToDirectMessages();
    const unsubscribeErrors = subscribeToErrors();
    const unsubscribeFileUploads = subscribeToMultipleFilesUploads(
      selectedChannel.id,
    );

    return () => {
      console.log(`🔗 Cleaning up subscriptions`);
      unsubscribeChannel?.();
      unsubscribeDirectMessages?.();
      unsubscribeErrors?.();
      unsubscribeFileUploads?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, selectedChannel?.id]); // Only depend on connection status and channel id to prevent infinite loops

  // Initialize WebSocket connection only once
  useEffect(() => {
    let mounted = true;

    const initConnection = () => {
      if (mounted) {
        connect();
      }
    };

    // Delay connection to avoid multiple rapid connections
    const connectionTimer = setTimeout(initConnection, 100);

    return () => {
      mounted = false;
      clearTimeout(connectionTimer);
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty to prevent re-connections on every render

  // Update URL when workspace or channel changes
  useEffect(() => {
    if (selectedWorkspace) {
      if (selectedSection) {
        // Navigate to workspace with section
        navigate(
          `/workspaces/${selectedWorkspace?.id}/${selectedSection?.id}/${selectedChannel?.id}`,
          {
            replace: true,
          },
        );
      } else {
        // Navigate to workspace only
        navigate(`/workspaces/${selectedWorkspace.id}`, {
          replace: true,
        });
      }
    }
  }, [selectedWorkspace, selectedSection, selectedChannel, navigate]);

  const handleSendMessage = async (content: string) => {
    console.log("🚀 handleSendMessage called", {
      content,
      selectedChannel,
      isConnected,
    });

    if (!selectedChannel) {
      toast.warning("Vui lòng chọn kênh trước khi gửi tin nhắn.");
      return;
    }

    if (!isConnected) {
      toast.error("Kết nối real-time bị mất. Vui lòng thử lại sau.");
      return;
    }

    try {
      console.log("📤 Sending message via WebSocket...");

      // Send via WebSocket directly to broker
      sendWebSocketMessage({
        channelId: selectedChannel.id,
        content: content,
      });

      // Clear any previous errors
      clearError();
    } catch (error) {
      console.error("❌ Error sending message:", error);

      // Show user-friendly error
      const errorMessage =
        error instanceof Error ? error.message : "Lỗi không xác định";
      toast.error(`Không thể gửi tin nhắn: ${errorMessage}`);
    }
  };

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
        isLoadingMessages={isLoadingMessages}
        isConnected={isConnected}
        wsMessages={wsMessages}
        wsErrors={wsErrors}
        onSendMessage={handleSendMessage}
        onClearErrors={clearErrors}
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
