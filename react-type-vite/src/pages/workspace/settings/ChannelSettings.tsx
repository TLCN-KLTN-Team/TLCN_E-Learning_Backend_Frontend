import React, { useState } from "react";
import { X, Settings, Users, Shield, Puzzle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Channel } from "@/types/channel.types";
import { OverviewSection } from "./OverviewSection.tsx";
import { MembersSection } from "./MembersSection.tsx";
import { PermissionsSection } from "./PermissionsSection.tsx";
import { IntegrationsSection } from "./IntegrationsSection.tsx";
import { DeleteChannelSection } from "./DeleteChannelSection.tsx";
import { useToast } from "@/hooks/use-toast.ts";

type SettingsTab =
  | "overview"
  | "permissions"
  | "members"
  | "integrations"
  | "delete";

interface ChannelSettingsProps {
  channel: Channel;
  onClose: () => void;
  onSave: (channelData: Channel) => Promise<void>;
  onDelete: (channelId: string) => Promise<void>;
}

export const ChannelSettings: React.FC<ChannelSettingsProps> = ({
  channel,
  onClose,
  onSave,
  onDelete,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("overview");
  const [channelData, setChannelData] = useState<Channel>(channel);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleDataChange = (updates: Partial<Channel>) => {
    setChannelData((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(channelData);
      setHasChanges(false);
      toast({
        title: "Success",
        description: "Channel settings saved successfully",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save channel settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setChannelData(channel);
    setHasChanges(false);
  };

  const menuItems = [
    { id: "overview" as SettingsTab, label: "Overview", icon: Settings },
    { id: "permissions" as SettingsTab, label: "Permissions", icon: Shield },
    { id: "members" as SettingsTab, label: "Members", icon: Users },
    { id: "integrations" as SettingsTab, label: "Integrations", icon: Puzzle },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
      <div className="bg-[#2b2d31] w-full max-w-7xl h-[90vh] rounded-lg flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-[#1e1f22] p-4 flex flex-col">
          {/* Channel Header */}
          <div className="mb-6">
            <div className="text-xs font-semibold text-[#949ba4] uppercase mb-2">
              # {channelData.channelName}
            </div>
            <div className="text-sm text-[#b5bac1]">Channel Settings</div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-[#404249] text-white"
                    : "text-[#b5bac1] hover:bg-[#35373c] hover:text-[#dbdee1]"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}

            <div className="pt-4">
              <button
                onClick={() => setActiveTab("delete")}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium transition-colors ${
                  activeTab === "delete"
                    ? "bg-[#404249] text-[#f23f42]"
                    : "text-[#f23f42] hover:bg-[#35373c]"
                }`}
              >
                <Trash2 className="w-4 h-4" />
                Delete Channel
              </button>
            </div>
          </nav>

          {/* ESC to close */}
          <div className="text-xs text-[#949ba4] mt-4">
            <kbd className="px-2 py-1 bg-[#111214] rounded text-[10px]">
              ESC
            </kbd>{" "}
            to close
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-[#1e1f22]">
            <h2 className="text-xl font-semibold text-white capitalize">
              {activeTab === "delete" ? "Delete Channel" : activeTab}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-[#b5bac1] hover:text-white hover:bg-[#404249]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {activeTab === "overview" && (
              <OverviewSection
                channelData={channelData}
                onDataChange={handleDataChange}
              />
            )}
            {activeTab === "permissions" && <PermissionsSection />}
            {activeTab === "members" && (
              <MembersSection
                channelData={channelData}
                onDataChange={handleDataChange}
              />
            )}
            {activeTab === "integrations" && <IntegrationsSection />}
            {activeTab === "delete" && (
              <DeleteChannelSection
                channelName={channelData.channelName}
                onDelete={() => onDelete(channelData.id)}
                onCancel={() => setActiveTab("overview")}
              />
            )}
          </div>

          {/* Footer Actions (only for overview and members) */}
          {(activeTab === "overview" || activeTab === "members") && (
            <div className="px-8 py-4 bg-[#1e1f22] border-t border-[#111214] flex items-center justify-between">
              <div className="text-sm text-[#b5bac1]">
                {hasChanges && "Careful — you have unsaved changes!"}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={!hasChanges}
                  className="text-white hover:underline"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
