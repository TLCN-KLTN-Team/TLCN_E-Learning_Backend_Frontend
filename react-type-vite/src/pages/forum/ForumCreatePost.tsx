import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import forumApi, { type Category } from '../../services/api/forumApi';

const ForumCreatePost: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
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
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await forumApi.createPost({
                title: formData.title,
                content: formData.content,
                categoryId: formData.categoryId,
                tags: []
            });
            navigate('/forum');
        } catch (error) {
            console.error("Error creating post", error);
            alert("Có lỗi xảy ra khi tạo bài viết");
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">Tạo bài viết mới</h1>
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                    <input
                        type="text"
                        required
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề</label>
                    <select
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.categoryId}
                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
                    <textarea
                        required
                        rows={10}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.content}
                        onChange={e => setFormData({ ...formData, content: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/forum')}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Đăng bài
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ForumCreatePost;
