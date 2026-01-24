import { Client } from '@stomp/stompjs';
import type { Message, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface DiscussionMessage {
  id: string;
  quizId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'STUDENT' | 'TEACHER' | 'ADMIN';
  content: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  likes: number;
  isLiked: boolean;
  isOwner: boolean;
  parentMessageId?: string;
  replies?: DiscussionMessage[];
  isDeleted: boolean;
}

export interface DiscussionMessageRequest {
  content: string;
  imageUrl?: string;
  parentMessageId?: string;
  userName?: string;
  userAvatar?: string;
}

class QuizDiscussionWebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<number, StompSubscription[]> = new Map();
  private messageCallbacks: Map<number, (message: DiscussionMessage) => void> = new Map();
  private deleteCallbacks: Map<number, (messageId: string) => void> = new Map();
  private updateCallbacks: Map<number, (message: DiscussionMessage) => void> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private isConnecting: boolean = false;

  /**
   * Connect to WebSocket server
   */
  async connect(token: string): Promise<void> {
    if (this.client?.connected) {
      console.log('WebSocket already connected');
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectionPromise) {
      console.log('WebSocket connection in progress, waiting...');
      return this.connectionPromise;
    }

    console.log('Starting new WebSocket connection...');
    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        // Connect via API Gateway
        const wsUrl = `${import.meta.env.VITE_BASE_URL || 'http://localhost:8888/api/v1'}/server/ws?token=${token}`;
        console.log('Connecting to WebSocket:', wsUrl);

        const socket = new SockJS(wsUrl);

        this.client = new Client({
          webSocketFactory: () => socket as any,
          connectHeaders: {
            Authorization: `Bearer ${token}`,
          },
          debug: (str) => {
            console.log('STOMP Debug:', str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            console.log('✅ Quiz Discussion WebSocket Connected Successfully');
            this.isConnecting = false;
            resolve();
          },
          onStompError: (frame) => {
            console.error('❌ STOMP error:', frame);
            this.isConnecting = false;
            reject(new Error(`WebSocket STOMP error: ${frame.headers?.message || 'Unknown error'}`));
          },
          onWebSocketError: (error) => {
            console.error('❌ WebSocket error:', error);
            this.isConnecting = false;
            reject(error);
          },
          onWebSocketClose: () => {
            console.log('WebSocket closed');
            this.isConnecting = false;
          },
        });

        // Add timeout
        const timeout = setTimeout(() => {
          if (this.isConnecting) {
            console.error('❌ WebSocket connection timeout');
            this.isConnecting = false;
            this.client?.deactivate();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 second timeout

        // Clear timeout on success
        this.connectionPromise?.then(() => clearTimeout(timeout)).catch(() => clearTimeout(timeout));

        this.client.activate();
      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Subscribe to quiz discussion updates
   */
  subscribeToQuizDiscussion(
    quizId: number,
    onMessage: (message: DiscussionMessage) => void,
    onDelete: (messageId: string) => void,
    onUpdate: (message: DiscussionMessage) => void
  ): void {
    if (!this.client?.connected) {
      console.error('WebSocket not connected. Call connect() first.');
      return;
    }

    // Unsubscribe if already subscribed
    this.unsubscribeFromQuizDiscussion(quizId);

    const subs: StompSubscription[] = [];

    // Subscribe to new messages
    const messageSub = this.client.subscribe(
      `/topic/quiz/${quizId}/discussion`,
      (message: Message) => {
        try {
          const data: DiscussionMessage = JSON.parse(message.body);
          console.log('Received discussion message:', data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse discussion message:', error);
        }
      }
    );
    subs.push(messageSub);

    // Subscribe to deletions
    const deleteSub = this.client.subscribe(
      `/topic/quiz/${quizId}/discussion/delete`,
      (message: Message) => {
        try {
          const messageId: string = JSON.parse(message.body);
          console.log('Message deleted:', messageId);
          onDelete(messageId);
        } catch (error) {
          console.error('Failed to parse delete notification:', error);
        }
      }
    );
    subs.push(deleteSub);

    // Subscribe to updates (likes, etc.)
    const updateSub = this.client.subscribe(
      `/topic/quiz/${quizId}/discussion/update`,
      (message: Message) => {
        try {
          const data: DiscussionMessage = JSON.parse(message.body);
          console.log('Message updated:', data);
          onUpdate(data);
        } catch (error) {
          console.error('Failed to parse update notification:', error);
        }
      }
    );
    subs.push(updateSub);

    // Store subscription and callbacks
    this.subscriptions.set(quizId, subs);
    this.messageCallbacks.set(quizId, onMessage);
    this.deleteCallbacks.set(quizId, onDelete);
    this.updateCallbacks.set(quizId, onUpdate);

    console.log(`Subscribed to quiz ${quizId} discussion`);
  }

  /**
   * Unsubscribe from quiz discussion
   */
  unsubscribeFromQuizDiscussion(quizId: number): void {
    const subs = this.subscriptions.get(quizId);
    if (subs) {
      subs.forEach(s => s.unsubscribe());
      this.subscriptions.delete(quizId);
      this.messageCallbacks.delete(quizId);
      this.deleteCallbacks.delete(quizId);
      this.updateCallbacks.delete(quizId);
      console.log(`Unsubscribed from quiz ${quizId} discussion`);
    }
  }

  /**
   * Send a discussion message via WebSocket
   */
  sendMessage(quizId: number, request: DiscussionMessageRequest): void {
    if (!this.client?.connected) {
      console.error('WebSocket not connected');
      throw new Error('WebSocket not connected');
    }

    this.client.publish({
      destination: `/app/quiz/${quizId}/discussion`,
      body: JSON.stringify(request),
    });

    console.log(`Sent message to quiz ${quizId} discussion`);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    // Unsubscribe from all discussions
    this.subscriptions.forEach((_, quizId) => {
      this.unsubscribeFromQuizDiscussion(quizId);
    });

    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.connectionPromise = null;
      this.isConnecting = false;
      console.log('Quiz Discussion WebSocket Disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

// Export singleton instance
export const quizDiscussionWS = new QuizDiscussionWebSocketService();
