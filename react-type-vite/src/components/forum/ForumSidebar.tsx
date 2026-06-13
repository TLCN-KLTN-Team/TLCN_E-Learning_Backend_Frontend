import React, { useEffect, useState } from 'react';
import {
    Layout,
    Plus,
    Folder,
    Hash,
    List,
} from 'lucide-react';
import forumApi, { type Category } from '@/services/api/forumApi';
import { useNavigate } from 'react-router-dom';
import ForumCreatePostModal from './ForumCreatePostModal';
import { Bookmark } from 'lucide-react';
import { useForumModeration } from '@/hooks/useForumModeration';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

interface ForumSidebarProps {
    categories: Category[];
    selectedCategory?: string;
    onSelectCategory: (id?: string) => void;
    selectedTag?: string;
    onSelectTag: (tag?: string) => void;
}

const ForumSidebar: React.FC<ForumSidebarProps> = ({
    categories,
    selectedCategory,
    onSelectCategory,
    selectedTag,
    onSelectTag
}) => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { isSuperAdmin } = useForumModeration();
    const [tags, setTags] = useState<string[]>([]);
    const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryDesc, setNewCategoryDesc] = useState('');
    const [isSubmittingCat, setIsSubmittingCat] = useState(false);

    useEffect(() => {
        loadTags();
    }, []);

    const loadTags = async () => {
        try {
            const res = await forumApi.getTags();
            setTags(res.data);
        } catch (error) {
            console.error("Failed to load tags", error);
        }
    };

    return (
        <>
        <aside className="w-64 bg-white border-r min-h-screen py-6 px-4 flex flex-col gap-6">
            {/* Main Action */}
            <div>
                <div className="flex items-center justify-between mb-2 text-gray-700 font-semibold">
                    <div className="flex items-center gap-2">
                        <Layout size={18} />
                        <span>Chủ đề</span>
                    </div>
                </div>
                <ForumCreatePostModal categories={categories}>
                    <button
                        className="w-full flex items-center justify-center gap-2 bg-white border border-dashed border-gray-300 rounded text-gray-500 hover:text-blue-600 hover:border-blue-500 hover:bg-blue-50 py-2 transition"
                    >
                        <Plus size={16} />
                        <span>Thêm bài viết</span>
                    </button>
                </ForumCreatePostModal>
            </div>

            {/* Categories (Folders) */}
            <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase mb-3 group">
                    <div className="flex items-center gap-2">
                        <span className="cursor-pointer" onClick={() => {
                            onSelectCategory(undefined);
                            onSelectTag(undefined);
                            navigate('/forum');
                        }}>THƯ MỤC</span>
                    </div>
                    {isSuperAdmin && (
                        <button 
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-blue-600 transition opacity-0 group-hover:opacity-100"
                            title="Thêm thư mục mới"
                            onClick={() => setIsAddCategoryOpen(true)}
                        >
                            <Plus size={14} />
                        </button>
                    )}
                </div>
                <ul className="space-y-1">
                    <li>
                        <button
                            onClick={() => {
                                onSelectCategory(undefined);
                                onSelectTag(undefined);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition ${!selectedCategory && !selectedTag
                                ? 'bg-gray-100 text-gray-900 font-medium'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            <List size={16} />
                            <span>Tất cả danh mục</span>
                        </button>
                    </li>
                    {categories.map((cat) => (
                        <li key={cat.id}>
                            <button
                                onClick={() => {
                                    onSelectCategory(cat.id);
                                    onSelectTag(undefined);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition ${selectedCategory === cat.id
                                    ? 'bg-gray-100 text-gray-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Folder size={16} className={selectedCategory === cat.id ? "text-blue-500" : "text-gray-400"} />
                                <span className="truncate">{cat.name}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Tags */}
            <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase mb-3">
                    <span>THẺ NỔI BẬT</span>
                </div>
                <ul className="space-y-1">
                    {tags.length === 0 && (
                        <li className="text-xs text-gray-400 px-3">Chưa có thẻ nào</li>
                    )}
                    {tags.map((tag) => (
                        <li key={tag}>
                            <button
                                onClick={() => {
                                    onSelectTag(tag);
                                    onSelectCategory(undefined);
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition ${selectedTag === tag
                                    ? 'bg-gray-100 text-gray-900 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Hash size={16} className={selectedTag === tag ? "text-blue-500" : "text-gray-400"} />
                                <span className="truncate">{tag}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="pt-2 border-t">
                <button
                    onClick={() => navigate('/forum/bookmarks')}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition"
                >
                    <Bookmark size={16} />
                    <span>Bài viết đã lưu</span>
                </button>
            </div>
        </aside>

        {/* Add Category Modal */}
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Thêm thư mục mới</DialogTitle>
                    <DialogDescription>
                        Tạo chuyên mục mới cho diễn đàn (Chỉ dành cho Super Admin).
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Tên thư mục *</label>
                        <input
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Ví dụ: Công nghệ"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Mô tả</label>
                        <textarea
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Nhập mô tả cho thư mục này..."
                            value={newCategoryDesc}
                            onChange={(e) => setNewCategoryDesc(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)} disabled={isSubmittingCat}>
                        Hủy
                    </Button>
                    <Button 
                        className="bg-blue-600 hover:bg-blue-700 text-white" 
                        disabled={!newCategoryName.trim() || isSubmittingCat}
                        onClick={async () => {
                            try {
                                setIsSubmittingCat(true);
                                await forumApi.createCategory({
                                    name: newCategoryName,
                                    description: newCategoryDesc
                                });
                                toast({ title: 'Thêm thư mục thành công' });
                                setIsAddCategoryOpen(false);
                                setNewCategoryName('');
                                setNewCategoryDesc('');
                                // Tải lại trang để lấy danh sách thư mục mới (hoặc bạn có thể thêm logic fetch categories)
                                window.location.reload();
                            } catch (err) {
                                toast({ variant: 'destructive', title: 'Lỗi', description: 'Không thể tạo thư mục' });
                            } finally {
                                setIsSubmittingCat(false);
                            }
                        }}
                    >
                        {isSubmittingCat ? 'Đang thêm...' : 'Thêm thư mục'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
};

export default ForumSidebar;
