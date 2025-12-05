import React, { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast.ts";

interface DeleteChannelSectionProps {
  channelName: string;
  onDelete: () => Promise<void>;
  onCancel: () => void;
}

export const DeleteChannelSection: React.FC<DeleteChannelSectionProps> = ({
  channelName,
  onDelete,
  onCancel,
}) => {
  const [confirmText, setConfirmText] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDeleteClick = () => {
    if (confirmText === channelName) {
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete();
      toast({
        title: "Channel Deleted",
        description: "The channel has been permanently deleted.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete channel. Please try again.",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  const isConfirmValid = confirmText === channelName;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Warning Card */}
      <Card className="bg-[#f23f42]/10 border-[#f23f42]/20 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#f23f42] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-[#f23f42]">Danger Zone</div>
            <div className="text-sm text-[#f23f42]/90">
              Deleting a channel is permanent and cannot be undone. All
              messages, files, and channel history will be lost forever.
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Form */}
      <Card className="bg-[#1e1f22] border-[#1e1f22] p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">Delete Channel</h3>
          <p className="text-sm text-[#b5bac1]">
            Once you delete a channel, there is no going back. Please be
            certain.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="confirmChannelName"
              className="text-sm text-[#b5bac1]"
            >
              To confirm deletion, type the channel name:{" "}
              <span className="font-semibold text-white">{channelName}</span>
            </Label>
            <Input
              id="confirmChannelName"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type "${channelName}" to confirm`}
              className="bg-[#2b2d31] border-[#1e1f22] text-white focus:border-[#f23f42]"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleDeleteClick}
              disabled={!isConfirmValid || isDeleting}
              className="bg-[#f23f42] hover:bg-[#d83639] text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Channel"}
            </Button>
            <Button
              variant="ghost"
              onClick={onCancel}
              className="text-white hover:bg-[#404249]"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>

      {/* What Gets Deleted */}
      <Card className="bg-[#1e1f22] border-[#1e1f22] p-6">
        <div className="space-y-4">
          <h4 className="font-semibold text-white">What gets deleted?</h4>
          <ul className="space-y-2 text-sm text-[#b5bac1]">
            <li className="flex items-start gap-2">
              <span className="text-[#f23f42] mt-1">•</span>
              <span>All messages and conversation history</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f23f42] mt-1">•</span>
              <span>All files and attachments shared in this channel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f23f42] mt-1">•</span>
              <span>All channel settings and configurations</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f23f42] mt-1">•</span>
              <span>Member associations with this channel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#f23f42] mt-1">•</span>
              <span>Any integrations connected to this channel</span>
            </li>
          </ul>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-[#2b2d31] border-[#1e1f22]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#f23f42]" />
              Delete Channel "{channelName}"?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#b5bac1]">
              This action cannot be undone. This will permanently delete the
              channel and remove all associated data including messages, files,
              and history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-[#1e1f22] text-white hover:bg-[#404249]"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-[#f23f42] hover:bg-[#d83639] text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Channel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
