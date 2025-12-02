import { useEffect, useState } from "react";
import ChannelList from "./ChannelList";
import InvitePeopleButton from "@/components/student/workspace/channel/InvitePeopleButton";
import InvitePeopleModal from "@/components/student/workspace/channel/InvitePeopleModal";
import { PackagePlus } from "lucide-react";
import AddChannelModal from "./AddChannelModal";

import { toast } from "react-toastify";
import type { ChannelResponse, WorkspaceResponse } from "@/types/chat.types";
import { getBasicChannelsByWorkspaceId } from "@/services/api/channel.api";

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
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [channels, setChannels] = useState<ChannelResponse[]>([]);

  // Function to handle new channel creation
  const handleChannelCreated = (newChannel: ChannelResponse) => {
    // Convert ChannelResponse to BasicChannelResponse format
    const basicChannel: ChannelResponse = {
      id: newChannel.id,
      channelName: newChannel.channelName,
      participantHash: newChannel.participantHash || null,
      isPrivate: newChannel.isPrivate,
      endTime: newChannel.endTime,
    };

    // Add new channel to the list
    setChannels((prevChannels) => [...prevChannels, basicChannel]);

    // Note: We could auto-select the new channel here if desired:
    // onChannelSelect(newChannel);
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
            setChannels(chennelsData);
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
              {/* Text Channels */}
              <ChannelList
                channels={channels || []}
                selectedChannel={selectedChannel}
                onChannelSelect={onChannelSelect}
              />

              {/* Add Channel Button */}
              <div className="px-2 my-2">
                <button
                  className="w-full flex items-center justify-center bg-gray-700 hover:bg-gray-600 text-gray-400 hover:text-white rounded-lg px-4 py-2 transition-colors"
                  onClick={() => setShowAddChannel(true)}
                >
                  <PackagePlus className="w-4 h-4 mr-2" />
                  <span className="text-sm">Thêm kênh</span>
                </button>
              </div>

              {/* Invite People Button */}
              <div className="px-2">
                <InvitePeopleButton onClick={() => setShowInviteModal(true)} />
              </div>
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

      {/* Add Channel Modal */}
      <AddChannelModal
        isOpen={showAddChannel}
        onClose={() => setShowAddChannel(false)}
        workspace={selectedWorkspace}
        onChannelCreated={handleChannelCreated}
      />
    </>
  );
};

export default ChannelPanel;
