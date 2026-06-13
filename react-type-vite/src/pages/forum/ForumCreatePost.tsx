import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import forumApi, { type Category } from '../../services/api/forumApi';
import { useAuth } from '@/context/auth-context/useAuth';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Check, ChevronsUpDown, Hash, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_TITLE_LENGTH = 150;
const MAX_TAGS = 5;

const ForumCreatePost: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();

    const [categories, setCategories] = useState<Category[]>([]);
    const [existingTags, setExistingTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Combobox state
    const [openCombobox, setOpenCombobox] = useState(false);
    const [categorySearch, setCategorySearch] = useState('');
    const comboboxRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        categoryId: '',
        content: ''
    });

    // Guard: redirect to login if not authenticated
    useEffect(() => {
        if (user === null) {
            navigate('/login', { state: { from: '/forum/create' } });
        }
    }, [user, navigate]);

    useEffect(() => {
        forumApi.getAllCategories().then((res: any) => {
            const cats: Category[] = res.data || [];
            setCategories(cats);
            // Do NOT auto-select the first category — force user to choose
        });
        forumApi.getTags().then((res) => setExistingTags(res.data)).catch(console.error);
    }, []);

    // Close combobox when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
                setOpenCombobox(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedCategory = categories.find(c => c.id === formData.categoryId);

    const filteredCategories = categories
        .filter(c => c.id && c.id.trim() !== '')
        .filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

    const addTag = (value?: string) => {
        const trimmedTag = (value ?? tagInput).trim().toLowerCase();
        if (!trimmedTag || tags.includes(trimmedTag) || tags.length >= MAX_TAGS) return;
        setTags(prev => [...prev, trimmedTag]);
        setTagInput('');
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    // Tags to suggest: show popular ones when no input, filter when typing
    const suggestedTags = existingTags
        .filter(t => {
            if (tags.includes(t)) return false;
            if (tagInput.trim()) return t.toLowerCase().includes(tagInput.toLowerCase());
            return true; // show all when no input
        })
        .slice(0, 8);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.categoryId) {
            toast({
                variant: 'destructive',
                title: 'Chưa chọn chủ đề',
                description: 'Vui lòng chọn chủ đề cho bài viết.',
            });
            return;
        }

        if (!formData.content.trim()) {
            toast({
                variant: 'destructive',
                title: 'Thiếu nội dung',
                description: 'Vui lòng nhập nội dung bài viết.',
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await forumApi.createPost({
                title: formData.title,
                content: formData.content,
                categoryId: formData.categoryId,
                tags,
                authorUsername: user?.username,
                authorName: user ? `${user.firstName} ${user.lastName}` : 'Người dùng ẩn danh',
                authorAvatar: user?.avatarUrl || ''
            });
            // @ts-ignore
            const createdPostId = res.data.result ? res.data.result.id : res.data.id;
            if (createdPostId) {
                navigate(`/forum/posts/${createdPostId}`);
            } else {
                navigate('/forum');
            }
        } catch (error) {
            console.error('Error creating post', error);
            toast({
                variant: 'destructive',
                title: 'Không thể đăng bài',
                description: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto px-4 max-w-3xl">

                {/* Header */}
                <div className="mb-6 flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/forum')}
                        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Quay lại diễn đàn
                    </button>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border">
                    <div className="px-6 py-5 border-b">
                        <h1 className="text-xl font-bold text-gray-900">Tạo bài viết mới</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Chia sẻ câu hỏi, kinh nghiệm hoặc tài liệu với cộng đồng.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Tiêu đề */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="title" className="text-sm font-medium">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </Label>
                                <span className={cn(
                                    "text-xs",
                                    formData.title.length > MAX_TITLE_LENGTH * 0.9 ? "text-orange-500" : "text-gray-400"
                                )}>
                                    {formData.title.length}/{MAX_TITLE_LENGTH}
                                </span>
                            </div>
                            <Input
                                id="title"
                                type="text"
                                required
                                maxLength={MAX_TITLE_LENGTH}
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Đặt tiêu đề rõ ràng, súc tích cho bài viết..."
                                className="text-sm"
                            />
                        </div>

                        {/* Chủ đề — Combobox */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">
                                Chủ đề <span className="text-red-500">*</span>
                            </Label>
                            <div className="relative" ref={comboboxRef}>
                                <button
                                    type="button"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    onClick={() => setOpenCombobox(prev => !prev)}
                                    className={cn(
                                        "w-full flex items-center justify-between rounded-md border bg-white px-3 py-2 text-sm shadow-sm transition-colors",
                                        openCombobox ? "border-blue-500 ring-1 ring-blue-500" : "border-input hover:border-gray-300",
                                        !selectedCategory && "text-gray-400"
                                    )}
                                >
                                    <span>
                                        {selectedCategory ? selectedCategory.name : "Chọn chủ đề..."}
                                    </span>
                                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                                </button>

                                {openCombobox && (
                                    <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                        <div className="p-2">
                                            <Input
                                                placeholder="Tìm chủ đề..."
                                                value={categorySearch}
                                                onChange={e => setCategorySearch(e.target.value)}
                                                onKeyDown={e => e.key === 'Escape' && setOpenCombobox(false)}
                                                className="h-8 text-sm"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="max-h-52 overflow-y-auto pb-1">
                                            {filteredCategories.length === 0 ? (
                                                <div className="px-3 py-4 text-center text-sm text-gray-400">
                                                    Không tìm thấy chủ đề phù hợp
                                                </div>
                                            ) : (
                                                filteredCategories.map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        type="button"
                                                        className={cn(
                                                            "w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors",
                                                            formData.categoryId === cat.id && "bg-blue-50 text-blue-700"
                                                        )}
                                                        onClick={() => {
                                                            setFormData({ ...formData, categoryId: cat.id });
                                                            setCategorySearch('');
                                                            setOpenCombobox(false);
                                                        }}
                                                    >
                                                        <span>{cat.name}</span>
                                                        {formData.categoryId === cat.id && (
                                                            <Check className="h-4 w-4 text-blue-600" />
                                                        )}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {selectedCategory?.description && (
                                <p className="text-xs text-gray-400 mt-1">{selectedCategory.description}</p>
                            )}
                        </div>

                        {/* Nội dung */}
                        <div className="space-y-1.5">
                            <Label htmlFor="content" className="text-sm font-medium">
                                Nội dung <span className="text-red-500">*</span>
                            </Label>
                            <RichTextEditor
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                placeholder="Chia sẻ nội dung của bạn..."
                                minHeight="380px"
                            />
                        </div>

                        {/* Thẻ (Tags) */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="tag-input" className="text-sm font-medium">
                                    Thẻ (Tags)
                                </Label>
                                <span className={cn(
                                    "text-xs",
                                    tags.length >= MAX_TAGS ? "text-orange-500 font-medium" : "text-gray-400"
                                )}>
                                    {tags.length}/{MAX_TAGS}
                                </span>
                            </div>

                            {/* Selected tags */}
                            {tags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {tags.map(tag => (
                                        <Badge
                                            key={tag}
                                            variant="secondary"
                                            className="gap-1 pl-2 pr-1.5 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                                        >
                                            <Hash size={10} />
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="ml-0.5 rounded-full hover:text-red-500 transition-colors"
                                                aria-label={`Xóa tag ${tag}`}
                                            >
                                                <X size={11} />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            )}

                            {/* Input + Add button */}
                            {tags.length < MAX_TAGS && (
                                <div className="flex gap-2">
                                    <Input
                                        id="tag-input"
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                addTag();
                                            }
                                        }}
                                        placeholder="Nhập thẻ và nhấn Enter..."
                                        className="text-sm"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => addTag()}
                                        className="shrink-0"
                                        title="Thêm thẻ"
                                    >
                                        <Plus size={16} />
                                    </Button>
                                </div>
                            )}

                            {/* Tag suggestions */}
                            {suggestedTags.length > 0 && tags.length < MAX_TAGS && (
                                <div className="space-y-1">
                                    <p className="text-xs text-gray-400">
                                        {tagInput.trim() ? 'Gợi ý phù hợp:' : 'Thẻ phổ biến:'}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {suggestedTags.map(tag => (
                                            <button
                                                key={tag}
                                                type="button"
                                                onClick={() => addTag(tag)}
                                                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                            >
                                                <Hash size={9} />
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-gray-400">
                                Thêm tối đa {MAX_TAGS} thẻ để bài viết dễ tìm kiếm hơn.
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-2 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate('/forum')}
                                disabled={submitting}
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
                                disabled={submitting}
                            >
                                {submitting ? 'Đang đăng...' : 'Đăng bài'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ForumCreatePost;
