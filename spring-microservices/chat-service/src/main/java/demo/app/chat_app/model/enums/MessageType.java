package demo.app.chat_app.model.enums;

import lombok.Getter;

@Getter
public enum MessageType {
    TEXT("TEXT"), // Regular text message
    IMAGE("IMAGE"), // image
    FILE("FILE"),
    ; // file attachment

    private final String type;

    MessageType(String type) {
        this.type = type;
    }
}
