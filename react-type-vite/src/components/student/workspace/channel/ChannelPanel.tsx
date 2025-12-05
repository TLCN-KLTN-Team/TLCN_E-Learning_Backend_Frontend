import { useEffect, useState } from "react";
import SectionList from "../section/SectionList";
import InvitePeopleModal from "@/components/student/workspace/channel/InvitePeopleModal";
import AddChannelModal from "@/components/student/workspace/channel/AddChannelModal";
import { ChannelSettings } from "@/pages/workspace/settings/index.ts";

import { toast } from "react-toastify";
import type {
  ChannelResponse,
  WorkspaceResponse,
  SectionResponse,
} from "@/types/chat.types";
import type { Channel } from "@/types/channel.types";
import {
  ChannelType as ChannelSettingsType,
  ChannelStatus,
} from "@/types/channel.types";
import { getSectionsByWorkspaceId } from "@/services/api/workspace/section.api";
import { getAllGroupsByChannelId } from "@/services/api/workspace/group.api";
import { getChannel } from "@/services/api/workspace/channel.api";

interface ChannelPanelProps {
  selectedWorkspace: WorkspaceResponse | null;
  selectedChannel: ChannelResponse | null;
  onChannelSelect: (channel: ChannelResponse) => void;
}

const ChannelPanel = ({
  selectedWorkspace,
  selectedChannel,
  onChannelSelect,
}: ChannelPanelProps) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [sections, setSections] = useState<SectionResponse[]>([]);
  const [channelDetailsMap, setChannelDetailsMap] = useState<
    Map<string, ChannelResponse>
  >(new Map());
  const [selectedChannelForAction, setSelectedChannelForAction] =
    useState<ChannelResponse | null>(null);

  // Handle invite people to a specific channel
  const handleInvitePeople = (channel: ChannelResponse) => {
    setSelectedChannelForAction(channel);
    setShowInviteModal(true);
  };

  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Handle channel settings
  const handleChannelSettings = (channel: ChannelResponse) => {
    setSelectedChannelForAction(channel);
    setShowSettingsModal(true);
  };

  // Convert ChannelResponse to Channel type for settings
  const convertToChannelSettings = (channel: ChannelResponse): Channel => {
    return {
      id: channel.id,
      participantHash: channel.participantHash || "",
      channelName: channel.channelName,
      description: channel.description || "",
      workspaceId: selectedWorkspace?.id || "",
      classId: null,
      memberIds: channel.participants?.map((p) => p.userId) || [],
      isPrivate: channel.isPrivate,
      type: ChannelSettingsType.TEXT,
      status: channel.ended ? ChannelStatus.LOCKED : ChannelStatus.ACTIVE,
      durationMinutes: Math.floor(channel.endTime / 60000) || 60,
    };
  };

  // Handle save channel settings
  const handleSaveChannelSettings = async (channelData: Channel) => {
    try {
      // TODO: Call API to update channel
      console.log("Saving channel data:", channelData);
      toast.success("Cập nhật channel thành công!");
      setShowSettingsModal(false);
      // Refresh sections to get updated channel data
      if (selectedWorkspace) {
        try {
          const sectionsData = await getSectionsByWorkspaceId(
            selectedWorkspace.id
          );
          setSections(sectionsData);
        } catch (error) {
          console.error("Error refreshing sections:", error);
        }
      }
    } catch (error) {
      console.error("Error saving channel:", error);
      toast.error("Không thể cập nhật channel");
      throw error;
    }
  };

  // Handle delete channel
  const handleDeleteChannel = async (channelId: string) => {
    try {
      // TODO: Call API to delete channel
      console.log("Deleting channel:", channelId);
      toast.success("Xóa channel thành công!");
      setShowSettingsModal(false);
      // Refresh sections
      if (selectedWorkspace) {
        try {
          const sectionsData = await getSectionsByWorkspaceId(
            selectedWorkspace.id
          );
          setSections(sectionsData);
        } catch (error) {
          console.error("Error refreshing sections:", error);
        }
      }
      // If deleted channel was selected, clear selection
      if (selectedChannel?.id === channelId) {
        onChannelSelect(null as any);
      }
    } catch (error) {
      console.error("Error deleting channel:", error);
      toast.error("Không thể xóa channel");
      throw error;
    }
  };

  // Handle create channel in section
  const handleCreateChannel = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setShowAddChannelModal(true);
  };

  // Handle channel created callback
  const handleChannelCreated = (newChannel: ChannelResponse) => {
    // Refresh sections to show new channel
    if (selectedWorkspace) {
      getSectionsByWorkspaceId(selectedWorkspace.id)
        .then((sectionsData) => {
          setSections(sectionsData);
          toast.success(
            `Kênh "${newChannel.channelName}" đã được tạo thành công!`
          );
        })
        .catch((error) => {
          console.error("Error refreshing sections:", error);
        });
    }
  };

  // Handle channel select - fetch full details if needed
  const handleChannelSelectInternal = async (channel: ChannelResponse) => {
    try {
      // If we already have full details with groups, use them
      const cachedDetails = channelDetailsMap.get(channel.id);
      if (cachedDetails) {
        onChannelSelect(cachedDetails);
        return;
      }

      // Otherwise fetch full channel details including groups
      const fullChannel = await getChannel(channel.id);
      const groups = await getAllGroupsByChannelId(channel.id);
      const channelWithGroups = { ...fullChannel, groups };

      // Cache the details
      setChannelDetailsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(channel.id, channelWithGroups);
        return newMap;
      });

      onChannelSelect(channelWithGroups);
    } catch (error) {
      console.error("Error fetching channel details:", error);
      onChannelSelect(channel); // Fallback to basic channel
    }
  };

  useEffect(() => {
    if (selectedWorkspace) {
      // Fetch sections from workspaceId
      const fetchSections = async () => {
        try {
          const sectionsData: SectionResponse[] =
            await getSectionsByWorkspaceId(selectedWorkspace.id);
          if (sectionsData) {
            console.log("Fetched sections:", sectionsData);
            setSections(sectionsData);
          } else {
            setSections([]);
          }
        } catch (error) {
          console.error("Error fetching sections:", error);
          toast.error("Không thể tải sections: " + error);
        }
      };
      fetchSections();
    }
  }, [selectedWorkspace]);

  return (
    <>
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

        {/* Sections */}
        {selectedWorkspace && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {/* Sections List */}
              <SectionList
                sections={sections || []}
                selectedChannel={selectedChannel}
                onChannelSelect={handleChannelSelectInternal}
                onInvitePeople={handleInvitePeople}
                onChannelSettings={handleChannelSettings}
                onCreateChannel={handleCreateChannel}
              />
            </div>
          </div>
        )}
      </div>

      {/* Invite People Modal */}
      <InvitePeopleModal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSelectedChannelForAction(null);
        }}
        workspaceName={selectedWorkspace?.name || ""}
        channelName={
          selectedChannelForAction?.channelName ||
          selectedChannel?.channelName ||
          "general"
        }
      />

      {/* Add Channel Modal */}
      <AddChannelModal
        isOpen={showAddChannelModal}
        onClose={() => {
          setShowAddChannelModal(false);
          setSelectedSectionId(null);
        }}
        workspace={selectedWorkspace}
        sectionId={selectedSectionId}
        onChannelCreated={handleChannelCreated}
      />

      {/* Channel Settings Modal */}
      {showSettingsModal && selectedChannelForAction && (
        <ChannelSettings
          channel={convertToChannelSettings(selectedChannelForAction)}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveChannelSettings}
          onDelete={handleDeleteChannel}
        />
      )}
    </>
  );
};

export default ChannelPanel;
