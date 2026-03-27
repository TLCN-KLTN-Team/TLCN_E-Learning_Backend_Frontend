package com.hoangphihiep.service;

import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.entity.Course;
import com.hoangphihiep.entity.CourseObjective;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
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

    /**
     * Create a new CLO for a course
     */
    @Transactional
    public CourseObjective createCourseObjective(Integer courseId, String code, String description) {
        log.info("Creating CLO with code {} for course {}", code, courseId);

        // Validate course exists
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Validate CLO code
        if (code == null || code.trim().isEmpty()) {
            throw new AppException(ErrorCode.CLO_CODE_REQUIRED);
        }

        String codeUpper = code.trim().toUpperCase();

        // Check for duplicate code within this course
        Optional<CourseObjective> existing = courseObjectiveRepository.findByCourseIdAndCode(courseId, codeUpper);
        if (existing.isPresent()) {
            throw new AppException(ErrorCode.CLO_CODE_ALREADY_EXISTS);
        }

        // Create new CLO
        CourseObjective clo = new CourseObjective();
        clo.setCourse(course);
        clo.setCode(codeUpper);
        clo.setDescription(description != null ? description.trim() : "");
        clo.setIsActive(true);
        clo.setCreatedAt(LocalDateTime.now());
        clo.setUpdatedAt(LocalDateTime.now());

        CourseObjective saved = courseObjectiveRepository.save(clo);
        log.info("Successfully created CLO with id {}", saved.getId());
        return saved;
    }

    /**
     * Get CLO by id
     */
    @Transactional(readOnly = true)
    public CourseObjective getCourseObjectiveById(Integer cloId) {
        log.info("Retrieving CLO with id {}", cloId);
        return courseObjectiveRepository.findById(cloId)
                .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));
    }

    /**
     * Get all CLOs for a course
     */
    @Transactional(readOnly = true)
    public List<CourseObjective> getCourseObjectivesByCourseId(Integer courseId) {
        log.info("Retrieving all CLOs for course {}", courseId);

        // Verify course exists
        courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        return courseObjectiveRepository.findByCourseId(courseId);
    }

    /**
     * Get active CLOs for a course
     */
    @Transactional(readOnly = true)
    public List<CourseObjective> getActiveCourseObjectivesByCourseId(Integer courseId) {
        log.info("Retrieving active CLOs for course {}", courseId);

        // Verify course exists
        courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        return courseObjectiveRepository.findActiveByCourseId(courseId);
    }

    /**
     * Get all active CLOs from courses owned by current teacher
     */
    @Transactional(readOnly = true)
    public List<CourseObjective> getActiveCourseObjectivesByTeacherId(String teacherId) {
        log.info("Retrieving active CLOs for teacher principal {}", teacherId);

        TeacherResponse teacherResponse = null;

        if (teacherResponse == null) {
            try {
                ApiResponse<TeacherResponse> teacherResponseApi = teacherRepository.getTeacherByUserId(teacherId);
                teacherResponse = teacherResponseApi != null ? teacherResponseApi.getResult() : null;
            } catch (Exception ex) {
                log.warn("Cannot resolve principal {} by userId", teacherId);
            }
        }

        if (teacherResponse == null) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }

        String mappedTeacherId = teacherResponse.getTeacherId();
        if (mappedTeacherId == null || mappedTeacherId.trim().isEmpty()) {
            throw new AppException(ErrorCode.TEACHER_NOT_FOUND);
        }

        log.info("Mapped teacher principal {} to teacherId {} for CLO lookup", teacherId, mappedTeacherId);
        return courseObjectiveRepository.findActiveByTeacherId(mappedTeacherId);
    }

    /**
     * Update a CLO
     */
    @Transactional
    public CourseObjective updateCourseObjective(Integer cloId, String code, String description) {
        log.info("Updating CLO with id {}", cloId);

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
        log.info("Successfully updated CLO with id {}", updated.getId());
        return updated;
    }

    /**
     * Deactivate a CLO (soft delete)
     */
    @Transactional
    public void deactivateCourseObjective(Integer cloId) {
        log.info("Deactivating CLO with id {}", cloId);

        CourseObjective clo = courseObjectiveRepository.findById(cloId)
                .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));

        clo.setIsActive(false);
        clo.setUpdatedAt(LocalDateTime.now());
        courseObjectiveRepository.save(clo);
        log.info("Successfully deactivated CLO with id {}", cloId);
    }

    /**
     * Reactivate a CLO
     */
    @Transactional
    public void reactivateCourseObjective(Integer cloId) {
        log.info("Reactivating CLO with id {}", cloId);

        CourseObjective clo = courseObjectiveRepository.findById(cloId)
                .orElseThrow(() -> new AppException(ErrorCode.CLO_NOT_FOUND));

        clo.setIsActive(true);
        clo.setUpdatedAt(LocalDateTime.now());
        courseObjectiveRepository.save(clo);
        log.info("Successfully reactivated CLO with id {}", cloId);
    }

    /**
     * Delete a CLO permanently
     */
    @Transactional
    public void deleteCourseObjective(Integer cloId) {
        log.info("Deleting CLO with id {}", cloId);

        if (!courseObjectiveRepository.existsById(cloId)) {
            throw new AppException(ErrorCode.CLO_NOT_FOUND);
        }

        courseObjectiveRepository.deleteById(cloId);
        log.info("Successfully deleted CLO with id {}", cloId);
    }

    /**
     * Count CLOs for a course
     */
    @Transactional(readOnly = true)
    public int countCourseObjectivesByCourseId(Integer courseId) {
        log.info("Counting CLOs for course {}", courseId);
        return courseObjectiveRepository.countByCourseId(courseId);
    }

    /**
     * Count active CLOs for a course
     */
    @Transactional(readOnly = true)
    public int countActiveCourseObjectivesByCourseId(Integer courseId) {
        log.info("Counting active CLOs for course {}", courseId);
        return courseObjectiveRepository.countActiveByCourseId(courseId);
    }
}
