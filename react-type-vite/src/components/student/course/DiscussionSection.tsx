import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, ThumbsUp, Clock, User, Loader2, AlertCircle, Trash2, Image as ImageIcon, X } from "lucide-react";
import { quizDiscussionWS, type DiscussionMessage as QuizDiscussionMessage } from "@/services/websocket/quizDiscussionWebSocket";
import { assignmentDiscussionWS, type DiscussionMessage as AssignmentDiscussionMessage } from "@/services/websocket/assignmentDiscussionWebSocket";
import { lessonDiscussionWS, type DiscussionMessage as LessonDiscussionMessage } from "@/services/websocket/lessonDiscussionWebSocket";
import { 
  getQuizDiscussion, 
  postDiscussionMessage, 
  deleteDiscussionMessage,
  toggleDiscussionLike,
  markDiscussionAsRead
} from "@/services/api/quizDiscussionApi";
import {
  getAssignmentDiscussion,
  postAssignmentDiscussionMessage,
  deleteAssignmentDiscussionMessage,
  toggleAssignmentDiscussionLike,
  markAssignmentDiscussionAsRead
} from "@/services/api/assignmentDiscussionApi";
import {
  getLessonDiscussion,
  postLessonDiscussionMessage,
  deleteLessonDiscussionMessage,
  toggleLessonDiscussionLike,
  markLessonDiscussionAsRead
} from "@/services/api/lessonDiscussionApi";
import { uploadImage } from "@/services/api/fileUploadApi";
import { toast } from "react-toastify";
import { getAccessToken } from "@/utils/localStorageVariables";
import type { User as UserType } from "@/context/auth-context/types";
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

interface DiscussionSectionProps {
  itemType: "quiz" | "assignment" | "lesson";
  itemId: number;
  itemTitle: string;
  user?: UserType | null;
}

const DiscussionSection = ({ itemType, itemId, user }: DiscussionSectionProps) => {
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

  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      initializeDiscussion();
    }

    return () => {
      if (itemType === "quiz") {
        quizDiscussionWS.unsubscribeFromQuizDiscussion(itemId);
      } else if (itemType === "assignment") {
        assignmentDiscussionWS.unsubscribeFromAssignmentDiscussion(itemId);
      } else if (itemType === "lesson") {
        lessonDiscussionWS.unsubscribeFromLessonDiscussion(itemId);
      }
    };
  }, [itemType, itemId]);

  const initializeDiscussion = async () => {
    try {
      setIsConnecting(true);
      setIsLoading(true);

      const token = getAccessToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      if (itemType === "quiz") {
        await quizDiscussionWS.connect(token);

        const response = await getQuizDiscussion(itemId);
        
        if (response && response.content) {
          setMessages(response.content);
        } else {
          setMessages([]);
        }

        // Mark messages as read
        await markDiscussionAsRead(itemId).catch(err => {
          console.error("Failed to mark quiz as read:", err);
        });

        quizDiscussionWS.subscribeToQuizDiscussion(
          itemId,
          handleNewMessage,
          handleMessageDelete,
          handleMessageUpdate
        );
      } else if (itemType === "assignment") {
        await assignmentDiscussionWS.connect(token);

        const response = await getAssignmentDiscussion(itemId);
        
        if (response && response.content) {
          setMessages(response.content);
        } else {
          setMessages([]);
        }

        // Mark messages as read
        await markAssignmentDiscussionAsRead(itemId).catch(err => {
          console.error("Failed to mark assignment as read:", err);
        });

        assignmentDiscussionWS.subscribeToAssignmentDiscussion(
          itemId,
          handleNewMessage,
          handleMessageDelete,
          handleMessageUpdate
        );
      } else if (itemType === "lesson") {
        await lessonDiscussionWS.connect(token);

        const response = await getLessonDiscussion(itemId);
        
        if (response && response.content) {
          setMessages(response.content);
        } else {
          setMessages([]);
        }

        // Mark messages as read
        await markLessonDiscussionAsRead(itemId).catch(err => {
          console.error("Failed to mark lesson as read:", err);
        });

        lessonDiscussionWS.subscribeToLessonDiscussion(
          itemId,
          handleNewMessage,
          handleMessageDelete,
          handleMessageUpdate
        );
      }

      setIsConnecting(false);
      setError(null);
    } catch (err) {
      console.error("Error initializing discussion:", err);
      setError("Không thể kết nối thảo luận");
      setIsConnecting(false);
      toast.error("Không thể kết nối thảo luận realtime");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = (message: DiscussionMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  const handleMessageDelete = (messageId: string) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const handleMessageUpdate = (updatedMessage: DiscussionMessage) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === updatedMessage.id) {
          // Only update likes count, preserve current user's isLiked and isOwner
          return {
            ...msg,
            likes: updatedMessage.likes,
          };
        }
        return msg;
      })
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
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Ảnh không được vượt quá 10MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitMessage = async () => {
    if ((!newMessage.trim() && !selectedImage) || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const fullName = user?.firstName && user?.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user?.username || user?.email || "User";
      const userAvatar = user?.avatarUrl || undefined;
      
      let imageUrl: string | undefined;
      if (selectedImage) {
        const uploadResult = await uploadImage(selectedImage);
        imageUrl = uploadResult.url;
      }
      
      if (itemType === "quiz") {
        await postDiscussionMessage(itemId, {
          content: newMessage || (imageUrl ? "[Đã gửi ảnh]" : ""),
          userName: fullName,
          userAvatar: userAvatar,
          imageUrl: imageUrl,
        });
      } else if (itemType === "assignment") {
        await postAssignmentDiscussionMessage(itemId, {
          content: newMessage || (imageUrl ? "[Đã gửi ảnh]" : ""),
          userName: fullName,
          userAvatar: userAvatar,
          imageUrl: imageUrl,
        });
      } else if (itemType === "lesson") {
        await postLessonDiscussionMessage(itemId, {
          content: newMessage || (imageUrl ? "[Đã gửi ảnh]" : ""),
          userName: fullName,
          userAvatar: userAvatar,
          imageUrl: imageUrl,
        });
      }
      
      setNewMessage("");
      handleRemoveImage();
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error("Không thể gửi tin nhắn");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      if (itemType === "quiz") {
        await deleteDiscussionMessage(messageId);
      } else if (itemType === "assignment") {
        await deleteAssignmentDiscussionMessage(messageId);
      } else if (itemType === "lesson") {
        await deleteLessonDiscussionMessage(messageId);
      }
      // Remove message from UI immediately after successful deletion
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      toast.success("Đã xóa tin nhắn");
    } catch (err) {
      console.error("Error deleting message:", err);
      toast.error("Không thể xóa tin nhắn");
    }
  };

  const handleLike = async (messageId: string) => {
    try {
      let updatedMessage;
      if (itemType === "quiz") {
        updatedMessage = await toggleDiscussionLike(messageId);
      } else if (itemType === "assignment") {
        updatedMessage = await toggleAssignmentDiscussionLike(messageId);
      } else if (itemType === "lesson") {
        updatedMessage = await toggleLessonDiscussionLike(messageId);
      }
      
      if (updatedMessage) {
        // Update current user's message state immediately
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === messageId) {
              return {
                ...msg,
                likes: updatedMessage.likes,
                isLiked: updatedMessage.isLiked,
              };
            }
            return msg;
          })
        );
      }
    } catch (err) {
      console.error("Error toggling like:", err);
      toast.error("Không thể thích/bỏ thích");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    // THAY ĐỔI QUAN TRỌNG:
    // h-[calc(100vh-220px)]: Chiều cao tự động bằng màn hình trừ đi phần Header của Modal (khoảng 220px)
    // min-h-[400px]: Đảm bảo không bị quá bé
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[400px] bg-white rounded-lg">
      
      {/* 1. Header (Cố định) */}
      <div className="flex items-center gap-2 pb-3 border-b shrink-0 px-1 pt-1">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Thảo luận về {itemType === "quiz" ? "bài kiểm tra" : "bài tập"}
        </h3>
        <span className="text-sm text-gray-500">
          ({messages.length} tin nhắn)
        </span>
        {isConnecting && (
          <span className="text-xs text-yellow-600 flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Đang kết nối...
          </span>
        )}
        {!isConnecting && (
          itemType === "quiz" 
            ? quizDiscussionWS.isConnected() 
            : itemType === "assignment" 
            ? assignmentDiscussionWS.isConnected()
            : lessonDiscussionWS.isConnected()
        ) && (
          <span className="text-xs text-green-600">● Realtime</span>
        )}
      </div>

      {/* 2. Danh sách tin nhắn (Cuộn) */}
      <div className="flex-1 overflow-y-auto space-y-3 p-2 my-2 custom-scrollbar">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {!isLoading && !error && messages.length > 0 && (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`bg-white border rounded-lg p-4 hover:shadow-md transition-shadow ${
                  message.isDeleted ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0">
                    {message.userAvatar ? (
                      <img
                        src={message.userAvatar}
                        alt={message.userName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {message.userName}
                      </span>
                      {message.userRole === "TEACHER" && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          Giảng viên
                        </span>
                      )}
                      {message.userId === user?.id && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Bạn
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(message.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {message.isDeleted ? "[Tin nhắn đã bị xóa]" : message.content}
                    </p>
                    {message.imageUrl && !message.isDeleted && (
                      <img
                        src={message.imageUrl}
                        alt="Attachment"
                        className="mt-2 max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(message.imageUrl, '_blank')}
                      />
                    )}
                  </div>
                </div>

                {!message.isDeleted && (
                  <div className="flex items-center gap-4 ml-13">
                    <button
                      onClick={() => handleLike(message.id)}
                      className={`flex items-center gap-1 text-sm transition-colors ${
                        message.isLiked
                          ? "text-blue-600"
                          : "text-gray-600 hover:text-blue-600"
                      }`}
                    >
                      <ThumbsUp
                        className={`w-4 h-4 ${message.isLiked ? "fill-current" : ""}`}
                      />
                      {message.likes > 0 && <span>{message.likes}</span>}
                    </button>

                    {message.userId === user?.id && (
                      <button
                        onClick={() => setMessageToDelete(message.id)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium mb-1">
              Chưa có thảo luận nào
            </p>
            <p className="text-sm text-gray-500">
              Hãy là người đầu tiên bắt đầu cuộc trò chuyện!
            </p>
          </div>
        )}
      </div>

      {/* 3. Input Form (Luôn cố định ở đáy) */}
      <div className="shrink-0 pt-2 bg-white z-10 sticky bottom-0">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          {imagePreview && (
            <div className="mb-3 relative inline-block">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-w-xs max-h-40 rounded-lg border border-gray-300"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmitMessage();
              }
            }}
            placeholder="Chia sẻ suy nghĩ của bạn, đặt câu hỏi hoặc thảo luận với các bạn khác..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            rows={2}
            disabled={isSubmitting || !(itemType === "quiz" ? quizDiscussionWS.isConnected() : itemType === "assignment" ? assignmentDiscussionWS.isConnected() : lessonDiscussionWS.isConnected())}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          <div className="flex justify-between items-center mt-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Đính kèm ảnh"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <p className="text-xs text-gray-500">
                💡 Hãy tôn trọng và hỗ trợ lẫn nhau trong học tập
              </p>
            </div>
            <button
              onClick={handleSubmitMessage}
              disabled={(!newMessage.trim() && !selectedImage) || isSubmitting || !(itemType === "quiz" ? quizDiscussionWS.isConnected() : itemType === "assignment" ? assignmentDiscussionWS.isConnected() : lessonDiscussionWS.isConnected())}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Gửi tin nhắn
                </>
              )}
            </button>
          </div>
        </div>
      </div>

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

export default DiscussionSection;