import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import forumApi, { type Post } from '@/services/api/forumApi';
import { useAuth } from '@/context/auth-context/useAuth';
import { readForumBookmarks } from '@/utils/forumEngagement';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const ForumBookmarkedPosts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<Post[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBookmarks = async () => {
      setLoading(true);
      try {
        if (user?.id) {
          const res = await forumApi.getBookmarkedPosts();
          setBookmarks(res.data);
        } else {
          setBookmarks(readForumBookmarks(user?.id) as Post[]);
        }
      } catch (error) {
        console.error('Failed to load bookmarked posts', error);
        setBookmarks(readForumBookmarks(user?.id) as Post[]);
      } finally {
        setLoading(false);
      }
    };

    loadBookmarks();
  }, [user?.id]);

  const visibleBookmarks = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return bookmarks.filter((post) => {
      if (!normalized) return true;
      return (
        post.title.toLowerCase().includes(normalized) ||
        post.content.toLowerCase().includes(normalized) ||
        (post.tags || []).some((tag) => tag.toLowerCase().includes(normalized))
      );
    });
  }, [bookmarks, searchTerm]);

  const formatActivityTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} giây trước`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bài viết đã lưu</h1>
            <p className="mt-1 text-sm text-gray-500">Các bài viết bạn bookmark để đọc lại sau.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/forum')} className="w-fit">
            Về diễn đàn
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm">
          <Search className="h-4 w-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm trong bài viết đã lưu..."
            className="border-0 p-0 shadow-none focus-visible:ring-0"
          />
        </div>

        {loading ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-gray-500 shadow-sm">Đang tải bài viết đã lưu...</div>
        ) : visibleBookmarks.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-gray-500 shadow-sm">
            Chưa có bài viết nào được lưu.
          </div>
        ) : (
          <div className="space-y-3">
            {visibleBookmarks.map((post) => (
              <div key={post.id} className="rounded-2xl border bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
                <div className="flex items-start gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarImage src={post.authorAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.userId}`} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/forum/posts/${post.id}`} className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                        {post.title}
                      </Link>
                      <Bookmark className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>{post.authorName || 'Sinh viên'}</span>
                      <span>•</span>
                      <span>{formatActivityTime(post.createdAt)}</span>
                      <span>•</span>
                      <span>{post.commentCount} bình luận</span>
                      <span>•</span>
                      <span>{post.viewCount} lượt xem</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(post.tags || []).slice(0, 6).map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-600">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForumBookmarkedPosts;
