import React, { useEffect, useMemo, useRef, useState } from 'react';
import forumApi, { type Category, type Post } from '../../services/api/forumApi';
import { forumDiscussionWS } from '@/services/websocket/forumDiscussionWebSocket';
import { getAccessToken } from '@/utils/localStorageVariables';
import { useAuth } from '@/context/auth-context/useAuth';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ForumSidebar from '@/components/forum/ForumSidebar';
// import { MessageSquare, Eye, Clock, Pin } from 'lucide-react'; // Removed unused
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Bookmark, BookmarkCheck, Search } from 'lucide-react';
import {
    isForumBookmarked,
    readForumBookmarks,
    toggleForumBookmark,
} from '@/utils/forumEngagement';

type ForumSortBy = 'newest' | 'hot' | 'unanswered';

const ForumHome: React.FC = () => {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [savedBookmarks, setSavedBookmarks] = useState<Post[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortBy, setSortBy] = useState<ForumSortBy>('newest');
    const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
    const [loading, setLoading] = useState(true);
    const filtersRef = useRef({
        categoryId: undefined as string | undefined,
        tag: undefined as string | undefined,
        searchTerm: '',
        sortBy: 'newest' as ForumSortBy,
    });

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        const loadBookmarks = async () => {
            if (user?.id) {
                try {
                    const res = await forumApi.getBookmarkedPosts();
                    setSavedBookmarks(res.data);
                    return;
                } catch (error) {
                    console.error('Failed to load bookmarks from backend', error);
                }
            }

            setSavedBookmarks(readForumBookmarks(user?.id));
        };

        loadBookmarks();
    }, [user?.id]);

    useEffect(() => {
        filtersRef.current = {
            categoryId: selectedCategory,
            tag: selectedTag,
            searchTerm,
            sortBy,
        };
    }, [selectedCategory, selectedTag, searchTerm, sortBy]);

    const loadPosts = async () => {
        setLoading(true);
        try {
            const res = await forumApi.getPosts({
                categoryId: filtersRef.current.categoryId,
                tag: filtersRef.current.tag,
                search: filtersRef.current.searchTerm,
                sortBy: filtersRef.current.sortBy,
            });
            setPosts(res.data.content);
        } catch (error) {
            console.error("Failed to load posts", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (showBookmarksOnly) {
            setLoading(false);
            return;
        }

        const timeout = window.setTimeout(() => {
            loadPosts();
        }, 250);

        return () => window.clearTimeout(timeout);
    }, [selectedCategory, selectedTag, searchTerm, sortBy, showBookmarksOnly]);

    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            forumDiscussionWS.connect(token).then(() => {
                forumDiscussionWS.subscribeToAllPosts(
                    () => {
                        loadPosts();
                    },
                    (deletedPostId) => {
                        setPosts(prev => prev.filter(p => p.id !== deletedPostId));
                    }
                );
            }).catch(err => console.error("WS connect error", err));
        }

        return () => {
            forumDiscussionWS.unsubscribeFromAllPosts();
        };
    }, []);

    const loadCategories = async () => {
        try {
            const res = await forumApi.getAllCategories();
            setCategories(res.data);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const formatActivityTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;

        return format(date, 'dd/MM/yyyy');
    };

    const visiblePosts = useMemo(() => {
        const sourcePosts = showBookmarksOnly ? savedBookmarks : posts;
        const normalizedSearch = searchTerm.trim().toLowerCase();

        const filteredPosts = sourcePosts.filter((post) => {
            const matchesCategory = !selectedCategory || post.categoryId === selectedCategory;
            const matchesTag = !selectedTag || (post.tags || []).includes(selectedTag);
            const matchesSearch =
                !normalizedSearch ||
                post.title.toLowerCase().includes(normalizedSearch) ||
                post.content.toLowerCase().includes(normalizedSearch) ||
                (post.tags || []).some((tag) => tag.toLowerCase().includes(normalizedSearch));

            return matchesCategory && matchesTag && matchesSearch;
        });

        const sortedPosts = [...filteredPosts].sort((left, right) => {
            if (sortBy === 'hot') {
                return (right.score || 0) - (left.score || 0);
            }

            if (sortBy === 'unanswered') {
                return (left.commentCount || 0) - (right.commentCount || 0);
            }

            return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        });

        return sortedPosts;
    }, [posts, savedBookmarks, selectedCategory, selectedTag, searchTerm, sortBy, showBookmarksOnly]);

    const handleToggleBookmark = async (post: Post) => {
        try {
            if (user?.id) {
                const res = await forumApi.toggleBookmark(post.id);
                const nextState = res.data.bookmarked;
                setSavedBookmarks((current) => nextState
                    ? [post, ...current.filter((bookmark) => bookmark.id !== post.id)]
                    : current.filter((bookmark) => bookmark.id !== post.id)
                );
                return;
            }

            const nextBookmarks = toggleForumBookmark(user?.id, post);
            setSavedBookmarks(nextBookmarks);
        } catch (error) {
            console.error('Failed to toggle bookmark', error);
        }
    };

    const isBookmarked = (postId: string) => {
        return savedBookmarks.some((bookmark) => bookmark.id === postId) || isForumBookmarked(user?.id, postId);
    };

    return (
        <div className="flex bg-gray-50 min-h-screen">
            {/* Sidebar */}
            <div className="hidden lg:block sticky top-20 h-screen overflow-y-auto">
                <ForumSidebar
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                    selectedTag={selectedTag}
                    onSelectTag={setSelectedTag}
                />
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
                {/* Top Filter Bar */}
                <div className="flex flex-col gap-4 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1 max-w-xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                                className="pl-9 bg-white"
                            />
                        </div>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white rounded-lg border hover:bg-gray-50"
                        >
                            Xóa tìm kiếm
                        </button>
                        <button
                            onClick={() => setShowBookmarksOnly((current) => !current)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg border transition ${showBookmarksOnly
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                                }`}
                        >
                            Đã lưu {savedBookmarks.length > 0 ? `(${savedBookmarks.length})` : ''}
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setSortBy('newest')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md shadow-sm border transition ${sortBy === 'newest' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'}`}
                        >
                            Mới nhất
                        </button>
                        <button
                            onClick={() => setSortBy('hot')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md shadow-sm border transition ${sortBy === 'hot' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'}`}
                        >
                            Nhiều upvote nhất
                        </button>
                        <button
                            onClick={() => setSortBy('unanswered')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md shadow-sm border transition ${sortBy === 'unanswered' ? 'bg-teal-500 text-white border-teal-500' : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-200'}`}
                        >
                            Chưa có ai trả lời
                        </button>
                    </div>
                </div>

                {/* Posts List Container */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Header Row */}
                    <div className="flex items-center text-xs font-medium text-gray-500 border-b px-6 py-3 bg-gray-50/50">
                        <div className="flex-1">Chủ đề</div>
                        <div className="w-24 text-center hidden sm:block">Trả lời</div>
                        <div className="w-24 text-center hidden md:block">Lượt xem</div>
                        <div className="w-32 text-right hidden sm:block">Hoạt động</div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="p-8 text-center text-gray-500">
                            Đang tải bài viết...
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && visiblePosts.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            {showBookmarksOnly
                                ? 'Chưa có bài viết nào được lưu.'
                                : 'Chưa có bài viết nào trong danh mục này.'}
                        </div>
                    )}

                    {/* Posts Rows */}
                    {!loading && visiblePosts.map((post) => (
                        <div key={post.id} className="group flex items-center px-6 py-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                            {/* Main Info */}
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-start gap-3 justify-between">
                                    <Link to={`/forum/posts/${post.id}`} className="block min-w-0 flex-1">
                                        <h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate mb-1">
                                            {post.title}
                                        </h3>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => handleToggleBookmark(post)}
                                        className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 transition hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50"
                                        title={isBookmarked(post.id) ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
                                    >
                                        {isBookmarked(post.id) ? <BookmarkCheck size={16} className="fill-current" /> : <Bookmark size={16} />}
                                    </button>
                                </div>

                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                    {/* Pinned Icon (Mock if needed) */}
                                    {/* <Pin size={12} className="text-gray-400 rotate-45" /> */}

                                    {/* Tags */}
                                    <div className="flex items-center gap-2">
                                        {post.tags && post.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200 font-normal px-1.5 py-0 h-5 text-[10px]">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>

                                    {/* Author Avatars */}
                                    <div className="flex -space-x-1.5 items-center">
                                        {/* Post Author */}
                                        <Avatar className="w-5 h-5 border border-white">
                                            <AvatarImage src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} />
                                            <AvatarFallback>U</AvatarFallback>
                                        </Avatar>

                                        {/* Commenters */}
                                        {post.recentCommenterAvatars?.map((avatar, i) => (
                                            <Avatar key={i} className="w-5 h-5 border border-white">
                                                <AvatarImage src={avatar} />
                                                <AvatarFallback>C</AvatarFallback>
                                            </Avatar>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="w-24 text-center hidden sm:block">
                                <span className="text-sm font-semibold text-gray-700">{post.commentCount}</span>
                            </div>

                            <div className="w-24 text-center hidden md:block">
                                <span className="text-sm text-gray-500 font-medium">
                                    {post.viewCount >= 1000 ? `${(post.viewCount / 1000).toFixed(1)}k` : post.viewCount}
                                </span>
                            </div>

                            <div className="w-32 text-right hidden sm:block">
                                <span className="text-sm text-gray-500">
                                    {formatActivityTime(post.createdAt)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ForumHome;
