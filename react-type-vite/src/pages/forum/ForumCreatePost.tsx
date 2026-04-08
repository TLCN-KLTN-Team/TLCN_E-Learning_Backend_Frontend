import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import forumApi, { type Category } from '../../services/api/forumApi';
import { useAuth } from '@/context/auth-context/useAuth';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

const ForumCreatePost: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [existingTags, setExistingTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        title: '',
        categoryId: '',
        content: ''
    });

    useEffect(() => {
        forumApi.getAllCategories().then((res: any) => {
            setCategories(res.data);
            if (res.data.length > 0) {
                setFormData(prev => ({ ...prev, categoryId: res.data[0].id }));
            }
        });
        forumApi.getTags().then((res) => setExistingTags(res.data)).catch(console.error);
    }, []);

    const addTag = () => {
        const trimmedTag = tagInput.trim();
        if (!trimmedTag || tags.includes(trimmedTag)) {
            return;
        }

        if (tags.length >= 5) {
            return;
        }

        setTags([...tags, trimmedTag]);
        setTagInput('');
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter((tag) => tag !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await forumApi.createPost({
                title: formData.title,
                content: formData.content,
                categoryId: formData.categoryId,
                tags,
                authorUsername: user?.username,
                authorName: user ? `${user.firstName} ${user.lastName}` : 'Người dùng ẩn danh',
                authorAvatar: user?.avatarUrl || ''
            });
            navigate('/forum');
        } catch (error) {
            console.error("Error creating post", error);
            alert("Có lỗi xảy ra khi tạo bài viết");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto p-4 max-w-4xl">
                <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Tạo bài viết mới</h1>
                        <p className="text-sm text-gray-500 mt-1">Viết bài bằng rich-text, thêm thẻ và chọn chủ đề trước khi đăng.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <Label htmlFor="title">Tiêu đề</Label>
                            <Input
                                id="title"
                                type="text"
                                required
                                className="mt-1"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Nhập tiêu đề bài viết"
                            />
                        </div>

                        <div>
                            <Label htmlFor="category">Chủ đề</Label>
                            <select
                                id="category"
                                required
                                title="Chọn chủ đề"
                                aria-label="Chọn chủ đề"
                                className="mt-1 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            >
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label htmlFor="content">Nội dung</Label>
                            <div className="mt-1">
                                <RichTextEditor
                                    value={formData.content}
                                    onChange={(content) => setFormData({ ...formData, content })}
                                    placeholder="Chia sẻ nội dung của bạn..."
                                    minHeight="420px"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="tag-input">Thẻ</Label>
                            <div className="mt-1 flex gap-2">
                                <Input
                                    id="tag-input"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                    placeholder="Nhập tag rồi nhấn Enter"
                                />
                                <Button type="button" variant="outline" onClick={addTag}>
                                    <Plus size={16} />
                                </Button>
                            </div>

                            {tags.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {tags.map((tag) => (
                                        <Badge key={tag} variant="secondary" className="gap-1 px-2 py-1">
                                            #{tag}
                                            <button type="button" onClick={() => removeTag(tag)} aria-label={`Xóa tag ${tag}`}>
                                                <X size={12} />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {existingTags.length > 0 && tagInput.trim() && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {existingTags
                                        .filter((tag) => tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag))
                                        .slice(0, 6)
                                        .map((tag) => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => {
                                                    if (tags.length >= 5) return;
                                                    setTags([...tags, tag]);
                                                    setTagInput('');
                                                }}
                                                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-600 hover:border-blue-300 hover:text-blue-700"
                                            >
                                                #{tag}
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t">
                            <Button type="button" variant="outline" onClick={() => navigate('/forum')}>
                                Hủy
                            </Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                Đăng bài
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForumCreatePost;
