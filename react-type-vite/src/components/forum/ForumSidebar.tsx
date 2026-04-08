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
    const [tags, setTags] = useState<string[]>([]);

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
                <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase mb-3">
                    <div className="flex items-center gap-2">
                        <span className="cursor-pointer" onClick={() => {
                            onSelectCategory(undefined);
                            onSelectTag(undefined);
                            navigate('/forum');
                        }}>THƯ MỤC</span>
                    </div>
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
    );
};

export default ForumSidebar;
