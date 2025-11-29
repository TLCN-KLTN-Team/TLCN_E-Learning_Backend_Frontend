package demo.app.chat_app.utils;

import lombok.Getter;

@Getter
public enum MemberRole {
    OWNER("OWNER"),
    MEMBER("MEMBER");

    private final String role;

    MemberRole(String role) {
        this.role = role;
    }
}
