package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.PublishCourseRequest;
import com.hoangphihiep.dto.response.PublishedCourseResponse;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.PublishedCourseMapper;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.FileHandlerRepository;
import com.hoangphihiep.service.searchandfilter.PublishedCourseSearchService;
import com.hoangphihiep.utils.ElasticSearchIndexInitializer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PublishedCourseTeacherService {

    private final PublishedCourseRepository publishedCourseRepository;
    private final CourseRepository courseRepository;
    private final CourseTypeRepository courseTypeRepository;
    private final PublishedCourseMapper publishedCourseMapper;
    private final FileHandlerRepository fileHandlerRepository;
    private final ElasticSearchIndexInitializer elasticSearchIndexInitializer;

    public Page<PublishedCourseResponse> getPublishedCoursesForAdmin(
            Integer educationalUnitId, Integer status, int page, int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());

        Page<PublishedCourse> publishedCourses;
        if (status != null) {
            publishedCourses = publishedCourseRepository.findByEducationalUnitIdAndStatus(
                    educationalUnitId, status, pageable);
        } else {
            publishedCourses = publishedCourseRepository.findByEducationalUnitId(
                    educationalUnitId, pageable);
        }

        return publishedCourses.map(publishedCourseMapper::toPublishedCourseResponse);
    }

    private void indexingForPublishedCourse(PublishedCourse publishedCourse) {
        try {
            elasticSearchIndexInitializer.indexCourse(publishedCourse);
        } catch (Exception e) {
            throw new AppException(ErrorCode.ELASTICSEARCH_OPERATION_FAILED);
        }
    }

    /**
     * Giảng viên tạo hoặc cập nhật thông tin đóng gói khóa học (Draft)
     */
    @Transactional
    public PublishedCourseResponse createOrUpdateDraft(PublishCourseRequest request, MultipartFile courseImage, MultipartFile courseVideo) {
        // Validate course exists and belongs to teacher
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Validate course type exists
        CourseType courseType = courseTypeRepository.findById(request.getCourseTypeId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_TYPE_NOT_FOUND));

        // Validate có ít nhất 1 section published
        boolean hasPublishedContent = course.getSections().stream()
                .anyMatch(section -> Boolean.TRUE.equals(section.getIsPublished()));

        if (!hasPublishedContent) {
            throw new AppException(ErrorCode.COURSE_EMPTY_SECTIONS);
        }

        PublishedCourse publishedCourse;

        // Check if already exists
        if (publishedCourseRepository.existsByCourseId(request.getCourseId())) {
            publishedCourse = publishedCourseRepository.findByCourseId(request.getCourseId())
                    .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));

            // Chỉ cho phép update nếu đang ở trạng thái Draft hoặc Rejected
            if (publishedCourse.getStatus() != 0 && publishedCourse.getStatus() != 3) {
                throw new AppException(ErrorCode.PUBLISHED_COURSE_CANNOT_UPDATE);
            }

            updatePublishedCourse(publishedCourse, request, course, courseType);
        } else {
            publishedCourse = createNewPublishedCourse(request, course, courseType);
        }

        String imageUrl = null;
        String videoUrl = null;

        // Upload image if provided
        if (courseImage != null && !courseImage.isEmpty()) {
            log.info("Uploading course image");
            try {
                Map<String, String> imageUploadResponse = fileHandlerRepository.uploadFile(courseImage);
                imageUrl = imageUploadResponse.get("url");
                log.info("Image uploaded successfully: {}", imageUrl);
            } catch (Exception e) {
                log.error("Error uploading course image: {}", e.getMessage(), e);
            }
        }

        // Upload video if provided
        if (courseVideo != null && !courseVideo.isEmpty()) {
            log.info("Uploading course video");
            try {
                Map<String, String> videoUploadResponse = fileHandlerRepository.uploadFile(courseVideo);
                videoUrl = videoUploadResponse.get("url");
                log.info("Video uploaded successfully: {}", videoUrl);
            } catch (Exception e) {
                log.error("Error uploading course video: {}", e.getMessage(), e);
            }
        }

        publishedCourse.setDescription(request.getDescription());
        publishedCourse.setCourseIntroduction(request.getCourseIntroduction());
        publishedCourse.setCourseImage(imageUrl);
        publishedCourse.setCourseVideo(videoUrl);
        publishedCourse.setLearnerAchievements(request.getLearnerAchievements());
        publishedCourse.setCourseLearner(request.getCourseLearner());
        publishedCourse.setCourseTarget(request.getCourseTarget());

        PublishedCourse saved = publishedCourseRepository.save(publishedCourse);
        // indexing for elasticsearch here
//        indexingForPublishedCourse(saved);
        log.info("Created/Updated draft published course for course ID: {}", request.getCourseId());

        return publishedCourseMapper.toPublishedCourseResponse(saved);
    }

    /**
     * Giảng viên gửi duyệt khóa học
     */
    @Transactional
    public PublishedCourseResponse submitForApproval(Integer courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        String currentTeacherId = SecurityContextHolder.getContext().getAuthentication().getName();

        PublishedCourse publishedCourse = publishedCourseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        // Chỉ cho phép gửi duyệt nếu đang ở trạng thái Draft hoặc Rejected
        if (publishedCourse.getStatus() != 0 && publishedCourse.getStatus() != 3) {
            throw new AppException(ErrorCode.PUBLISHED_COURSE_ALREADY_SUBMITTED);
        }

        // Validate có đầy đủ thông tin
        validatePublishedCourseForSubmission(publishedCourse);

        publishedCourse.setStatus(1); // Pending Approval
        publishedCourse.setUpdatedAt(new Date());

        PublishedCourse saved = publishedCourseRepository.save(publishedCourse);
        log.info("Teacher {} submitted course {} for approval", currentTeacherId, courseId);

        return publishedCourseMapper.toPublishedCourseResponse(saved);
    }

    /**
     * Admin duyệt khóa học
     */
    @Transactional
    public PublishedCourseResponse approveCourse(Integer publishedCourseId) {
        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        // Validate admin có quyền duyệt (cùng educational unit)
        String currentAdminId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!currentAdminId.equals(publishedCourse.getCourse().getEducationalUnit().getIdAdmin())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        if (publishedCourse.getStatus() != 1) {
            throw new AppException(ErrorCode.PUBLISHED_COURSE_NOT_PENDING);
        }

        publishedCourse.setStatus(2); // Approved
        publishedCourse.setUpdatedAt(new Date());

        PublishedCourse saved = publishedCourseRepository.save(publishedCourse);
        // indexing
        this.indexingForPublishedCourse(saved);
        log.info("Admin {} approved published course ID: {}", currentAdminId, publishedCourseId);

        return publishedCourseMapper.toPublishedCourseResponse(saved);
    }

    /**
     * Admin từ chối khóa học
     */
    @Transactional
    public PublishedCourseResponse rejectCourse(Integer publishedCourseId, String reason) {
        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        String currentAdminId = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!currentAdminId.equals(publishedCourse.getCourse().getEducationalUnit().getIdAdmin())) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        if (publishedCourse.getStatus() != 1) {
            throw new AppException(ErrorCode.PUBLISHED_COURSE_NOT_PENDING);
        }

        publishedCourse.setStatus(3); // Rejected
        publishedCourse.setUpdatedAt(new Date());

        PublishedCourse saved = publishedCourseRepository.save(publishedCourse);
        log.info("Admin {} rejected published course ID: {} with reason: {}", currentAdminId, publishedCourseId, reason);

        return publishedCourseMapper.toPublishedCourseResponse(saved);
    }

    /**
     * Lấy danh sách khóa học đã đóng gói của giảng viên
     */
    public Page<PublishedCourseResponse> getPublishedCoursesByTeacher(String teacherId, Integer status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());

        Page<PublishedCourse> publishedCourses;
        if (status != null) {
            publishedCourses = publishedCourseRepository.findByTeacherIdAndStatus(teacherId, status, pageable);
        } else {
            publishedCourses = publishedCourseRepository.findByTeacherId(teacherId, pageable);
        }

        return publishedCourses.map(publishedCourseMapper::toPublishedCourseResponse);
    }

    /**
     * Lấy danh sách khóa học cần duyệt của educational unit
     */
    public Page<PublishedCourseResponse> getPendingCoursesForAdmin(Integer educationalUnitId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<PublishedCourse> publishedCourses = publishedCourseRepository.findByEducationalUnitIdAndStatus(
                educationalUnitId, 1, pageable); // Status 1 = Pending

        return publishedCourses.map(publishedCourseMapper::toPublishedCourseResponse);
    }

    /**
     * Lấy chi tiết published course
     */
    public PublishedCourseResponse getPublishedCourseById(Integer id) {
        PublishedCourse publishedCourse = publishedCourseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        return publishedCourseMapper.toPublishedCourseResponse(publishedCourse);
    }

    /**
     * Lấy published course by course ID
     */
    public PublishedCourseResponse getPublishedCourseByCourseId(Integer courseId) {
        PublishedCourse publishedCourse = publishedCourseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        return publishedCourseMapper.toPublishedCourseResponse(publishedCourse);
    }

    // Helper methods
    private PublishedCourse createNewPublishedCourse(PublishCourseRequest request, Course course, CourseType courseType) {
        PublishedCourse publishedCourse = new PublishedCourse();
        publishedCourse.setCourse(course);
        publishedCourse.setCourseType(courseType);
        publishedCourse.setCoursePrice(request.getCoursePrice());
        publishedCourse.setStatus(0); // Draft
        publishedCourse.setCreatedAt(new Date());
        publishedCourse.setUpdatedAt(new Date());
        return publishedCourse;
    }

    private void updatePublishedCourse(PublishedCourse publishedCourse, PublishCourseRequest request,
                                       Course course, CourseType courseType) {
        publishedCourse.setCourseType(courseType);
        publishedCourse.setCoursePrice(request.getCoursePrice());
        publishedCourse.setUpdatedAt(new Date());
        // Reset về Draft khi update
        publishedCourse.setStatus(0);
    }
    private void validatePublishedCourseForSubmission(PublishedCourse publishedCourse) {
        // Validate có ít nhất 1 section published
        boolean hasPublishedSection = publishedCourse.getCourse().getSections().stream()
                .anyMatch(section -> Boolean.TRUE.equals(section.getIsPublished()) &&
                        (hasPublishedContent(section)));

        if (!hasPublishedSection) {
            throw new AppException(ErrorCode.COURSE_NO_PUBLISHED_CONTENT);
        }
    }

    private boolean hasPublishedContent(Section section) {
        boolean hasLesson = section.getLessons().stream()
                .anyMatch(lesson -> Boolean.TRUE.equals(lesson.getIsPublished()));
        boolean hasQuiz = section.getQuizs().stream()
                .anyMatch(quiz -> Boolean.TRUE.equals(quiz.getIsPublished()));
        boolean hasAssignment = section.getAssignments().stream()
                .anyMatch(assignment -> Boolean.TRUE.equals(assignment.getIsPublished()));

        return hasLesson || hasQuiz || hasAssignment;
    }
}