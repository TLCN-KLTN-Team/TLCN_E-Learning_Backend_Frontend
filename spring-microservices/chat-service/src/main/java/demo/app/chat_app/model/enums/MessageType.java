package demo.app.chat_app.model.enums;

import lombok.Getter;

@Getter
public enum MessageType {
    TEXT, // Regular text message
    IMAGE, // Just image
    FILE, // Just file attachment
    MIXED, // Combination of text and attachments
}
