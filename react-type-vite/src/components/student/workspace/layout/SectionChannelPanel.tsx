import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import type {
  ChannelResponse,
  BasicChannelResponse,
  WorkspaceResponse,
  SectionResponse,
  UpdateChannelRequest,
} from "@/types/chat.types";
import { SectionList } from "../section";
import { AddChannelModal, InvitePeopleModal, SessionManagementModal } from "../channel";
import { ChannelSettings } from "@/pages/workspace/settings/ChannelSettings.tsx";
import { getSectionsByWorkspaceId } from "@/services/api/workspace/section.api";
import { getChannel, updateChannel, softDeleteChannel } from "@/services/api/workspace/channel.api";


interface SectionChannelPanelProps {
  selectedWorkspace: WorkspaceResponse | null;
  selectedChannel: ChannelResponse | null;
  onChannelSelect: (channel: ChannelResponse) => void;
}

const SectionChannelPanel = ({
  selectedWorkspace,
  selectedChannel,
  onChannelSelect,
}: SectionChannelPanelProps) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [selectedSectionIdForCreate, setSelectedSectionIdForCreate] = useState<
    string | null
  >(null);
  const [sections, setSections] = useState<SectionResponse[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(),
  );
  const [channelDetailsMap, setChannelDetailsMap] = useState<
    Map<string, ChannelResponse>
  >(new Map());
  const [selectedChannelForAction, setSelectedChannelForAction] =
    useState<ChannelResponse | null>(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionModalTarget, setSessionModalTarget] = useState<{
    sectionId: string;
    sectionName: string;
  } | null>(null);
  const [inviteChannelName, setInviteChannelName] = useState<string>("");

  const handleInvitePeople = (channel: BasicChannelResponse) => {
    setInviteChannelName(channel.name);
    setShowInviteModal(true);
  };

  const handleChannelSettings = async (channel: BasicChannelResponse) => {
    const cached = channelDetailsMap.get(channel.id);
    if (cached) {
      setSelectedChannelForAction(cached);
      setShowSettingsModal(true);
      return;
    }
    try {
      const full = await getChannel(channel.id);
      setChannelDetailsMap((prev) => {
        const m = new Map(prev);
        m.set(full.id, full);
        return m;
      });
      setSelectedChannelForAction(full);
      setShowSettingsModal(true);
    } catch {
      toast.error("Không thể tải thông tin kênh");
    }
  };

  const handleSaveChannelSettings = async (request: UpdateChannelRequest) => {
    if (!selectedChannelForAction) return;
    const updated = await updateChannel(selectedChannelForAction.id, request);
    // Update cache
    setChannelDetailsMap((prev) => {
      const next = new Map(prev);
      next.set(updated.id, updated);
      return next;
    });
    // If this is the currently displayed channel, push the update up
    if (selectedChannel?.id === updated.id) {
      onChannelSelect(updated);
    }
    setSelectedChannelForAction(updated);
    toast.success("Đã cập nhật thông tin kênh");
  };

  const handleDeleteChannel = async (channelId: string) => {
    await softDeleteChannel(channelId);
    setShowSettingsModal(false);
    setSelectedChannelForAction(null);
    // Evict from cache
    setChannelDetailsMap((prev) => {
      const next = new Map(prev);
      next.delete(channelId);
      return next;
    });
    if (selectedChannel?.id === channelId) {
      onChannelSelect(null as unknown as ChannelResponse);
    }
    // Refresh sections to reflect the removed channel
    if (selectedWorkspace) {
      try {
        const sectionsData = await getSectionsByWorkspaceId(selectedWorkspace.id);
        setSections(sectionsData);
      } catch {
        // non-critical
      }
    }
    toast.success("Đã xóa kênh thành công");
  };

  // Handle create channel in section
  const handleCreateChannel = (sectionId: string) => {
    setSelectedSectionIdForCreate(sectionId);
    setShowAddChannelModal(true);
  };

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

  const handleChannelCreated = (_sectionId: string) => {
    // Modal closes itself after creation; no reload needed
  };

  const handleManageSession = (sectionId: string, sectionName: string) => {
    setSessionModalTarget({ sectionId, sectionName });
    setShowSessionModal(true);
  };

  // Handle channel select - fetch full details if needed
  const handleChannelSelectInternal = async (channel: BasicChannelResponse) => {
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
      <div className="w-64 flex-shrink-0 bg-gray-900 flex flex-col border-l border-gray-200">
        {/* Workspace Name Header */}
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
                onManageSession={handleManageSession}
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
          setInviteChannelName("");
        }}
        workspaceName={selectedWorkspace?.name || ""}
        channelName={inviteChannelName || selectedChannel?.name || "general"}
      />

      {/* Add Channel Modal */}
      <AddChannelModal
        isOpen={showAddChannelModal}
        onClose={() => {
          setShowAddChannelModal(false);
          setSelectedSectionIdForCreate(null);
        }}
        sectionId={selectedSectionIdForCreate ?? undefined}
        onChannelCreated={handleChannelCreated}
      />

      {/* Session Management Modal */}
      {sessionModalTarget && (
        <SessionManagementModal
          isOpen={showSessionModal}
          onClose={() => {
            setShowSessionModal(false);
            setSessionModalTarget(null);
          }}
          sectionId={sessionModalTarget.sectionId}
          sectionName={sessionModalTarget.sectionName}
        />
      )}

      {showSettingsModal && selectedChannelForAction && (
        <ChannelSettings
          channel={selectedChannelForAction}
          onClose={() => {
            setShowSettingsModal(false);
            setSelectedChannelForAction(null);
          }}
          onSave={handleSaveChannelSettings}
          onDelete={handleDeleteChannel}
        />
      )}
    </>
  );
};

export default SectionChannelPanel;
