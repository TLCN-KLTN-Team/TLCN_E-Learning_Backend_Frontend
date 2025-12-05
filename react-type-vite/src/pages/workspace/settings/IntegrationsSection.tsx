import React from "react";
import { Puzzle, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";

export const IntegrationsSection: React.FC = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Placeholder Card */}
      <Card className="bg-[#1e1f22] border-[#1e1f22] p-8">
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#5865f2]/20 flex items-center justify-center">
            <Puzzle className="w-8 h-8 text-[#5865f2]" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              No Integrations Yet
            </h3>
            <p className="text-[#b5bac1] max-w-md">
              Connect this channel to external services and tools to enhance
              your workspace experience. Integrations will be available in a
              future update.
            </p>
          </div>
        </div>
      </Card>

      {/* Info Card */}
      <Card className="bg-[#1e1f22] border-[#1e1f22] p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#faa61a] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-white">Coming Soon</div>
            <div className="text-sm text-[#b5bac1]">
              Future integrations may include webhooks, bots, third-party
              services, notification systems, and automation tools to streamline
              your workflow.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
