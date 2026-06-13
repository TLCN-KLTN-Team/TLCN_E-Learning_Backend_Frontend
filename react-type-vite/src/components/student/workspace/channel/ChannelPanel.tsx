import { useEffect, useState } from "react";
import SectionList from "../section/SectionList";
import InvitePeopleModal from "@/components/student/workspace/channel/InvitePeopleModal";
import AddChannelModal from "@/components/student/workspace/channel/AddChannelModal";

import { toast } from "react-toastify";
import type {
  ChannelResponse,
  BasicChannelResponse,
  WorkspaceResponse,
  SectionResponse,
} from "@/types/chat.types";
import { getSectionsByWorkspaceId } from "@/services/api/workspace/section.api";
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
  const [sections, setSections] = useState<SectionResponse[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [channelDetailsMap, setChannelDetailsMap] = useState<
    Map<string, ChannelResponse>
  >(new Map());
  const [selectedChannelForAction, setSelectedChannelForAction] =
    useState<BasicChannelResponse | null>(null);

  // Handle invite people to a specific channel
  const handleInvitePeople = (channel: BasicChannelResponse) => {
    setSelectedChannelForAction(channel);
    setShowInviteModal(true);
  };

  // const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Handle channel settings
  const handleChannelSettings = (channel: BasicChannelResponse) => {
    setSelectedChannelForAction(channel);
    // setShowSettingsModal(true);
    console.log("Channel settings for:", channel.name);
  };

  // // Handle save channel settings
  // const handleSaveChannelSettings = async (channelData: Channel) => {
  //   try {
  //     // TODO: Call API to update channel
  //     console.log("Saving channel data:", channelData);
  //     toast.success("Cập nhật channel thành công!");
  //     setShowSettingsModal(false);
  //     // Refresh sections to get updated channel data
  //     if (selectedWorkspace) {
  //       try {
  //         const sectionsData = await getSectionsByWorkspaceId(
  //           selectedWorkspace.id,
  //         );
  //         setSections(sectionsData);
  //       } catch (error) {
  //         console.error("Error refreshing sections:", error);
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error saving channel:", error);
  //     toast.error("Không thể cập nhật channel");
  //     throw error;
  //   }
  // };

  // // Handle delete channel
  // const handleDeleteChannel = async (channelId: string) => {
  //   try {
  //     // TODO: Call API to delete channel
  //     console.log("Deleting channel:", channelId);
  //     toast.success("Xóa channel thành công!");
  //     setShowSettingsModal(false);
  //     // Refresh sections
  //     if (selectedWorkspace) {
  //       try {
  //         const sectionsData = await getSectionsByWorkspaceId(
  //           selectedWorkspace.id,
  //         );
  //         setSections(sectionsData);
  //       } catch (error) {
  //         console.error("Error refreshing sections:", error);
  //       }
  //     }
  //     // If deleted channel was selected, clear selection
  //     if (selectedChannel?.id === channelId) {
  //       onChannelSelect(null as any);
  //     }
  //   } catch (error) {
  //     console.error("Error deleting channel:", error);
  //     toast.error("Không thể xóa channel");
  //     throw error;
  //   }
  // };

  // Handle toggle section expand
  const handleToggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Handle channel created callback
  const handleChannelCreated = (_sectionId: string) => {
    // Refresh sections to show new channel
    if (selectedWorkspace) {
      getSectionsByWorkspaceId(selectedWorkspace.id)
        .then((sectionsData) => {
          setSections(sectionsData);
          toast.success("Kênh đã được tạo thành công!");
        })
        .catch((error) => {
          console.error("Error refreshing sections:", error);
          toast.error(
            "Không thể làm mới danh sách kênh. Vui lòng tải lại trang.",
          );
        });
    }
  };

  // Handle channel select - fetch full details if needed
  const handleChannelSelectInternal = async (
    channel: BasicChannelResponse,
  ) => {
    try {
      // If we already have full details, use them
      const cachedDetails = channelDetailsMap.get(channel.id);
      if (cachedDetails) {
        onChannelSelect(cachedDetails);
        return;
      }

      // Otherwise fetch full channel details
      const fullChannel = await getChannel(channel.id);

      // Cache the details
      setChannelDetailsMap((prev) => {
        const newMap = new Map(prev);
        newMap.set(channel.id, fullChannel);
        return newMap;
      });

      onChannelSelect(fullChannel);
    } catch (error) {
      console.error("Error fetching channel details:", error);
      toast.error("Không thể tải thông tin chi tiết kênh. Vui lòng thử lại.");
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

            // Auto-expand public section
            const publicSection = sectionsData.find((sec) => sec.isPublic);
            if (publicSection) {
              setExpandedSections(new Set([publicSection.id]));
            }
          } else {
            setSections([]);
            setExpandedSections(new Set());
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
                expandedSections={expandedSections}
                onToggleSection={handleToggleSection}
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
          selectedChannelForAction?.name || selectedChannel?.name || "general"
        }
      />

      {/* Add Channel Modal */}
      <AddChannelModal
        isOpen={showAddChannelModal}
        onClose={() => {
          setShowAddChannelModal(false);
        }}
        onChannelCreated={handleChannelCreated}
      />

      {/* Channel Settings Modal */}
      {/* {showSettingsModal && selectedChannelForAction && (
        <ChannelSettings
          channel={selectedChannel}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSaveChannelSettings}
          onDelete={handleDeleteChannel}
        />
      )} */}
    </>
  );
};

export default ChannelPanel;
