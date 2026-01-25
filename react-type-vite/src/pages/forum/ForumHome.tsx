import React, { useEffect, useState } from 'react';
import forumApi, { type Category, type Post } from '../../services/api/forumApi';
import { forumDiscussionWS } from '@/services/websocket/forumDiscussionWebSocket';
import { getAccessToken } from '@/utils/localStorageVariables';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import ForumSidebar from '@/components/forum/ForumSidebar';
// import { MessageSquare, Eye, Clock, Pin } from 'lucide-react'; // Removed unused
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const ForumHome: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCategories();
    }, []);

    useEffect(() => {
        loadPosts(selectedCategory, selectedTag);
        // Connect WebSocket
        const token = getAccessToken();
        if (token) {
            forumDiscussionWS.connect(token).then(() => {
                forumDiscussionWS.subscribeToAllPosts(
                    (newPost) => {
                        // Only add if it matches current filter (client-side filter)
                        if (selectedCategory && newPost.categoryId !== selectedCategory) return;
                        if (selectedTag && !newPost.tags?.includes(selectedTag)) return;

                        setPosts(prev => [newPost, ...prev]);
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
    }, [selectedCategory, selectedTag]);

    const loadCategories = async () => {
        try {
            const res = await forumApi.getAllCategories();
            setCategories(res.data);
        } catch (error) {
            console.error("Failed to load categories", error);
        }
    };

    const loadPosts = async (catId?: string, tag?: string) => {
        setLoading(true);
        try {
            const res = await forumApi.getPosts(catId, tag);
            setPosts(res.data.content);
        } catch (error) {
            console.error("Failed to load posts", error);
        } finally {
            setLoading(false);
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
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex bg-white rounded-lg p-1 shadow-sm border">
                        <button className="px-4 py-1.5 text-sm font-medium rounded-md bg-teal-500 text-white shadow-sm">
                            Mới nhất
                        </button>
                        <button className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                            Danh mục
                        </button>
                        <button className="px-4 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">
                            Hot
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
                    {!loading && posts.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            Chưa có bài viết nào trong danh mục này.
                        </div>
                    )}

                    {/* Posts Rows */}
                    {!loading && posts.map((post) => (
                        <div key={post.id} className="group flex items-center px-6 py-4 border-b last:border-0 hover:bg-gray-50 transition-colors">
                            {/* Main Info */}
                            <div className="flex-1 min-w-0 pr-4">
                                <Link to={`/forum/posts/${post.id}`} className="block">
                                    <h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors truncate mb-1">
                                        {post.title}
                                    </h3>
                                </Link>

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
