import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import forumApi, { type PostResponse, type Comment, type Category, type ViolationReportResponse } from '../../services/api/forumApi';
import { useAuth } from '@/context/auth-context/useAuth';
import { forumDiscussionWS } from '@/services/websocket/forumDiscussionWebSocket';
import { getAccessToken } from '@/utils/localStorageVariables';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Link as LinkIcon, Trash2, ChevronDown, ChevronUp, Bookmark, BookmarkCheck, Pencil, ThumbsDown, ThumbsUp, Lock, Pin, MoreHorizontal, Share2 } from 'lucide-react';
import ForumSidebar from '@/components/forum/ForumSidebar';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ReportDialog } from '@/components/forum/ReportDialog';
import { useForumModeration } from '@/hooks/useForumModeration';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { decodeHTMLEntities } from '@/utils/htmlCleaner';
import RichTextEditor from '@/components/shared/RichTextEditor';
import {
    isForumBookmarked,
    toggleForumBookmark,
} from '@/utils/forumEngagement';

const getViolationReasonLabel = (reason?: string) => {
    switch (reason) {
        case 'SPAM':
            return 'Spam';
        case 'OFFENSIVE_CONTENT':
            return 'Nội dung xúc phạm';
        case 'HATE_SPEECH':
            return 'Ngôn từ thù ghét';
        case 'PLAGIARISM':
            return 'Đạo văn';
        case 'MISINFORMATION':
            return 'Thông tin sai lệch';
        case 'SEXUAL_CONTENT':
            return 'Nội dung nhạy cảm';
        case 'SELF_PROMOTION':
            return 'Tự quảng bá';
        case 'OFF_TOPIC':
            return 'Lạc đề';
        case 'OTHER':
            return 'Khác';
        default:
            return reason || 'Không xác định';
    }
};

const getReportStatusLabel = (status?: string) => {
    switch (status) {
        case 'PENDING':
            return 'Chờ xử lý';
        case 'UNDER_REVIEW':
            return 'Đang xem xét';
        case 'RESOLVED':
            return 'Đã xử lý';
        case 'DISMISSED':
            return 'Bác bỏ';
        case 'ESCALATED':
            return 'Đã chuyển cấp';
        default:
            return status || 'Không rõ';
    }
};

const ForumPostDetail: React.FC = () => {
    const { toast } = useToast();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isSuperAdmin, pinPost, unpinPost, lockPost, unlockPost, softDeletePost } = useForumModeration();
    const [postData, setPostData] = useState<PostResponse | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [targetReports, setTargetReports] = useState<ViolationReportResponse[]>([]);
    const [loadingReports, setLoadingReports] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [replyToComment, setReplyToComment] = useState<Comment | null>(null);
    const [editingComment, setEditingComment] = useState<Comment | null>(null);
    const [isEditingPost, setIsEditingPost] = useState(false);
    const [editPostTitle, setEditPostTitle] = useState('');
    const [editPostContent, setEditPostContent] = useState('');
    const [editPostTags, setEditPostTags] = useState('');
    const [editPostCategoryId, setEditPostCategoryId] = useState('');
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [loading, setLoading] = useState(true);

    const [reportUpdateModalOpen, setReportUpdateModalOpen] = useState(false);
    const [reportUpdateData, setReportUpdateData] = useState<{ reportId: string, status: string, notes: string } | null>(null);

    const [isExpanded, setIsExpanded] = useState(false);
    const [showToggle, setShowToggle] = useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const [activeId, setActiveId] = useState<string>('start');

    const updatePostViewCount = (viewCount: number) => {
        setPostData(prev =>
            prev
                ? {
                    ...prev,
                    post: {
                        ...prev.post,
                        viewCount,
                    },
                }
                : prev
        );
    };

    const parsePostUpdate = (data: any) => {
        if (typeof data !== 'string') {
            return data;
        }

        try {
            return JSON.parse(data);
        } catch {
            return data;
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = entry.target.id.replace('comment-', '');
                        setActiveId(entry.target.id === 'post-start' ? 'start' : id);
                    }
                });
            },
            {
                root: null,
                rootMargin: '-20% 0px -60% 0px', // Activate when element is in the middle-ish
                threshold: 0
            }
        );

        // Observe start point
        const startEl = document.getElementById('post-start');
        if (startEl) observer.observe(startEl);

        // Observe comments
        comments.forEach((comment) => {
            const el = document.getElementById(`comment-${comment.id}`);
            if (el) observer.observe(el);
        });

        // Observe input
        const inputEl = document.getElementById('comment-input');
        if (inputEl) observer.observe(inputEl);

        return () => observer.disconnect();
    }, [comments]); // Re-run when comments change

    useEffect(() => {
        loadCategories();
        if (id) {
            loadPost(id);
            loadComments(id);

            // Increment view count only once when the page is first visited
            forumApi.incrementView(id)
                .then((res) => {
                    updatePostViewCount(res.data.viewCount);
                })
                .catch(() => {
                    // Silently ignore view count errors
                });

            // Connect WebSocket
            const token = getAccessToken();
            if (token) {
                forumDiscussionWS.connect(token).then(() => {
                    forumDiscussionWS.subscribeToPostComments(id, () => {
                        loadComments(id);
                    });

                    forumDiscussionWS.subscribeToPostUpdates(id, (data) => {
                        const update = parsePostUpdate(data);

                        if (update === "vote_update") {
                            // Reload vote counts only (not full post to avoid viewCount inflation)
                            loadPostVotesOnly(id);
                            return;
                        }

                        if (update?.type === "view_update" && update.postId === id) {
                            updatePostViewCount(update.viewCount);
                        }
                    });
                }).catch(err => console.error("WS connect error", err));
            }
        }

        return () => {
            if (id) {
                forumDiscussionWS.unsubscribeFromPostComments(id);
                forumDiscussionWS.unsubscribeFromPostUpdates(id);
            }
        };
    }, [id]);

    /** Refresh only the vote counts & isLiked fields without re-calling getPostDetail (which would inflate views) */
    const loadPostVotesOnly = async (postId: string) => {
        try {
            const res = await forumApi.getPostDetail(postId);
            setPostData(prev =>
                prev
                    ? {
                        ...prev,
                        upvotes: res.data.upvotes,
                        downvotes: res.data.downvotes,
                        isLiked: res.data.isLiked,
                        liked: res.data.liked,
                        post: {
                            ...prev.post,
                            score: res.data.post.score,
                        },
                    }
                    : res.data
            );
        } catch (error) {
            console.error('Error refreshing vote counts', error);
        }
    };

    useEffect(() => {
        if (contentRef.current && postData) {
            // Check if content height > 300px (or any threshold you prefer)
            if (contentRef.current.scrollHeight > 400) {
                setShowToggle(true);
            } else {
                setShowToggle(false);
            }
        }
    }, [postData]);

    useEffect(() => {
        if (!postData?.post?.id) {
            return;
        }

        setEditPostTitle(postData.post.title || '');
        setEditPostContent(postData.post.content || '');
        setEditPostCategoryId(postData.post.categoryId || '');
        setEditPostTags((postData.post.tags || []).join(', '));

        const syncBookmarkState = async () => {
            if (user?.id) {
                try {
                    const res = await forumApi.getBookmarkedPosts();
                    setIsBookmarked(res.data.some((bookmark) => bookmark.id === postData.post.id));
                    return;
                } catch (error) {
                    console.error('Failed to load bookmarked posts', error);
                }
            }

            setIsBookmarked(isForumBookmarked(user?.id, postData.post.id));
        };

        syncBookmarkState();
    }, [postData?.post?.id, user?.id]);

    useEffect(() => {
        const loadTargetReports = async () => {
            if (!postData?.post?.id || !isSuperAdmin) {
                setTargetReports([]);
                return;
            }

            try {
                setLoadingReports(true);
                const response = await forumApi.getReportsForTarget(postData.post.id);
                setTargetReports(response.data ?? []);
            } catch (error) {
                console.error('Failed to load reports for target', error);
                setTargetReports([]);
            } finally {
                setLoadingReports(false);
            }
        };

        loadTargetReports();
    }, [postData?.post?.id, isSuperAdmin]);

    const loadCategories = async () => {
        try {
            const res = await forumApi.getAllCategories();
            setCategories(res.data);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const loadPost = async (postId: string) => {
        try {
            const res = await forumApi.getPostDetail(postId);
            setPostData(prev =>
                prev?.post?.id === postId
                    ? {
                        ...res.data,
                        post: {
                            ...res.data.post,
                            viewCount: Math.max(prev.post.viewCount ?? 0, res.data.post.viewCount ?? 0),
                        },
                    }
                    : res.data
            );
        } catch (error) {
            console.error("Error loading post", error);
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async (postId: string) => {
        try {
            const res = await forumApi.getComments(postId);
            setComments(res.data);
        } catch (error) {
            console.error("Error loading comments", error);
        }
    };

    const handleVote = async (type: 'UP' | 'DOWN') => {
        if (!id || !postData) return;
        if (!user) {
            toast({
                title: 'Bạn chưa đăng nhập',
                description: 'Vui lòng đăng nhập để vote bài viết.',
                variant: 'destructive',
                duration: 3000,
            });
            return;
        }
        try {
            await forumApi.vote({ targetId: id, targetType: 'POST', type });
            // Only refresh vote counts, not the full post (avoids inflating viewCount)
            loadPostVotesOnly(id);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Không thể vote bài viết này.';
            toast({
                title: 'Vote thất bại',
                description: message,
                variant: 'destructive',
                duration: 3000,
            });
        }
    };

    const handleSubmitComment = async () => {
        // Strip HTML tags to check for actual content (TinyMCE returns '<p></p>' for empty)
        const plainText = newComment.replace(/<[^>]*>/g, '').trim();
        if (!id || !plainText) return;
        try {
            if (editingComment) {
                const res = await forumApi.updateComment(id, editingComment.id, {
                    content: newComment,
                });

                setComments((prev) => prev.map((comment) => (comment.id === editingComment.id ? res.data : comment)));
                setReplyToComment(null);
                setEditingComment(null);
                setNewComment('');
                loadComments(id);
                toast({
                    title: 'Đã cập nhật bình luận',
                    description: 'Nội dung bình luận đã được lưu lại.',
                    duration: 2500,
                });
                return;
            }

            await forumApi.createComment(id, {
                postId: id,
                content: newComment,
                authorUsername: user?.username,
                authorName: user ? `${user.firstName} ${user.lastName}` : 'Người dùng ẩn danh',
                authorAvatar: user?.avatarUrl || '',
                replyToId: replyToComment?.id,
            });

            setNewComment('');
            setReplyToComment(null);
            loadComments(id);
        } catch (error) {
            console.error("Error sending comment", error);
        }
    };

    const handleToggleBookmark = async () => {
        if (!postData?.post) return;

        try {
            let nextState = false;

            if (user?.id) {
                const res = await forumApi.toggleBookmark(postData.post.id);
                nextState = res.data.bookmarked;
            } else {
                const nextBookmarks = toggleForumBookmark(user?.id, postData.post);
                nextState = nextBookmarks.some((bookmark) => bookmark.id === postData.post.id);
            }

            setIsBookmarked(nextState);
            toast({
                title: nextState ? 'Đã lưu bài viết' : 'Đã bỏ lưu',
                description: nextState
                    ? 'Bài viết đã được thêm vào danh sách đã lưu.'
                    : 'Bài viết đã được xóa khỏi danh sách đã lưu.',
                duration: 2500,
            });
        } catch (error) {
            console.error('Error toggling bookmark', error);
            toast({
                variant: 'destructive',
                title: 'Không thể cập nhật bookmark',
                description: 'Vui lòng thử lại sau.',
            });
        }
    };

    const handleCopyPostLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            toast({
                title: 'Đã sao chép liên kết',
                description: 'Đường dẫn bài viết đã được copy vào bộ nhớ tạm.',
                duration: 2500,
            });
        } catch (error) {
            console.error('Error copying post link', error);
            toast({
                variant: 'destructive',
                title: 'Không thể sao chép liên kết',
                description: 'Vui lòng thử lại sau.',
            });
        }
    };

    const handleDeletePost = async () => {
        if (!id) return;
        try {
            await forumApi.deletePost(id);
            navigate('/forum');
        } catch (error) {
            console.error("Error deleting post", error);
            alert("Có lỗi xảy ra khi xóa bài viết.");
        }
    };

    const handleSavePostEdit = async () => {
        if (!id || !postData) return;

        try {
            await forumApi.updatePost(id, {
                title: editPostTitle,
                content: editPostContent,
                categoryId: editPostCategoryId || postData.post.categoryId,
                tags: editPostTags
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter(Boolean),
            });
            setIsEditingPost(false);
            await loadPost(id);
            toast({
                title: 'Đã cập nhật bài viết',
                description: 'Nội dung bài viết đã được chỉnh sửa.',
                duration: 2500,
            });
        } catch (error) {
            console.error('Error updating post', error);
            toast({
                variant: 'destructive',
                title: 'Không thể chỉnh sửa bài viết',
                description: 'Vui lòng thử lại sau.',
            });
        }
    };

    const handleVoteComment = async (commentId: string, type: 'UP' | 'DOWN') => {
        if (!id) return;
        if (!user) {
            toast({
                title: 'Bạn chưa đăng nhập',
                description: 'Vui lòng đăng nhập để vote bình luận.',
                variant: 'destructive',
                duration: 3000,
            });
            return;
        }
        try {
            await forumApi.vote({
                targetId: commentId,
                targetType: 'COMMENT',
                type,
            });
            await loadComments(id);
        } catch (error: any) {
            const message = error?.response?.data?.message || 'Không thể vote bình luận này.';
            toast({
                title: 'Vote thất bại',
                description: message,
                variant: 'destructive',
                duration: 3000,
            });
        }
    };

    const handleCopyLink = (commentId?: string) => {
        let url = window.location.origin + window.location.pathname;
        if (commentId) {
            url += `#comment-${commentId}`;
        }
        navigator.clipboard.writeText(url).then(() => {
            toast({
                title: "Đã sao chép!",
                description: "Liên kết đã được lưu vào bộ nhớ tạm.",
                duration: 3000,
            });
        }).catch(err => {
            console.error('Failed to copy: ', err);
            toast({
                variant: "destructive",
                title: "Lỗi",
                description: "Không thể sao chép liên kết.",
            });
        });
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500">Đang tải...</div>;
    if (!postData) return <div className="min-h-screen flex items-center justify-center text-gray-500">Bài viết không tồn tại.</div>;

    const { post } = postData;
    const participantCount = new Set([
        post.userId,
        ...comments.map((comment) => comment.userId),
    ].filter(Boolean)).size;
    const uniqueCommentParticipants = comments
        .filter((comment) => comment.userId && comment.userId !== post.userId)
        .filter(
            (comment, index, arr) =>
                arr.findIndex((item) => item.userId === comment.userId) === index
        );

    type CommentTreeNode = Comment & { replies: CommentTreeNode[] };

    const buildCommentTree = (items: Comment[]): CommentTreeNode[] => {
        const nodeMap = new Map<string, CommentTreeNode>();
        const roots: CommentTreeNode[] = [];

        items.forEach((item) => {
            nodeMap.set(item.id, { ...item, replies: [] });
        });

        items.forEach((item) => {
            const node = nodeMap.get(item.id);
            if (!node) return;

            if (item.replyToId && nodeMap.has(item.replyToId)) {
                nodeMap.get(item.replyToId)!.replies.push(node);
            } else {
                roots.push(node);
            }
        });

        return roots;
    };

    const commentTree = buildCommentTree(comments);

    const handleStartReply = (comment: Comment) => {
        setEditingComment(null);
        setReplyToComment(comment);
        setNewComment('');
        setTimeout(() => {
            const el = document.getElementById('comment-input');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const textarea = el?.querySelector('textarea');
            textarea?.focus();
        }, 150);
    };

    const handleStartEdit = (comment: Comment) => {
        setReplyToComment(null);
        setEditingComment(comment);
        setNewComment(comment.content || '');
        setTimeout(() => {
            const el = document.getElementById('comment-input');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const textarea = el?.querySelector('textarea');
            textarea?.focus();
        }, 150);
    };

    const handleCancelCommentMode = () => {
        setReplyToComment(null);
        setEditingComment(null);
        setNewComment('');
    };

    const handleDeleteComment = async (comment: Comment) => {
        if (!id) return;
        try {
            await forumApi.deleteComment(id, comment.id);
            if (editingComment?.id === comment.id) {
                handleCancelCommentMode();
            }
            if (replyToComment?.id === comment.id) {
                setReplyToComment(null);
            }
            loadComments(id);
            toast({
                title: 'Đã xóa bình luận',
                description: 'Bình luận đã được xóa khỏi bài viết.',
                duration: 2500,
            });
        } catch (error) {
            console.error('Error deleting comment', error);
            toast({
                variant: 'destructive',
                title: 'Không thể xóa bình luận',
                description: 'Bạn chỉ có thể xóa bình luận của chính mình.',
            });
        }
    };

    const renderCommentNode = (comment: CommentTreeNode, depth = 0): React.ReactNode => {
        const canManageComment = user?.id === comment.userId || isSuperAdmin;
        const isRecentlyEdited = comment.updatedAt && comment.updatedAt !== comment.createdAt;

        return (
            <div
                key={comment.id}
                id={`comment-${comment.id}`}
                className={`bg-white rounded-xl shadow-sm border p-6 relative ${depth > 0 ? 'ml-8 border-l-4 border-blue-100' : ''}`}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                        <Avatar className="w-10 h-10 border">
                            <AvatarImage src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                    </div>
                    <div>
                        <div className="font-bold text-gray-900">{comment.authorName || 'Sinh viên'}</div>
                        <div className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), "dd 'Thg' MM yyyy")}
                            {isRecentlyEdited && <span className="ml-2 italic">· Đã chỉnh sửa</span>}
                        </div>
                    </div>
                </div>

                {comment.replyToId && (
                    <div className="mb-3 rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-xs text-blue-700">
                        Trả lời bình luận trước
                    </div>
                )}

                <div className="mt-2">
                    <div
                        className="text-gray-800 mb-3 leading-relaxed content-html"
                        dangerouslySetInnerHTML={{
                            __html: decodeHTMLEntities(comment.content || ""),
                        }}
                    />

                    <div className="flex items-center justify-end gap-3 mt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                            onClick={() => handleStartReply(comment)}
                        >
                            Trả lời
                        </Button>
                        <div className="flex items-center rounded-md border border-gray-200">
                            <button
                                type="button"
                                className={`px-2 py-1 text-xs transition ${(comment.isLiked ?? comment.liked) ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                                onClick={() => handleVoteComment(comment.id, 'UP')}
                                title="Upvote bình luận"
                            >
                                <ThumbsUp size={14} />
                            </button>
                            <span className="px-2 text-xs font-medium text-gray-600 min-w-8 text-center">{comment.score || 0}</span>
                            <button
                                type="button"
                                className="px-2 py-1 text-xs text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition"
                                onClick={() => handleVoteComment(comment.id, 'DOWN')}
                                title="Downvote bình luận"
                            >
                                <ThumbsDown size={14} />
                            </button>
                        </div>
                        {canManageComment && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-amber-600 hover:bg-amber-50"
                                    onClick={() => handleStartEdit(comment)}
                                >
                                    <Pencil size={16} />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Xóa bình luận?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Bình luận và tất cả các trả lời bên dưới sẽ bị xóa vĩnh viễn.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={() => handleDeleteComment(comment)}
                                                className="bg-red-600 hover:bg-red-700 text-white"
                                            >
                                                Xóa
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                            onClick={() => handleCopyLink(comment.id)}
                        >
                            <LinkIcon size={16} />
                        </Button>
                    </div>
                </div>

                {comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4">
                        {comment.replies.map((reply) => renderCommentNode(reply, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            {/* Left Sidebar */}
            <div className="hidden lg:block sticky top-20 h-screen overflow-y-auto">
                <ForumSidebar
                    categories={categories}
                    selectedCategory={post.categoryId}
                    onSelectCategory={(catId) => navigate(catId ? `/forum?categoryId=${catId}` : '/forum')}
                    onSelectTag={(tag) => navigate(tag ? `/forum?tag=${tag}` : '/forum')}
                />
            </div>

            <div className="flex-1 py-8 px-4 lg:px-8 max-w-7xl mx-auto w-full">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight flex items-center gap-2">
                    {post.isPinned && (
                        <span title="Bài viết được ghim" className="flex items-center justify-center p-1 bg-purple-50 rounded-full">
                            <Pin size={20} className="text-purple-500 fill-purple-500 shrink-0" />
                        </span>
                    )}
                    {post.isLocked && (
                        <span title="Bài viết bị khóa" className="flex items-center justify-center p-1 bg-orange-50 rounded-full">
                            <Lock size={20} className="text-orange-500 shrink-0" />
                        </span>
                    )}
                    <span>{post.title}</span>
                </h1>

                {/* Category & Tags */}
                <div className="flex items-center gap-2 mb-6 -mt-3">
                    {(() => {
                        const category = categories.find(c => c.id === post.categoryId);
                        return category ? (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 hover:bg-blue-100 font-medium px-2 py-0.5 text-xs">
                                {category.name}
                            </Badge>
                        ) : null;
                    })()}
                    {post.tags?.map((tag, index) => (
                        <Badge key={`tag-${index}`} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 font-normal px-2 py-0.5 text-xs">
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="flex gap-8">
                    {/* Main Content (Left) */}
                    <div className="flex-1 min-w-0">
                        {/* Original Post */}
                        <div id="post-start" className="bg-white rounded-xl shadow-sm border p-6 mb-4 relative">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Avatar className="w-10 h-10 border">
                                        <AvatarImage src={postData.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">{postData.authorName || 'Người dùng ẩn danh'}</span>
                                            <span className="text-sm text-gray-500 font-normal">Tác giả</span>
                                        </div>
                                        <div className="text-xs text-gray-500 hidden sm:block">
                                            {/* Role placeholder if we had it */}
                                            Thành viên
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-gray-500 flex items-center gap-1">
                                    <span className="font-medium text-gray-400">#1</span>
                                    <span className="mx-1">•</span>
                                    {format(new Date(post.createdAt), "dd 'Thg' MM yyyy")}
                                    {user && user.id === post.userId && (
                                        <>
                                            <button
                                                className="ml-4 text-gray-400 hover:text-amber-600 transition-colors"
                                                title="Chỉnh sửa bài viết"
                                                onClick={() => setIsEditingPost(true)}
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <button
                                                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Xóa bài viết"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Xóa bài viết?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Hành động này không thể hoàn tác. Bài viết này sẽ bị xóa vĩnh viễn khỏi hệ thống.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleDeletePost} className="bg-red-600 hover:bg-red-700">
                                                            Xóa
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </>
                                    )}

                                    {/* Report & Moderation Controls */}
                                    <div className="ml-4 flex items-center gap-2">
                                        <ReportDialog targetId={post.id} targetType="POST" triggerClassName="ml-1" />

                                        {isSuperAdmin && (
                                            <>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
                                                            title="Công cụ quản trị"
                                                        >
                                                            <MoreHorizontal size={16} />
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent align="end" className="w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
                                                        <div className="mb-2 px-2 pt-1">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quản trị viên</p>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={async () => {
                                                                    if (post.isPinned) await unpinPost(post.id);
                                                                    else await pinPost(post.id);
                                                                    await loadPost(post.id);
                                                                }}
                                                                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors ${post.isPinned
                                                                    ? 'bg-blue-50 text-blue-700'
                                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                                    }`}
                                                                title={post.isPinned ? 'Bỏ ghim bài' : 'Ghim bài lên đầu'}
                                                            >
                                                                <Pin size={16} fill={post.isPinned ? 'currentColor' : 'none'} className={post.isPinned ? 'text-blue-700' : 'text-gray-500'} />
                                                                {post.isPinned ? 'Bỏ ghim bài' : 'Ghim bài viết'}
                                                            </button>

                                                            <button
                                                                onClick={async () => {
                                                                    if (post.isLocked) await unlockPost(post.id);
                                                                    else await lockPost(post.id);
                                                                    await loadPost(post.id);
                                                                }}
                                                                className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors ${post.isLocked
                                                                    ? 'bg-amber-50 text-amber-700'
                                                                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                                                                    }`}
                                                                title={post.isLocked ? 'Mở khóa bài' : 'Khóa bài'}
                                                            >
                                                                <Lock size={16} fill={post.isLocked ? 'currentColor' : 'none'} className={post.isLocked ? 'text-amber-700' : 'text-gray-500'} />
                                                                {post.isLocked ? 'Mở khóa bài' : 'Khóa bài viết'}
                                                            </button>

                                                            <div className="my-1 h-px bg-gray-100" />

                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700">
                                                                        <Trash2 size={16} />
                                                                        Xóa bài viết
                                                                    </button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent>
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Xóa bài viết (Quản trị)?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            Bài viết sẽ bị ẩn khỏi công khai nhưng dữ liệu sẽ được lưu giữ cho audit.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                                                                        <AlertDialogAction onClick={async () => {
                                                                            const success = await softDeletePost(post.id);
                                                                            if (success) navigate('/forum');
                                                                        }} className="bg-red-600 hover:bg-red-700">
                                                                            Xóa
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>

                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 text-amber-900 transition-colors hover:bg-amber-100"
                                                            title="Xem danh sách báo cáo vi phạm"
                                                        >
                                                            <span>📋 Báo cáo vi phạm</span>
                                                            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                                                                {loadingReports ? '...' : targetReports.length}
                                                            </span>
                                                        </button>
                                                    </PopoverTrigger>
                                                    <PopoverContent align="end" className="w-[360px] rounded-xl border border-amber-200 bg-amber-50 p-0 shadow-lg">
                                                        <div className="border-b border-amber-200 px-4 py-3">
                                                            <div className="text-xs font-semibold uppercase tracking-wide text-amber-900">📋 Danh sách báo cáo vi phạm</div>
                                                            <div className="text-sm text-amber-800">
                                                                {loadingReports
                                                                    ? 'Đang tải danh sách báo cáo...'
                                                                    : `Tổng số báo cáo: ${targetReports.length}`}
                                                            </div>
                                                        </div>

                                                        <div className="max-h-80 overflow-y-auto p-3">
                                                            {!loadingReports && targetReports.length === 0 && (
                                                                <div className="rounded-md border border-dashed border-amber-300 bg-white/70 px-3 py-2 text-sm text-amber-900">
                                                                    Bài viết này chưa có báo cáo vi phạm nào.
                                                                </div>
                                                            )}

                                                            {!loadingReports && targetReports.length > 0 && (
                                                                <div className="space-y-2 pr-1">
                                                                    {targetReports.map((report) => (
                                                                        <div key={report.id} className="rounded-md border border-amber-200 bg-white px-3 py-2 shadow-sm">
                                                                            <div className="flex items-start justify-between gap-3">
                                                                                <div>
                                                                                    <div className="text-xs font-semibold text-amber-900 mb-1">Lý do báo cáo:</div>
                                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                                        {getViolationReasonLabel(report.reason)}
                                                                                    </div>
                                                                                    <div className="mt-2 text-xs text-gray-500">
                                                                                        Người báo cáo: {report.reporterName || 'Người dùng ẩn danh'}
                                                                                    </div>
                                                                                </div>
                                                                                {isSuperAdmin ? (
                                                                                    <select
                                                                                        className="text-[11px] font-medium text-amber-900 bg-amber-100 border border-amber-300 rounded-full px-2 py-1 outline-none cursor-pointer"
                                                                                        value={report.status}
                                                                                        onChange={(e) => {
                                                                                            setReportUpdateData({
                                                                                                reportId: report.id,
                                                                                                status: e.target.value,
                                                                                                notes: report.notes || ""
                                                                                            });
                                                                                            setReportUpdateModalOpen(true);
                                                                                        }}
                                                                                    >
                                                                                        <option value="PENDING">Đang chờ</option>
                                                                                        <option value="UNDER_REVIEW">Đang xem xét</option>
                                                                                        <option value="RESOLVED">Đã giải quyết</option>
                                                                                        <option value="DISMISSED">Bỏ qua</option>
                                                                                    </select>
                                                                                ) : (
                                                                                    <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-800">
                                                                                        {getReportStatusLabel(report.status)}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            {report.notes && (
                                                                                <div className="mt-2 text-sm text-gray-700 whitespace-pre-wrap border-t border-amber-100 pt-2">
                                                                                    <span className="font-semibold text-amber-800 text-xs">Ghi chú: </span>
                                                                                    {report.notes}
                                                                                </div>
                                                                            )}
                                                                            <div className="mt-2 text-[11px] text-gray-400">
                                                                                {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm')}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Content */}
                            {isEditingPost ? (
                                <div className="space-y-3 mb-4">
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        value={editPostTitle}
                                        onChange={(e) => setEditPostTitle(e.target.value)}
                                        placeholder="Tiêu đề"
                                    />
                                    <select
                                        className="w-full border rounded-lg px-3 py-2 text-sm bg-white"
                                        value={editPostCategoryId}
                                        onChange={(e) => setEditPostCategoryId(e.target.value)}
                                        title="Chọn chuyên mục"
                                        aria-label="Chọn chuyên mục"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                    <input
                                        className="w-full border rounded-lg px-3 py-2 text-sm"
                                        value={editPostTags}
                                        onChange={(e) => setEditPostTags(e.target.value)}
                                        placeholder="Tags, phân tách bằng dấu phẩy"
                                    />
                                    <RichTextEditor
                                        value={editPostContent}
                                        onChange={setEditPostContent}
                                        placeholder="Nội dung bài viết"
                                        minHeight="260px"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setIsEditingPost(false)}>
                                            Hủy
                                        </Button>
                                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleSavePostEdit}>
                                            Lưu bài viết
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className={`relative ${!isExpanded && showToggle ? 'max-h-[400px] overflow-hidden' : ''}`}>
                                    <div
                                        ref={contentRef}
                                        className="prose max-w-none text-gray-800 mb-6 text-base leading-relaxed content-html"
                                        dangerouslySetInnerHTML={{
                                            __html: decodeHTMLEntities(post.content || ""),
                                        }}
                                    />
                                    {!isExpanded && showToggle && (
                                        <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                    )}
                                </div>
                            )}

                            {showToggle && (
                                <div className="flex justify-center -mt-4 mb-4 relative z-10">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 font-medium"
                                    >
                                        {isExpanded ? (
                                            <>
                                                Thu gọn <ChevronUp size={16} />
                                            </>
                                        ) : (
                                            <>
                                                Xem thêm <ChevronDown size={16} />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 mt-4 border-t pt-4 border-dashed border-gray-100">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleToggleBookmark}
                                    className={`gap-2 ${isBookmarked ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                >
                                    {isBookmarked ? <BookmarkCheck size={18} className="fill-current" /> : <Bookmark size={18} />}
                                    {isBookmarked ? 'Đã lưu' : 'Lưu bài viết'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVote('UP')}
                                    className={`text-gray-400 hover:text-red-500 hover:bg-red-50 gap-2 ${(postData.isLiked ?? postData.liked) ? 'text-red-500' : ''}`}
                                >
                                    <Heart size={18} className={(postData.isLiked ?? postData.liked) ? "fill-current" : ""} />
                                    {postData.upvotes > 0 && <span className="text-sm font-medium">{postData.upvotes}</span>}
                                </Button>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-gray-400 hover:text-blue-500 hover:bg-blue-50 gap-2"
                                        >
                                            <Share2 size={18} />
                                            Chia sẻ
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 rounded-xl border border-gray-200 p-4 shadow-lg">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">Chia sẻ bài viết</p>
                                                <p className="text-xs text-gray-500">Chọn mạng xã hội hoặc sao chép liên kết.</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <a
                                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                >
                                                    Facebook
                                                </a>
                                                <a
                                                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(post.title)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
                                                >
                                                    X / Twitter
                                                </a>
                                                <a
                                                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                                >
                                                    LinkedIn
                                                </a>
                                                <button
                                                    type="button"
                                                    onClick={handleCopyPostLink}
                                                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                                                >
                                                    Sao chép link
                                                </button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="flex items-center justify-between text-sm text-gray-500 px-6 py-3 bg-gray-100/50 rounded-lg mb-8">
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="font-bold text-gray-700 text-lg leading-none">{post.viewCount}</div>
                                    <div className="text-xs">lượt xem</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-gray-700 text-lg leading-none">{comments.length}</div>
                                    <div className="text-xs">bình luận</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-gray-700 text-lg leading-none">{participantCount}</div>
                                    <div className="text-xs">người dùng</div>
                                </div>
                            </div>

                            <div className="flex items-center pl-6 border-l border-gray-300 gap-2">
                                <Avatar className="w-8 h-8 border-2 border-white -ml-2 first:ml-0 z-10">
                                    <AvatarImage src={postData.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                {/* Unique commenters (excluding author) */}
                                {uniqueCommentParticipants.slice(0, 3).map((comment) => (
                                    <Avatar key={comment.userId} className="w-8 h-8 border-2 border-white -ml-4 hover:z-20 transition-all">
                                        <AvatarImage src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                ))}
                                {uniqueCommentParticipants.length > 3 && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white -ml-4 flex items-center justify-center text-xs font-medium text-gray-600 z-0">
                                        +{uniqueCommentParticipants.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {commentTree.map((comment) => renderCommentNode(comment))}
                        </div>

                        {/* Locked Post Message */}
                        {post.isLocked && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-6 text-center">
                                <div className="flex items-center justify-center gap-2 text-orange-700">
                                    <Lock size={20} />
                                    <span className="font-medium">Bài viết này đã bị khóa. Không thể thêm bình luận mới.</span>
                                </div>
                            </div>
                        )}

                        {/* Comment Input */}
                        {!post.isLocked && (
                            <div id="comment-input" className="bg-white rounded-xl shadow-sm border p-6 mt-6">
                                <div className="flex gap-4">
                                    <Avatar className="w-10 h-10">
                                        <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'guest'}`} />
                                        <AvatarFallback>Me</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        {(replyToComment || editingComment) && (
                                            <div className="mb-2 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                                                <span>
                                                    {editingComment
                                                        ? `Đang chỉnh sửa bình luận của ${editingComment.authorName || 'Sinh viên'}`
                                                        : `Đang trả lời: ${replyToComment?.authorName || 'Sinh viên'}`}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="text-xs font-medium text-blue-600 hover:underline"
                                                    onClick={handleCancelCommentMode}
                                                >
                                                    Hủy
                                                </button>
                                            </div>
                                        )}
                                        <RichTextEditor
                                            value={newComment}
                                            onChange={setNewComment}
                                            placeholder={editingComment ? 'Chỉnh sửa nội dung bình luận...' : 'Viết bình luận, đặt câu hỏi hoặc chia sẻ ý kiến của bạn...'}
                                            minHeight="180px"
                                        />
                                        <div className="flex justify-end mt-2">
                                            <Button
                                                onClick={handleSubmitComment}
                                                disabled={!newComment.replace(/<[^>]*>/g, '').trim()}
                                                className="bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                                            >
                                                {editingComment ? 'Lưu chỉnh sửa' : 'Gửi trả lời'}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Right Timeline Sidebar */}
                    {/* Right Timeline Sidebar */}
                    <div className="w-48 hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="text-sm font-semibold text-gray-500 mb-4 px-2">Dòng thời gian</div>

                        <div className="relative pl-4 border-l-2 border-gray-100 space-y-0">
                            {/* Start Point (Post) */}
                            <div className="relative group cursor-pointer mb-6" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                <div className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white transition-colors ${activeId === 'start' ? 'bg-teal-500 scale-125' : 'bg-gray-300 group-hover:bg-teal-400'}`}></div>
                                <div className="pl-4">
                                    <div className={`text-xs font-bold transition-colors ${activeId === 'start' ? 'text-teal-600' : 'text-gray-900 group-hover:text-teal-600'}`}>Bắt đầu</div>
                                    <div className={`text-[10px] transition-colors ${activeId === 'start' ? 'text-teal-500 font-medium' : 'text-gray-400'}`}>{format(new Date(post.createdAt), "dd/MM HH:mm")}</div>
                                </div>
                            </div>

                            {/* Comments Timeline */}
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="relative group cursor-pointer mb-4 last:mb-0"
                                    onClick={() => {
                                        const el = document.getElementById(`comment-${comment.id}`);
                                        if (el) {
                                            const offset = 100; // Header offset
                                            const elementPosition = el.getBoundingClientRect().top;
                                            const offsetPosition = elementPosition + window.pageYOffset - offset;
                                            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                                        }
                                    }}
                                >
                                    <div className={`absolute -left-[4px] top-1.5 w-2 h-2 rounded-full ring-2 ring-white transition-all ${activeId === comment.id ? 'bg-blue-500 scale-125' : 'bg-gray-300 group-hover:bg-blue-400'}`}></div>
                                    <div className="pl-4">
                                        <div className={`text-xs font-medium truncate max-w-[140px] transition-colors ${activeId === comment.id ? 'text-blue-600 font-bold' : 'text-gray-600 group-hover:text-blue-600'}`}>
                                            {comment.authorName}
                                        </div>
                                        <div className={`text-[10px] transition-colors ${activeId === comment.id ? 'text-blue-500 font-medium' : 'text-gray-400'}`}>
                                            {format(new Date(comment.createdAt), "dd/MM HH:mm")}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* End Point (Input) */}
                            <div className="relative pt-6">
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 w-full rounded-lg shadow-sm transition-all"
                                    onClick={() => {
                                        const el = document.getElementById('comment-input');
                                        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        // Auto focus text area
                                        setTimeout(() => {
                                            const textarea = el?.querySelector('textarea');
                                            textarea?.focus();
                                        }, 500);
                                    }}
                                >
                                    Bình luận
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Moderation Notes Modal */}
            <Dialog open={reportUpdateModalOpen} onOpenChange={setReportUpdateModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Cập nhật trạng thái báo cáo</DialogTitle>
                        <DialogDescription>
                            Nhập ghi chú quản trị (không bắt buộc) cho thay đổi trạng thái này.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            rows={3}
                            placeholder="Ví dụ: Đã khóa bài viết vì vi phạm nội quy..."
                            value={reportUpdateData?.notes || ""}
                            onChange={(e) => setReportUpdateData(prev => prev ? { ...prev, notes: e.target.value } : null)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportUpdateModalOpen(false)}>Hủy</Button>
                        <Button
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            onClick={async () => {
                                if (!reportUpdateData || !postData?.post?.id) return;
                                try {
                                    await forumApi.updateReportStatus(reportUpdateData.reportId, reportUpdateData.status, reportUpdateData.notes);
                                    toast({ title: 'Đã cập nhật trạng thái báo cáo', duration: 2000 });
                                    const res = await forumApi.getReportsForTarget(postData.post.id);
                                    setTargetReports(res.data ?? []);
                                    setReportUpdateModalOpen(false);
                                } catch (err) {
                                    toast({ variant: 'destructive', title: 'Lỗi cập nhật trạng thái' });
                                }
                            }}
                        >
                            Cập nhật
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
};

export default ForumPostDetail;
