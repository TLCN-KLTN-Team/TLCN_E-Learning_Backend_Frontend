package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CourseTypeRequest;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.entity.CourseType;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.repository.CourseRepository;
import com.hoangphihiep.repository.CourseTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseTypeService {

    private final CourseTypeRepository courseTypeRepository;
    private final CourseRepository courseRepository;

    // Constants for validation
    private static final int MIN_COURSE_TYPE_NAME_LENGTH = 2;
    private static final int MAX_COURSE_TYPE_NAME_LENGTH = 100;
    private static final int MIN_PAGE_SIZE = 1;
    private static final int MAX_PAGE_SIZE = 100;

    // Lấy tất cả course types với phân trang
    public Page<CourseTypeResponse> getAllCourseTypes(int page, int size, String search) {
        validatePaginationParameters(page, size);

        if (search != null && search.trim().isEmpty()) {
            search = null;
        }

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by("courseTypeName").ascending());
            Page<CourseType> courseTypePage = courseTypeRepository.findBySearch(search, pageable);

            return courseTypePage.map(this::toCourseTypeResponse);
        } catch (Exception e) {
            log.error("Error occurred while fetching course types", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // Lấy tất cả course types không phân trang (cho dropdown)
    public List<CourseTypeResponse> getAllCourseTypesForDropdown() {
        try {
            List<CourseType> courseTypes = courseTypeRepository.findAllByOrderByCourseTypeNameAsc();

            return courseTypes.stream()
                    .map(this::toCourseTypeResponse)
                    .toList();
        } catch (Exception e) {
            log.error("Error occurred while fetching course types for dropdown", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }

    // Lấy course type theo ID
    public CourseTypeResponse getCourseTypeById(int courseTypeId) {
        if (courseTypeId <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        CourseType courseType = courseTypeRepository.findById(courseTypeId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_TYPE_NOT_FOUND));

        return toCourseTypeResponse(courseType);
    }

    private void validatePaginationParameters(int page, int size) {
        if (page < 0) {
            throw new AppException(ErrorCode.COURSE_PAGE_NUMBER_INVALID);
        }

        if (size < MIN_PAGE_SIZE || size > MAX_PAGE_SIZE) {
            throw new AppException(ErrorCode.COURSE_PAGE_SIZE_INVALID);
        }
    }

    // Mapper method
    private CourseTypeResponse toCourseTypeResponse(CourseType courseType) {
        return CourseTypeResponse.builder()
                .id(courseType.getId())
                .courseTypeName(courseType.getCourseTypeName())
                .build();
    }
}