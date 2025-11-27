package com.hoangphihiep.utils;

import lombok.Getter;

@Getter
public enum EducationalUnitStatus {
    PENDING("PENDING"),
    ACTIVE("ACTIVE"),
    REJECTED("REJECTED"),
    SUSPENDED("SUSPENDED");

    private final String status;

    EducationalUnitStatus(String status) {
        this.status = status;
    }

}
