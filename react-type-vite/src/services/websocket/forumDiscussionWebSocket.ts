import { Client } from '@stomp/stompjs';
import type { Message, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { type Comment, type Post } from '../api/forumApi';

class ForumDiscussionWebSocketService {
    private client: Client | null = null;
    private subscriptions: Map<string, StompSubscription[]> = new Map();
    private connectionPromise: Promise<void> | null = null;
    private isConnecting: boolean = false;

    async connect(token: string): Promise<void> {
        if (this.client?.connected) {
            return Promise.resolve();
        }

        if (this.isConnecting && this.connectionPromise) {
            return this.connectionPromise;
        }

        this.isConnecting = true;

        this.connectionPromise = new Promise((resolve, reject) => {
            try {
                const wsUrl = `${import.meta.env.VITE_BASE_URL || 'http://localhost:8888/api/v1'}/server/ws?token=${token}`;
                const socket = new SockJS(wsUrl);

                this.client = new Client({
                    webSocketFactory: () => socket as any,
                    connectHeaders: {
                        Authorization: `Bearer ${token}`,
                    },
                    reconnectDelay: 5000,
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                    onConnect: () => {
                        console.log('✅ Forum WebSocket Connected Successfully');
                        this.isConnecting = false;
                        resolve();
                    },
                    onStompError: (frame) => {
                        console.error('❌ STOMP error:', frame);
                        this.isConnecting = false;
                    },
                    onWebSocketError: (error) => {
                        console.error('❌ WebSocket error:', error);
                        this.isConnecting = false;
                        reject(error);
                    }
                });

                this.client.activate();
            } catch (error) {
                console.error('❌ Failed to create WebSocket connection:', error);
                this.isConnecting = false;
                reject(error);
            }
        });

        return this.connectionPromise;
    }

    // Subscribe to global forum updates (New Post, Delete Post)
    subscribeToAllPosts(
        onNewPost: (post: Post) => void,
        onDeletePost: (postId: string) => void
    ): void {
        if (!this.client?.connected) return;

        this.unsubscribeFromAllPosts();

        const subs: StompSubscription[] = [];

        // New Post
        subs.push(this.client.subscribe(`/topic/forum/posts`, (message: Message) => {
            try {
                const post: Post = JSON.parse(message.body);
                onNewPost(post);
            } catch (e) {
                console.error("Error parsing new post", e);
            }
        }));

        // Delete Post
        subs.push(this.client.subscribe(`/topic/forum/posts/delete`, (message: Message) => {
            try {
                const postId = message.body;
                onDeletePost(postId);
            } catch (e) {
                console.error("Error parsing delete post", e);
            }
        }));

        this.subscriptions.set("ALL_POSTS", subs);
    }

    unsubscribeFromAllPosts(): void {
        const subs = this.subscriptions.get("ALL_POSTS");
        if (subs) {
            subs.forEach(s => s.unsubscribe());
            this.subscriptions.delete("ALL_POSTS");
        }
    }

    // Subscribe to comments for a specific post
    subscribeToPostComments(
        postId: string,
        onMessage: (comment: Comment) => void
    ): void {
        if (!this.client?.connected) return;

        this.unsubscribeFromPostComments(postId);

        const subs: StompSubscription[] = [];

        subs.push(this.client.subscribe(
            `/topic/posts/${postId}/comments`,
            (message: Message) => {
                try {
                    const data: Comment = JSON.parse(message.body);
                    onMessage(data);
                } catch (error) {
                    console.error('Failed to parse comment message:', error);
                }
            }
        ));

        this.subscriptions.set(postId, subs);
    }

    unsubscribeFromPostComments(postId: string): void {
        const subs = this.subscriptions.get(postId);
        if (subs) {
            subs.forEach(s => s.unsubscribe());
            this.subscriptions.delete(postId);
        }
    }

    // Subscribe to specific post updates (e.g. votes)
    subscribeToPostUpdates(
        postId: string,
        onUpdate: (data: any) => void
    ): void {
        if (!this.client?.connected) return;

        const key = `UPDATE_${postId}`;
        this.unsubscribeFromPostUpdates(postId);

        const subs: StompSubscription[] = [];

        subs.push(this.client.subscribe(
            `/topic/posts/${postId}/update`,
            (message: Message) => {
                // Could send complex object or simple string trigger
                onUpdate(message.body);
            }
        ));

        this.subscriptions.set(key, subs);
    }

    unsubscribeFromPostUpdates(postId: string): void {
        const key = `UPDATE_${postId}`;
        const subs = this.subscriptions.get(key);
        if (subs) {
            subs.forEach(s => s.unsubscribe());
            this.subscriptions.delete(key);
        }
    }

    disconnect(): void {
        this.subscriptions.forEach((subs) => {
            subs.forEach(s => s.unsubscribe());
        });
        this.subscriptions.clear();

        if (this.client) {
            this.client.deactivate();
            this.client = null;
            this.connectionPromise = null;
            this.isConnecting = false;
        }
    }

    isConnected(): boolean {
        return this.client?.connected || false;
    }
}

export const forumDiscussionWS = new ForumDiscussionWebSocketService();
