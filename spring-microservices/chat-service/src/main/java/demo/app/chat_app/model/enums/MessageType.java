package demo.app.chat_app.model.enums;

import lombok.Getter;

@Getter
public enum MessageType {
    TEXT("TEXT"),       // Regular text message
    IMAGE("IMAGE"),    // image (legacy)
    FILE("FILE"),      // file attachment (legacy)
    MIXED("MIXED"),    // Text + attachments
    FILE_ONLY("FILE_ONLY"); // Attachments only, no text content

    private final String type;

    MessageType(String type) {
        this.type = type;
    }
}
