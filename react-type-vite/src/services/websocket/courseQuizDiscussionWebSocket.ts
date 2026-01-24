import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface DiscussionMessage {
  id: string;
  quizId: number;
  publishedCourseId: number;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  imageUrl?: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

class CourseQuizDiscussionWebSocket {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription[]> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  async connect(token: string): Promise<void> {
    if (this.isConnected && this.client?.connected) {
      console.log("Already connected to course quiz discussion WebSocket");
      return;
    }

    return new Promise((resolve, reject) => {
      const socket = new SockJS(`${import.meta.env.VITE_BASE_URL || 'http://localhost:8888/api/v1'}/server/ws`);

      this.client = new Client({
        webSocketFactory: () => socket as any,
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log("Course Quiz Discussion WS:", str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("Connected to course quiz discussion WebSocket");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        },
        onStompError: (frame) => {
          console.error("Course Quiz Discussion WS error:", frame);
          this.isConnected = false;
          reject(new Error(frame.headers["message"]));
        },
        onWebSocketClose: () => {
          console.log("Course Quiz Discussion WebSocket closed");
          this.isConnected = false;
          this.attemptReconnect(token);
        },
      });

      this.client.activate();
    });
  }

  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting course quiz discussion... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(token), 3000 * this.reconnectAttempts);
    }
  }

  subscribeToQuizDiscussion(
    publishedCourseId: number,
    quizId: number,
    onMessage: (message: DiscussionMessage) => void,
    onDelete: (messageId: string) => void,
    onUpdate: (message: DiscussionMessage) => void
  ): void {
    if (!this.client || !this.isConnected) {
      console.error("Cannot subscribe: WebSocket not connected");
      return;
    }

    const topicKey = `course-quiz-${publishedCourseId}-${quizId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(topicKey)) {
      this.subscriptions.get(topicKey)?.forEach((sub) => sub.unsubscribe());
      this.subscriptions.delete(topicKey);
    }

    const subs: StompSubscription[] = [];

    // Subscription for new messages
    const newMsgSub = this.client.subscribe(
      `/topic/course/quiz/${publishedCourseId}/${quizId}/discussion/new`,
      (message) => {
        try {
          const data = JSON.parse(message.body);
          if (data && data.type === "NEW_MESSAGE") {
            onMessage(data.message);
          } else {
            onMessage(data);
          }
        } catch (error) {
          console.error("Error parsing new message:", error);
        }
      }
    );
    subs.push(newMsgSub);

    // Subscription for deleted messages
    const deleteSub = this.client.subscribe(
      `/topic/course/quiz/${publishedCourseId}/${quizId}/discussion/delete`,
      (message) => {
        try {
          const body = JSON.parse(message.body);
          const messageId = body.id || body.messageId || body;
          onDelete(messageId);
        } catch (error) {
          console.error("Error parsing delete message:", error);
        }
      }
    );
    subs.push(deleteSub);

    // Subscription for updated messages
    const updateSub = this.client.subscribe(
      `/topic/course/quiz/${publishedCourseId}/${quizId}/discussion/update`,
      (message) => {
        try {
          const body = JSON.parse(message.body);
          onUpdate(body);
        } catch (error) {
          console.error("Error parsing update message:", error);
        }
      }
    );
    subs.push(updateSub);

    this.subscriptions.set(topicKey, subs);
    console.log(`Subscribed to course quiz discussion: ${publishedCourseId}/${quizId}`);
  }

  unsubscribeFromQuizDiscussion(publishedCourseId: number, quizId: number): void {
    const topicKey = `course-quiz-${publishedCourseId}-${quizId}`;
    const subs = this.subscriptions.get(topicKey);

    if (subs) {
      subs.forEach((sub) => sub.unsubscribe());
      this.subscriptions.delete(topicKey);
      console.log(`Unsubscribed from course quiz discussion: ${publishedCourseId}/${quizId}`);
    }
  }

  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach((subs) => {
        subs.forEach((sub) => sub.unsubscribe());
      });
      this.subscriptions.clear();
      this.client.deactivate();
      this.isConnected = false;
      console.log("Disconnected from course quiz discussion WebSocket");
    }
  }
}

export const courseQuizDiscussionWS = new CourseQuizDiscussionWebSocket();
