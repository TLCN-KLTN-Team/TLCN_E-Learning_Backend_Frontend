package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CourseTypeRequest;
import com.hoangphihiep.dto.response.CourseTypeResponse;
import com.hoangphihiep.dto.response.PaginatedResponse;
import com.hoangphihiep.entity.CourseType;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.CourseTypeMapper;
import com.hoangphihiep.repository.CourseRepository;
import com.hoangphihiep.repository.CourseTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseTypeService {

    private final CourseTypeRepository courseTypeRepository;
    private final CourseRepository courseRepository;
    private final CourseTypeMapper courseTypeMapper;

    // Constants for validation
    private static final int MIN_COURSE_TYPE_NAME_LENGTH = 2;
    private static final int MAX_COURSE_TYPE_NAME_LENGTH = 100;


    // Lấy tất cả course types với phân trang
    public PaginatedResponse<CourseTypeResponse> getAllCourseTypes(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<CourseType> courseTypes = courseTypeRepository.findAll(pageable);
        List<CourseTypeResponse> courseTypeResponses = courseTypes.stream()
                .filter(ct -> !ct.isDeleted())
                .map(ct -> {
                    CourseTypeResponse response = courseTypeMapper.toCourseTypeResponse(ct);
                    response.setNumberOfType(ct.getCourses().size());
                    return response;
                })
                .toList();

        return PaginatedResponse.<CourseTypeResponse>builder()
                .content(courseTypeResponses)
                .page(page)
                .size(size)
                .totalElements(courseTypes.getTotalElements())
                .totalPages(courseTypes.getTotalPages())
                .build();
    }

    public List<CourseTypeResponse> getAllCourseTypesNonPaging(){
        List<CourseType> courseTypes = courseTypeRepository.findAll(Sort.by("courseTypeName").ascending());
        return courseTypes.stream()
                .filter(ct -> !ct.isDeleted())
                .map(ct -> {
                    CourseTypeResponse response = courseTypeMapper.toCourseTypeResponse(ct);
                    response.setNumberOfType(ct.getCourses().size());
                    return response;
                })
                .toList();
    }

    // Create new course type
    @Transactional
    public CourseTypeResponse createCourseType(CourseTypeRequest req){
        if (isCourseTypeNameExists(req.getCourseTypeName())) {
            throw new AppException(ErrorCode.COURSE_TYPE_NAME_ALREADY_EXISTS);
        }
        CourseType courseType = courseTypeMapper.toCourseType(req);
        CourseType savedCourseType = courseTypeRepository.save(courseType);
        return courseTypeMapper.toCourseTypeResponse(savedCourseType);
    }

    @Transactional
    public CourseTypeResponse updateCourseType(Integer id, CourseTypeRequest req){
        try{
            CourseType existingCourseType = courseTypeRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_TYPE_NOT_FOUND));

            if (req.getCourseTypeName() != null) {
                if (isCourseTypeNameExists(req.getCourseTypeName())) {
                    throw new AppException(ErrorCode.COURSE_TYPE_NAME_ALREADY_EXISTS);
                }
                existingCourseType.setCourseTypeName(req.getCourseTypeName());
            }
            if (req.getDescription() != null) {
                existingCourseType.setDescription(req.getDescription());
            }
            CourseType updatedCourseType = courseTypeRepository.save(existingCourseType);

            return courseTypeMapper.toCourseTypeResponse(updatedCourseType);
        } catch (Exception e) {
            throw e;
        }
    }

    @Transactional
    public void disableCourseType(Integer id){
        try{
            CourseType existingCourseType = courseTypeRepository.findById(id)
                    .orElseThrow(() -> new AppException(ErrorCode.COURSE_TYPE_NOT_FOUND));
            existingCourseType.setDeleted(true);

            courseTypeRepository.save(existingCourseType);
        } catch (Exception e) {
            throw e;
        }
    }

    public boolean isCourseTypeNameExists(String courseTypeName) {
        return courseTypeRepository.existsByCourseTypeNameIgnoreCaseAndIsDeletedFalse(courseTypeName);
    }

    // Lấy course type theo ID
    public CourseTypeResponse getCourseTypeById(int courseTypeId) {
        if (courseTypeId <= 0) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        CourseType courseType = courseTypeRepository.findById(courseTypeId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_TYPE_NOT_FOUND));

        return courseTypeMapper.toCourseTypeResponse(courseType);
    }

    // Lấy tất cả course types không phân trang (cho dropdown)
    public List<CourseTypeResponse> getAllCourseTypesForDropdown() {
        try {
            List<CourseType> courseTypes = courseTypeRepository.findAllByOrderByCourseTypeNameAsc();

            return courseTypes.stream()
                    .map(courseTypeMapper::toCourseTypeResponse)
                    .toList();
        } catch (Exception e) {
            log.error("Error occurred while fetching course types for dropdown", e);
            throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
        }
    }
}