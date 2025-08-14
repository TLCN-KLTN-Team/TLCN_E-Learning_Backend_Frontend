import { useState, useEffect } from "react";
import type {
  WorkspaceResponse,
  Participant,
} from "@/services/api/workspaceApi";
import type { PaginatedResponse } from "@/services/shared/apiResponse";
import { getWorkspaces } from "@/services/api/workspaceApi";
import {
  getChannel,
  type ChannelResponse,
  type ChatMessageResponse,
} from "@/services/api/channelApi";

export const useWorkspace = () => {
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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const pageSize = 6;

  // Load initial workspaces
  useEffect(() => {
    getWorkspaces(0, pageSize).then((data) => {
      console.log("Fetched workspaces:", data);
      setWorkspacesData(data);
    });
  }, []);

  // // Auto select general channel when workspace changes
  // useEffect(() => {
  //   if (selectedWorkspace) {
  //     // Find general channel first, otherwise use first channel

  //     setSelectedChannel(channelToSelect);
  //   } else {
  //     setSelectedChannel(null);
  //   }
  // }, [selectedWorkspace]);

  // Load channel messages when channel changes
  useEffect(() => {
    if (selectedChannel) {
      setIsLoadingMessages(true);
      getChannel(selectedChannel.id)
        .then((channelData) => {
          console.log("Loaded channel data:", channelData);
          setChannelMessages(channelData.messages || []);
          setParticipants(channelData.participants || []);
        })
        .catch((error) => {
          console.error("Error loading channel messages:", error);
          setChannelMessages([]);
          setParticipants([]);
        })
        .finally(() => {
          setIsLoadingMessages(false);
        });
    } else {
      setChannelMessages([]);
      setParticipants([]);
    }
  }, [selectedChannel]);

  const handleWorkspaceSelect = (workspace: WorkspaceResponse) => {
    console.log("Selecting workspace:", workspace.name);
    setSelectedWorkspace(workspace);
    // Channel will be auto-selected by the useEffect above
  };

  const handleChannelSelect = (channel: ChannelResponse) => {
    setSelectedChannel(channel);
  };

  const loadMoreWorkspaces = () => {
    if (!workspacesData) return;

    const nextPage = Math.floor(visibleWorkspaceCount / pageSize);
    getWorkspaces(nextPage, pageSize)
      .then((data) => {
        setWorkspacesData((prev) =>
          prev
            ? {
                ...data,
                content: [...prev.content, ...data.content],
              }
            : data
        );
        setVisibleWorkspaceCount((prev) => prev + pageSize);
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

  return {
    workspacesData,
    selectedWorkspace,
    selectedChannel,
    channelMessages,
    participants,
    isLoadingMessages,
    handleWorkspaceSelect,
    handleChannelSelect,
    loadMoreWorkspaces,
    getVisibleWorkspaces,
    hasMoreWorkspaces,
    setChannelMessages,
  };
};
