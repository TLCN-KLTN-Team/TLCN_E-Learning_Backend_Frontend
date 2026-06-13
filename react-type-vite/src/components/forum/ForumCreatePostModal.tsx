import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import forumApi, { type Category } from '@/services/api/forumApi';
import { useAuth } from '@/context/auth-context/useAuth';
import { useForumModeration } from '@/hooks/useForumModeration';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown, Hash, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import RichTextEditor from '@/components/shared/RichTextEditor';

interface ForumCreatePostModalProps {
    children: React.ReactNode;
    categories: Category[];
}

const ForumCreatePostModal: React.FC<ForumCreatePostModalProps> = ({ children, categories }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isSuperAdmin } = useForumModeration();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Combobox state
    const [openCombobox, setOpenCombobox] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newCategoryName, setNewCategoryName] = useState<string | null>(null);

    // Tags state
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState("");
    const [existingTags, setExistingTags] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        categoryId: '',
        content: ''
    });

    // Reset state when modal opens/closes
    React.useEffect(() => {
        if (!open) {
            setSearchTerm("");
            setNewCategoryName(null);
            setFormData(prev => ({ ...prev, categoryId: '' }));
            setTags([]);
            setTagInput("");
        } else {
            // Load existing tags for autocomplete
            forumApi.getTags().then(res => {
                setExistingTags(res.data);
            }).catch(console.error);
        }
    }, [open]);

    const addTag = () => {
        const trimmedTag = tagInput.trim();
        if (trimmedTag && !tags.includes(trimmedTag)) {
            if (tags.length >= 5) {
                // Optional: Alert max tags
                return;
            }
            setTags([...tags, trimmedTag]);
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    const filteredCategories = categories
        .filter(c => c.id && c.id.trim() !== "") // Filter out invalid categories
        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let finalCategoryId = formData.categoryId;

            // If creating a new category (SuperAdmin only)
            if (newCategoryName && isSuperAdmin) {
                const newCatRes = await forumApi.createCategory({
                    name: newCategoryName,
                    description: `Chủ đề: ${newCategoryName}`
                });
                // @ts-ignore
                finalCategoryId = newCatRes.data.result ? newCatRes.data.result.id : newCatRes.data.id;
            } else if (!finalCategoryId) {
                if (categories.length > 0) finalCategoryId = categories[0].id;
            }

            if (!finalCategoryId) {
                toast({
                    variant: 'destructive',
                    title: 'Thiếu chủ đề',
                    description: 'Vui lòng chọn chủ đề cho bài viết.',
                });
                setLoading(false);
                return;
            }

            if (!formData.content.trim()) {
                toast({
                    variant: 'destructive',
                    title: 'Thiếu nội dung',
                    description: 'Vui lòng nhập nội dung bài viết.',
                });
                setLoading(false);
                return;
            }

            const res = await forumApi.createPost({
                title: formData.title,
                content: formData.content,
                categoryId: finalCategoryId,
                tags: tags,
                authorUsername: user?.username,
                authorName: user ? `${user.firstName} ${user.lastName}` : 'Người dùng ẩn danh',
                authorAvatar: user?.avatarUrl || ''
            });

            // @ts-ignore
            const createdPostId = res.data.result ? res.data.result.id : res.data.id;
            setOpen(false);
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
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            {/* Thêm overflow-visible để tránh cắt dropdown nếu không dùng Portal, nhưng thường Popover dùng Portal nên z-index quan trọng hơn */}
            <DialogContent
                overlayClassName="bg-transparent"
                className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto z-[10000]"
                onInteractOutside={(event) => {
                    event.preventDefault();
                }}
            >
                <DialogHeader>
                    <DialogTitle>Tạo bài viết mới</DialogTitle>
                    <DialogDescription>
                        Điền thông tin chi tiết để tạo bài viết thảo luận mới.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Tiêu đề</Label>
                        <Input
                            id="title"
                            required
                            placeholder="Đặt tiêu đề cho bài viết..."
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Chủ đề</Label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={false}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={openCombobox}
                                    className="w-full justify-between font-normal"
                                >
                                    {newCategoryName
                                        ? `Tạo mới: ${newCategoryName}`
                                        : formData.categoryId
                                            ? categories.find((c) => c.id === formData.categoryId)?.name
                                            : "Chọn hoặc nhập chủ đề..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>

                            {/* FIX: 
                                1. w-[--radix-popover-trigger-width]: Để width bằng đúng nút bấm
                                2. z-[9999]: Đè lên mọi thứ
                                3. max-h-[...]: Giới hạn chiều cao để không trôi quá xa
                                4. border & shadow: Tách biệt rõ ràng khỏi textarea
                            */}
                            <PopoverContent
                                portal={false}
                                className="w-[--radix-popover-trigger-width] p-0 bg-white dark:bg-slate-950 z-[10050] shadow-xl border border-slate-200"
                                align="start"
                                sideOffset={4}
                            >
                                <div className="p-2">
                                    <Input
                                        placeholder="Tìm hoặc tạo chủ đề..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                            }
                                        }}
                                        className="mb-2 h-9"
                                    />
                                    <div className="max-h-[200px] overflow-y-auto space-y-1">
                                        {/* Option tạo chủ đề mới: chỉ hiện với SuperAdmin */}
                                        {searchTerm.trim() && isSuperAdmin && !categories.some(c => c.name.toLowerCase() === searchTerm.trim().toLowerCase()) && (
                                            <div
                                                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-slate-100 text-blue-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const normalized = searchTerm.trim();
                                                    if (!normalized) return;
                                                    setNewCategoryName(normalized);
                                                    setFormData({ ...formData, categoryId: '' });
                                                    setOpenCombobox(false);
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Tạo chủ đề "{searchTerm.trim()}"
                                            </div>
                                        )}

                                        {filteredCategories.map((category) => (
                                            <div
                                                key={category.id}
                                                className={cn(
                                                    "flex items-center justify-between px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-slate-100",
                                                    formData.categoryId === category.id ? "bg-slate-100" : ""
                                                )}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log("Selected category:", category);
                                                    setFormData({ ...formData, categoryId: category.id });
                                                    setNewCategoryName(null);
                                                    setOpenCombobox(false);
                                                }}
                                            >
                                                <span>{category.name}</span>
                                                {formData.categoryId === category.id && (
                                                    <Check className="h-4 w-4" />
                                                )}
                                            </div>
                                        ))}

                                        {filteredCategories.length === 0 && !searchTerm && (
                                            <div className="text-sm text-gray-500 p-2 text-center">
                                                Chưa có chủ đề nào
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="tags">Thẻ (Tags)</Label>
                            <span className={`text-xs ${tags.length >= 5 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
                                {tags.length}/5
                            </span>
                        </div>

                        {/* Selected tags */}
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {tags.map((tag, index) => (
                                    <Badge key={index} variant="secondary" className="gap-1 pl-2 pr-1.5 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100">
                                        <Hash size={9} />
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="ml-0.5 rounded-full hover:text-red-500 transition-colors"
                                            aria-label="Xóa thẻ"
                                        >
                                            <X size={11} />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Input */}
                        {tags.length < 5 && (
                            <div className="flex gap-2">
                                <Input
                                    id="tags"
                                    placeholder="Nhập thẻ và nhấn Enter..."
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    className="text-sm"
                                />
                                <Button type="button" variant="outline" onClick={addTag} className="shrink-0">
                                    <Plus size={16} />
                                </Button>
                            </div>
                        )}

                        {/* Inline tag suggestions */}
                        {tags.length < 5 && (
                            (() => {
                                const suggested = existingTags
                                    .filter(t => !tags.includes(t))
                                    .filter(t => tagInput.trim() ? t.toLowerCase().includes(tagInput.toLowerCase()) : true)
                                    .slice(0, 8);
                                return suggested.length > 0 ? (
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400">
                                            {tagInput.trim() ? 'Gợi ý phù hợp:' : 'Thẻ phổ biến:'}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {suggested.map(tag => (
                                                <button
                                                    key={tag}
                                                    type="button"
                                                    onClick={() => {
                                                        if (tags.length >= 5) return;
                                                        setTags([...tags, tag]);
                                                        setTagInput("");
                                                    }}
                                                    className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs text-gray-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                >
                                                    <Hash size={9} />
                                                    {tag}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : null;
                            })()
                        )}

                        <p className="text-xs text-gray-400">
                            Thêm tối đa 5 thẻ để bài viết dễ tìm kiếm hơn.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">Nội dung</Label>
                        <RichTextEditor
                            value={formData.content}
                            onChange={(content) => {
                                setFormData(prev => ({
                                    ...prev,
                                    content: content
                                }))
                            }}
                            placeholder="Chia sẻ nội dung của bạn..."
                            minHeight="300px"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={loading}>
                            {loading ? 'Đang đăng...' : 'Đăng bài'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ForumCreatePostModal;
