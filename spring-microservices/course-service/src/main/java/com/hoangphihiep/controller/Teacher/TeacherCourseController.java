package com.hoangphihiep.controller.Teacher;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.hoangphihiep.dto.request.*;
import com.hoangphihiep.dto.response.*;
import com.hoangphihiep.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/teacher/courses")
@RequiredArgsConstructor
@Slf4j
public class TeacherCourseController {

    private final CourseService courseService;

    private final SectionService sectionService;

    private final StudentService studentService;

    private final ContentVisibilityService contentVisibilityService;

    private final ContentPublishService contentPublishService;
    private final CourseClassService classService;
    private final CourseEnrollmentService enrollmentService;

    @GetMapping("/{courseId}/classes")
    public ApiResponse<Page<CourseClassResponse>> getClassesByCourse(
            @PathVariable int courseId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<CourseClassResponse> classes = classService.getClassesByCourse(courseId, pageable);

        return ApiResponse.<Page<CourseClassResponse>>builder()
                .result(classes)
                .build();
    }

    @GetMapping("/classes/{classId}/students")
    public ApiResponse<List<StudentResponse>> getStudentsInClass(
            @PathVariable Integer classId) {

        List<StudentResponse> students = enrollmentService.getStudentsInClass(classId);

        return ApiResponse.<List<StudentResponse>>builder()
                .result(students)
                .build();
    }


    @GetMapping("/classes/{classId}/available-students")
    public ApiResponse<List<StudentResponse>> getAvailableStudentsForClass(
            @PathVariable Integer classId,
            @RequestParam(required = false, defaultValue = "0") Integer educationalUnitId) { // accept it from frontend

        List<StudentResponse> students = enrollmentService.getAvailableStudentsForClass(classId, educationalUnitId);

        return ApiResponse.<List<StudentResponse>>builder()
                .result(students)
                .build();
    }

    @PostMapping("/classes/{classId}/enroll-students")
    public ApiResponse<String> enrollStudentsInClass(
            @PathVariable Integer classId,
            @RequestBody List<String> studentIds) {
        try {
            enrollmentService.enrollStudentsToClass(classId, studentIds);

            String message = String.format("Successfully enrolled %d students to class", studentIds.size());

            return ApiResponse.<String>builder()
                    .result(message)
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Enrollment failed: " + e.getMessage());
        }
    }

    @DeleteMapping("/classes/{classId}/students/{studentId}")
    public ApiResponse<Void> unenrollStudentFromClass(
            @PathVariable Integer classId,
            @PathVariable String studentId) {

        enrollmentService.unenrollStudentFromClass(classId, studentId);

        return ApiResponse.<Void>builder()
                .message("Student successfully unenrolled from class")
                .build();
    }

    @GetMapping("/classes/{classId}/statistics")
    public ApiResponse<ClassStudentStatsResponse> getClassStatistics(
            @PathVariable Integer classId) {

        ClassStudentStatsResponse stats = enrollmentService.getClassStatistics(classId);

        return ApiResponse.<ClassStudentStatsResponse>builder()
                .result(stats)
                .build();
    }

    @GetMapping("/{teacherId}/paginated")
    public ApiResponse<Page<CourseResponse>> getCoursesByTeacherPaginated(
            @PathVariable String teacherId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String creditRange) {

        Page<CourseResponse> courses = courseService.getCoursesByTeacherPaginated(teacherId, page, size, search, creditRange);

        return ApiResponse.<Page<CourseResponse>>builder()
                .result(courses)
                .build();
    }

    @GetMapping("/by-course/{courseId}")
    public ApiResponse<CourseResponse> getCoursesById(
            @PathVariable int courseId) {

        CourseResponse courses = courseService.getCourseById(courseId);

        return ApiResponse.<CourseResponse>builder()
                .result(courses)
                .build();
    }

    @GetMapping("/section/{courseId}")
    public ApiResponse<List<SectionResponse>> getCourseDetail(
            @PathVariable Integer courseId) {

        List<SectionResponse> sectionResponse = sectionService.getSectionsByCourseId(courseId);

        return ApiResponse.<List<SectionResponse>>builder()
                .result(sectionResponse)
                .build();
    }

    @PostMapping(value = "/section/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<List<SectionResponse>> createSections(
            @RequestPart("data") String dataJson,  // ĐỔI THÀNH String
            @RequestPart(value = "lessonFiles", required = false) List<MultipartFile> lessonFiles,
            @RequestPart(value = "questionFiles", required = false) List<MultipartFile> questionFiles,
            @RequestPart(value = "assignmentFiles", required = false) List<MultipartFile> assignmentFiles,
            @RequestPart(value = "rubricFiles", required = false) List<MultipartFile> rubricFiles
    ) throws JsonProcessingException {  // Thêm throws

        // Parse JSON string thành object
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule()); // Nếu có Date/Time fields
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

        BulkSectionRequest request = mapper.readValue(dataJson, BulkSectionRequest.class);

        printFileList("Lesson files", lessonFiles);
        printFileList("Question files", questionFiles);
        printFileList("Assignment files", assignmentFiles);
        printFileList("Rubric files", rubricFiles);

        List<SectionResponse> responses = sectionService.createSections(
                request,
                lessonFiles,
                questionFiles,
                assignmentFiles,
                rubricFiles
        );

        return ApiResponse.<List<SectionResponse>>builder()
                .result(responses)
                .build();
    }

    @GetMapping("/content-visibility/section/{sectionId}")
    public ApiResponse<ContentVisibilityResponse> getSectionVisibility(
            @PathVariable Integer sectionId,
            @RequestParam Integer courseId) {
        return ApiResponse.<ContentVisibilityResponse>builder()
                .result(contentVisibilityService.getSectionVisibility(courseId, sectionId))
                .build();
    }

    @PutMapping("/content-visibility/section/{sectionId}")
    public ApiResponse<Void> updateSectionVisibility(
            @PathVariable Integer sectionId,
            @RequestBody ContentVisibilityRequest request) {
        contentVisibilityService.updateSectionVisibility(sectionId, request.getVisibleClassIds());
        return ApiResponse.<Void>builder()
                .message("Cập nhật khả năng hiển thị thành công")
                .build();
    }

    @GetMapping("/content-visibility/lesson/{lessonId}")
    public ApiResponse<ContentVisibilityResponse> getLessonVisibility(
            @PathVariable Integer lessonId,
            @RequestParam Integer courseId) {
        return ApiResponse.<ContentVisibilityResponse>builder()
                .result(contentVisibilityService.getLessonVisibility(courseId, lessonId))
                .build();
    }

    @PutMapping("/content-visibility/lesson/{lessonId}")
    public ApiResponse<Void> updateLessonVisibility(
            @PathVariable Integer lessonId,
            @RequestBody ContentVisibilityRequest request) {
        contentVisibilityService.updateLessonVisibility(lessonId, request.getVisibleClassIds());
        return ApiResponse.<Void>builder()
                .message("Cập nhật khả năng hiển thị bài học thành công")
                .build();
    }

    @GetMapping("/content-visibility/quiz/{quizId}")
    public ApiResponse<ContentVisibilityResponse> getQuizVisibility(
            @PathVariable Integer quizId,
            @RequestParam Integer courseId) {
        return ApiResponse.<ContentVisibilityResponse>builder()
                .result(contentVisibilityService.getQuizVisibility(courseId, quizId))
                .build();
    }

    @PutMapping("/content-visibility/quiz/{quizId}")
    public ApiResponse<Void> updateQuizVisibility(
            @PathVariable Integer quizId,
            @RequestBody ContentVisibilityRequest request) {
        contentVisibilityService.updateQuizVisibility(quizId, request.getVisibleClassIds());
        return ApiResponse.<Void>builder()
                .message("Cập nhật khả năng hiển thị bài kiểm tra thành công")
                .build();
    }

    @GetMapping("/content-visibility/assignment/{assignmentId}")
    public ApiResponse<ContentVisibilityResponse> getAssignmentVisibility(
            @PathVariable Integer assignmentId,
            @RequestParam Integer courseId) {
        return ApiResponse.<ContentVisibilityResponse>builder()
                .result(contentVisibilityService.getAssignmentVisibility(courseId, assignmentId))
                .build();
    }

    @PutMapping("/content-visibility/assignment/{assignmentId}")
    public ApiResponse<Void> updateAssignmentVisibility(
            @PathVariable Integer assignmentId,
            @RequestBody ContentVisibilityRequest request) {
        contentVisibilityService.updateAssignmentVisibility(assignmentId, request.getVisibleClassIds());
        return ApiResponse.<Void>builder()
                .message("Cập nhật khả năng hiển thị bài tập thành công")
                .build();
    }


    @GetMapping("/{classId}/students/{studentId}")
    public ApiResponse<StudentResponse> getStudentDetails(
            @PathVariable Integer classId,
            @PathVariable String studentId) {

        StudentResponse student = studentService.getStudentDetailByStudentId(studentId, classId);

        return ApiResponse.<StudentResponse>builder()
                .result(student)
                .build();
    }

    private void printFileList(String label, List<MultipartFile> files) {
        if (files == null) {
            System.out.println(label + ": NULL");
            return;
        }
        System.out.println(label + ": " + files.size() + " file(s)");
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            System.out.printf("  [%d] name=%s, originalFilename=%s, size=%d bytes%n",
                    i, file.getName(), file.getOriginalFilename(), file.getSize());
        }
    }



    @GetMapping("/{courseId}/publish-status")
    public ApiResponse<ContentPublishStatusResponse> getPublishStatus(@PathVariable Integer courseId) {
        ContentPublishStatusResponse response = contentPublishService.getPublishStatus(courseId);

        return ApiResponse.<ContentPublishStatusResponse>builder()
                .message("Get publish status successfully")
                .result(response)
                .build();
    }

    @PutMapping("/sections/{sectionId}/publish")
    public ApiResponse<Void> toggleSectionPublish(
            @PathVariable Integer sectionId,
            @RequestParam Boolean isPublished) {
        contentPublishService.toggleSectionPublish(sectionId, isPublished);

        return ApiResponse.<Void>builder()
                .message("Section publish status updated successfully")
                .build();
    }

    @PutMapping("/lessons/{lessonId}/publish")
    public ApiResponse<Void> toggleLessonPublish(
            @PathVariable Integer lessonId,
            @RequestParam Boolean isPublished) {

        contentPublishService.toggleLessonPublish(lessonId, isPublished);

        return ApiResponse.<Void>builder()
                .message("Lesson publish status updated successfully")
                .build();
    }

    @PutMapping("/quizzes/{quizId}/publish")
    public ApiResponse<Void> toggleQuizPublish(
            @PathVariable Integer quizId,
            @RequestParam Boolean isPublished) {

        log.info("Toggle quiz {} publish status to: {}", quizId, isPublished);
        contentPublishService.toggleQuizPublish(quizId, isPublished);

        return ApiResponse.<Void>builder()
                .message("Quiz publish status updated successfully")
                .build();
    }

    @PutMapping("/assignments/{assignmentId}/publish")
    public ApiResponse<Void> toggleAssignmentPublish(
            @PathVariable Integer assignmentId,
            @RequestParam Boolean isPublished) {

        log.info("Toggle assignment {} publish status to: {}", assignmentId, isPublished);
        contentPublishService.toggleAssignmentPublish(assignmentId, isPublished);

        return ApiResponse.<Void>builder()
                .message("Assignment publish status updated successfully")
                .build();
    }

    @PostMapping("/{courseId}/publish-all")
    public ApiResponse<ContentPublishStatusResponse> publishAllContent(
            @PathVariable Integer courseId,
            @RequestParam Boolean isPublished) {

        log.info("Publish all content for course: {}, isPublished: {}", courseId, isPublished);
        ContentPublishStatusResponse response = contentPublishService.publishAllContent(courseId, isPublished);

        return ApiResponse.<ContentPublishStatusResponse>builder()
                .message(isPublished ? "All content published successfully" : "All content unpublished successfully")
                .result(response)
                .build();
    }
}
