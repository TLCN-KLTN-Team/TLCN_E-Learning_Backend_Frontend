package com.devteria.identity.entity;

import lombok.Getter;

@Getter
public enum Role {
    USER("USER"),
    STUDENT("STUDENT"),
    TEACHER("TEACHER"),
    ADMIN("ADMIN"),
    SUPER_ADMIN("SUPER_ADMIN");

    private final String name;

    Role(String name) {
        this.name = name;
    }
}
