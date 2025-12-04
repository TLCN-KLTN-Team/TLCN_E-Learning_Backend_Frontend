import { useEffect, useState } from "react";
import ChannelList from "./ChannelList";
import InvitePeopleModal from "@/components/student/workspace/channel/InvitePeopleModal";
import AddGroupModal from "../group/AddGroupModal";

import { toast } from "react-toastify";
import type {
  ChannelResponse,
  WorkspaceResponse,
  GroupResponse,
} from "@/types/chat.types";
import { getBasicChannelsByWorkspaceId } from "@/services/api/channel.api";
import { getAllGroupsByChannelId } from "@/services/api/workspace/group.api";

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
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [channels, setChannels] = useState<ChannelResponse[]>([]);
  const [selectedChannelForAction, setSelectedChannelForAction] =
    useState<ChannelResponse | null>(null);

  // Handle invite people to a specific channel
  const handleInvitePeople = (channel: ChannelResponse) => {
    setSelectedChannelForAction(channel);
    setShowInviteModal(true);
  };

  // Handle create group for a specific channel
  const handleCreateGroup = (channel: ChannelResponse) => {
    setSelectedChannelForAction(channel);
    setShowAddGroup(true);
  };

  // Handle group creation
  const handleGroupCreated = (newGroup: GroupResponse) => {
    // Update the channels list to include the new group
    setChannels((prevChannels) =>
      prevChannels.map((channel) =>
        channel.id === newGroup.channelId
          ? {
              ...channel,
              groups: [...(channel.groups || []), newGroup],
            }
          : channel
      )
    );
  };

  useEffect(() => {
    if (selectedWorkspace) {
      // Fetch channels from workspaceId
      const fetchChannels = async () => {
        try {
          const chennelsData: ChannelResponse[] =
            await getBasicChannelsByWorkspaceId(selectedWorkspace.id);
          if (chennelsData) {
            console.log("Fetched channels:", chennelsData);

            // Fetch groups for each channel
            const channelsWithGroups = await Promise.all(
              chennelsData.map(async (channel) => {
                try {
                  const groups = await getAllGroupsByChannelId(channel.id);
                  return { ...channel, groups };
                } catch (error) {
                  console.error(
                    `Error fetching groups for channel ${channel.id}:`,
                    error
                  );
                  return { ...channel, groups: [] };
                }
              })
            );

            setChannels(channelsWithGroups);
          } else {
            setChannels([]);
          }
        } catch (error) {
          toast.error("Không thể tải kênh " + error);
        }
      };
      fetchChannels();
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

        {/* Channels */}
        {selectedWorkspace && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {/* Section Header */}
              <div className="flex items-center justify-between px-2 py-2 mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Kênh văn bản
                </h3>
              </div>

              {/* Text Channels */}
              <ChannelList
                channels={channels || []}
                selectedChannel={selectedChannel}
                onChannelSelect={onChannelSelect}
                onInvitePeople={handleInvitePeople}
                onCreateGroup={handleCreateGroup}
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

      {/* Add Group Modal */}
      <AddGroupModal
        isOpen={showAddGroup}
        onClose={() => {
          setShowAddGroup(false);
          setSelectedChannelForAction(null);
        }}
        onGroupCreated={handleGroupCreated}
      />
    </>
  );
};

export default ChannelPanel;
