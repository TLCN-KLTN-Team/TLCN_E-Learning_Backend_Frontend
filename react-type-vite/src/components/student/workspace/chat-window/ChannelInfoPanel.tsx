import {
  Bell,
  ChevronLeft,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  Loader2,
  Pin,
  Settings,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import type {
  AttachmentResponse,
  ChannelResponse,
  UserResponse,
} from "@/types/chat.types";
import {
  getChannelFiles,
  getChannelImages,
} from "@/services/api/workspace/channel.api";
import { channelMemberApi } from "@/services/api/workspace/channelMember.api";

type PanelView = "ROOT" | "MEMBERS" | "PHOTOS" | "FILES";

interface ChannelInfoPanelProps {
  channel: ChannelResponse;
  onClose: () => void;
  /** Optional: callback to open the invite dialog (Mời thành viên). */
  onInvite?: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getInitials = (name: string | null | undefined): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const ChannelInfoPanel = ({
  channel,
  onClose,
  onInvite,
}: ChannelInfoPanelProps) => {
  const [view, setView] = useState<PanelView>("ROOT");

  // Lazy-loaded data per section
  const [members, setMembers] = useState<UserResponse[]>([]);
  const [images, setImages] = useState<AttachmentResponse[]>([]);
  const [files, setFiles] = useState<AttachmentResponse[]>([]);

  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Always-loaded for badges on the root view
  useEffect(() => {
    let cancelled = false;
    setLoadingMembers(true);
    setLoadingImages(true);
    setLoadingFiles(true);

    Promise.allSettled([
      channelMemberApi
        .getActiveChannelMembers(channel.id)
        .then((data) => !cancelled && setMembers(data ?? [])),
      getChannelImages(channel.id).then(
        (data) => !cancelled && setImages(data ?? []),
      ),
      getChannelFiles(channel.id).then(
        (data) => !cancelled && setFiles(data ?? []),
      ),
    ]).finally(() => {
      if (cancelled) return;
      setLoadingMembers(false);
      setLoadingImages(false);
      setLoadingFiles(false);
    });

    return () => {
      cancelled = true;
    };
  }, [channel.id]);

  const onlineMembers = members.slice(0, 3); // placeholder presence — first 3 as "online"

  const renderHeader = () => {
    if (view === "ROOT") {
      return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <span className="text-gray-100 font-semibold text-sm">
            Thông tin kênh
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      );
    }
    const title =
      view === "MEMBERS"
        ? "Thành viên"
        : view === "PHOTOS"
          ? "Ảnh đã gửi"
          : "File đã gửi";
    return (
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
        <button
          onClick={() => setView("ROOT")}
          className="flex items-center gap-1 text-gray-300 hover:text-white"
          title="Quay lại"
        >
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-semibold">{title}</span>
        </button>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  };

  const renderRoot = () => (
    <>
      <div className="px-3 py-3 border-b border-gray-700">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-2">
          Chức năng
        </div>

        <PanelAction
          icon={<Users className="w-[18px] h-[18px]" />}
          label="Thành viên"
          badge={loadingMembers ? "…" : members.length.toString()}
          onClick={() => setView("MEMBERS")}
        />
        <PanelAction
          icon={<ImageIcon className="w-[18px] h-[18px]" />}
          label="Ảnh đã gửi"
          badge={loadingImages ? "…" : images.length.toString()}
          onClick={() => setView("PHOTOS")}
        />
        <PanelAction
          icon={<FileText className="w-[18px] h-[18px]" />}
          label="File đã gửi"
          badge={loadingFiles ? "…" : files.length.toString()}
          onClick={() => setView("FILES")}
        />
        <PanelAction
          icon={<LinkIcon className="w-[18px] h-[18px]" />}
          label="Link đã chia sẻ"
          badge="0"
          onClick={() => toast.info("Tính năng đang được phát triển")}
        />
        <PanelAction
          icon={<Pin className="w-[18px] h-[18px]" />}
          label="Tin nhắn ghim"
          badge="0"
          onClick={() => toast.info("Tính năng đang được phát triển")}
        />
        <PanelAction
          icon={<Bell className="w-[18px] h-[18px]" />}
          label="Thông báo"
          onClick={() => toast.info("Tính năng đang được phát triển")}
        />
        <PanelAction
          icon={<Settings className="w-[18px] h-[18px]" />}
          label="Cài đặt kênh"
          onClick={() => toast.info("Tính năng đang được phát triển")}
        />
      </div>

      <div className="px-3 py-3 flex-1 overflow-y-auto">
        <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-2">
          Thành viên đang online — {onlineMembers.length}
        </div>
        {loadingMembers ? (
          <div className="flex items-center gap-2 text-gray-400 text-xs px-2 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải…
          </div>
        ) : onlineMembers.length === 0 ? (
          <div className="text-gray-500 text-xs px-2 py-2 italic">
            Chưa có thành viên nào.
          </div>
        ) : (
          onlineMembers.map((m) => (
            <MemberRow key={m.id} member={m} compact />
          ))
        )}

        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold mb-2 px-2">
            Mời thành viên
          </div>
          <div className="rounded-md bg-indigo-500/10 border-l-2 border-indigo-500 px-3 py-2 mb-2">
            <p className="text-xs text-gray-300 leading-snug">
              Chia sẻ link mời hoặc tìm kiếm theo tên để thêm thành viên mới
              vào kênh.
            </p>
          </div>
          {onInvite && (
            <button
              type="button"
              onClick={onInvite}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md border border-indigo-500/60 text-indigo-300 hover:bg-indigo-500/10 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-sm">Tạo link mời</span>
            </button>
          )}
        </div>
      </div>
    </>
  );

  const renderMembers = () => (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {loadingMembers ? (
        <LoadingBox />
      ) : members.length === 0 ? (
        <EmptyBox text="Không có thành viên nào" />
      ) : (
        members.map((m) => <MemberRow key={m.id} member={m} />)
      )}
    </div>
  );

  const renderPhotos = () => (
    <div className="flex-1 overflow-y-auto px-3 py-3">
      {loadingImages ? (
        <LoadingBox />
      ) : images.length === 0 ? (
        <EmptyBox text="Chưa có ảnh nào trong kênh này." />
      ) : (
        <div className="grid grid-cols-3 gap-1.5">
          {images.map((img) => (
            <a
              key={img.id}
              href={img.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="aspect-square rounded-md overflow-hidden border border-gray-700 hover:border-indigo-500 transition-colors block"
              title={img.fileName}
            >
              <img
                src={img.fileUrl}
                alt={img.fileName}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const renderFiles = () => (
    <div className="flex-1 overflow-y-auto px-3 py-3">
      {loadingFiles ? (
        <LoadingBox />
      ) : files.length === 0 ? (
        <EmptyBox text="Chưa có file nào trong kênh này." />
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between gap-2 rounded-md bg-gray-800 px-3 py-2 border border-gray-700"
            >
              <div className="min-w-0 flex-1">
                <p
                  className="text-gray-100 text-sm truncate"
                  title={f.fileName}
                >
                  {f.fileName}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(f.fileSize)}
                </p>
              </div>
              <a
                href={f.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
                title="Tải xuống"
              >
                <Download className="w-4 h-4" />
              </a>
              <a
                href={f.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-white"
                title="Mở trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="w-72 flex-shrink-0 bg-[#1e2128] border-l border-gray-800 flex flex-col h-full">
      {renderHeader()}
      {view === "ROOT" && renderRoot()}
      {view === "MEMBERS" && renderMembers()}
      {view === "PHOTOS" && renderPhotos()}
      {view === "FILES" && renderFiles()}
    </div>
  );
};

interface PanelActionProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  onClick?: () => void;
}

const PanelAction = ({ icon, label, badge, onClick }: PanelActionProps) => (
  <button
    type="button"
    onClick={onClick}
    className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
  >
    <span className="text-gray-400">{icon}</span>
    <span className="flex-1 text-sm">{label}</span>
    {badge !== undefined && (
      <span className="text-[11px] bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
        {badge}
      </span>
    )}
  </button>
);

interface MemberRowProps {
  member: UserResponse;
  compact?: boolean;
}

const MemberRow = ({ member, compact }: MemberRowProps) => (
  <div
    className={`flex items-center gap-2.5 ${compact ? "px-2 py-1" : "px-2 py-1.5"} rounded-md hover:bg-gray-800 transition-colors`}
  >
    <div className="relative">
      {member.avatarUrl ? (
        <img
          src={member.avatarUrl}
          alt={member.nickname || "member"}
          className="w-7 h-7 rounded-full object-cover"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-indigo-600/80 text-white flex items-center justify-center text-[10px] font-semibold">
          {getInitials(member.nickname)}
        </div>
      )}
      {!compact && (
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#1e2128]" />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1">
        {member.owner ? (
          <span className="text-amber-400 text-sm font-medium truncate">
            {member.nickname || <i className="text-gray-500">Không tên</i>}
          </span>
        ) : (
          <span className="text-gray-100 text-sm truncate">
            {member.nickname || <i className="text-gray-500">Không tên</i>}
          </span>
        )}
      </div>
      <div className="text-[11px] text-gray-400 truncate">
        {member.owner ? "Giáo viên" : `MSSV: ${member.studentId ?? "—"}`}
      </div>
    </div>
    {compact && (
      <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
    )}
  </div>
);

const LoadingBox = () => (
  <div className="flex items-center justify-center py-6 text-gray-400 text-xs">
    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Đang tải…
  </div>
);

const EmptyBox = ({ text }: { text: string }) => (
  <div className="flex items-center justify-center py-6 text-gray-500 text-xs italic gap-1.5">
    <User className="w-4 h-4" /> {text}
  </div>
);

export default ChannelInfoPanel;
