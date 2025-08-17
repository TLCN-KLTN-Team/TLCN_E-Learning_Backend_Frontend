# WebSocket Chat Implementation

This implementation provides real-time chat functionality using WebSocket (STOMP) protocol to communicate with the Spring Boot backend.

## Architecture Overview

```
Frontend (React)     Backend (Spring Boot)
     │                       │
     ├─ HTTP API ──────────→ REST Controllers (Message persistence)
     │                       │
     └─ WebSocket ──────────→ STOMP Controllers (Real-time messaging)
```

## Files Structure

```
src/
├── hooks/
│   ├── useChatWebSocket.ts      # Core WebSocket hook
│   └── useChatService.ts        # Combined HTTP + WebSocket service
├── components/student/workspace/
│   └── ChatIntegration.tsx      # Integration component
└── pages/workspace/
    └── ChatWebSocket.tsx        # Standalone test component
```

## Backend Integration

The implementation is designed to work with your Spring Boot backend controller:

```java
@MessageMapping("/chat.sendMessage")
public void sendMessage(@Payload ChatMessageRequest request,
                       SimpMessageHeaderAccessor headerAccessor,
                       Principal principal) {
    // Your backend logic here
}

@MessageMapping("/chat.addUser")
public void addUser(@Payload String username,
                   SimpMessageHeaderAccessor headerAccessor) {
    // Your backend logic here
}
```

## WebSocket Communication Flow

### 1. Connection Setup

```typescript
// Automatic connection with authentication
const chat = useChatWebSocket();
// or
const chatService = useChatService(); // HTTP + WebSocket combined
```

### 2. Sending Messages

```typescript
// Via WebSocket only
chat.sendMessage({
  channelId: "channel-123",
  content: "Hello World!",
  recipientId: "user-456", // Optional for DMs
});

// Via Combined Service (HTTP + WebSocket)
await chatService.sendMessage({
  channelId: "channel-123",
  content: "Hello World!",
});
```

### 3. Receiving Messages

```typescript
// Subscribe to channel messages
useEffect(() => {
  const unsubscribe = chat.subscribeToChannel("channel-123");
  return unsubscribe;
}, [channelId]);

// Messages are automatically added to chat.messages state
```

## Message Flow

### Outgoing Messages

1. **HTTP API Call** → Save message to database
2. **WebSocket Publish** → Send to `/app/chat.sendMessage`
3. **Backend Processing** → Process and validate message
4. **Broadcast** → Send to `/topic/channel/{channelId}` subscribers

### Incoming Messages

1. **WebSocket Subscribe** → Listen to `/topic/channel/{channelId}`
2. **Message Received** → Parse JSON message
3. **State Update** → Add to local messages state
4. **UI Update** → Display new message in chat

## Subscriptions

The implementation subscribes to multiple endpoints:

```typescript
// Channel messages (public)
/topic/acehlnn /
  { channelId } /
  // Direct messages (private)
  user /
  { username } /
  queue /
  messages /
  // Error messages (private)
  user /
  { username } /
  queue /
  errors;
```

## Error Handling

### WebSocket Errors

- Connection failures
- STOMP protocol errors
- Message parsing errors

### API Errors

- HTTP request failures
- Authentication errors
- Validation errors

### Error Display

```typescript
const { wsErrors, apiErrors, allErrors, hasErrors } = useChatService();

// Clear errors
chat.clearWsErrors();
chat.clearApiErrors();
```

## Integration Examples

### Basic Usage

```typescript
import { useChatWebSocket } from "@/hooks/useChatWebSocket";

function ChatComponent() {
  const chat = useChatWebSocket();

  useEffect(() => {
    chat.connect();
    return () => chat.disconnect();
  }, []);

  const handleSendMessage = () => {
    chat.sendMessage({
      channelId: "test-channel",
      content: "Hello!",
    });
  };

  return (
    <div>
      <div>Status: {chat.isConnected ? "Connected" : "Disconnected"}</div>
      {chat.messages.map((msg) => (
        <div key={msg.id}>
          {msg.senderName}: {msg.content}
        </div>
      ))}
    </div>
  );
}
```

### Advanced Usage with HTTP API

```typescript
import { useChatService } from "@/hooks/useChatService";

function AdvancedChatComponent() {
  const chat = useChatService();

  const handleSendMessage = async () => {
    try {
      await chat.sendMessage({
        channelId: "channel-123",
        content: "This message is saved and broadcast!",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div>
      <div>Loading: {chat.isLoading}</div>
      <div>Errors: {chat.allErrors.length}</div>
      {/* Rest of your chat UI */}
    </div>
  );
}
```

### WorkspacePage Integration

```typescript
// Replace the existing handleSendMessage in WorkspacePage.tsx
import { useChatService } from "@/hooks/useChatService";

const WorkspacePage = () => {
  const chat = useChatService();

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel) return;

    try {
      await chat.sendMessage({
        channelId: selectedChannel.id,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Subscribe to current channel
  useEffect(() => {
    if (selectedChannel && chat.isConnected) {
      return chat.subscribeToChannel(selectedChannel.id);
    }
  }, [selectedChannel, chat.isConnected]);

  // ... rest of component
};
```

## Message Types

### Request (Frontend → Backend)

```typescript
interface ChatMessageRequest {
  channelId: string;
  content: string;
  recipientId?: string; // For direct messages
}
```

### Response (Backend → Frontend)

```typescript
interface ChatMessageResponse {
  id: string;
  channelId?: string;
  content: string;
  senderId: string;
  senderName: string;
  recipientId?: string;
  timestamp: string;
  messageType: "CHAT" | "JOIN" | "LEAVE";
}
```

## Configuration

### WebSocket Endpoint

```typescript
// Current configuration
const WEBSOCKET_URL = "http://localhost:8090/server/ws";

// Authentication via query parameter and headers
?token=${accessToken}
Authorization: Bearer ${accessToken}
```

### STOMP Destinations

```typescript
// Send message
/app/acht.sendMessage /
  // Add user to session
  app /
  chat.addUser /
  // Subscribe to channel
  topic /
  channel /
  { channelId } /
  // Subscribe to direct messages
  user /
  { username } /
  queue /
  messages /
  // Subscribe to errors
  user /
  { username } /
  queue /
  errors;
```

## Testing

Use the `ChatWebSocket` component for testing:

1. Navigate to the ChatWebSocket page
2. Ensure backend is running on localhost:8090
3. Test connection status
4. Send test messages
5. Monitor console for debug information

## Troubleshooting

### Common Issues

1. **Connection Failed**

   - Check if backend WebSocket is running
   - Verify authentication token is valid
   - Check CORS configuration

2. **Messages Not Received**

   - Verify subscription to correct channel
   - Check backend message routing
   - Monitor browser console for errors

3. **Authentication Issues**
   - Ensure access token is not expired
   - Verify token format in Authorization header
   - Check backend security configuration

### Debug Mode

Enable STOMP debug logging:

```typescript
const client = new Client({
  debug: (str) => console.log("STOMP Debug:", str),
});
```

## Performance Considerations

1. **Message Deduplication**: Prevents duplicate messages in UI
2. **Connection Management**: Automatic reconnection handling
3. **Memory Management**: Clean up subscriptions on unmount
4. **Error Recovery**: Graceful error handling and retry logic

## Future Enhancements

1. **Typing Indicators**: Show when users are typing
2. **Message Status**: Delivery confirmation, read receipts
3. **File Uploads**: Support for file sharing
4. **Emoji Reactions**: Message reactions and emoji support
5. **Message Threading**: Reply to specific messages
6. **Presence Status**: Online/offline user status
