import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import forumApi, { type Category } from '@/services/api/forumApi';
import { useAuth } from '@/context/auth-context/useAuth';
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
import { Check, ChevronsUpDown, Plus, X } from 'lucide-react';
import { Editor } from '@tinymce/tinymce-react';
import { cn } from '@/lib/utils';

interface ForumCreatePostModalProps {
    children: React.ReactNode;
    categories: Category[];
}

const ForumCreatePostModal: React.FC<ForumCreatePostModalProps> = ({ children, categories }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
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
            console.log("Submitting form:", { formData, newCategoryName, categories });


            // If creating a new category
            if (newCategoryName) {
                const newCatRes = await forumApi.createCategory({
                    name: newCategoryName,
                    description: `Chủ đề: ${newCategoryName}`
                });
                console.log("Create Category Response:", newCatRes);

                // Handle response if wrapped in result property
                // @ts-ignore
                finalCategoryId = newCatRes.data.result ? newCatRes.data.result.id : newCatRes.data.id;
            } else if (!finalCategoryId) {
                if (categories.length > 0) finalCategoryId = categories[0].id;
            }

            if (!finalCategoryId) {
                console.log("Validation failed: No Category ID", { finalCategoryId, formData });
                alert("Vui lòng chọn hoặc nhập chủ đề!");
                setLoading(false);
                return;
            }

            const res = await forumApi.createPost({
                title: formData.title,
                content: formData.content,
                categoryId: finalCategoryId,
                tags: tags,
                authorName: user ? `${user.firstName} ${user.lastName}` : 'Người dùng ẩn danh',
                authorAvatar: user?.avatarUrl || ''
            });
            console.log("Create Post Response:", res);

            // Handle response if wrapped in result property
            // @ts-ignore
            const createdPostId = res.data.result ? res.data.result.id : res.data.id;

            if (createdPostId) {
                navigate(`/forum/posts/${createdPostId}`);
            } else {
                navigate('/forum');
                window.location.reload();
            }
        } catch (error) {
            console.error("Error creating post", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            {/* Thêm overflow-visible để tránh cắt dropdown nếu không dùng Portal, nhưng thường Popover dùng Portal nên z-index quan trọng hơn */}
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto z-[50]">
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
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox} modal={true}>
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
                                className="w-[--radix-popover-trigger-width] p-0 bg-white dark:bg-slate-950 z-[9999] shadow-xl border border-slate-200"
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
                                        {searchTerm && !categories.some(c => c.name.toLowerCase() === searchTerm.toLowerCase()) && (
                                            <div
                                                className="flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-slate-100 text-blue-600"
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setNewCategoryName(searchTerm);
                                                    setFormData({ ...formData, categoryId: '' });
                                                    setOpenCombobox(false);
                                                }}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Tạo chủ đề "{searchTerm}"
                                            </div>
                                        )}

                                        {filteredCategories.map((category) => (
                                            <div
                                                key={category.id}
                                                className={cn(
                                                    "flex items-center justify-between px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-slate-100",
                                                    formData.categoryId === category.id ? "bg-slate-100" : ""
                                                )}
                                                onMouseDown={(e) => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
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
                        <Label htmlFor="tags">Thẻ (Tags)</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {tags.map((tag, index) => (
                                <div key={index} className="flex items-center gap-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm">
                                    <span>#{tag}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tag)}
                                        className="text-gray-400 hover:text-red-500 ml-1"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2 relative">
                            <Input
                                id="tags"
                                placeholder="Nhập thẻ và nhấn Enter hoặc chọn từ gợi ý..."
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                onBlur={() => {
                                    // Delay hide to allow click
                                    setTimeout(() => setTagInput(prev => prev), 200);
                                }}
                            />
                            <Button type="button" variant="outline" onClick={addTag}>
                                <Plus size={16} />
                            </Button>

                            {/* Tag Suggestions */}
                            {tagInput.trim() && (
                                <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                                    {existingTags
                                        .filter(t => t.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(t))
                                        .map(tag => (
                                            <div
                                                key={tag}
                                                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                                onClick={() => {
                                                    if (tags.length >= 5) return;
                                                    setTags([...tags, tag]);
                                                    setTagInput("");
                                                }}
                                            >
                                                #{tag}
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Thêm tối đa 5 thẻ để bài viết dễ dàng được tìm thấy hơn.
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="content">Nội dung</Label>
                        <Editor
                            apiKey={import.meta.env.VITE_API_KEY_TINY}
                            value={formData.content}
                            init={{
                                height: 300,
                                menubar: false,
                                plugins: [
                                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                                ],
                                toolbar: 'undo redo | blocks | ' +
                                    'bold italic forecolor | alignleft aligncenter ' +
                                    'alignright alignjustify | bullist numlist outdent indent | ' +
                                    'removeformat | help',
                                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                                placeholder: "Chia sẻ nội dung của bạn..."
                            }}
                            onEditorChange={(content) => {
                                setFormData(prev => ({
                                    ...prev,
                                    content: content
                                }))
                            }}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Hủy
                        </Button>
                        <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
                            {loading ? 'Đang đăng...' : 'Đăng bài'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ForumCreatePostModal;