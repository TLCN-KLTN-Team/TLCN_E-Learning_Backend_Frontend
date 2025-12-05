import React, { useState } from "react";
import { Search, UserPlus, UserMinus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Channel, ChannelMember } from "@/types/channel.types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar.tsx";
import { Label } from "@/components/ui/label";

interface MembersSectionProps {
  channelData: Channel;
  onDataChange: (updates: Partial<Channel>) => void;
}

export const MembersSection: React.FC<MembersSectionProps> = ({
  channelData,
  onDataChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMemberSearch, setNewMemberSearch] = useState("");
  const [selectedNewMember, setSelectedNewMember] = useState<string | null>(
    null
  );

  // Mock members data - In production, this would come from an API
  const getMemberDetails = (memberId: string): ChannelMember => {
    const mockMembers: Record<string, ChannelMember> = {
      u123: {
        id: "u123",
        fullName: "Nguyễn Văn A",
        email: "nguyenvana@example.com",
      },
      u456: {
        id: "u456",
        fullName: "Trần Thị B",
        email: "tranthib@example.com",
      },
      u789: { id: "u789", fullName: "Lê Văn C", email: "levanc@example.com" },
      u101: {
        id: "u101",
        fullName: "Phạm Thị D",
        email: "phamthid@example.com",
      },
      u102: {
        id: "u102",
        fullName: "Hoàng Văn E",
        email: "hoangvane@example.com",
      },
    };
    return mockMembers[memberId] || { id: memberId, fullName: "Unknown User" };
  };

  const members = channelData.memberIds.map(getMemberDetails);

  const filteredMembers = members.filter((member) =>
    member.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mock available users to add
  const availableUsers: ChannelMember[] = [
    { id: "u101", fullName: "Phạm Thị D", email: "phamthid@example.com" },
    { id: "u102", fullName: "Hoàng Văn E", email: "hoangvane@example.com" },
  ].filter((user) => !channelData.memberIds.includes(user.id));

  const filteredAvailableUsers = availableUsers.filter(
    (user) =>
      user.fullName.toLowerCase().includes(newMemberSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(newMemberSearch.toLowerCase())
  );

  const handleRemoveMember = (memberId: string) => {
    const updatedMemberIds = channelData.memberIds.filter(
      (id) => id !== memberId
    );
    onDataChange({ memberIds: updatedMemberIds });
  };

  const handleAddMember = () => {
    if (
      selectedNewMember &&
      !channelData.memberIds.includes(selectedNewMember)
    ) {
      const updatedMemberIds = [...channelData.memberIds, selectedNewMember];
      onDataChange({ memberIds: updatedMemberIds });
      setIsAddDialogOpen(false);
      setNewMemberSearch("");
      setSelectedNewMember(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header with Search and Add Button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6d6f78]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="pl-10 bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#00a8fc]"
          />
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2b2d31] border-[#1e1f22] text-white">
            <DialogHeader>
              <DialogTitle className="text-white">
                Add Member to Channel
              </DialogTitle>
              <DialogDescription className="text-[#b5bac1]">
                Search for users to add to this channel
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[#b5bac1]">Search Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#6d6f78]" />
                  <Input
                    value={newMemberSearch}
                    onChange={(e) => setNewMemberSearch(e.target.value)}
                    placeholder="Search by name or email..."
                    className="pl-10 bg-[#1e1f22] border-[#1e1f22] text-white focus:border-[#00a8fc]"
                  />
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredAvailableUsers.length === 0 ? (
                  <div className="text-center py-8 text-[#6d6f78]">
                    No users available to add
                  </div>
                ) : (
                  filteredAvailableUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedNewMember(user.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                        selectedNewMember === user.id
                          ? "bg-[#404249] ring-2 ring-[#5865f2]"
                          : "hover:bg-[#35373c]"
                      }`}
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-[#5865f2] text-white">
                          {getInitials(user.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-white">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-[#949ba4]">
                          {user.email}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setNewMemberSearch("");
                  setSelectedNewMember(null);
                }}
                className="text-white hover:bg-[#404249]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddMember}
                disabled={!selectedNewMember}
                className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
              >
                Add Member
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Members Count */}
      <div className="text-sm text-[#b5bac1]">
        <span className="font-semibold text-white">{members.length}</span>{" "}
        member
        {members.length !== 1 ? "s" : ""} in this channel
      </div>

      {/* Members Table */}
      <div className="rounded-lg border border-[#1e1f22] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-[#1e1f22] hover:bg-transparent">
              <TableHead className="text-[#949ba4] font-semibold uppercase text-xs">
                Member
              </TableHead>
              <TableHead className="text-[#949ba4] font-semibold uppercase text-xs">
                Email
              </TableHead>
              <TableHead className="text-[#949ba4] font-semibold uppercase text-xs text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-12 text-[#6d6f78]"
                >
                  No members found
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
                <TableRow
                  key={member.id}
                  className="border-[#1e1f22] hover:bg-[#2b2d31]"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback className="bg-[#5865f2] text-white">
                          {getInitials(member.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-white">
                        {member.fullName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#b5bac1]">
                    {member.email || "No email"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-[#f23f42] hover:text-[#f23f42] hover:bg-[#f23f42]/10"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Info Card */}
      <div className="bg-[#1e1f22] rounded-lg p-4 border border-[#1e1f22]">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-[#5865f2]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-[#5865f2] text-lg">ℹ</span>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-white">
              About Channel Members
            </div>
            <div className="text-sm text-[#b5bac1]">
              Members added to this channel will be able to view and participate
              in channel activities. Private channels are only visible to added
              members.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
