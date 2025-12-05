import React, { useState } from "react";
import { ChannelSettings } from "./settings/index.ts";
import type { Channel } from "@/types/channel.types";
import { ChannelType, ChannelStatus } from "@/types/channel.types";
import { Button } from "@/components/ui/button";

/**
 * Example/Demo component showing how to use the ChannelSettings component
 *
 * Usage:
 * 1. Import ChannelSettings from '@/pages/workspace/settings'
 * 2. Provide a Channel object with all required properties
 * 3. Implement onSave and onDelete handlers
 * 4. Control visibility with state (e.g., isOpen)
 */

export const ChannelSettingsDemo: React.FC = () => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Mock channel data - Replace with actual data from your API/state
  const mockChannel: Channel = {
    id: "ch_123456",
    participantHash: "u123_u456_u789",
    channelName: "chao-mung-va-noi-quy",
    description: "Let everyone know how to use this channel!",
    workspaceId: "workspace-12345",
    classId: 502,
    memberIds: ["u123", "u456", "u789"],
    isPrivate: true,
    type: ChannelType.TEXT,
    status: ChannelStatus.ACTIVE,
    durationMinutes: 45,
  };

  // Handler for saving channel changes
  const handleSaveChannel = async (channelData: Channel) => {
    console.log("Saving channel data:", channelData);

    // TODO: Implement your API call here
    // Example:
    // await channelService.updateChannel(channelData.id, channelData);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Channel saved successfully!");
  };

  // Handler for deleting channel
  const handleDeleteChannel = async (channelId: string) => {
    console.log("Deleting channel:", channelId);

    // TODO: Implement your API call here
    // Example:
    // await channelService.deleteChannel(channelId);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Channel deleted successfully!");
    setIsSettingsOpen(false);

    // Navigate away or update UI after deletion
    // Example: navigate('/workspace');
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Channel Settings Demo</h1>

        <div className="bg-[#2b2d31] p-6 rounded-lg space-y-4">
          <h2 className="text-lg font-semibold text-white">Current Channel</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[#949ba4]">Name:</div>
              <div className="text-white">{mockChannel.channelName}</div>
            </div>
            <div>
              <div className="text-[#949ba4]">Type:</div>
              <div className="text-white">{mockChannel.type}</div>
            </div>
            <div>
              <div className="text-[#949ba4]">Status:</div>
              <div className="text-white">{mockChannel.status}</div>
            </div>
            <div>
              <div className="text-[#949ba4]">Members:</div>
              <div className="text-white">{mockChannel.memberIds.length}</div>
            </div>
          </div>

          <Button
            onClick={() => setIsSettingsOpen(true)}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
          >
            Open Channel Settings
          </Button>
        </div>

        <div className="bg-[#1e1f22] p-6 rounded-lg space-y-4">
          <h3 className="font-semibold text-white">Integration Instructions</h3>
          <div className="text-sm text-[#b5bac1] space-y-2">
            <p>To integrate this into your workspace page:</p>
            <ol className="list-decimal list-inside space-y-1 pl-2">
              <li>Import the ChannelSettings component</li>
              <li>Fetch your channel data from the API</li>
              <li>Implement onSave handler to update channel via API</li>
              <li>Implement onDelete handler to delete channel via API</li>
              <li>Add a button/trigger to open the settings modal</li>
              <li>Handle the onClose callback to hide the modal</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Channel Settings Modal */}
      {isSettingsOpen && (
        <ChannelSettings
          channel={mockChannel}
          onClose={() => setIsSettingsOpen(false)}
          onSave={handleSaveChannel}
          onDelete={handleDeleteChannel}
        />
      )}
    </div>
  );
};
