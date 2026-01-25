import axios from "axios";
import axiosInstance from "./httpClient/axiosInstance";

const formattedBaseUrl = (import.meta.env.VITE_BASE_URL || "http://localhost:8888/api/v1").replace(/\/$/, "");

const publicClient = axios.create({
    baseURL: formattedBaseUrl,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});


export interface Category {
    id: string;
    name: string;
    description: string;
    icon?: string;
}

export interface Post {
    id: string;
    title: string;
    content: string;
    userId: string;
    categoryId: string;
    createdAt: string;
    viewCount: number;
    tags?: string[];
    score: number;
    commentCount: number;
    authorName?: string;
    authorAvatar?: string;
    recentCommenterAvatars?: string[];
}

export interface PostResponse {
    post: Post;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    isLiked?: boolean;
    authorName?: string;
    authorAvatar?: string;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    content: string;
    replyToId?: string;
    createdAt: string;
    authorName?: string;
    authorAvatar?: string;
}

export interface CreatePostRequest {
    title: string;
    content: string;
    categoryId: string;
    tags?: string[];
    authorName?: string;
    authorAvatar?: string;
}

export interface CreateCommentRequest {
    postId: string;
    content: string;
    replyToId?: string;
    authorName?: string;
    authorAvatar?: string;
}

export interface VoteRequest {
    targetId: string;
    targetType: 'POST' | 'COMMENT';
    type: 'UP' | 'DOWN';
}

export interface CreateCategoryRequest {
    name: string;
    description: string;
    icon?: string;
}

const forumApi = {
    getAllCategories: () => {
        return publicClient.get<Category[]>("/chat/forum/categories");
    },
    createCategory: (data: CreateCategoryRequest) => {
        return axiosInstance.post<Category>("/chat/forum/categories", data);
    },
    getPosts: (categoryId?: string, tag?: string, page = 0, size = 10) => {
        return publicClient.get<any>("/chat/forum/posts", {
            params: { categoryId, tag, page, size },
        });
    },
    createPost: (data: CreatePostRequest) => {
        return axiosInstance.post<Post>("/chat/forum/posts", data);
    },
    getPostDetail: (postId: string) => {
        return axiosInstance.get<PostResponse>(`/chat/forum/posts/${postId}`);
    },
    deletePost: (postId: string) => {
        return axiosInstance.delete<void>(`/chat/forum/posts/${postId}`);
    },
    createComment: (postId: string, data: CreateCommentRequest) => {
        return axiosInstance.post<Comment>(`/chat/forum/posts/${postId}/comments`, data);
    },
    getComments: (postId: string) => {
        return publicClient.get<Comment[]>(`/chat/forum/posts/${postId}/comments`);
    },
    vote: (data: VoteRequest) => {
        return axiosInstance.post<void>("/chat/forum/interactions/vote", data);
    },
    getTags: () => {
        return publicClient.get<string[]>("/chat/forum/tags");
    },
};

export default forumApi;
