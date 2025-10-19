package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CourseClassRequest;
import com.hoangphihiep.dto.response.CourseClassResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseClass;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.CourseClassMapper;
import com.hoangphihiep.repository.CourseClassRepository;
import com.hoangphihiep.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseClassService {

    private final CourseClassRepository classRepository;
    private final CourseRepository courseRepository;
    private final CourseClassMapper courseClassMapper;

    @Transactional
    public CourseClassResponse createClass(CourseClassRequest request) {
        // Validate course exists
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Check if class code already exists
        if (classRepository.existsByClassCode(request.getClassCode())) {
            throw new AppException(ErrorCode.CLASS_CODE_ALREADY_EXISTS);
        }

        CourseClass courseClass = CourseClass.builder()
                .className(request.getClassName())
                .classCode(request.getClassCode())
                .course(course)
                .maxStudents(request.getMaxStudents())
                .currentStudents(0)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .description(request.getDescription())
                .status("ACTIVE")
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        CourseClass savedClass = classRepository.save(courseClass);

        return courseClassMapper.toCourseClassResponse(savedClass);
    }

    public Page<CourseClassResponse> getClassesByEducationalUnit(Integer educationalUnitId, Pageable pageable, String search) {
        Page<CourseClass> classPage = classRepository.findByEducationalUnitIdWithSearch(educationalUnitId, search, pageable);

        return classPage.map(courseClassMapper::toCourseClassResponse);
    }

    public Page<CourseClassResponse> getClassesByCourse(Integer courseId, Pageable pageable) {
        Page<CourseClass> classPage = classRepository.findByCourseId(courseId, pageable);

        return classPage.map(courseClassMapper::toCourseClassResponse);
    }

    @Transactional
    public CourseClassResponse updateClass(Long classId, CourseClassRequest request) {
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        // Check if class code is being changed and if new code already exists
        if (!courseClass.getClassCode().equals(request.getClassCode()) &&
                classRepository.existsByClassCode(request.getClassCode())) {
            throw new AppException(ErrorCode.CLASS_CODE_ALREADY_EXISTS);
        }

        courseClass.setClassName(request.getClassName());
        courseClass.setClassCode(request.getClassCode());
        courseClass.setMaxStudents(request.getMaxStudents());
        courseClass.setStartDate(request.getStartDate());
        courseClass.setEndDate(request.getEndDate());
        courseClass.setDescription(request.getDescription());
        courseClass.setUpdatedAt(new Date());

        CourseClass updatedClass = classRepository.save(courseClass);

        return courseClassMapper.toCourseClassResponse(updatedClass);
    }

    @Transactional
    public void deleteClass(Long classId) {
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        // Check if class has enrolled students
        if (courseClass.getCurrentStudents() > 0) {
            throw new AppException(ErrorCode.CLASS_HAS_ENROLLED_STUDENTS);
        }

        classRepository.delete(courseClass);
    }
}