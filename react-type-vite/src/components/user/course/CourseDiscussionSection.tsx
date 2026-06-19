import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, ThumbsUp, Clock, User, Loader2, AlertCircle, Trash2, Image as ImageIcon, X } from "lucide-react";
import { courseQuizDiscussionWS, type DiscussionMessage as QuizDiscussionMessage } from "@/services/websocket/courseQuizDiscussionWebSocket";
import { courseAssignmentDiscussionWS, type DiscussionMessage as AssignmentDiscussionMessage } from "@/services/websocket/courseAssignmentDiscussionWebSocket";
import { courseLessonDiscussionWS, type DiscussionMessage as LessonDiscussionMessage } from "@/services/websocket/courseLessonDiscussionWebSocket";
import { 
  getCourseQuizDiscussion, 
  postCourseQuizDiscussionMessage, 
  deleteCourseQuizDiscussionMessage,
  toggleCourseQuizDiscussionLike,
  markCourseQuizDiscussionAsRead
} from "@/services/api/courseQuizDiscussionApi";
import {
  getCourseAssignmentDiscussion,
  postCourseAssignmentDiscussionMessage,
  deleteCourseAssignmentDiscussionMessage,
  toggleCourseAssignmentDiscussionLike,
  markCourseAssignmentDiscussionAsRead
} from "@/services/api/courseAssignmentDiscussionApi";
import {
  getCourseLessonDiscussion,
  postCourseLessonDiscussionMessage,
  deleteCourseLessonDiscussionMessage,
  toggleCourseLessonDiscussionLike,
  markCourseLessonDiscussionAsRead
} from "@/services/api/courseLessonDiscussionApi";
import { uploadImage } from "@/services/api/fileUploadApi";
import { toast } from "react-toastify";
import { getAccessToken } from "@/utils/localStorageVariables";
import type { User as UserType } from "@/context/auth-context/types";
import { getUserById } from "@/services/api/userApi";
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

type DiscussionMessage = QuizDiscussionMessage | AssignmentDiscussionMessage | LessonDiscussionMessage;

interface CourseDiscussionSectionProps {
  itemType: "quiz" | "assignment" | "lesson";
  itemId: number;
  itemTitle: string;
  publishedCourseId: number;
  user?: UserType | null;
}

const CourseDiscussionSection = ({ itemType, itemId, publishedCourseId, user }: CourseDiscussionSectionProps) => {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  const [userDetails, setUserDetails] = useState<Record<string, { name: string; avatar?: string }>>({});

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeDiscussion();
    }

    return () => {
      if (itemType === "quiz") {
        courseQuizDiscussionWS.unsubscribeFromQuizDiscussion(publishedCourseId, itemId);
      } else if (itemType === "assignment") {
        courseAssignmentDiscussionWS.unsubscribeFromAssignmentDiscussion(publishedCourseId, itemId);
      } else if (itemType === "lesson") {
        courseLessonDiscussionWS.unsubscribeFromCourseLesson(publishedCourseId, itemId);
      }
    };
  }, [itemType, itemId, publishedCourseId]);

  useEffect(() => {
    const fetchUnknownUsers = async () => {
      // Find unique user IDs that aren't the current user and we haven't fetched yet
      const unknownUserIds = [...new Set(messages.map(m => m.userId))].filter(
        id => id && id !== user?.id && !userDetails[id]
      );
      
      if (unknownUserIds.length === 0) return;

      const newDetails = { ...userDetails };
      let updated = false;

      // Fetch user details concurrently
      await Promise.all(unknownUserIds.map(async (id) => {
        try {
          const userData = await getUserById(id);
          if (userData) {
            newDetails[id] = {
              name: `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || userData.username || "Người dùng",
              avatar: userData.avatarUrl || (userData as any).profilePicture
            };
            updated = true;
          }
        } catch (error) {
          console.error(`Failed to fetch user ${id}`, error);
          // Mark as fetched but unknown to prevent retry loops
          newDetails[id] = { name: "Người dùng" };
          updated = true;
        }
      }));

      if (updated) {
        setUserDetails(newDetails);
      }
    };

    fetchUnknownUsers();
  }, [messages, user?.id, userDetails]);

  const initializeDiscussion = async () => {
    try {
      setIsConnecting(true);
      setIsLoading(true);

      console.log("🔌 Initializing discussion:", { itemType, itemId, publishedCourseId });

      const token = getAccessToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      if (itemType === "quiz") {
        await courseQuizDiscussionWS.connect(token);

        const response = await getCourseQuizDiscussion(publishedCourseId, itemId);
        
        if (response && response.content) {
          setMessages(response.content);
        } else {
          setMessages([]);
        }

        // Mark messages as read
        await markCourseQuizDiscussionAsRead(publishedCourseId, itemId).catch(err => {
          console.error("Failed to mark quiz as read:", err);
        });

        console.log("📡 Subscribing to quiz discussion topic:", `/topic/course/quiz/${publishedCourseId}/${itemId}/discussion`);
        courseQuizDiscussionWS.subscribeToQuizDiscussion(
          publishedCourseId,
          itemId,
          handleNewMessage,
          handleMessageDelete,
          handleMessageUpdate
        );
      } else if (itemType === "assignment") {
        await courseAssignmentDiscussionWS.connect(token);

        const response = await getCourseAssignmentDiscussion(publishedCourseId, itemId);
        
        if (response && response.content) {
          setMessages(response.content);
        } else {
          setMessages([]);
        }

        // Mark messages as read
        await markCourseAssignmentDiscussionAsRead(publishedCourseId, itemId).catch(err => {
          console.error("Failed to mark assignment as read:", err);
        });
        console.log("📡 Subscribing to quiz discussion topic:", `/topic/course/quiz/${publishedCourseId}/${itemId}/discussion`);        courseAssignmentDiscussionWS.subscribeToAssignmentDiscussion(
          publishedCourseId,
          itemId,
          handleNewMessage,
          handleMessageDelete,
          handleMessageUpdate
        );
      } else if (itemType === "lesson") {
        await courseLessonDiscussionWS.connect(token);

        const response = await getCourseLessonDiscussion(publishedCourseId, itemId);
        
        if (response && response.content) {
          setMessages(response.content);
        } else {
          setMessages([]);
        }

        // Mark messages as read
        await markCourseLessonDiscussionAsRead(publishedCourseId, itemId).catch(err => {
          console.error("Failed to mark lesson as read:", err);
        });

        courseLessonDiscussionWS.subscribeToCourseLesson(
          publishedCourseId,
          itemId,
          (event) => {
            if (event.type === "NEW_MESSAGE") {
              handleNewMessage(event.message);
            } else if (event.type === "DELETE_MESSAGE") {
              handleMessageDelete(event.message.id);
            } else if (event.type === "UPDATE_MESSAGE") {
              handleMessageUpdate(event.message);
            }
          }
        );
      }

      setIsConnecting(false);
    } catch (err) {
      console.error("Error initializing discussion:", err);
      setError("Không thể kết nối đến thảo luận");
      setIsConnecting(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = (message: DiscussionMessage) => {
    console.log("🔔 Received new message via WebSocket:", message);
    setMessages((prev) => {
      console.log("✅ Adding message to list, current count:", prev.length);
      return [...prev, message];
    });
    scrollToBottom();
  };

  const handleMessageDelete = (messageId: string) => {
    console.log("🗑️ Received delete message via WebSocket:", messageId);
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleMessageUpdate = (updatedMessage: DiscussionMessage) => {
    console.log("🔄 Received update message via WebSocket:", updatedMessage);
    setMessages((prev) =>
      prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB");
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() && !selectedImage) {
      toast.error("Vui lòng nhập nội dung tin nhắn hoặc chọn ảnh");
      return;
    }

    try {
      setIsSubmitting(true);

      let imageUrl: string | undefined;
      if (selectedImage) {
        const uploadResponse = await uploadImage(selectedImage);
        imageUrl = uploadResponse.url;
      }

      const trimmedContent = newMessage.trim();
      const messageData = {
        content: trimmedContent || " ",
        imageUrl,
        userName: user ? `${user.firstName} ${user.lastName}`.trim() : "Người dùng",
        userAvatar: user?.avatarUrl,
      };

      console.log("📤 Sending message data:", messageData);

      console.log("📤 Sending message with user data:", {
        userName: messageData.userName,
        userAvatar: messageData.userAvatar,
        fullUser: user
      });

      if (itemType === "quiz") {
        await postCourseQuizDiscussionMessage(publishedCourseId, itemId, messageData);
      } else if (itemType === "assignment") {
        await postCourseAssignmentDiscussionMessage(publishedCourseId, itemId, messageData);
      } else if (itemType === "lesson") {
        await postCourseLessonDiscussionMessage(publishedCourseId, itemId, messageData);
      }

      setNewMessage("");
      handleRemoveImage();
    } catch (err) {
      console.error("Error posting message:", err);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      if (itemType === "quiz") {
        await deleteCourseQuizDiscussionMessage(messageId);
      } else if (itemType === "assignment") {
        await deleteCourseAssignmentDiscussionMessage(messageId);
      } else if (itemType === "lesson") {
        await deleteCourseLessonDiscussionMessage(messageId);
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error("Không thể xóa tin nhắn");
    }
  };

  const handleLike = async (messageId: string) => {
    try {
      // Optimistic update
      setMessages((prev) => prev.map(msg => {
        if (msg.id === messageId) {
          const currentUserId = user?.id || "";
          const hasLiked = msg.likedBy?.includes(currentUserId);
          const newLikedBy = hasLiked 
            ? msg.likedBy?.filter(id => id !== currentUserId) || []
            : [...(msg.likedBy || []), currentUserId];
          
          return {
            ...msg,
            likedBy: newLikedBy,
            likes: newLikedBy.length
          };
        }
        return msg;
      }));

      if (itemType === "quiz") {
        await toggleCourseQuizDiscussionLike(messageId);
      } else if (itemType === "assignment") {
        await toggleCourseAssignmentDiscussionLike(messageId);
      } else if (itemType === "lesson") {
        await toggleCourseLessonDiscussionLike(messageId);
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("Không thể thích tin nhắn");
    }
  };

  const isLikelyUuid = (value?: string): boolean => {
    if (!value) return false;
    return /^[a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12}$/i.test(value.trim());
  };

  const resolveDisplayName = (message: DiscussionMessage): string => {
    if (user?.id && message.userId === user.id) {
      const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      if (fullName) return fullName;
      if (user.username && !isLikelyUuid(user.username)) return user.username;
      return "Bạn";
    }

    if (userDetails[message.userId] && userDetails[message.userId].name !== "Người dùng") {
      return userDetails[message.userId].name;
    }

    const rawName = [
      (message as any).userName,
      (message as any).displayName,
      (message as any).fullName,
      (message as any).senderName,
      (message as any).username,
    ].find((v) => typeof v === "string" && v.trim().length > 0) as string | undefined;

    if (rawName && !isLikelyUuid(rawName)) {
      return rawName;
    }

    return userDetails[message.userId]?.name || "Người dùng";
  };

  const resolveAvatarUrl = (message: DiscussionMessage): string | undefined => {
    if (user?.id && message.userId === user.id) {
      return user.avatarUrl;
    }

    if (userDetails[message.userId]?.avatar) {
      return userDetails[message.userId].avatar;
    }

    const messageAvatar = [
      (message as any).userAvatar,
      (message as any).avatarUrl,
      (message as any).profilePicture,
      (message as any).senderAvatar,
    ].find((v) => typeof v === "string" && v.trim().length > 0) as string | undefined;

    return messageAvatar;
  };

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Đang kết nối...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <AlertCircle className="h-12 w-12 text-red-600 mb-4" />
        <p className="text-red-600 font-medium mb-2">{error}</p>
        <button
          onClick={initializeDiscussion}
          className="text-blue-600 hover:underline"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gray-50">
        <MessageSquare className="h-5 w-5 text-blue-600" />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Thảo luận</h3>
          <p className="text-sm text-gray-600">{messages.length} tin nhắn</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="h-12 w-12 mb-3 text-gray-300" />
            <p className="font-medium">Chưa có tin nhắn nào</p>
            <p className="text-sm">Hãy là người đầu tiên bắt đầu thảo luận!</p>
          </div>
        ) : (
          <>
            {[...messages]
              .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
              .map((message) => {
              const isOwner = user?.id === message.userId;
              const hasLiked = message.likedBy?.includes(user?.id || "");
              const displayName = resolveDisplayName(message);
              const displayAvatar = resolveAvatarUrl(message);

            return (
              <div key={message.id} className={`flex gap-3 ${isOwner ? "flex-row-reverse" : "flex-row"}`}>
                <div className="flex-shrink-0">
                  {displayAvatar ? (
                    <img 
                      src={displayAvatar} 
                      alt={displayName} 
                      className="w-10 h-10 rounded-full object-cover shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  )}
                </div>
                <div className={`flex flex-col flex-1 min-w-0 ${isOwner ? "items-end" : "items-start"}`}>
                  <div className={`flex items-center gap-2 mb-1 ${isOwner ? "flex-row-reverse" : "flex-row"}`}>
                    <span className="font-medium text-gray-900 text-sm">
                      {displayName}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(message.createdAt).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className={`rounded-xl p-3 max-w-[85%] shadow-sm ${isOwner ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-gray-100 rounded-tl-sm text-gray-800"}`}>
                    {message.content && (
                      <p className={`text-sm whitespace-pre-wrap break-words ${isOwner ? "text-white" : "text-gray-800"}`}>
                        {message.content}
                      </p>
                    )}
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl}
                        alt="Attached"
                        className="mt-2 max-w-full rounded-lg max-h-64 object-contain"
                      />
                    )}
                  </div>
                  <div className={`flex items-center gap-3 mt-1.5 ${isOwner ? "flex-row-reverse" : "flex-row"}`}>
                    <button
                      onClick={() => handleLike(message.id)}
                      className={`flex items-center gap-1 text-xs transition-colors ${
                        hasLiked
                          ? "text-blue-600 font-medium"
                          : "text-gray-500 hover:text-blue-600"
                      }`}
                    >
                      <ThumbsUp
                        className={`h-3.5 w-3.5 ${hasLiked ? "fill-current" : ""}`}
                      />
                      <span>{message.likes || 0}</span>
                    </button>
                    {isOwner && (
                      <button
                        onClick={() => setMessageToDelete(message.id)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-gray-50">
        {imagePreview && (
          <div className="relative mb-3 inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-32 rounded-lg"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Thêm ảnh"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Nhập tin nhắn..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={isSubmitting || (!newMessage.trim() && !selectedImage)}
            className="flex-shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            <span>Gửi</span>
          </button>
        </div>
      </form>

      <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa tin nhắn?</AlertDialogTitle>
            <AlertDialogDescription>
              Tin nhắn sẽ bị xóa và không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (messageToDelete) {
                  handleDelete(messageToDelete);
                  setMessageToDelete(null);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseDiscussionSection;
