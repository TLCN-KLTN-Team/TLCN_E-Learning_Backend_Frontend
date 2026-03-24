import { MoreHorizontal } from "lucide-react";
import type { WorkspaceResponse } from "@/types/chat.types";
import WorkspaceItem from "./WorkspaceItem";

interface WorkspaceListProps {
  workspaces: WorkspaceResponse[];
  selectedWorkspace: WorkspaceResponse | null;
  hasMoreWorkspaces: boolean;
  onWorkspaceSelect: (workspace: WorkspaceResponse) => void;
  onLoadMore: () => void;
}

const WorkspaceList = ({
  workspaces,
  selectedWorkspace,
  hasMoreWorkspaces,
  onWorkspaceSelect,
  onLoadMore,
}: WorkspaceListProps) => {
  return (
    <>
      {/* Workspace Icons */}
      {workspaces.map((workspace) => (
        <WorkspaceItem
          key={workspace.id}
          workspace={workspace}
          isSelected={selectedWorkspace?.id === workspace.id}
          onSelect={onWorkspaceSelect}
        />
      ))}

      {/* Show More Button */}
      {hasMoreWorkspaces && (
        <div
          onClick={onLoadMore}
          className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-2xl hover:rounded-xl transition-all duration-200 flex items-center justify-center cursor-pointer group relative"
        >
          <MoreHorizontal className="w-5 h-5 text-gray-400 group-hover:text-white" />
          <div className="absolute left-16 bg-black text-white px-2 py-1 rounded text-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
            Xem thêm workspaces
          </div>
        </div>
      )}
    </>
  );
};

export default WorkspaceList;
