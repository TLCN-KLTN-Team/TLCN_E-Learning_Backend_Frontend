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
    isPinned?: boolean;
    isLocked?: boolean;
    moderationStatus?: string;
}

export interface PostResponse {
    post: Post;
    upvotes: number;
    downvotes: number;
    commentCount: number;
    isLiked?: boolean;
    liked?: boolean;
    authorName?: string;
    authorAvatar?: string;
}

export interface BookmarkToggleResponse {
    bookmarked: boolean;
}

export interface Comment {
    id: string;
    postId: string;
    userId: string;
    content: string;
    replyToId?: string;
    createdAt: string;
    updatedAt?: string;
    authorName?: string;
    authorAvatar?: string;
    upvotes?: number;
    downvotes?: number;
    score?: number;
    isLiked?: boolean;
    liked?: boolean;
}

export interface CreatePostRequest {
    title: string;
    content: string;
    categoryId: string;
    tags?: string[];
    authorUsername?: string;
    authorName?: string;
    authorAvatar?: string;
}

export interface UpdatePostRequest {
    title: string;
    content: string;
    categoryId: string;
    tags?: string[];
}

export interface CreateCommentRequest {
    postId: string;
    content: string;
    replyToId?: string;
    authorUsername?: string;
    authorName?: string;
    authorAvatar?: string;
}

export interface VoteRequest {
    targetId: string;
    targetType: 'POST' | 'COMMENT';
    type: 'UP' | 'DOWN';
}

export interface CreateReportRequest {
    targetType: 'POST' | 'COMMENT';
    reason: string;
    notes?: string;
}

export interface ViolationReportResponse {
    id: string;
    reporterId: string;
    reporterName?: string;
    targetId: string;
    targetType: 'POST' | 'COMMENT';
    reason: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    status: 'PENDING' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED';
    moderatorId?: string;
    moderatorNotes?: string;
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
    getPosts: (
        params?: {
            categoryId?: string;
            tag?: string;
            search?: string;
            sortBy?: string;
            page?: number;
            size?: number;
        }
    ) => {
        return publicClient.get<any>("/chat/forum/posts", {
            params: {
                categoryId: params?.categoryId,
                tag: params?.tag,
                search: params?.search,
                sortBy: params?.sortBy,
                page: params?.page ?? 0,
                size: params?.size ?? 10,
            },
        });
    },
    createPost: (data: CreatePostRequest) => {
        return axiosInstance.post<Post>("/chat/forum/posts", data);
    },
    updatePost: (postId: string, data: UpdatePostRequest) => {
        return axiosInstance.put<Post>(`/chat/forum/posts/${postId}`, data);
    },
    getPostDetail: (postId: string) => {
        return publicClient.get<PostResponse>(`/chat/forum/posts/${postId}`);
    },
    deletePost: (postId: string) => {
        return axiosInstance.delete<void>(`/chat/forum/posts/${postId}`);
    },
    getBookmarkedPosts: () => {
        return axiosInstance.get<Post[]>('/chat/forum/bookmarks');
    },
    toggleBookmark: (postId: string) => {
        return axiosInstance.post<BookmarkToggleResponse>(`/chat/forum/posts/${postId}/bookmark`);
    },
    createComment: (postId: string, data: CreateCommentRequest) => {
        return axiosInstance.post<Comment>(`/chat/forum/posts/${postId}/comments`, data);
    },
    updateComment: (postId: string, commentId: string, data: { content: string }) => {
        return axiosInstance.put<Comment>(`/chat/forum/posts/${postId}/comments/${commentId}`, data);
    },
    deleteComment: (postId: string, commentId: string) => {
        return axiosInstance.delete<void>(`/chat/forum/posts/${postId}/comments/${commentId}`);
    },
    getComments: (postId: string) => {
        return axiosInstance.get<Comment[]>(`/chat/forum/posts/${postId}/comments`);
    },
    vote: (data: VoteRequest) => {
        return axiosInstance.post<void>("/chat/forum/interactions/vote", data);
    },
    getTags: () => {
        return publicClient.get<string[]>("/chat/forum/tags");
    },

    // ==================== MODERATION METHODS ====================
    
    // Report endpoints (public - any user can report)
    reportPost: (postId: string, data: Omit<CreateReportRequest, 'targetType'>) => {
        return axiosInstance.post<ViolationReportResponse>(`/chat/forum/posts/${postId}/report`, {
            ...data,
            targetType: 'POST'
        });
    },
    reportComment: (commentId: string, data: Omit<CreateReportRequest, 'targetType'>) => {
        return axiosInstance.post<ViolationReportResponse>(`/chat/forum/comments/${commentId}/report`, {
            ...data,
            targetType: 'COMMENT'
        });
    },

    // Moderation queue (SuperAdmin only)
    getPendingReports: (page: number = 0, size: number = 20) => {
        return axiosInstance.get<any>('/chat/forum/moderation/reports', {
            params: { page, size }
        });
    },
    getAllReports: (status?: string, page: number = 0, size: number = 20) => {
        return axiosInstance.get<any>('/chat/forum/moderation/reports/all', {
            params: { status, page, size }
        });
    },
    updateReportStatus: (reportId: string, status: string, moderatorNotes?: string) => {
        return axiosInstance.put<ViolationReportResponse>(
            `/chat/forum/moderation/reports/${reportId}/status`,
            moderatorNotes,
            { params: { status } }
        );
    },

    // Post moderation (SuperAdmin only)
    pinPost: (postId: string) => {
        return axiosInstance.post<Post>(`/chat/forum/moderation/posts/${postId}/pin`);
    },
    unpinPost: (postId: string) => {
        return axiosInstance.post<Post>(`/chat/forum/moderation/posts/${postId}/unpin`);
    },
    lockPost: (postId: string) => {
        return axiosInstance.post<Post>(`/chat/forum/moderation/posts/${postId}/lock`);
    },
    unlockPost: (postId: string) => {
        return axiosInstance.post<Post>(`/chat/forum/moderation/posts/${postId}/unlock`);
    },
    softDeletePost: (postId: string) => {
        return axiosInstance.delete<void>(`/chat/forum/moderation/posts/${postId}`);
    },

    // Comment moderation (SuperAdmin only)
    softDeleteComment: (commentId: string) => {
        return axiosInstance.delete<void>(`/chat/forum/moderation/comments/${commentId}`);
    },

    // Get reports for specific target
    getReportsForTarget: (targetId: string) => {
        return axiosInstance.get<ViolationReportResponse[]>(`/chat/forum/${targetId}/reports`);
    },
};

export default forumApi;
