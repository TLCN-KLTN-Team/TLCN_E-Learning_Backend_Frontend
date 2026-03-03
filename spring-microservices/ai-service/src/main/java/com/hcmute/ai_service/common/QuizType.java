package com.hcmute.ai_service.common;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum QuizType {
    SINGLE("SINGLE_CHOICE"),
    MULTIPLE("MULTIPLE_CHOICE"),
    TRUE_FALSE("TRUE_FALSE"),
    FILL_BLANK("FILL_IN_THE_BLANK");

    private final String value;

    QuizType(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static QuizType fromValue(String value) {
        for (QuizType type : QuizType.values()) {
            if (type.value.equalsIgnoreCase(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Invalid QuizType value: " + value);
    }

    @Override
    public String toString() {
        return value;
    }
}
