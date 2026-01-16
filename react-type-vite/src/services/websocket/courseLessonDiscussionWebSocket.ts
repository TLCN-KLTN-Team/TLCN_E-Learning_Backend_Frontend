import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface DiscussionMessage {
  id: string;
  lessonId: number;
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

export type MessageType = "NEW_MESSAGE" | "DELETE_MESSAGE" | "UPDATE_MESSAGE";

export interface DiscussionEvent {
  type: MessageType;
  message: DiscussionMessage;
}

class CourseLessonDiscussionWebSocket {
  private client: Client | null = null;
  private subscriptions: Map<number, StompSubscription> = new Map();

  async connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `${import.meta.env.VITE_BASE_URL || 'http://localhost:8888/api/v1'}/server/ws`;
      
      this.client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          console.log("STOMP Debug:", str);
        },
        onConnect: () => {
          console.log("✅ Course Lesson Discussion WebSocket Connected");
          resolve();
        },
        onStompError: (frame) => {
          console.error("❌ STOMP error:", frame);
          reject(new Error(frame.headers?.message || "STOMP connection error"));
        },
        onWebSocketError: (event) => {
          console.error("❌ WebSocket error:", event);
          reject(new Error("WebSocket connection error"));
        },
      });

      this.client.activate();
    });
  }

  subscribeToCourseLesson(
    publishedCourseId: number,
    lessonId: number,
    callback: (event: DiscussionEvent) => void
  ): void {
    if (!this.client || !this.client.connected) {
      console.error("WebSocket client is not connected");
      return;
    }

    const subscriptionKey = this.getSubscriptionKey(publishedCourseId, lessonId);
    
    if (this.subscriptions.has(subscriptionKey)) {
      console.log(`Already subscribed to lesson ${lessonId} in course ${publishedCourseId}`);
      return;
    }

    const destination = `/topic/course/lesson/${publishedCourseId}/${lessonId}/discussion`;
    console.log(`📡 Subscribing to: ${destination}`);

    const subscription = this.client.subscribe(destination, (message) => {
      try {
        const receivedMessage: DiscussionMessage = JSON.parse(message.body);
        console.log("📨 Received lesson discussion message:", receivedMessage);
        
        callback({
          type: "NEW_MESSAGE",
          message: receivedMessage,
        });
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    this.subscriptions.set(subscriptionKey, subscription);
  }

  unsubscribeFromCourseLesson(publishedCourseId: number, lessonId: number): void {
    const subscriptionKey = this.getSubscriptionKey(publishedCourseId, lessonId);
    const subscription = this.subscriptions.get(subscriptionKey);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(subscriptionKey);
      console.log(`🔌 Unsubscribed from lesson ${lessonId} in course ${publishedCourseId}`);
    }
  }

  sendMessage(
    publishedCourseId: number,
    lessonId: number,
    content: string,
    imageUrl?: string,
    userName?: string,
    userAvatar?: string
  ): void {
    if (!this.client || !this.client.connected) {
      console.error("Cannot send message: WebSocket not connected");
      return;
    }

    const destination = `/app/course/lesson/${publishedCourseId}/${lessonId}/discussion`;
    const message = {
      content,
      imageUrl,
      userName,
      userAvatar,
    };

    this.client.publish({
      destination,
      body: JSON.stringify(message),
    });
  }

  disconnect(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions.clear();

    if (this.client) {
      this.client.deactivate();
      console.log("🔌 Course Lesson Discussion WebSocket Disconnected");
    }
  }

  private getSubscriptionKey(publishedCourseId: number, lessonId: number): number {
    return publishedCourseId * 1000000 + lessonId;
  }
}

export const courseLessonDiscussionWS = new CourseLessonDiscussionWebSocket();
