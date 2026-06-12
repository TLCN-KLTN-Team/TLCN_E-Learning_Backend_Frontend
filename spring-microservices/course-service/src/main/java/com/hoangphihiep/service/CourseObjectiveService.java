package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.CourseObjectiveResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseObjective;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.CourseObjectiveMapper;
import com.hoangphihiep.repository.CourseObjectiveRepository;
import com.hoangphihiep.repository.CourseRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CourseObjectiveService {

    private final CourseObjectiveRepository courseObjectiveRepository;
    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;
    private final CourseObjectiveMapper courseObjectiveMapper;

    @Transactional
    public CourseObjectiveResponse createCourseObjective(Integer courseId, String code, String description) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        if (code == null || code.trim().isEmpty()) {
            throw new AppException(ErrorCode.CLO_CODE_REQUIRED);
        }

        String codeUpper = code.trim().toUpperCase();
        Optional<CourseObjective> existing = courseObjectiveRepository.findByCourseIdAndCode(courseId, codeUpper);
        if (existing.isPresent()) {
            throw new AppException(ErrorCode.CLO_CODE_ALREADY_EXISTS);
        }

        CourseObjective clo = new CourseObjective();
        clo.setCourse(course);
        clo.setCode(codeUpper);
        clo.setDescription(description != null ? description.trim() : "");
        clo.setIsActive(true);
        clo.setCreatedAt(LocalDateTime.now());
        clo.setUpdatedAt(LocalDateTime.now());

        CourseObjective saved = courseObjectiveRepository.save(clo);
        return courseObjectiveMapper.toCourseObjectiveResponse(saved);
    }

    @Transactional
    public List<CourseObjectiveResponse> getCourseObjectivesByCourseId(Integer courseId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        List<CourseObjective> objectives = courseObjectiveRepository.findByCourseId(courseId);
        return courseObjectiveMapper.toCourseObjectiveResponseList(objectives);
    }

    @Transactional(readOnly = true)
    public List<CourseObjectiveResponse> getActiveCourseObjectivesByTeacherId() {
        String teacherId = org.springframework.security.core.context.SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        TeacherResponse teacherResponse = null;

        try {
            ApiResponse<TeacherResponse> teacherResponseApi = teacherRepository.getTeacherByUserId(teacherId);
            teacherResponse = teacherResponseApi != null ? teacherResponseApi.getResult() : null;
        } catch (Exception ex) {
            log.warn("Cannot resolve principal {} by userId", teacherId);
        }

        if (teacherResponse == null) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }

        String mappedTeacherId = teacherResponse.getTeacherId();
        if (mappedTeacherId == null || mappedTeacherId.trim().isEmpty()) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }

            List<CourseObjective> objectives = courseObjectiveRepository.findActiveByTeacherId(mappedTeacherId);
            return courseObjectiveMapper.toCourseObjectiveResponseList(objectives);
    }

    @Transactional(readOnly = true)
    public List<CourseObjectiveResponse> getActiveCourseObjectivesByCourseId(Integer courseId) {
        courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        List<CourseObjective> objectives = courseObjectiveRepository.findActiveByCourseId(courseId);
        return courseObjectiveMapper.toCourseObjectiveResponseList(objectives);
    }

    @Transactional
    public CourseObjectiveResponse updateCourseObjective(Integer cloId, String code, String description) {
        CourseObjective clo = courseObjectiveRepository.findById(cloId)
                .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));

        // Only allow updating if code is different
        if (code != null && !code.trim().isEmpty()) {
            String codeUpper = code.trim().toUpperCase();
            if (!codeUpper.equals(clo.getCode())) {
                // Check for duplicate code within this course
                Optional<CourseObjective> existing = courseObjectiveRepository
                        .findByCourseIdAndCode(clo.getCourse().getId(), codeUpper);
                if (existing.isPresent()) {
                    throw new AppException(ErrorCode.CLO_CODE_ALREADY_EXISTS);
                }
                clo.setCode(codeUpper);
            }
        }

        if (description != null) {
            clo.setDescription(description.trim());
        }

        clo.setUpdatedAt(LocalDateTime.now());
        CourseObjective updated = courseObjectiveRepository.save(clo);
        return courseObjectiveMapper.toCourseObjectiveResponse(updated);
    }

    @Transactional
    public void deactivateCourseObjective(Integer cloId) {
        CourseObjective clo = courseObjectiveRepository.findById(cloId)
                .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));

        clo.setIsActive(false);
        clo.setUpdatedAt(LocalDateTime.now());
        courseObjectiveRepository.save(clo);
    }

    @Transactional
    public void reactivateCourseObjective(Integer cloId) {

        CourseObjective clo = courseObjectiveRepository.findById(cloId)
                .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));

        clo.setIsActive(true);
        clo.setUpdatedAt(LocalDateTime.now());
        courseObjectiveRepository.save(clo);
    }
}
