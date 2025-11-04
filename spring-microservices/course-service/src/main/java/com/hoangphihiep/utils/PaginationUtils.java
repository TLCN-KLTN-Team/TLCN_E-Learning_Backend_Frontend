package com.hoangphihiep.utils;

import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import org.springframework.stereotype.Component;

@Component
public class PaginationUtils<T> {
    private static final int MIN_PAGE_SIZE = 0;
    private static final int MAX_PAGE_SIZE = 100;

    public void validatePaginationParameters(int page, int size) {
        if (size < MIN_PAGE_SIZE || size > MAX_PAGE_SIZE) {
            throw new AppException(ErrorCode.COURSE_PAGE_SIZE_INVALID);
        }
    }
}
