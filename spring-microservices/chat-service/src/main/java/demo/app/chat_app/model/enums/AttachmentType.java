package demo.app.chat_app.model.enums;

import lombok.Getter;

@Getter
public enum AttachmentType {
    IMAGE("IMAGE"),
    DOCUMENT("DOCUMENT"),
    VIDEO("VIDEO"),
    AUDIO("AUDIO"),
    OTHER("OTHER");

    private final String type;

    AttachmentType(String type) {
        this.type = type;
    }
}
