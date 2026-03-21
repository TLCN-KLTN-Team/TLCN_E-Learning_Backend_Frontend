import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";
import { getWorkspaces } from "@/services/api/workspace/workspace.api";
import {
  getChannel,
  getPublicChannelBySectionId,
} from "@/services/api/workspace/channel.api";
import type {
  ChannelResponse,
  Participant,
  SectionResponse,
  WorkspaceResponse,
} from "@/types/chat.types";
import { getSectionsByWorkspaceId } from "@/services/api/workspace/section.api";

export const useWorkspace = () => {
  const [workspacesData, setWorkspacesData] =
    useState<PaginatedResponse<WorkspaceResponse> | null>(null);
  const [visibleWorkspaceCount, setVisibleWorkspaceCount] = useState(6);
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceResponse | null>(null);
  const [selectedSection, setSelectedSection] =
    useState<SectionResponse | null>(null);
  const [selectedChannel, setSelectedChannel] =
    useState<ChannelResponse | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const pageSize = 6;

  // Load initial workspaces
  useEffect(() => {
    getWorkspaces(0, pageSize)
      .then((data) => {
        setWorkspacesData(data);
      })
      .catch((error) => {
        console.error("Error fetching workspaces:", error);
        toast.error("Không thể tải danh sách workspace. Vui lòng thử lại.");
      });
  }, []);

  // Auto select general channel when workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      // Find general channel first, otherwise use first channel
      const fetchChannelsAndSelectGeneralChannel = async () => {
        try {
          const sections = await getSectionsByWorkspaceId(selectedWorkspace.id);

          const publicSection = sections.find((sec) => sec.isPublic);
          if (!publicSection) {
            return;
          }

          setSelectedSection(publicSection || null);
          const publicChannel = await getPublicChannelBySectionId(
            publicSection.id,
          );
          setSelectedChannel(publicChannel);

          console.log("publicSection:", publicSection);
          console.log("publicChannel:", publicChannel);
        } catch (error) {
          console.error("Error auto-selecting channel:", error);
          toast.error("Không thể tải kênh. Vui lòng thử lại.");
          setSelectedChannel(null);
        }
      };

      fetchChannelsAndSelectGeneralChannel();
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
        })
        .catch((error) => {
          console.error("Error loading channel data:", error);
          toast.error("Không thể tải thông tin kênh. Vui lòng thử lại.");
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
            : data,
        );
        setVisibleWorkspaceCount((prev) => prev + pageSize);
      })
      .catch((error) => {
        console.error("Error loading more workspaces:", error);
        toast.error("Không thể tải thêm workspace. Vui lòng thử lại.");
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
    selectedSection,
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
