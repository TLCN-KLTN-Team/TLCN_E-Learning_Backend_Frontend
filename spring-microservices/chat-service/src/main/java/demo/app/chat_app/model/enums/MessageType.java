package demo.app.chat_app.model.enums;

import lombok.Getter;

@Getter
public enum MessageType {
    TEXT, // Regular text message
    IMAGE, // Image message
    VIDEO, // Video message
    AUDIO, // Audio message
    FILE, // File attachment
    LINK_PREVIEW, // Link preview message
    POLL, // Poll message
    STICKER, // Sticker message
    REACTION, // Reaction to a message
    SYSTEM // System-generated messages (e.g., notifications)
}
