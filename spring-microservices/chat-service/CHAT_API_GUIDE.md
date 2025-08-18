# Chat Service - Separated Architecture API Guide

## Tổng quan

Tính năng chat realtime được xây dựng theo kiến trúc tách biệt (Separated Architecture), trong đó:

- **Text messages** được gửi qua WebSocket cho độ trễ thấp
- **Files/attachments** được upload riêng qua REST API
- **Message status** được update realtime qua WebSocket

## Flow hoạt động

### 1. Gửi tin nhắn text

```javascript
// Frontend gửi tin nhắn qua WebSocket
stompClient.send(
  "/app/chat.sendMessage",
  {},
  JSON.stringify({
    channelId: "channel123",
    content: "Hello world!",
    clientMessageId: "uuid-from-frontend",
  })
);

// Backend trả về message với status = "SENT"
// Broadcast đến tất cả thành viên trong channel
```

### 2. Gửi tin nhắn có files (2-step process)

#### Step 1: Gửi text message trước

```javascript
// 1. Gửi text message với placeholder
stompClient.send(
  "/app/chat.sendMessage",
  {},
  JSON.stringify({
    channelId: "channel123",
    content: "Sending files...",
    clientMessageId: "uuid-123",
  })
);

// Nhận response với messageId
const messageId = response.id; // Lưu lại để upload files
```

#### Step 2: Upload files song song

```javascript
// 2. Upload từng file song song qua REST API
const filePromises = files.map((file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("channelId", channelId);

  return fetch(`/api/files/upload/${messageId}`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: "Bearer " + token,
    },
  });
});

// Xử lý kết quả từng file
Promise.allSettled(filePromises).then((results) => {
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      console.log(`File ${index} uploaded successfully`);
      // WebSocket sẽ tự động broadcast attachment update
    } else {
      console.error(`File ${index} failed:`, result.reason);
      // Hiển thị error cho file này, không ảnh hưởng files khác
    }
  });
});
```

## API Endpoints

### WebSocket Endpoints

#### 1. Gửi tin nhắn text

**Destination:** `/app/chat.sendMessage`
**Payload:**

```json
{
  "channelId": "string",
  "content": "string",
  "clientMessageId": "string"
}
```

**Response Topic:** `/topic/channel/{channelId}`

```json
{
    "id": "message_id",
    "channelId": "channel123",
    "content": "Hello world!",
    "sender": {...},
    "status": "SENT",
    "createdDate": "2024-01-01T10:00:00Z",
    "attachments": []
}
```

#### 2. Update message status

**Destination:** `/app/chat.updateMessageStatus`
**Payload:** `messageId`

### REST API Endpoints

#### 1. Upload single file

```http
POST /api/files/upload/{messageId}
Content-Type: multipart/form-data

file: [binary]
channelId: string
```

**Response:**

```json
{
  "code": 1000,
  "message": "File uploaded successfully",
  "result": {
    "success": true,
    "messageId": "msg123",
    "attachmentId": "att456",
    "fileName": "image.jpg",
    "fileUrl": "https://cloudinary.com/...",
    "status": "SENT"
  }
}
```

#### 2. Upload multiple files

```http
POST /api/files/upload-multiple/{messageId}
Content-Type: multipart/form-data

files: [binary[]]
channelId: string
```

#### 3. Get upload status

```http
GET /api/files/upload-status/{messageId}
```

## WebSocket Subscriptions

### 1. Channel messages

```javascript
stompClient.subscribe("/topic/channel/" + channelId, function (message) {
  const chatMessage = JSON.parse(message.body);
  // Handle new message or message update
  displayMessage(chatMessage);
});
```

### 2. Attachment notifications

```javascript
stompClient.subscribe(
  "/topic/channel/" + channelId + "/attachments",
  function (message) {
    const attachmentUpdate = JSON.parse(message.body);
    // Handle attachment upload completion
    updateMessageAttachment(attachmentUpdate);
  }
);
```

### 3. Error notifications

```javascript
stompClient.subscribe("/user/queue/errors", function (error) {
  const errorMessage = JSON.parse(error.body);
  // Handle errors
  showError(errorMessage);
});
```

## Message Status Flow

1. **PENDING** - Message được tạo, đang chờ xử lý
2. **UPLOADING** - Đang upload files
3. **SENT** - Message đã được gửi thành công
4. **DELIVERED** - Message đã được deliver
5. **READ** - Message đã được đọc
6. **FAILED** - Message gửi thất bại

## Frontend Implementation Example

```javascript
class ChatService {
  constructor() {
    this.stompClient = null;
    this.pendingUploads = new Map();
  }

  // Gửi text message
  sendTextMessage(channelId, content) {
    const message = {
      channelId,
      content,
      clientMessageId: this.generateUUID(),
    };

    this.stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(message));
  }

  // Gửi message với files
  async sendMessageWithFiles(channelId, content, files) {
    // 1. Gửi text message trước
    const textMessage = {
      channelId,
      content: content || "📎 Sending files...",
      clientMessageId: this.generateUUID(),
    };

    this.stompClient.send(
      "/app/chat.sendMessage",
      {},
      JSON.stringify(textMessage)
    );

    // Đợi nhận messageId từ WebSocket response
    return new Promise((resolve) => {
      const subscription = this.stompClient.subscribe(
        "/topic/channel/" + channelId,
        (message) => {
          const response = JSON.parse(message.body);
          if (response.sender.userId === this.currentUserId) {
            subscription.unsubscribe();

            // 2. Upload files sau khi có messageId
            this.uploadFilesToMessage(response.id, channelId, files);
            resolve(response);
          }
        }
      );
    });
  }

  // Upload files song song
  async uploadFilesToMessage(messageId, channelId, files) {
    const uploadPromises = Array.from(files).map((file) =>
      this.uploadSingleFile(messageId, channelId, file)
    );

    const results = await Promise.allSettled(uploadPromises);

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        this.showFileError(files[index].name, result.reason);
      }
    });
  }

  async uploadSingleFile(messageId, channelId, file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("channelId", channelId);

    const response = await fetch(`/api/files/upload/${messageId}`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: "Bearer " + this.getToken(),
      },
    });

    if (!response.ok) {
      throw new Error(`Upload failed for ${file.name}`);
    }

    return response.json();
  }

  showFileError(fileName, error) {
    // Hiển thị error cho file cụ thể
    // UI có thể hiển thị retry button
    console.error(`Failed to upload ${fileName}:`, error);
  }
}
```

## Lợi ích của kiến trúc này

1. **Performance**: Text messages có độ trễ thấp qua WebSocket
2. **Reliability**: Mỗi file upload độc lập, lỗi 1 file không ảnh hưởng files khác
3. **User Experience**: User thấy message ngay lập tức, files được attach dần dần
4. **Scalability**: File upload có thể scale riêng biệt với messaging
5. **Error Handling**: Có thể retry upload từng file riêng lẻ

## Error Handling

- File upload fail → hiển thị retry button cho file đó
- Message text được giữ nguyên
- Files upload thành công vẫn được attach
- User có thể retry upload file fail mà không gửi lại message
