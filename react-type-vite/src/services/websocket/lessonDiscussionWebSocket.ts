import { Client } from '@stomp/stompjs';
import type { Message, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export interface DiscussionMessage {
  id: string;
  lessonId: number;
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

class LessonDiscussionWebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<number, StompSubscription> = new Map();
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
      console.log('Lesson Discussion WebSocket already connected');
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectionPromise) {
      console.log('Lesson Discussion WebSocket connection in progress, waiting...');
      return this.connectionPromise;
    }

    console.log('Starting new Lesson Discussion WebSocket connection...');
    this.isConnecting = true;
    
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        const wsUrl = `${import.meta.env.VITE_BASE_URL || 'http://localhost:8888/api/v1'}/server/ws?token=${token}`;
        console.log('Connecting to Lesson Discussion WebSocket:', wsUrl);
        
        const socket = new SockJS(wsUrl);

        this.client = new Client({
          webSocketFactory: () => socket as any,
          connectHeaders: {
            Authorization: `Bearer ${token}`,
          },
          debug: (str) => {
            console.log('STOMP Debug (Lesson):', str);
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            console.log('✅ Lesson Discussion WebSocket Connected Successfully');
            this.isConnecting = false;
            resolve();
          },
          onStompError: (frame) => {
            console.error('❌ STOMP error (Lesson):', frame);
            this.isConnecting = false;
            reject(new Error(`WebSocket STOMP error: ${frame.headers?.message || 'Unknown error'}`));
          },
          onWebSocketError: (error) => {
            console.error('❌ WebSocket error (Lesson):', error);
            this.isConnecting = false;
            reject(error);
          },
          onWebSocketClose: () => {
            console.log('Lesson Discussion WebSocket closed');
            this.isConnecting = false;
          },
        });

        const timeout = setTimeout(() => {
          if (this.isConnecting) {
            console.error('❌ Lesson Discussion WebSocket connection timeout');
            this.isConnecting = false;
            this.client?.deactivate();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000);

        this.connectionPromise?.then(() => clearTimeout(timeout)).catch(() => clearTimeout(timeout));

        this.client.activate();
      } catch (error) {
        console.error('❌ Failed to create Lesson Discussion WebSocket connection:', error);
        this.isConnecting = false;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  /**
   * Subscribe to lesson discussion updates
   */
  subscribeToLessonDiscussion(
    lessonId: number,
    onMessage: (message: DiscussionMessage) => void,
    onDelete: (messageId: string) => void,
    onUpdate: (message: DiscussionMessage) => void
  ): void {
    if (!this.client?.connected) {
      console.error('Lesson Discussion WebSocket not connected. Call connect() first.');
      return;
    }

    this.unsubscribeFromLessonDiscussion(lessonId);

    const messageSub = this.client.subscribe(
      `/topic/lesson/${lessonId}/discussion`,
      (message: Message) => {
        try {
          const data: DiscussionMessage = JSON.parse(message.body);
          console.log('Received lesson discussion message:', data);
          onMessage(data);
        } catch (error) {
          console.error('Failed to parse lesson discussion message:', error);
        }
      }
    );

    this.subscriptions.set(lessonId, messageSub);
    this.messageCallbacks.set(lessonId, onMessage);
    this.deleteCallbacks.set(lessonId, onDelete);
    this.updateCallbacks.set(lessonId, onUpdate);

    console.log(`✅ Subscribed to lesson ${lessonId} discussion`);
  }

  /**
   * Unsubscribe from lesson discussion
   */
  unsubscribeFromLessonDiscussion(lessonId: number): void {
    const sub = this.subscriptions.get(lessonId);
    if (sub) {
      sub.unsubscribe();
      this.subscriptions.delete(lessonId);
      this.messageCallbacks.delete(lessonId);
      this.deleteCallbacks.delete(lessonId);
      this.updateCallbacks.delete(lessonId);
      console.log(`Unsubscribed from lesson ${lessonId} discussion`);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.messageCallbacks.clear();
      this.deleteCallbacks.clear();
      this.updateCallbacks.clear();
      this.client.deactivate();
      this.client = null;
      this.connectionPromise = null;
      console.log('Lesson Discussion WebSocket disconnected');
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client?.connected || false;
  }
}

export const lessonDiscussionWS = new LessonDiscussionWebSocketService();
