import { useCallback } from "react";
import { useAuth } from "@/context/auth-context/useAuth";
import {
  uploadFileOnlyMessage,
  uploadMultipleFiles,
} from "@/services/api/fileUploadApi";
import { AttachmentType, MessageStatus, MessageType } from "@/types/chat.enums";
import type {
  AttachmentResponse,
  ChatMessageResponse,
  MessageUpdatePayload,
  UserResponse,
} from "@/types/chat.types";
import type { Client } from "@stomp/stompjs";
import type { FileItem } from "@/types/file.types";

interface UseSendMessageOptions {
  channelId: string | null | undefined;
  stompClient: Client | null;
  isConnected: boolean;
  addOptimisticMessage: (msg: ChatMessageResponse) => void;
  markMessageFailed: (clientMessageId: string) => void;
  applyMessageUpdate: (payload: MessageUpdatePayload) => void;
  upsertServerMessage: (msg: ChatMessageResponse) => void;
}

/**
 * Three-path send hook:
 *
 * - text-only: send only WS message
 * - mixed: send WS text message first, then upload files via /upload-multiple
 * - file-only: skip WS message, call /upload-file-only directly
 */
export const useSendMessage = ({
  channelId,
  stompClient,
  isConnected,
  addOptimisticMessage,
  markMessageFailed,
  applyMessageUpdate,
  upsertServerMessage,
}: UseSendMessageOptions) => {
  const { user } = useAuth();

  const buildFormData = (
    files: FileItem[],
    selectedChannelId: string,
    clientMessageId: string,
  ) => {
    const formData = new FormData();
    files.forEach((f) => {
      if (f.file) {
        formData.append("files", f.file);
      }
    });
    formData.append("channelId", selectedChannelId);
    formData.append("clientMessageId", clientMessageId);
    return formData;
  };

  const send = useCallback(
    (content: string, files: FileItem[]) => {
      if (!channelId || !isConnected || !stompClient?.connected) {
        console.error("Cannot send: not connected or no channel");
        return;
      }

      const clientMessageId = crypto.randomUUID();
      const trimmed = content.trim();
      const hasText = trimmed.length > 0;
      const hasFiles = files.length > 0;

      if (!hasText && !hasFiles) {
        return;
      }

      const messageType = hasText
        ? hasFiles
          ? MessageType.MIXED
          : MessageType.TEXT
        : MessageType.FILE_ONLY;

      const isTextOnly = messageType === MessageType.TEXT;
      const isMixed = messageType === MessageType.MIXED;
      const isFileOnly = messageType === MessageType.FILE_ONLY;

      // ── Build sender ──
      const nickname =
        user?.firstName || user?.lastName
          ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
          : user?.username || "Bạn";

      const sender: UserResponse = {
        id: user?.id ?? "",
        nickname,
        studentId: "",
        owner: false,
        avatarUrl: user?.avatarUrl ?? null,
      };

      // ── Build optimistic message ──
      const optimisticAttachments: AttachmentResponse[] = isTextOnly
        ? []
        : files.map((f) => ({
            id: f.id,
            fileName: f.name,
            contentType: f.file?.type || "application/octet-stream",
            fileSize: f.size,
            attachmentType: f.type.startsWith("image/")
              ? AttachmentType.IMAGE
              : AttachmentType.DOCUMENT,
            fileUrl: f.preview || "",
            uploadedAt: new Date().toISOString(),
          }));

      const optimistic: ChatMessageResponse = {
        id: `temp-${clientMessageId}`,
        channelId,
        clientMessageId,
        me: true,
        content: trimmed,
        sender,
        messageType,
        status: isTextOnly ? MessageStatus.SENT : MessageStatus.PENDING,
        attachments: optimisticAttachments,
        createdDate: new Date().toISOString(),
      };

      addOptimisticMessage(optimistic);

      // text-only & mixed must create message through WebSocket
      if (isTextOnly || isMixed) {
        try {
          stompClient.publish({
            destination: "/app/chat.sendMessage",
            body: JSON.stringify({
              channelId,
              content: trimmed,
              clientMessageId,
              textOnly: isTextOnly,
            }),
            headers: {
              "content-type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
            },
          });
        } catch (err) {
          console.error("WS publish error:", err);
          markMessageFailed(clientMessageId);
          return;
        }
      }

      // mixed: post-attach upload updates existing message
      if (isMixed) {
        const formData = buildFormData(files, channelId, clientMessageId);
        uploadMultipleFiles(formData)
          .then((payload) => {
            // HTTP fallback in case MESSAGE_UPDATED WS event is delayed/lost.
            applyMessageUpdate(payload);
          })
          .catch((err) => {
            console.error("File upload failed:", err);
            markMessageFailed(clientMessageId);
          });
        return;
      }

      // file-only: create message and attachments in one HTTP request
      if (isFileOnly) {
        const formData = buildFormData(files, channelId, clientMessageId);
        uploadFileOnlyMessage(formData)
          .then((serverMessage) => {
            upsertServerMessage({
              ...serverMessage,
              me: user?.id === serverMessage.sender?.id,
            });
          })
          .catch((err) => {
            console.error("File-only upload failed:", err);
            markMessageFailed(clientMessageId);
          });
      }
    },
    [
      channelId,
      isConnected,
      stompClient,
      user,
      addOptimisticMessage,
      markMessageFailed,
      applyMessageUpdate,
      upsertServerMessage,
    ],
  );

  return { send };
};
