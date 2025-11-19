import { useState, useEffect } from "react";
import { MessageSquare, Send, ThumbsUp, Clock, User, Loader2, AlertCircle, Trash2 } from "lucide-react";

interface Comment {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  isOwner: boolean;
}

interface DiscussionSectionProps {
  itemType: "quiz" | "assignment";
  itemId: number;
  itemTitle: string;
}

const DiscussionSection = ({ itemType, itemId, itemTitle }: DiscussionSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchComments();
  }, [itemType, itemId]);

  const fetchComments = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // TODO: Replace with actual API call
      // const response = await discussionApi.getComments(itemType, itemId);
      // setComments(response);
      
      // Mock data for demonstration
      setTimeout(() => {
        const mockComments: Comment[] = [
          {
            id: 1,
            userId: 1,
            userName: "Nguyễn Văn A",
            content: "Câu hỏi số 3 có vẻ hơi khó hiểu, mọi người có thể giải thích thêm không?",
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            likes: 5,
            isLiked: false,
            isOwner: false,
          },
          {
            id: 2,
            userId: 2,
            userName: "Trần Thị B",
            content: "Mình nghĩ đáp án nên là B vì dựa vào lý thuyết ở bài học 2...",
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            likes: 3,
            isLiked: true,
            isOwner: false,
          },
          {
            id: 3,
            userId: 999,
            userName: "Bạn",
            content: "Cảm ơn mọi người đã giải đáp, mình hiểu rồi!",
            createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            likes: 1,
            isLiked: false,
            isOwner: true,
          },
        ];
        setComments(mockComments);
        setIsLoading(false);
      }, 800);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Không thể tải bình luận");
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    
    try {
      // TODO: Replace with actual API call
      // await discussionApi.createComment({
      //   itemType,
      //   itemId,
      //   content: newComment,
      // });
      
      // Mock successful submission
      setTimeout(() => {
        const newCommentObj: Comment = {
          id: Date.now(),
          userId: 999,
          userName: "Bạn",
          content: newComment,
          createdAt: new Date().toISOString(),
          likes: 0,
          isLiked: false,
          isOwner: true,
        };
        
        setComments([newCommentObj, ...comments]);
        setNewComment("");
        setIsSubmitting(false);
      }, 500);
    } catch (err) {
      console.error("Error submitting comment:", err);
      alert("Không thể gửi bình luận. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    try {
      // TODO: Replace with actual API call
      // await discussionApi.toggleLike(commentId);
      
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        return comment;
      }));
    } catch (err) {
      console.error("Error liking comment:", err);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      // TODO: Replace with actual API call
      // await discussionApi.deleteComment(commentId);
      
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error("Error deleting comment:", err);
      alert("Không thể xóa bình luận. Vui lòng thử lại.");
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Vừa xong";
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Thảo luận về {itemType === "quiz" ? "bài kiểm tra" : "bài tập"}
        </h3>
        <span className="text-sm text-gray-500">
          ({comments.length} bình luận)
        </span>
      </div>

      {/* New Comment Form */}
      <div className="bg-gray-50 rounded-lg p-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Chia sẻ suy nghĩ của bạn, đặt câu hỏi hoặc thảo luận với các bạn khác..."
          className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          disabled={isSubmitting}
        />
        <div className="flex justify-between items-center mt-3">
          <p className="text-xs text-gray-500">
            💡 Hãy tôn trọng và hỗ trợ lẫn nhau trong học tập
          </p>
          <button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
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
                Gửi bình luận
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </div>
        )}

        {/* Comments */}
        {!isLoading && !error && comments.length > 0 && (
          <>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                {/* Comment Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0">
                    {comment.userAvatar ? (
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {comment.userName}
                      </span>
                      {comment.isOwner && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                          Bạn
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Comment Content */}
                <p className="text-gray-700 mb-3 ml-13">
                  {comment.content}
                </p>

                {/* Comment Actions */}
                <div className="flex items-center gap-4 ml-13">
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className={`flex items-center gap-1 text-sm transition-colors ${
                      comment.isLiked
                        ? "text-blue-600"
                        : "text-gray-500 hover:text-blue-600"
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${comment.isLiked ? "fill-current" : ""}`} />
                    <span>{comment.likes > 0 ? comment.likes : "Thích"}</span>
                  </button>

                  {comment.isOwner && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Empty State */}
        {!isLoading && !error && comments.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">
              Chưa có bình luận nào
            </p>
            <p className="text-sm text-gray-400">
              Hãy là người đầu tiên thảo luận về {itemType === "quiz" ? "bài kiểm tra" : "bài tập"} này!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscussionSection;