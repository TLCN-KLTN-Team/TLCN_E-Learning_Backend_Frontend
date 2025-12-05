package demo.app.chat_app.utils;

import lombok.Getter;

@Getter
public enum ChannelType {
    TEXT("TEXT"),
    GROUP("GROUP"),
    ANNOUNCEMENT("ANNOUNCEMENT"),
    VOICE_LIVE("VOICE_LIVE"),
    POST("POST");

    private final String type;

    ChannelType(String type) {
        this.type = this.name();
    }
}
