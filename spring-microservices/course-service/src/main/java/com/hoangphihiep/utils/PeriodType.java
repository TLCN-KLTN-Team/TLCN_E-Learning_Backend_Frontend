package com.hoangphihiep.utils;

import lombok.Getter;

@Getter
public enum PeriodType {
    WEEK(7),
    MONTH(30),
    YEAR(365),
    CUSTOM(0);

    private final int days;

    PeriodType(int days) {
        this.days = days;
    }
}
