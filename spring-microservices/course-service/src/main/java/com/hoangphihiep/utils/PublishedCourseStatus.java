package com.hoangphihiep.utils;

import lombok.Getter;

@Getter
public enum PublishedCourseStatus {
    DRAFT,
    PENDING,
    APPROVED,
    REJECTED;

    private final String status;

    PublishedCourseStatus() {
        this.status = this.name();
    }
}
