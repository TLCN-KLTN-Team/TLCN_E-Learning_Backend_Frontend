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

type DiscussionMessage = QuizDiscussionMessage | AssignmentDiscussionMessage | LessonDiscussionMessage;

interface StudentDiscussionPanelProps {
  itemType: "quiz" | "assignment" | "lesson";
  itemId: number;
  itemTitle: string;
  publishedCourseId: number;
  user?: UserType | null;
}

const StudentDiscussionPanel = ({ itemType, itemId, publishedCourseId, user }: StudentDiscussionPanelProps) => {
  const [messages, setMessages] = useState<DiscussionMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

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
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeDiscussion = async () => {
    try {
      setIsConnecting(true);
      setIsLoading(true);

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
        await markCourseQuizDiscussionAsRead(publishedCourseId, itemId).catch(err => {
          console.error("Failed to mark quiz as read:", err);
        });
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
        await markCourseAssignmentDiscussionAsRead(publishedCourseId, itemId).catch(err => {
          console.error("Failed to mark assignment as read:", err);
        });
        courseAssignmentDiscussionWS.subscribeToAssignmentDiscussion(
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

      setError(null);
    } catch (err) {
      console.error("Error initializing discussion:", err);
      setError("Không thể tải thảo luận. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
      setIsConnecting(false);
    }
  };

  const handleNewMessage = (message: DiscussionMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleMessageDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleMessageUpdate = (updatedMessage: DiscussionMessage) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || isSubmitting) return;

    try {
      setIsSubmitting(true);

      let imageUrl: string | undefined;
      if (selectedImage) {
        const uploadResponse = await uploadImage(selectedImage);
        imageUrl = uploadResponse.url;
      }

      if (itemType === "quiz") {
        await postCourseQuizDiscussionMessage(publishedCourseId, itemId, {
          content: newMessage.trim() || " ",
          imageUrl,
        });
      } else if (itemType === "assignment") {
        await postCourseAssignmentDiscussionMessage(publishedCourseId, itemId, {
          content: newMessage.trim() || " ",
          imageUrl,
        });
      } else if (itemType === "lesson") {
        await postCourseLessonDiscussionMessage(publishedCourseId, itemId, {
          content: newMessage.trim() || " ",
          imageUrl,
        });
      }

      setNewMessage("");
      setSelectedImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tin nhắn này?")) return;

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

  if (isConnecting) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
          <div className="absolute inset-0 blur-xl bg-blue-400 opacity-20 animate-pulse"></div>
        </div>
        <p className="text-gray-600 mt-6 text-lg font-medium">Đang kết nối đến cuộc thảo luận...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="bg-red-50 rounded-full p-6 mb-6">
          <AlertCircle className="h-16 w-16 text-red-600" />
        </div>
        <p className="text-red-600 font-semibold text-xl mb-4">{error}</p>
        <button
          onClick={initializeDiscussion}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header - Simple Design */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Thảo luận</h3>
            <p className="text-gray-600 text-sm">{messages.length} tin nhắn</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="space-y-4 mb-6 max-h-[600px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Đang tải tin nhắn...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mb-4" />
            <h4 className="font-semibold text-gray-900 text-xl mb-2">Chưa có tin nhắn nào</h4>
            <p className="text-gray-600">Hãy là người đầu tiên bắt đầu thảo luận!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isOwner = user?.id === message.userId;
              const hasLiked = message.likedBy?.includes(user?.id || "");

              return (
                <div key={message.id} className="flex gap-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {message.userAvatar ? (
                      <img
                        src={message.userAvatar}
                        alt={message.userName || "User"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Name & Time */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 text-sm">
                        {message.userName || "Người dùng"}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(message.createdAt).toLocaleString("vi-VN")}
                      </span>
                    </div>

                    {/* Message Content */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      {message.content && (
                        <p className="text-gray-800 text-sm whitespace-pre-wrap break-words">
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

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => handleLike(message.id)}
                        className={`flex items-center gap-1 text-sm transition-colors ${hasLiked
                            ? "text-blue-600 font-medium"
                            : "text-gray-600 hover:text-blue-600"
                          }`}
                      >
                        <ThumbsUp
                          className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`}
                        />
                        <span>{message.likes || 0}</span>
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(message.id)}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Xóa</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="pt-4 border-t">
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
    </div>
  );
};

export default StudentDiscussionPanel;
