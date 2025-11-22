package com.hoangphihiep.helper;

import java.util.List;

public final class Indices {
    public static final String PUBLISHED_COURSE_INDEX = "published_courses";
    public static final String PUBLISHED_COURSE_INDEX_NEW = "published_courses_new";

    private Indices() {
        // Private constructor to prevent instantiation
    }

    public static List<String> getAllIndices() {
        return List.of(
                PUBLISHED_COURSE_INDEX
        );
    }
}
