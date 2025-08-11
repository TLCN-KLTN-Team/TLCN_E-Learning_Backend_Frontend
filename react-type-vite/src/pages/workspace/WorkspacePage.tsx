import { useState, useRef, useEffect } from "react";
import {
  Hash,
  Users,
  Search,
  Bell,
  Pin,
  AtSign,
  HelpCircle,
  Smile,
  Plus,
  Gift,
  File,
  Edit,
  Send,
  PlusCircle,
  MoreHorizontal,
} from "lucide-react";

import InvitePeopleButton from "@/components/student/workspace/InvitePeopleButton";
import InvitePeopleModal from "@/components/student/workspace/InvitePeopleModal";

import type {
  WorkspaceResponse,
  ChannelResponse,
  ChatMessageResponse,
} from "@/services/api/workspaceApi";
import type { PaginatedResponse } from "@/services/shared/apiResponse";
import { getWorkspaces, getChannel } from "@/services/api/workspaceApi";
import { getAvartarFromName } from "@/utils/callApiUtils";
import { useSafeChatWebSocket } from "@/hooks/useSafeChatWebSocket";
import ChatErrorBoundary from "@/components/student/workspace/ChatErrorBoundary";
import { useAuth } from "@/context/auth-context/useAuth";

const WorkspacePageContent = () => {
  const [workspacesData, setWorkspacesData] =
    useState<PaginatedResponse<WorkspaceResponse> | null>(null);
  const [visibleWorkspaceCount, setVisibleWorkspaceCount] = useState(6);
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceResponse | null>(null);
  const [selectedChannel, setSelectedChannel] =
    useState<ChannelResponse | null>(null);
  const [channelMessages, setChannelMessages] = useState<ChatMessageResponse[]>(
    []
  );
  const [newMessage, setNewMessage] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();

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
    sendMessage: sendWebSocketMessage,
    clearErrors,
    error: safeChatError,
    isInitialized,
    clearError,
  } = useSafeChatWebSocket();

  // Set default channel when workspace changes
  useEffect(() => {
    if (selectedWorkspace && selectedWorkspace.channels) {
      // Set the first channel as default, or null if no channels
      setSelectedChannel(selectedWorkspace.channels[0] || null);
    }
  }, [selectedWorkspace]);

  // Load channel messages when channel changes (FIXED - Remove duplicate subscription)
  useEffect(() => {
    if (selectedChannel) {
      setIsLoadingMessages(true);
      getChannel(selectedChannel.id)
        .then((channelData) => {
          setChannelMessages(channelData.messages || []);
        })
        .catch((error) => {
          console.error("Error loading channel messages:", error);
          setChannelMessages([]);
        })
        .finally(() => {
          setIsLoadingMessages(false);
        });
    } else {
      setChannelMessages([]);
    }
  }, [selectedChannel]); // Remove isConnected and subscribeToChannel to prevent loops

  // Simple subscription effect - only run when connection status or channel changes
  useEffect(() => {
    if (!isConnected || !selectedChannel) {
      return;
    }

    console.log(
      `🔗 Setting up subscriptions for channel: ${selectedChannel.id}`
    );

    // Subscribe to all channels at once
    const unsubscribeChannel = subscribeToChannel(selectedChannel.id);
    const unsubscribeDirectMessages = subscribeToDirectMessages();
    const unsubscribeErrors = subscribeToErrors();

    return () => {
      console.log(`🔗 Cleaning up subscriptions`);
      unsubscribeChannel?.();
      unsubscribeDirectMessages?.();
      unsubscribeErrors?.();
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

  // Handle when component mounts at first time
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
    };

    // Load initial workspaces with minimal data
    getWorkspaces(0, 6).then((data) => {
      console.log("Fetched workspaces:", data);
      setWorkspacesData(data);
    });

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSendMessage = async () => {
    console.log("🚀 handleSendMessage called", {
      newMessage,
      selectedChannel,
      isConnected,
    });

    if (!newMessage.trim() || !selectedChannel) {
      console.warn("❌ Cannot send message: missing content or channel");
      return;
    }

    if (!isConnected) {
      console.warn("❌ Cannot send message: WebSocket not connected");
      alert("Kết nối real-time bị mất. Vui lòng thử lại sau.");
      return;
    }

    try {
      console.log("📤 Sending message via WebSocket...");

      // Send via WebSocket directly to broker
      sendWebSocketMessage({
        channelId: selectedChannel.id,
        content: newMessage.trim(),
      });

      console.log("✅ Message sent successfully");
      setNewMessage("");

      // Clear any previous errors
      clearError();
    } catch (error) {
      console.error("❌ Error sending message:", error);

      // Show user-friendly error
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Không thể gửi tin nhắn: ${errorMessage}`);
    }
  };

  const handleWorkspaceSelect = (workspace: WorkspaceResponse) => {
    setSelectedWorkspace(workspace);
  };

  const handleChannelSelect = (channel: ChannelResponse) => {
    setSelectedChannel(channel);
  };

  const loadMoreWorkspaces = () => {
    if (!workspacesData) return;

    const nextPage = Math.floor(visibleWorkspaceCount / 6);
    getWorkspaces(nextPage, 6)
      .then((data) => {
        // Append new workspaces to existing ones
        setWorkspacesData((prev) =>
          prev
            ? {
                ...data,
                content: [...prev.content, ...data.content],
              }
            : data
        );
        setVisibleWorkspaceCount((prev) => prev + 6);
      })
      .catch((error) => {
        console.error("Error loading more workspaces:", error);
      });
  };

  const getVisibleWorkspaces = () => {
    if (!workspacesData) return [];
    return workspacesData.content.slice(0, visibleWorkspaceCount);
  };

  const hasMoreWorkspaces = () => {
    if (!workspacesData) return false;
    return !workspacesData.last;
  };

  return (
    <div className="h-screen flex bg-gray-800">
      {/* Sidebar - Workspaces */}
      <div className="w-18 bg-gray-900 flex flex-col items-center py-3 space-y-2">
        {/* Home/Direct Messages */}
        <div className="w-12 h-12 bg-indigo-600 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group relative">
          <svg
            className="w-6 h-6 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
            Trang chủ
          </div>
        </div>

        {/* Separator */}
        <div className="w-8 h-0.5 bg-gray-700 rounded"></div>

        {/* Workspace Icons */}
        {getVisibleWorkspaces().map((workspace) => (
          <div
            key={workspace.id}
            onClick={() => handleWorkspaceSelect(workspace)}
            className="relative group"
          >
            {/* Active indicator */}
            {selectedWorkspace?.id === workspace.id && (
              <div className="absolute -left-3 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r"></div>
            )}

            <div
              className={`w-12 h-12 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer text-white font-bold text-sm ${
                selectedWorkspace?.id === workspace.id ? "rounded-xl" : ""
              }`}
            >
              {workspace.avatarUrl && (
                <img
                  src={getAvartarFromName(workspace.name)}
                  className="w-full h-full rounded-2xl hover:rounded-xl object-cover"
                />
              )}
            </div>

            {/* Tooltip */}
            <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 top-1/2 transform -translate-y-1/2">
              {workspace.name}
            </div>
          </div>
        ))}

        {/* Show More Button */}
        {hasMoreWorkspaces() && (
          <div
            onClick={loadMoreWorkspaces}
            className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group relative"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-400 group-hover:text-white" />
            <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Xem thêm workspaces
            </div>
          </div>
        )}

        {/* Add Workspace Button (only for teachers) */}
        {user?.role === "teacher" && (
          <div className="w-12 h-12 bg-gray-700 hover:bg-green-600 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group relative">
            <Plus className="w-6 h-6 text-green-400 group-hover:text-white" />
            <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
              Thêm workspace
            </div>
          </div>
        )}

        {/* User Avatar */}
        <div className="mt-auto relative" ref={dropdownRef}>
          <div
            className="w-12 h-12 rounded-full overflow-hidden cursor-pointer ring-2 ring-transparent hover:ring-gray-600 transition-all"
            onClick={() => setShowUserDropdown(!showUserDropdown)}
          >
            <img
              src={getAvartarFromName(`${user?.firstName} ${user?.lastName}`)}
              alt={user?.firstName || "User"}
              className="w-full h-full object-cover"
            />
          </div>

          {/* User Dropdown */}
          {showUserDropdown && (
            <div className="absolute bottom-16 left-0 bg-gray-800 rounded-lg shadow-lg py-2 w-48 z-20 border border-gray-700">
              <div className="px-4 py-2 border-b border-gray-700">
                <div className="font-semibold text-white text-sm">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-gray-400 text-xs">
                  {user?.role === "teacher" ? "Giảng viên" : "Sinh viên"}
                </div>
              </div>
              <button
                className="w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors text-sm"
                onClick={() => (window.location.href = "/")}
              >
                <svg
                  className="w-4 h-4 inline mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                </svg>
                Về trang chủ
              </button>
              <button className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 hover:text-red-300 transition-colors text-sm">
                <svg
                  className="w-4 h-4 inline mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z"
                    clipRule="evenodd"
                  />
                </svg>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Channel Panel */}
      <div className="w-64 bg-gray-900 flex flex-col border-l border-gray-200">
        {/* Server Name Header */}
        <div className="p-4 border-b border-gray-600 flex items-center justify-between">
          <h2 className="text-white font-semibold">
            {selectedWorkspace?.name || "Chọn workspace"}
          </h2>
          <button className="text-gray-400 hover:text-white">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Channels */}
        {selectedWorkspace && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {/* Text Channels */}
              <div className="mb-4">
                <div className="flex items-center justify-between px-2 py-1">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Kênh văn bản
                  </h3>
                  {user?.role === "teacher" && (
                    <button className="text-gray-400 hover:text-white">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {(selectedWorkspace.channels || []).map(
                  (channel: ChannelResponse) => (
                    <div
                      key={channel.id}
                      onClick={() => handleChannelSelect(channel)}
                      className={`flex items-center p-2 rounded cursor-pointer transition-colors ${
                        selectedChannel?.id === channel.id
                          ? "bg-gray-600 text-white"
                          : "hover:bg-gray-600 text-gray-300 hover:text-white"
                      }`}
                    >
                      <span className="mr-2 text-gray-400">#</span>
                      <span className="text-sm">{channel.channelName}</span>
                    </div>
                  )
                )}
              </div>

              {/* Voice Channels - Tạm thời ẩn vì ChannelResponse không có type */}
              {/* <div>
                <div className="flex items-center justify-between px-2 py-1">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    Kênh thoại
                  </h3>
                  {currentUser.role === "teacher" && (
                    <button className="text-gray-400 hover:text-white">
                      <Plus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div> */}

              {/* Invite People Button */}
              <div className="mt-4 px-2">
                <InvitePeopleButton onClick={() => setShowInviteModal(true)} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-900 border-l border-gray-700">
        {selectedChannel ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-3 border-b border-gray-600 bg-gray-900 flex items-center">
              <Hash className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="text-white font-semibold">
                {selectedChannel.channelName}
              </h3>
              <div className="ml-auto flex items-center space-x-4">
                <button className="text-gray-400 hover:text-white">
                  <Users className="w-5 h-5" />
                </button>
                <button className="text-gray-400 hover:text-white">
                  <Bell className="w-5 h-5" />
                </button>
                <button className="text-gray-400 hover:text-white">
                  <Pin className="w-5 h-5" />
                </button>
                <button className="text-gray-400 hover:text-white">
                  <AtSign className="w-5 h-5" />
                </button>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search"
                    className="bg-gray-900 text-white placeholder-gray-400 rounded border px-2 py-1 pl-8 text-sm w-32"
                  />
                </div>
                <button className="text-gray-400 hover:text-white">
                  <HelpCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-800">
              {/* Loading state */}
              {isLoadingMessages ? (
                <div className="p-6 pt-16 text-center">
                  <div className="text-gray-400">Loading messages...</div>
                </div>
              ) : (
                <>
                  {/* Channel Welcome Message or Messages */}
                  {channelMessages.length === 0 ? (
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
                        This is the start of the #{selectedChannel.channelName}{" "}
                        channel.
                      </p>
                      {user?.role === "teacher" && (
                        <button className="flex items-center text-blue-400 hover:text-blue-300 text-sm">
                          <Edit className="w-4 h-4 mr-1" />
                          Edit Channel
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      {/* Display existing messages from API */}
                      {channelMessages.map((message) => (
                        <div
                          key={message.id}
                          className="flex items-start space-x-3"
                        >
                          <img
                            src={
                              message.sender.avatarUrl ||
                              `https://ui-avatars.com/api/?name=${
                                message.sender.firstName ||
                                message.sender.username ||
                                "User"
                              }+${
                                message.sender.lastName || ""
                              }&background=3b82f6&color=fff`
                            }
                            alt={`${
                              message.sender.firstName ||
                              message.sender.username ||
                              "User"
                            } ${message.sender.lastName || ""}`}
                            className="w-10 h-10 rounded-full"
                          />
                          <div className="flex-1">
                            <div className="flex items-baseline space-x-2">
                              <span className="font-semibold text-white">
                                {message.sender.firstName ||
                                  message.sender.username ||
                                  "Anonymous"}{" "}
                                {message.sender.lastName || ""}
                              </span>
                              <span className="text-xs text-gray-400">
                                {new Date(
                                  message.createdDate
                                ).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {message.me && (
                                <span className="text-xs text-blue-400">
                                  (You)
                                </span>
                              )}
                            </div>
                            <p className="text-gray-300 mt-1">
                              {message.message}
                            </p>
                          </div>
                        </div>
                      ))}

                      {/* Display real-time WebSocket messages */}
                      {wsMessages
                        .filter((msg) => msg.channelId === selectedChannel.id)
                        .map((message) => (
                          <div
                            key={`ws-${message.id}`}
                            className="flex items-start space-x-3 bg-blue-50/5 p-3 rounded-lg border border-blue-500/20"
                          >
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                              {message.sender.firstName
                                ?.charAt(0)
                                .toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-baseline space-x-2">
                                <span className="font-semibold text-white">
                                  {message.sender.firstName
                                    ?.charAt(0)
                                    .toUpperCase()}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(
                                    message.createdDate
                                  ).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                  Live
                                </span>
                              </div>
                              <p className="text-gray-300 mt-1">
                                {message.message}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </>
              )}

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

            {/* Message Input */}
            <div className="p-4 bg-gray-900">
              <div className="relative">
                <PlusCircle className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 cursor-pointer hover:text-white" />
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && !e.shiftKey && handleSendMessage()
                  }
                  placeholder={`Message #${selectedChannel.channelName}`}
                  disabled={!isConnected}
                  className="w-full px-12 py-3 bg-gray-700 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <button
                    className="text-gray-400 hover:text-white"
                    title="Upload file"
                    disabled={!isConnected}
                  >
                    <File className="w-5 h-5" />
                  </button>
                  <button
                    className="text-gray-400 hover:text-white"
                    title="GIF"
                    disabled={!isConnected}
                  >
                    <Gift className="w-5 h-5" />
                  </button>
                  <button
                    className="text-gray-400 hover:text-white"
                    title="Emoji"
                    disabled={!isConnected}
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !isConnected}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:cursor-not-allowed text-white p-2 rounded-md transition-colors"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Connection and status info */}
              <div className="flex items-center justify-between mt-2 text-xs">
                <div className="flex items-center space-x-4 text-gray-400">
                  <span
                    className={`flex items-center space-x-1 ${
                      isConnected ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConnected ? "bg-green-400" : "bg-red-400"
                      }`}
                    ></div>
                    <span>
                      {isConnected ? "Real-time chat active" : "Connecting..."}
                    </span>
                  </span>
                  {wsMessages.length > 0 && (
                    <span className="text-blue-400">
                      {
                        wsMessages.filter(
                          (m) => m.channelId === selectedChannel.id
                        ).length
                      }{" "}
                      live messages
                    </span>
                  )}
                </div>
                {wsErrors.length > 0 && (
                  <button
                    onClick={() => {
                      clearErrors();
                    }}
                    className="text-red-400 hover:text-red-300 underline"
                  >
                    Clear errors ({wsErrors.length})
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-700">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Chọn một kênh để bắt đầu
              </h3>
              <p className="text-gray-400">
                Chọn một workspace và kênh từ sidebar để xem tin nhắn
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Invite People Modal */}
      <InvitePeopleModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        workspaceName={selectedWorkspace?.name || ""}
        channelName={selectedChannel?.channelName || "general"}
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
