import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import forumApi, { type PostResponse, type Comment, type Category } from '../../services/api/forumApi';
import { useAuth } from '@/context/auth-context/useAuth';
import { forumDiscussionWS } from '@/services/websocket/forumDiscussionWebSocket';
import { getAccessToken } from '@/utils/localStorageVariables';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, Link as LinkIcon, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import ForumSidebar from '@/components/forum/ForumSidebar';
import { useToast } from "@/hooks/use-toast";
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
import { decodeHTMLEntities } from '@/utils/htmlCleaner';

const ForumPostDetail: React.FC = () => {
    const { toast } = useToast();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [postData, setPostData] = useState<PostResponse | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    const [isExpanded, setIsExpanded] = useState(false);
    const [showToggle, setShowToggle] = useState(false);
    const contentRef = React.useRef<HTMLDivElement>(null);

    const [activeId, setActiveId] = useState<string>('start');

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

            // Connect WebSocket
            const token = getAccessToken();
            if (token) {
                forumDiscussionWS.connect(token).then(() => {
                    forumDiscussionWS.subscribeToPostComments(id, (newComment) => {
                        setComments((prev) => {
                            // Avoid duplicates
                            if (prev.some(c => c.id === newComment.id)) return prev;
                            return [...prev, newComment];
                        });
                    });

                    forumDiscussionWS.subscribeToPostUpdates(id, (data) => {
                        if (data === "vote_update") {
                            loadPost(id); // Reload to get new vote counts
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
            setPostData(res.data);
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
        try {
            await forumApi.vote({ targetId: id, targetType: 'POST', type });
            loadPost(id);
        } catch (error) {
            console.error("Error voting", error);
        }
    };

    const handleSubmitComment = async () => {
        if (!id || !newComment.trim()) return;
        try {
            await forumApi.createComment(id, {
                postId: id,
                content: newComment,
                authorName: user ? `${user.firstName} ${user.lastName}` : 'Người dùng ẩn danh',
                authorAvatar: user?.avatarUrl || ''
            });
            setNewComment('');
            loadComments(id);
            loadPost(id); // Reload post to update comment count
        } catch (error) {
            console.error("Error sending comment", error);
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
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 leading-tight">
                    {post.title}
                </h1>

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
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <button
                                                    className="ml-4 text-gray-400 hover:text-red-600 transition-colors"
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
                                    )}
                                </div>
                            </div>

                            {/* Content */}
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
                                    onClick={() => handleVote('UP')}
                                    className={`text-gray-400 hover:text-red-500 hover:bg-red-50 gap-2 ${postData.isLiked ? 'text-red-500' : ''}`}
                                >
                                    <Heart size={18} className={postData.isLiked ? "fill-current" : ""} />
                                    {postData.upvotes > 0 && <span className="text-sm font-medium">{postData.upvotes}</span>}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                                    onClick={() => handleCopyLink()}
                                >
                                    <LinkIcon size={18} />
                                </Button>
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
                                    <div className="font-bold text-gray-700 text-lg leading-none">{postData.commentCount}</div>
                                    <div className="text-xs">liên kết</div>
                                </div>
                                <div className="text-center">
                                    <div className="font-bold text-gray-700 text-lg leading-none">{postData.commentCount + 1}</div>
                                    <div className="text-xs">người dùng</div>
                                </div>
                            </div>

                            <div className="flex items-center pl-6 border-l border-gray-300 gap-2">
                                <Avatar className="w-8 h-8 border-2 border-white -ml-2 first:ml-0 z-10">
                                    <AvatarImage src={postData.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                {/* Mock stats users */}
                                {comments.slice(0, 3).map((comment, i) => (
                                    <Avatar key={i} className="w-8 h-8 border-2 border-white -ml-4 hover:z-20 transition-all">
                                        <AvatarImage src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} />
                                        <AvatarFallback>U</AvatarFallback>
                                    </Avatar>
                                ))}
                                {comments.length > 3 && (
                                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white -ml-4 flex items-center justify-center text-xs font-medium text-gray-600 z-0">
                                        +{comments.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} id={`comment-${comment.id}`} className="bg-white rounded-xl shadow-sm border p-6 relative">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 flex items-center justify-center">
                                            <Avatar className="w-10 h-10 border">
                                                <AvatarImage src={comment.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.userId}`} />
                                                <AvatarFallback>U</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900">{comment.authorName || 'Sinh viên'}</div>
                                            <div className="text-xs text-gray-500">{format(new Date(comment.createdAt), "dd 'Thg' MM yyyy")}</div>
                                        </div>
                                    </div>

                                    <div className="mt-2">
                                        <div
                                            className="text-gray-800 mb-3 leading-relaxed content-html"
                                            dangerouslySetInnerHTML={{
                                                __html: decodeHTMLEntities(comment.content || ""),
                                            }}
                                        />

                                        {/* Comment Actions */}
                                        <div className="flex items-center justify-end gap-3 mt-2">
                                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-red-500 hover:bg-red-50">
                                                <Heart size={16} />
                                            </Button>
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
                                </div>
                            ))}
                        </div>

                        {/* Comment Input */}
                        <div id="comment-input" className="bg-white rounded-xl shadow-sm border p-6 mt-6">
                            <div className="flex gap-4">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id || 'guest'}`} />
                                    <AvatarFallback>Me</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <textarea
                                        className="w-full p-3 bg-gray-50 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                                        placeholder="Viết câu trả lời của bạn..."
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                    />
                                    <div className="flex justify-end mt-2">
                                        <Button
                                            onClick={handleSubmitComment}
                                            disabled={!newComment.trim()}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Gửi trả lời
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

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
        </div >
    );
};

export default ForumPostDetail;
