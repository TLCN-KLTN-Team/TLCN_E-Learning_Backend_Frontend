import * as notificationApi from "@/services/api/notificationApi";
import type { Post } from "@/services/api/forumApi";

const BOOKMARK_STORAGE_PREFIX = "forum-bookmarks";

export type ForumBookmark = Pick<
  Post,
  | "id"
  | "title"
  | "content"
  | "userId"
  | "categoryId"
  | "createdAt"
  | "viewCount"
  | "tags"
  | "score"
  | "commentCount"
  | "authorName"
  | "authorAvatar"
  | "recentCommenterAvatars"
>;

export const getForumBookmarkStorageKey = (userId?: string) => {
  return `${BOOKMARK_STORAGE_PREFIX}:${userId || "guest"}`;
};

export const readForumBookmarks = (userId?: string): ForumBookmark[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(getForumBookmarkStorageKey(userId));
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to read forum bookmarks", error);
    return [];
  }
};

export const writeForumBookmarks = (userId: string | undefined, bookmarks: ForumBookmark[]) => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getForumBookmarkStorageKey(userId), JSON.stringify(bookmarks));
};

export const toggleForumBookmark = (userId: string | undefined, post: ForumBookmark) => {
  const currentBookmarks = readForumBookmarks(userId);
  const exists = currentBookmarks.some((item) => item.id === post.id);

  const nextBookmarks = exists
    ? currentBookmarks.filter((item) => item.id !== post.id)
    : [post, ...currentBookmarks];

  writeForumBookmarks(userId, nextBookmarks);
  return nextBookmarks;
};

export const isForumBookmarked = (userId: string | undefined, postId: string) => {
  return readForumBookmarks(userId).some((item) => item.id === postId);
};

interface ForumNotificationInput {
  recipientId?: string;
  senderId?: string;
  message: string;
  link: string;
  type?: string;
}

export const sendForumNotification = async ({
  recipientId,
  senderId,
  message,
  link,
  type = "FORUM",
}: ForumNotificationInput) => {
  if (!recipientId || recipientId === senderId) {
    return;
  }

  try {
    await notificationApi.sendNotification({
      userId: recipientId,
      senderId,
      type,
      message,
      link,
    });
  } catch (error) {
    console.error("Failed to send forum notification", error);
  }
};