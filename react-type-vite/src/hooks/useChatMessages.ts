import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/auth-context/useAuth";
import { getMessagesByChannelId } from "@/services/api/workspace/messageApi";
import type {
  AttachmentResponse,
  AttachmentItem,
  ChatMessageResponse,
  ChatEvent,
  MessageUpdatePayload,
} from "@/types/chat.types";
import { AttachmentType, MessageStatus, MessageType } from "@/types/chat.enums";
import type { Client, IMessage } from "@stomp/stompjs";
import { toast } from "react-toastify";

interface UseChatMessagesOptions {
  channelId: string | null | undefined;
  stompClient: Client | null;
  isConnected: boolean;
}

/**
 * Hook that manages the message list for a channel.
 *
 * - Fetches historical messages via REST on channel change
 * - Subscribes to `/topic/channel/{channelId}` for real-time events
 * - Handles NEW_MESSAGE  → append (dedup by clientMessageId & id)
 * - Handles MESSAGE_UPDATED → merge attachments, set status SENT
 * - Exposes helpers to insert optimistic messages & mark failures
 */
export const useChatMessages = ({
  channelId,
  stompClient,
  isConnected,
}: UseChatMessagesOptions) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const prevChannelIdRef = useRef<string | null>(null);

  const normalizeAttachments = useCallback(
    (
      attachments?: AttachmentResponse[] | AttachmentItem[],
    ): AttachmentResponse[] | undefined => {
      if (!attachments || attachments.length === 0) {
        return undefined;
      }

      return attachments.map((att) => {
        if ("attachmentType" in att) {
          return att;
        }

        return {
          id: att.id,
          fileName: att.fileName,
          contentType: "application/octet-stream",
          fileSize: att.fileSize ?? 0,
          attachmentType: att.category ?? AttachmentType.DOCUMENT,
          fileUrl: att.fileUrl,
          uploadedAt: new Date().toISOString(),
        };
      });
    },
    [],
  );

  // ──────────────────────────────────────────────
  // 1. Fetch historical messages when channel changes
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!channelId) {
      setMessages([]);
      prevChannelIdRef.current = null;
      return;
    }

    // Avoid re-fetching the same channel
    if (prevChannelIdRef.current === channelId) return;
    prevChannelIdRef.current = channelId;

    let cancelled = false;
    setLoading(true);

    getMessagesByChannelId(channelId)
      .then((data) => {
        if (cancelled) return;
        const withMe = data.map((msg) => ({
          ...msg,
          me: !!user?.id && user.id === msg.sender?.id,
        }));
        setMessages(withMe);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Error fetching messages:", err);
        toast.error("Không thể tải tin nhắn. Vui lòng thử lại sau.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [channelId, user?.id]);

  // ──────────────────────────────────────────────
  // 2. Subscribe to WS topics for real-time events
  // ──────────────────────────────────────────────
  useEffect(() => {
    if (!isConnected || !stompClient?.connected || !channelId) return;

    // 2a. Main channel topic — NEW_MESSAGE & MESSAGE_UPDATED events
    const mainSub = stompClient.subscribe(
      `/topic/channel/${channelId}`,
      (frame: IMessage) => {
        try {
          const raw = JSON.parse(frame.body);

          // Server sends MessageEvent: { type, message?, update? }
          if (raw.type && (raw.message || raw.update)) {
            const event = raw as ChatEvent;

            if (event.type === "NEW_MESSAGE" && event.message) {
              const msg = event.message;
              msg.me = user?.id === msg.sender?.id;
              handleNewMessage(msg);
            } else if (event.type === "MESSAGE_UPDATED" && event.update) {
              handleMessageUpdated(event.update);
            }
          } else {
            // Legacy fallback: bare ChatMessageResponse → treat as NEW_MESSAGE
            const msg = raw as ChatMessageResponse;
            msg.me = user?.id === msg.sender?.id;
            handleNewMessage(msg);
          }
        } catch (err) {
          console.error("Error parsing WS channel message:", err);
        }
      },
    );

    return () => {
      mainSub.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, stompClient, channelId, user?.id]);

  // ──────────────────────────────────────────────
  // 3. Event handlers
  // ──────────────────────────────────────────────

  /** Full message replacement — used when /attachments topic sends a full ChatMessageResponse */
  const handleIncomingFullMessage = useCallback(
    (incoming: ChatMessageResponse) => {
      setMessages((prev) => {
        const normalizedIncoming = {
          ...incoming,
          attachments: normalizeAttachments(incoming.attachments),
        };

        // Find by clientMessageId first, then by id
        const idx = normalizedIncoming.clientMessageId
          ? prev.findIndex(
              (m) => m.clientMessageId === normalizedIncoming.clientMessageId,
            )
          : prev.findIndex((m) => m.id === normalizedIncoming.id);

        if (idx !== -1) {
          const copy = [...prev];
          copy[idx] = {
            ...normalizedIncoming,
            me: normalizedIncoming.me,
            status: normalizedIncoming.status ?? MessageStatus.SENT,
          };
          return copy;
        }

        // Not found — append
        if (
          normalizedIncoming.id &&
          prev.some((m) => m.id === normalizedIncoming.id)
        ) {
          return prev;
        }
        return [...prev, normalizedIncoming];
      });
    },
    [normalizeAttachments],
  );

  /** NEW_MESSAGE — append, avoiding duplicates by clientMessageId and id */
  const handleNewMessage = useCallback(
    (incoming: ChatMessageResponse) => {
      setMessages((prev) => {
        const normalizedIncoming = {
          ...incoming,
          attachments: normalizeAttachments(incoming.attachments),
        };

        // If there's a clientMessageId, check if we already have a local
        // optimistic version with the same clientMessageId
        if (normalizedIncoming.clientMessageId) {
          const idx = prev.findIndex(
            (m) => m.clientMessageId === normalizedIncoming.clientMessageId,
          );
          if (idx !== -1) {
            const existing = prev[idx];
            const updated = [...prev];

            // Determine status:
            // - If the optimistic msg was PENDING (post-attach flow),
            //   keep it PENDING only for MIXED messages until MESSAGE_UPDATED
            // - Otherwise (text-only flow), use the server's status or SENT
            const isPendingMixedFlow =
              existing.status === MessageStatus.PENDING &&
              normalizedIncoming.messageType === MessageType.MIXED;

            updated[idx] = {
              ...normalizedIncoming,
              me: normalizedIncoming.me,
              status: isPendingMixedFlow
                ? MessageStatus.PENDING
                : (normalizedIncoming.status ?? MessageStatus.SENT),
              // For mixed post-attach: preserve local preview attachments
              // until MESSAGE_UPDATED merges real attachment metadata.
              attachments: isPendingMixedFlow
                ? (existing.attachments ?? [])
                : (normalizedIncoming.attachments ?? []),
            };
            return updated;
          }
        }

        // Dedup by server id
        if (
          normalizedIncoming.id &&
          prev.some((m) => m.id === normalizedIncoming.id)
        ) {
          return prev;
        }

        return [...prev, normalizedIncoming];
      });
    },
    [normalizeAttachments],
  );

  /** MESSAGE_UPDATED — find by clientMessageId, merge attachments, set SENT */
  const handleMessageUpdated = useCallback(
    (updated: MessageUpdatePayload) => {
      setMessages((prev) => {
        const key = updated.clientMessageId;
        const idx = prev.findIndex((m) => m.clientMessageId === key);

        if (idx === -1) {
          // Message not found locally — nothing to update
          return prev;
        }

        const copy = [...prev];
        const normalizedAttachments = normalizeAttachments(updated.attachments);
        copy[idx] = {
          ...copy[idx],
          status: updated.status ?? MessageStatus.SENT,
          attachments: normalizedAttachments ?? copy[idx].attachments,
        };
        return copy;
      });
    },
    [normalizeAttachments],
  );

  // ──────────────────────────────────────────────
  // 4. Public helpers for optimistic mutations
  // ──────────────────────────────────────────────

  /** Insert a local optimistic message (PENDING) */
  const addOptimisticMessage = useCallback((msg: ChatMessageResponse) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  /** Mark a message as FAILED by clientMessageId */
  const markMessageFailed = useCallback((clientMessageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.clientMessageId === clientMessageId
          ? { ...m, status: MessageStatus.FAILED }
          : m,
      ),
    );
  }, []);

  /** Remove a local optimistic message (e.g., before retry) */
  const removeOptimisticMessage = useCallback((clientMessageId: string) => {
    setMessages((prev) =>
      prev.filter((m) => m.clientMessageId !== clientMessageId),
    );
  }, []);

  /** HTTP fallback for mixed upload when MESSAGE_UPDATED socket is delayed/lost. */
  const applyMessageUpdate = useCallback(
    (payload: MessageUpdatePayload) => {
      handleMessageUpdated(payload);
    },
    [handleMessageUpdated],
  );

  /** HTTP fallback for file-only create when NEW_MESSAGE socket is delayed/lost. */
  const upsertServerMessage = useCallback(
    (incoming: ChatMessageResponse) => {
      handleIncomingFullMessage(incoming);
    },
    [handleIncomingFullMessage],
  );

  return {
    messages,
    loading,
    addOptimisticMessage,
    markMessageFailed,
    removeOptimisticMessage,
    applyMessageUpdate,
    upsertServerMessage,
  };
};
