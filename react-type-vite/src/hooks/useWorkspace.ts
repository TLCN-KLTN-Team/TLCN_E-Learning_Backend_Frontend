import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { PaginatedResponse } from "@/services/api/response/apiResponse";
import { getWorkspaces } from "@/services/api/workspace/workspace.api";
import {
  getChannel,
  getPublicChannelBySectionId,
} from "@/services/api/workspace/channel.api";
import type {
  ChannelResponse,
  UserResponse,
  SectionResponse,
  WorkspaceResponse,
} from "@/types/chat.types";
import { getSectionsByWorkspaceId } from "@/services/api/workspace/section.api";

export const useWorkspace = () => {
  const navigate = useNavigate();
  const initializedWorkspaceIdRef = useRef<string | null>(null);

  const [workspacesData, setWorkspacesData] =
    useState<PaginatedResponse<WorkspaceResponse> | null>(null);
  const [visibleWorkspaceCount, setVisibleWorkspaceCount] = useState(6);
  const [selectedWorkspace, setSelectedWorkspace] =
    useState<WorkspaceResponse | null>(null);
  const [selectedSection, setSelectedSection] =
    useState<SectionResponse | null>(null);
  const [selectedChannel, setSelectedChannel] =
    useState<ChannelResponse | null>(null);
  const [participants] = useState<UserResponse[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const pageSize = 6;

  const navigateToWorkspacePath = useCallback(
    (workspaceId?: string, sectionId?: string, channelId?: string) => {
      if (!workspaceId) {
        navigate("/workspaces", { replace: true });
        return;
      }

      if (sectionId && channelId) {
        navigate(`/workspaces/${workspaceId}/${sectionId}/${channelId}`, {
          replace: true,
        });
        return;
      }

      navigate(`/workspaces/${workspaceId}`, { replace: true });
    },
    [navigate],
  );

  const handleChannelSelect = useCallback(
    async (channel: ChannelResponse) => {
      setIsLoadingMessages(true);

      try {
        // If channel already has sectionId, navigate directly — no extra API calls needed
        if (channel.sectionId) {
          setSelectedChannel(channel);
          setSelectedSection({ id: channel.sectionId, name: "", isPublic: true });
          navigateToWorkspacePath(
            selectedWorkspace?.id,
            channel.sectionId,
            channel.id,
          );
        } else {
          // Fallback: fetch full channel if sectionId is missing
          const fullChannel = await getChannel(channel.id);
          setSelectedChannel(fullChannel);
          setSelectedSection({ id: fullChannel.sectionId, name: "", isPublic: true });
          navigateToWorkspacePath(
            selectedWorkspace?.id,
            fullChannel.sectionId,
            fullChannel.id,
          );
        }
      } catch (error) {
        console.error("Error fetching channel details:", error);
        toast.error("Không thể tải thông tin kênh. Vui lòng thử lại.");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [navigateToWorkspacePath, selectedWorkspace?.id],
  );

  // Load initial workspaces
  useEffect(() => {
    getWorkspaces(0, pageSize)
      .then((data) => {
        setWorkspacesData(data);
        console.log("Fetched workspaces:", data.content);
      })
      .catch((error) => {
        console.error("Error fetching workspaces:", error);
        toast.error("Không thể tải danh sách workspace. Vui lòng thử lại.");
      });
  }, []);

  // Auto select general channel when workspace changes
  useEffect(() => {
    if (selectedWorkspace) {
      if (initializedWorkspaceIdRef.current === selectedWorkspace.id) {
        return;
      }

      // Find public section and its public channel, then apply directly without extra API calls
      const fetchChannelsAndSelectGeneralChannel = async () => {
        try {
          const sections = await getSectionsByWorkspaceId(selectedWorkspace.id);

          const publicSection = sections.find((sec) => sec.isPublic);
          if (!publicSection) {
            initializedWorkspaceIdRef.current = selectedWorkspace.id;
            navigateToWorkspacePath(selectedWorkspace.id);
            return;
          }

          const publicChannel = await getPublicChannelBySectionId(
            publicSection.id,
          );

          if (!publicChannel) {
            setSelectedSection(publicSection);
            initializedWorkspaceIdRef.current = selectedWorkspace.id;
            navigateToWorkspacePath(selectedWorkspace.id);
            return;
          }

          // Set state directly — publicChannel already has full data including sectionId
          setSelectedChannel(publicChannel);
          setSelectedSection(publicSection);
          navigateToWorkspacePath(
            selectedWorkspace.id,
            publicSection.id,
            publicChannel.id,
          );
          initializedWorkspaceIdRef.current = selectedWorkspace.id;
        } catch (error) {
          console.error("Error auto-selecting channel:", error);
          toast.error("Không thể tải kênh. Vui lòng thử lại.");
          setSelectedSection(null);
          setSelectedChannel(null);
          initializedWorkspaceIdRef.current = null;
        }
      };

      fetchChannelsAndSelectGeneralChannel();
    } else {
      setSelectedSection(null);
      setSelectedChannel(null);
      initializedWorkspaceIdRef.current = null;
      navigateToWorkspacePath();
    }
  }, [navigateToWorkspacePath, selectedWorkspace]);

  const handleWorkspaceSelect = (workspace: WorkspaceResponse) => {
    if (selectedWorkspace?.id === workspace.id) {
      return;
    }

    console.log("Selecting workspace:", workspace.name);
    initializedWorkspaceIdRef.current = null;
    setSelectedSection(null);
    setSelectedChannel(null);
    setSelectedWorkspace(workspace);
    navigateToWorkspacePath(workspace.id);
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
