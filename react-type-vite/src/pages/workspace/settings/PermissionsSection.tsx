import React from "react";
import { Shield, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";

export const PermissionsSection: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Placeholder Card */}
      <Card className="bg-[#1e1f22] border-[#1e1f22] p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#5865f2]/20 flex items-center justify-center">
            <Shield className="w-8 h-8 text-[#5865f2]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              Permissions Management
            </h3>
            <p className="text-[#b5bac1] max-w-md">
              Future permissions customization will be available here. You'll be
              able to control who can send messages, manage threads, and perform
              other actions in this channel.
            </p>
          </div>
        </div>
      </Card>

      {/* Info Cards */}
      <div className="grid gap-4">
        <Card className="bg-[#1e1f22] border-[#1e1f22] p-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-[#5865f2] flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-white">Coming Soon</div>
              <div className="text-sm text-[#b5bac1]">
                Advanced permission controls including role-based access,
                message permissions, thread management, and more will be added
                in a future update.
              </div>
            </div>
          </div>
        </Card>

        <Card className="bg-[#1e1f22] border-[#1e1f22] p-4">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded bg-[#5865f2]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#5865f2] text-xs font-bold">ℹ</span>
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-white">Current Behavior</div>
              <div className="text-sm text-[#b5bac1]">
                Currently, all channel members have equal permissions. Private
                channels are only accessible to invited members, while public
                channels are visible to all workspace members.
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
