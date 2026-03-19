package com.hoangphihiep.service;

import com.hoangphihiep.dto.request.PublishCourseRequest;
import com.hoangphihiep.dto.response.PublishedCourseResponse;
import com.hoangphihiep.dto.response.TeacherResponse;
import com.hoangphihiep.entity.*;
import com.hoangphihiep.exception.AppException;
import com.hoangphihiep.exception.ErrorCode;
import com.hoangphihiep.mapper.PublishedCourseMapper;
import com.hoangphihiep.repository.*;
import com.hoangphihiep.repository.httpclient.FileHandlerRepository;
import com.hoangphihiep.repository.httpclient.TeacherRepository;
import com.hoangphihiep.repository.httpclient.ExpertRepository;
import com.hoangphihiep.dto.response.ExpertResponse;
import com.hoangphihiep.dto.response.ApiResponse;
import com.hoangphihiep.repository.httpclient.NotificationRepository;
import com.hoangphihiep.dto.request.NotificationMessage;
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
    private final TeacherRepository teacherRepository;
    private final NotificationRepository notificationRepository;
    private final ExpertRepository expertRepository;

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

    @Transactional
    public PublishedCourseResponse createOrUpdateDraft(PublishCourseRequest request, MultipartFile courseImage, MultipartFile courseVideo) {
        // Validate course exists and belongs to teacher
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Validate course type exists
        CourseType courseType = courseTypeRepository.findById(request.getCourseTypeId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_TYPE_NOT_FOUND));

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

            if (publishedCourse.getStatus() != 0 && publishedCourse.getStatus() != 2 && publishedCourse.getStatus() != 3) {
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
        
        // Only update image/video if new file was uploaded
        if (imageUrl != null) {
            publishedCourse.setCourseImage(imageUrl);
        }
        if (videoUrl != null) {
            publishedCourse.setCourseVideo(videoUrl);
        }
        
        publishedCourse.setLearnerAchievements(request.getLearnerAchievements());
        publishedCourse.setCourseLearner(request.getCourseLearner());
        publishedCourse.setCourseTarget(request.getCourseTarget());

        PublishedCourse saved = publishedCourseRepository.save(publishedCourse);
        // indexing for elasticsearch here
//        indexingForPublishedCourse(saved);
        log.info("Created/Updated draft published course for course ID: {}", request.getCourseId());

        return publishedCourseMapper.toPublishedCourseResponse(saved);
    }

    @Transactional
    public PublishedCourseResponse submitForApproval(Integer courseId) {

        String currentTeacherId = SecurityContextHolder.getContext().getAuthentication().getName();

        PublishedCourse publishedCourse = publishedCourseRepository.findByCourseId(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

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

    @Transactional
    public PublishedCourseResponse approveCourse(Integer publishedCourseId) {
        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isAuthorized = false;

        ApiResponse<ExpertResponse> response = expertRepository.getExpertByUserId(currentUserId);
        if (response != null && response.getResult() != null) {
            ExpertResponse expert = response.getResult();
            String eduUnitIdStr = String.valueOf(publishedCourse.getCourse().getEducationalUnit().getId());
            if (expert.getEducationalUnitId() != null && expert.getEducationalUnitId().equals(eduUnitIdStr)) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
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
        this.indexingForPublishedCourse(saved);

        // Send notification to teacher
        try {
            String teacherCode = saved.getCourse().getIdTeacher();
            // Fetch teacher details to get UUID
            var teacherResponse = teacherRepository.getTeacherByTeacherId(teacherCode).getResult();
            
            if (teacherResponse != null) {
                notificationRepository.sendNotification(NotificationMessage.builder()
                        .userId(teacherResponse.getId()) // Use UUID from teacher response
                        .type("COURSE_APPROVED")
                        .message("Khóa học \"" + saved.getCourseName() + "\" của bạn đã được phê duyệt thành công.")
                    .link("/teacher/public-courses")
                        .data(Map.of("courseId", saved.getCourse().getId()))
                        .build());
            }
        } catch (Exception e) {
            log.error("Failed to send approval notification to teacher", e);
        }

        return publishedCourseMapper.toPublishedCourseResponse(saved);
    }

    @Transactional
    public PublishedCourseResponse rejectCourse(Integer publishedCourseId, String reason) {
        PublishedCourse publishedCourse = publishedCourseRepository.findById(publishedCourseId)
                .orElseThrow(() -> new AppException(ErrorCode.PUBLISHED_COURSE_NOT_FOUND));

        String currentUserId = SecurityContextHolder.getContext().getAuthentication().getName();
        boolean isAuthorized = false;

        log.info("Checking expert permission for user: {}", currentUserId);
        ApiResponse<ExpertResponse> response = expertRepository.getExpertByUserId(currentUserId);
        log.info("Expert response: {}", response);

        if (response != null && response.getResult() != null) {
            ExpertResponse expert = response.getResult();
            String eduUnitIdStr = String.valueOf(publishedCourse.getCourse().getEducationalUnit().getId());
            log.info("Comparing Expert EduUnitId: {} with Course EduUnitId: {}",
                    expert.getEducationalUnitId(), eduUnitIdStr);

            if (expert.getEducationalUnitId() != null && expert.getEducationalUnitId().equals(eduUnitIdStr)) {
                isAuthorized = true;
                log.info("Expert authorized!");
            }
        }

        if (!isAuthorized) {
            throw new AppException(ErrorCode.ACCESS_DENIED);
        }

        if (publishedCourse.getStatus() != 1) {
            throw new AppException(ErrorCode.PUBLISHED_COURSE_NOT_PENDING);
        }

        publishedCourse.setStatus(3); // Rejected
        publishedCourse.setUpdatedAt(new Date());

        PublishedCourse saved = publishedCourseRepository.save(publishedCourse);

        // Send notification to teacher
        // Send notification to teacher
        try {
            String teacherCode = saved.getCourse().getIdTeacher();
            // Fetch teacher details to get UUID
            var teacherResponse = teacherRepository.getTeacherByTeacherId(teacherCode).getResult();
            
            if (teacherResponse != null) {
                notificationRepository.sendNotification(NotificationMessage.builder()
                        .userId(teacherResponse.getId()) // Use UUID from teacher response
                        .type("COURSE_REJECTED")
                        .message("Khóa học \"" + saved.getCourseName() + "\" của bạn đã bị từ chối phê duyệt. Lý do: " + reason)
                    .link("/teacher/public-courses")
                        .data(Map.of("courseId", saved.getCourse().getId(), "reason", reason))
                        .build());
            }
        } catch (Exception e) {
            log.error("Failed to send rejection notification to teacher", e);
        }

        return publishedCourseMapper.toPublishedCourseResponse(saved);
    }

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

    public Page<PublishedCourseResponse> getPendingCoursesForAdmin(Integer educationalUnitId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        Page<PublishedCourse> publishedCourses = publishedCourseRepository.findByEducationalUnitIdAndStatus(
                educationalUnitId, 1, pageable); // Status 1 = Pending

        return publishedCourses.map(publishedCourseMapper::toPublishedCourseResponse);
    }

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

        publishedCourse.setCourseName(request.getCourseName() != null ? request.getCourseName() : course.getCourseName());

        TeacherResponse teacher = teacherRepository.getTeacherByTeacherId(course.getIdTeacher()).getResult();
        publishedCourse.setAuthorName(teacher.getLastName() + " " + teacher.getFirstName());
        
        publishedCourse.setStatus(0); // Draft
        publishedCourse.setCreatedAt(new Date());
        publishedCourse.setUpdatedAt(new Date());
        return publishedCourse;
    }

    private void updatePublishedCourse(PublishedCourse publishedCourse, PublishCourseRequest request,
                                       Course course, CourseType courseType) {
        publishedCourse.setCourseType(courseType);
        publishedCourse.setCoursePrice(request.getCoursePrice());
        
        // Update courseName and authorName
        publishedCourse.setCourseName(request.getCourseName() != null ? request.getCourseName() : course.getCourseName());
        TeacherResponse teacher = teacherRepository.getTeacherByTeacherId(course.getIdTeacher()).getResult();
        publishedCourse.setAuthorName(teacher.getUsername());
        
        publishedCourse.setUpdatedAt(new Date());
        if (publishedCourse.getStatus() == 0 || publishedCourse.getStatus() == 3) {
            publishedCourse.setStatus(0);
        }
    }
    private void validatePublishedCourseForSubmission(PublishedCourse publishedCourse) {
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