import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Channel } from "@/types/channel.types";
import { ChannelType, ChannelStatus } from "@/types/channel.types";
import { Card } from "@/components/ui/card";

interface OverviewSectionProps {
  channelData: Channel;
  onDataChange: (updates: Partial<Channel>) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  channelData,
  onDataChange,
}) => {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Channel Name */}
      <div className="space-y-2">
        <Label
          htmlFor="channelName"
          className="text-sm font-semibold text-[#b5bac1] uppercase"
        >
          Channel Name
        </Label>
        <Input
          id="channelName"
          value={channelData.channelName}
          onChange={(e) => onDataChange({ channelName: e.target.value })}
          className="bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#00a8fc]"
          placeholder="channel-name"
        />
        <p className="text-xs text-[#949ba4]">
          Choose a unique name for your channel
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label
          htmlFor="description"
          className="text-sm font-semibold text-[#b5bac1] uppercase"
        >
          Channel Topic
        </Label>
        <Textarea
          id="description"
          value={channelData.description}
          onChange={(e) => onDataChange({ description: e.target.value })}
          className="bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#00a8fc] min-h-[120px] resize-none"
          placeholder="Let everyone know how to use this channel!"
          maxLength={1024}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-[#949ba4]">
            Let everyone know how to use this channel
          </p>
          <span className="text-xs text-[#949ba4]">
            {channelData.description.length}/1024
          </span>
        </div>
      </div>

      {/* Workspace ID (Readonly) */}
      <div className="space-y-2">
        <Label
          htmlFor="workspaceId"
          className="text-sm font-semibold text-[#b5bac1] uppercase"
        >
          Workspace
        </Label>
        <Input
          id="workspaceId"
          value={channelData.workspaceId}
          readOnly
          className="bg-[#1e1f22] border-[#1e1f22] text-[#6d6f78] cursor-not-allowed"
        />
        <p className="text-xs text-[#949ba4]">
          The workspace this channel belongs to
        </p>
      </div>

      {/* Class ID (Optional) */}
      <div className="space-y-2">
        <Label
          htmlFor="classId"
          className="text-sm font-semibold text-[#b5bac1] uppercase"
        >
          Class Linked{" "}
          <span className="text-[#949ba4] normal-case">(Optional)</span>
        </Label>
        <Input
          id="classId"
          type="number"
          value={channelData.classId || ""}
          onChange={(e) =>
            onDataChange({
              classId: e.target.value ? parseInt(e.target.value) : null,
            })
          }
          className="bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#00a8fc]"
          placeholder="Enter class ID"
        />
        <p className="text-xs text-[#949ba4]">
          Link this channel to a specific class (optional)
        </p>
      </div>

      {/* Channel Type */}
      <div className="space-y-2">
        <Label
          htmlFor="channelType"
          className="text-sm font-semibold text-[#b5bac1] uppercase"
        >
          Channel Type
        </Label>
        <Select
          value={channelData.type}
          onValueChange={(value) =>
            onDataChange({ type: value as ChannelType })
          }
        >
          <SelectTrigger className="bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#00a8fc]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
            <SelectItem
              value={ChannelType.TEXT}
              className="text-white hover:bg-[#404249]"
            >
              TEXT
            </SelectItem>
            <SelectItem
              value={ChannelType.VOICE}
              className="text-white hover:bg-[#404249]"
            >
              VOICE
            </SelectItem>
            <SelectItem
              value={ChannelType.LIVE_STREAM}
              className="text-white hover:bg-[#404249]"
            >
              LIVE_STREAM
            </SelectItem>
            <SelectItem
              value={ChannelType.ASSIGNMENT}
              className="text-white hover:bg-[#404249]"
            >
              ASSIGNMENT
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-[#949ba4]">
          Define the primary purpose of this channel
        </p>
      </div>

      {/* Private Channel Toggle */}
      <Card className="bg-[#1e1f22] border-[#1e1f22] p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label
              htmlFor="isPrivate"
              className="text-sm font-semibold text-white"
            >
              Private Channel
            </Label>
            <p className="text-sm text-[#b5bac1]">
              Only invited members can see and access this channel
            </p>
          </div>
          <Switch
            id="isPrivate"
            checked={channelData.isPrivate}
            onCheckedChange={(checked: boolean) =>
              onDataChange({ isPrivate: checked })
            }
            className="data-[state=checked]:bg-[#5865f2]"
          />
        </div>
      </Card>

      {/* Duration */}
      <div className="space-y-2">
        <Label
          htmlFor="duration"
          className="text-sm font-semibold text-[#b5bac1] uppercase"
        >
          Duration (minutes)
        </Label>
        <Input
          id="duration"
          type="number"
          min="0"
          value={channelData.durationMinutes}
          onChange={(e) =>
            onDataChange({ durationMinutes: parseInt(e.target.value) || 0 })
          }
          className="bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#00a8fc]"
          placeholder="45"
        />
        <p className="text-xs text-[#949ba4]">
          After this time, the channel becomes locked
        </p>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <Label
          htmlFor="status"
          className="text-sm font-semibold text-[#b5bac1] uppercase"
        >
          Status
        </Label>
        <Select
          value={channelData.status}
          onValueChange={(value) =>
            onDataChange({ status: value as ChannelStatus })
          }
        >
          <SelectTrigger className="bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#00a8fc]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
            <SelectItem
              value={ChannelStatus.ACTIVE}
              className="text-white hover:bg-[#404249]"
            >
              ACTIVE
            </SelectItem>
            <SelectItem
              value={ChannelStatus.LOCKED}
              className="text-white hover:bg-[#404249]"
            >
              LOCKED
            </SelectItem>
            <SelectItem
              value={ChannelStatus.ARCHIVED}
              className="text-white hover:bg-[#404249]"
            >
              ARCHIVED
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-[#949ba4]">
          Control the availability of this channel
        </p>
      </div>

      {/* Participant Hash (Readonly) */}
      <div className="space-y-2">
        <Label
          htmlFor="participantHash"
          className="text-sm font-semibold text-[#b5bac1] uppercase"
        >
          Participant Hash
        </Label>
        <Input
          id="participantHash"
          value={channelData.participantHash}
          readOnly
          className="bg-[#1e1f22] border-[#1e1f22] text-[#6d6f78] cursor-not-allowed font-mono text-xs"
        />
        <p className="text-xs text-[#949ba4]">
          Auto-generated hash based on channel members
        </p>
      </div>
    </div>
  );
};
