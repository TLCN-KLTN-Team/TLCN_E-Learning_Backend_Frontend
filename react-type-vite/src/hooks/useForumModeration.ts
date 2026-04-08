import { useAuth } from "@/context/auth-context/useAuth";
import { useCallback, useState } from "react";
import forumApi from "@/services/api/forumApi";
import { useToast } from "@/hooks/use-toast";

export const useForumModeration = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const normalizedRoles = [
        ...(user?.roles ?? []),
        user?.role ?? "",
    ].filter(Boolean);

    const isSuperAdmin = normalizedRoles.some(
        (role) => role === 'ROLE_SUPER_ADMIN' || role === 'SUPER_ADMIN'
    );
    const canReport = !!user;

    // Report actions
    const reportPost = useCallback(async (postId: string, reason: string, notes?: string) => {
        if (!canReport) {
            toast({
                title: "Error",
                description: "You must be logged in to report",
                variant: "destructive"
            });
            return null;
        }

        try {
            setIsLoading(true);
            const response = await forumApi.reportPost(postId, { reason, notes });
            toast({
                title: "Success",
                description: "Report submitted successfully"
            });
            return response.data;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit report",
                variant: "destructive"
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [canReport, toast]);

    const reportComment = useCallback(async (commentId: string, reason: string, notes?: string) => {
        if (!canReport) {
            toast({
                title: "Error",
                description: "You must be logged in to report",
                variant: "destructive"
            });
            return null;
        }

        try {
            setIsLoading(true);
            const response = await forumApi.reportComment(commentId, { reason, notes });
            toast({
                title: "Success",
                description: "Report submitted successfully"
            });
            return response.data;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to submit report",
                variant: "destructive"
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [canReport, toast]);

    // Moderation actions (SuperAdmin only)
    const pinPost = useCallback(async (postId: string) => {
        if (!isSuperAdmin) {
            toast({
                title: "Error",
                description: "You don't have permission to pin posts",
                variant: "destructive"
            });
            return null;
        }

        try {
            setIsLoading(true);
            const response = await forumApi.pinPost(postId);
            toast({
                title: "Success",
                description: "Post pinned successfully"
            });
            return response.data;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to pin post",
                variant: "destructive"
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [isSuperAdmin, toast]);

    const unpinPost = useCallback(async (postId: string) => {
        if (!isSuperAdmin) {
            toast({
                title: "Error",
                description: "You don't have permission to unpin posts",
                variant: "destructive"
            });
            return null;
        }

        try {
            setIsLoading(true);
            const response = await forumApi.unpinPost(postId);
            toast({
                title: "Success",
                description: "Post unpinned successfully"
            });
            return response.data;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to unpin post",
                variant: "destructive"
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [isSuperAdmin, toast]);

    const lockPost = useCallback(async (postId: string) => {
        if (!isSuperAdmin) {
            toast({
                title: "Error",
                description: "You don't have permission to lock posts",
                variant: "destructive"
            });
            return null;
        }

        try {
            setIsLoading(true);
            const response = await forumApi.lockPost(postId);
            toast({
                title: "Success",
                description: "Post locked successfully"
            });
            return response.data;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to lock post",
                variant: "destructive"
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [isSuperAdmin, toast]);

    const unlockPost = useCallback(async (postId: string) => {
        if (!isSuperAdmin) {
            toast({
                title: "Error",
                description: "You don't have permission to unlock posts",
                variant: "destructive"
            });
            return null;
        }

        try {
            setIsLoading(true);
            const response = await forumApi.unlockPost(postId);
            toast({
                title: "Success",
                description: "Post unlocked successfully"
            });
            return response.data;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to unlock post",
                variant: "destructive"
            });
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [isSuperAdmin, toast]);

    const softDeletePost = useCallback(async (postId: string) => {
        if (!isSuperAdmin) {
            toast({
                title: "Error",
                description: "You don't have permission to delete posts",
                variant: "destructive"
            });
            return false;
        }

        try {
            setIsLoading(true);
            await forumApi.softDeletePost(postId);
            toast({
                title: "Success",
                description: "Post deleted successfully"
            });
            return true;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete post",
                variant: "destructive"
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSuperAdmin, toast]);

    const softDeleteComment = useCallback(async (commentId: string) => {
        if (!isSuperAdmin) {
            toast({
                title: "Error",
                description: "You don't have permission to delete comments",
                variant: "destructive"
            });
            return false;
        }

        try {
            setIsLoading(true);
            await forumApi.softDeleteComment(commentId);
            toast({
                title: "Success",
                description: "Comment deleted successfully"
            });
            return true;
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to delete comment",
                variant: "destructive"
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [isSuperAdmin, toast]);

    return {
        isSuperAdmin,
        canReport,
        isLoading,
        reportPost,
        reportComment,
        pinPost,
        unpinPost,
        lockPost,
        unlockPost,
        softDeletePost,
        softDeleteComment,
    };
};
