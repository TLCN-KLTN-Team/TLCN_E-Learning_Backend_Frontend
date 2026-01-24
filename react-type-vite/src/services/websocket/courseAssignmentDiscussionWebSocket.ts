import { Client, type StompSubscription } from "@stomp/stompjs";
import SockJS from "sockjs-client";

export interface DiscussionMessage {
  id: string;
  assignmentId: number;
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

class CourseAssignmentDiscussionWebSocket {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription[]> = new Map();
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
      this.subscriptions.get(topicKey)?.forEach((sub) => sub.unsubscribe());
      this.subscriptions.delete(topicKey);
    }

    const subs: StompSubscription[] = [];

    // Subscription for new messages
    const newMsgSub = this.client.subscribe(
      `/topic/course/assignment/${publishedCourseId}/${assignmentId}/discussion/new`,
      (message) => {
        try {
          const data = JSON.parse(message.body);
          if (data && data.type === "NEW_MESSAGE") {
            onMessage(data.message);
          } else {
            // Fallback if data is directly the message
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
      `/topic/course/assignment/${publishedCourseId}/${assignmentId}/discussion/delete`,
      (message) => {
        try {
          const body = JSON.parse(message.body);
          // Assuming body is { id: "..." } or similar, OR check if it's DiscussionEvent
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
      `/topic/course/assignment/${publishedCourseId}/${assignmentId}/discussion/update`,
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
    console.log(`Subscribed to course assignment discussion: ${publishedCourseId}/${assignmentId}`);
  }

  unsubscribeFromAssignmentDiscussion(publishedCourseId: number, assignmentId: number): void {
    const topicKey = `course-assignment-${publishedCourseId}-${assignmentId}`;
    const subs = this.subscriptions.get(topicKey);

    if (subs) {
      subs.forEach((sub) => sub.unsubscribe());
      this.subscriptions.delete(topicKey);
      console.log(`Unsubscribed from course assignment discussion: ${publishedCourseId}/${assignmentId}`);
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
      console.log("Disconnected from course assignment discussion WebSocket");
    }
  }
}

export const courseAssignmentDiscussionWS = new CourseAssignmentDiscussionWebSocket();
