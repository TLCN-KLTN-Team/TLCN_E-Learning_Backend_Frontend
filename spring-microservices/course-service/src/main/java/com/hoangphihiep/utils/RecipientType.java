package com.hoangphihiep.utils;

import lombok.Getter;

@Getter
public enum RecipientType {
    TEACHER("TEACHER"),
    ADMIN("ADMIN"),
    SUPER_ADMIN("SUPERADMIN");

    private final String displayName;

    RecipientType(String displayName) {
        this.displayName = displayName;
    }
}