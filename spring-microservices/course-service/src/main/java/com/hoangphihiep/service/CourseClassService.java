package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.CourseClassRequest;
import com.hoangphihiep.dto.response.ClassImportResponse;
import com.hoangphihiep.dto.response.CourseClassResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseClass;
import com.hoangphihiep.events.ClassCreatedEvent;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.kafka.producer.ClassEventProducer;
import com.hoangphihiep.mapper.CourseClassMapper;
import com.hoangphihiep.repository.CourseClassRepository;
import com.hoangphihiep.repository.CourseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseClassService {

    private final CourseClassRepository classRepository;
    private final CourseRepository courseRepository;
    private final CourseClassMapper courseClassMapper;
    private final ClassEventProducer producer;
    private final CourseEnrollmentService enrollmentService;

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
            .isArchived(false)
            .archivedAt(null)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        CourseClass savedClass = classRepository.save(courseClass);
        System.out.println ("Course1: " + course.getMaxStudents());
        course.setMaxStudents(course.getMaxStudents() + request.getMaxStudents());

        Course course1 = courseRepository.save(course);

        System.out.println ("Course" + course1.getMaxStudents());

        // create a new channel for this class in chat service
        ClassCreatedEvent event = ClassCreatedEvent.builder()
                .eventId(UUID.randomUUID().toString())
                .classId(savedClass.getId())
                .courseId(course.getId())
                .className(savedClass.getClassName())
                .description(savedClass.getDescription())
                .createdAt(savedClass.toString())
                .endedAt(savedClass.getEndDate().toString())
                .build();
        producer.publishClassCreatedEvent(event);

        return courseClassMapper.toCourseClassResponse(savedClass);
    }

    public Page<CourseClassResponse> getClassesByCourse(Integer courseId, Pageable pageable) {
        Page<CourseClass> classPage = classRepository.findByCourseIdAndIsArchivedFalse(courseId, pageable);

        return classPage.map(courseClassMapper::toCourseClassResponse);
    }

    public CourseClassResponse getClassesById(Integer classId) {
        return classRepository.findById(classId)
                .map(courseClassMapper::toCourseClassResponse)
                .orElse(null);
    }

    @Transactional
    public CourseClassResponse updateClass(Integer classId, CourseClassRequest request) {
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        Course course = courseRepository.findById(courseClass.getCourse().getId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        course.setMaxStudents(course.getMaxStudents() - courseClass.getMaxStudents() + request.getMaxStudents());

        Course course1 = courseRepository.save(course);
        System.out.println ("Course3" + course1.getMaxStudents());
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
    public void archiveClass(Integer classId) {
        CourseClass courseClass = classRepository.findById(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        courseClass.setIsArchived(true);
        courseClass.setArchivedAt(new Date());
        courseClass.setUpdatedAt(new Date());
        classRepository.save(courseClass);
        // Recalculate course totals after archiving a class
        try {
            enrollmentService.updateCourseTotalStudents(courseClass.getCourse().getId());
        } catch (Exception e) {
            log.warn("Failed to update course totals after archiving class {}: {}", classId, e.getMessage());
        }
    }

    @Transactional
    public ClassImportResponse bulkImportClasses(Integer courseId, List<CourseClassRequest> classes) {
        List<ClassImportResponse.ImportResultDetail> results = new ArrayList<>();
        int successful = 0;
        int failed = 0;

        if (classes == null || classes.isEmpty()) {
            return ClassImportResponse.builder()
                    .successful(0)
                    .failed(0)
                    .results(results)
                    .build();
        }

        for (CourseClassRequest req : classes) {
            try {
                // Ensure courseId is set from path
                req.setCourseId(courseId);

                CourseClassResponse created = createClass(req);
                results.add(ClassImportResponse.ImportResultDetail.builder()
                        .classCode(created.getClassCode())
                        .success(true)
                        .message("Tạo lớp học thành công")
                        .build());
                successful++;
            } catch (AppException e) {
                results.add(ClassImportResponse.ImportResultDetail.builder()
                        .classCode(req.getClassCode())
                        .success(false)
                        .message(e.getErrorCode().getMessage())
                        .build());
                failed++;
            } catch (Exception e) {
                results.add(ClassImportResponse.ImportResultDetail.builder()
                        .classCode(req.getClassCode())
                        .success(false)
                        .message(e.getMessage() != null ? e.getMessage() : "Lỗi không xác định")
                        .build());
                failed++;
            }
        }

        return ClassImportResponse.builder()
                .successful(successful)
                .failed(failed)
                .results(results)
                .build();
    }

    @Transactional
    public void autoArchiveExpiredClasses() {
        List<CourseClass> expiredClasses = classRepository.findExpiredClasses();
        
        if (expiredClasses.isEmpty()) {
            log.info("No expired classes to archive");
            return;
        }

        Date now = new Date();
        // Track affected course IDs to update totals once per course
        Set<Integer> affectedCourseIds = new HashSet<>();
        for (CourseClass courseClass : expiredClasses) {
            courseClass.setIsArchived(true);
            courseClass.setArchivedAt(now);
            courseClass.setUpdatedAt(now);
            classRepository.save(courseClass);
            if (courseClass.getCourse() != null && courseClass.getCourse().getId() != null) {
                affectedCourseIds.add(courseClass.getCourse().getId());
            }
            log.info("Auto-archived class: {} (ID: {})", courseClass.getClassName(), courseClass.getId());
        }

        log.info("Auto-archived {} expired classes", expiredClasses.size());

        // Recalculate course totals for affected courses
        for (Integer courseId : affectedCourseIds) {
            try {
                enrollmentService.updateCourseTotalStudents(courseId);
            } catch (Exception e) {
                log.warn("Failed to update course totals for course {} after auto-archive: {}", courseId, e.getMessage());
            }
        }
    }
}