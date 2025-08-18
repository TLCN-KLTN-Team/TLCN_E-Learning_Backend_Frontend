package demo.app.chat_app.model.enums;

public enum MessageStatus {
    PENDING,     // Message is being processed (placeholder status)
    UPLOADING,   // Files are being uploaded
    SENT,        // Message has been sent to the server
    DELIVERED,   // Message has been delivered to the recipient
    READ,        // Message has been read by the recipient
    FAILED       // Message failed to send or deliver
}
