import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface DiscussionMessage {
  id: string;
  assignmentId: number;
  publishedCourseId: number;
  userId: string;
  userName: string;
  content: string;
  imageUrl?: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

class CourseAssignmentDiscussionWebSocket {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  async connect(token: string): Promise<void> {
    if (this.isConnected && this.client?.connected) {
      console.log("Already connected to course assignment discussion WebSocket");
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
          console.log("Course Assignment Discussion WS:", str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("Connected to course assignment discussion WebSocket");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        },
        onStompError: (frame) => {
          console.error("Course Assignment Discussion WS error:", frame);
          this.isConnected = false;
          reject(new Error(frame.headers["message"]));
        },
        onWebSocketClose: () => {
          console.log("Course Assignment Discussion WebSocket closed");
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
      console.log(`Reconnecting course assignment discussion... Attempt ${this.reconnectAttempts}`);
      setTimeout(() => this.connect(token), 3000 * this.reconnectAttempts);
    }
  }

  subscribeToAssignmentDiscussion(
    publishedCourseId: number,
    assignmentId: number,
    onMessage: (message: DiscussionMessage) => void,
    onDelete: (messageId: string) => void,
    onUpdate: (message: DiscussionMessage) => void
  ): void {
    if (!this.client || !this.isConnected) {
      console.error("Cannot subscribe: WebSocket not connected");
      return;
    }

    const topicKey = `course-assignment-${publishedCourseId}-${assignmentId}`;

    // Unsubscribe if already subscribed
    if (this.subscriptions.has(topicKey)) {
      this.subscriptions.get(topicKey)?.unsubscribe();
    }

    const subscription = this.client.subscribe(
      `/topic/course/assignment/${publishedCourseId}/${assignmentId}/discussion`,
      (message) => {
        try {
          const data = JSON.parse(message.body);

          if (data.type === "NEW_MESSAGE") {
            onMessage(data.message);
          } else if (data.type === "DELETE_MESSAGE") {
            onDelete(data.messageId);
          } else if (data.type === "UPDATE_MESSAGE") {
            onUpdate(data.message);
          }
        } catch (error) {
          console.error("Error parsing course assignment discussion message:", error);
        }
      }
    );

    this.subscriptions.set(topicKey, subscription);
    console.log(`Subscribed to course assignment discussion: ${publishedCourseId}/${assignmentId}`);
  }

  unsubscribeFromAssignmentDiscussion(publishedCourseId: number, assignmentId: number): void {
    const topicKey = `course-assignment-${publishedCourseId}-${assignmentId}`;
    const subscription = this.subscriptions.get(topicKey);

    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(topicKey);
      console.log(`Unsubscribed from course assignment discussion: ${publishedCourseId}/${assignmentId}`);
    }
  }

  disconnect(): void {
    if (this.client) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.isConnected = false;
      console.log("Disconnected from course assignment discussion WebSocket");
    }
  }
}

export const courseAssignmentDiscussionWS = new CourseAssignmentDiscussionWebSocket();
