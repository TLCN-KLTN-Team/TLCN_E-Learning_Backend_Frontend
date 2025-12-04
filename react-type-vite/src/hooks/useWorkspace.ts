import { useState, useEffect } from "react";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";
import { getWorkspaces } from "@/services/api/workspaceApi";
import {
  getChannel,
  getBasicChannelsByWorkspaceId,
} from "@/services/api/workspace/channel.api";
import type {
  ChannelResponse,
  Participant,
  WorkspaceResponse,
} from "@/types/chat.types";

export const useWorkspace = () => {
  const [workspacesData, setWorkspacesData] =
    useState<PaginatedResponse<WorkspaceResponse> | null>(null);
  const [visibleWorkspaceCount, setVisibleWorkspaceCount] = useState(6);
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceResponse | null>(null);
  const [selectedChannel, setSelectedChannel] =
    useState<ChannelResponse | null>(null);
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

  // Auto select general channel when workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      // Find general channel first, otherwise use first channel
      const fetchChannelsAndSelectGeneral = async () => {
        try {
          const channels = await getBasicChannelsByWorkspaceId(
            selectedWorkspace.id
          );
          if (channels && channels.length > 0) {
            // Look for "general" channel first
            const generalChannel = channels.find(
              (ch) => ch.channelName.toLowerCase() === "general"
            );

            const channelToSelect = generalChannel || channels[0];

            // Convert BasicChannelResponse to ChannelResponse for selection
            const fullChannel = await getChannel(channelToSelect.id);
            setSelectedChannel(fullChannel);
          }
        } catch (error) {
          console.error("Error auto-selecting channel:", error);
          setSelectedChannel(null);
        }
      };

      fetchChannelsAndSelectGeneral();
    } else {
      setSelectedChannel(null);
    }
  }, [selectedWorkspace]);

  // Load channel data when channel changes
  useEffect(() => {
    if (selectedChannel) {
      setIsLoadingMessages(true);
      getChannel(selectedChannel.id)
        .then((channelData) => {
          console.log("Loaded channel data:", channelData);
          setParticipants(channelData.participants || []);
        })
        .catch((error) => {
          console.error("Error loading channel data:", error);
          setParticipants([]);
        })
        .finally(() => {
          setIsLoadingMessages(false);
        });
    } else {
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
    participants,
    isLoadingMessages,
    handleWorkspaceSelect,
    handleChannelSelect,
    loadMoreWorkspaces,
    getVisibleWorkspaces,
    hasMoreWorkspaces,
  };
};
