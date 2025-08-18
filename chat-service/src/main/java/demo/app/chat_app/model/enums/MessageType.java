package demo.app.chat_app.model.enums;

import lombok.Getter;

@Getter
public enum MessageType {
    TEXT, // Regular text message
    IMAGE, // image
    FILE, // file attachment
}
